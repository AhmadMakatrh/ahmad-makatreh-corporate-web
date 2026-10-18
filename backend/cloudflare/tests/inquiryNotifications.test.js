// codeguard:components:start
// codeguard:defines: inquiry notification retry regressions
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { createApi as createApiRef } from '../src/index.js';
import { adminApiFixture as adminApiFixtureRef, adminRequest as adminRequestRef } from './helpers/adminFixtures.js';

const inquiryId = '11111111-1111-4111-8111-111111111111';
const attemptedAt = '2026-10-12T08:00:00.0000000Z';
const inquiryIdRef = inquiryId;
const attemptedAtRef = attemptedAt;
const notificationFixtureRef = notificationFixture;
async function notificationFixture(t, provider = async () => Response.json({ messageId: 'accepted' })) {
  const f = await adminApiFixtureRef(t);
  f.emails = 0;
  Object.assign(f.env, { BREVO_API_KEY: 'isolated-provider-key', BREVO_SENDER_EMAIL: 'sender@example.test', BREVO_RECIPIENT_EMAIL: 'notifications@example.test' });
  await f.db.prepare("UPDATE inquiries SET notification_status='disabled',notification_attempted_at_utc=? WHERE id=?").bind(attemptedAtRef, inquiryIdRef).run();
  f.api = createApiRef({ fetcher: (url, options) => String(url).endsWith('/auth/v1/.well-known/jwks.json')
    ? f.fetcher(url, options) : (f.emails++, provider(url, options)) });
  f.session = await f.login();
  f.send = (body = { expectedNotificationAttemptedAtUtc: attemptedAtRef }) => f.call(`/inquiries/${inquiryIdRef}/notification`, { method: 'POST', ...f.session, body });
  return f;
}
// codeguard:components:end

testRef('concurrent retries claim one saved notification version and send only to the configured owner', async t => {
  const f = await notificationFixtureRef(t, async (url, options) => {
    assert.equal(url, 'https://api.brevo.com/v3/smtp/email');
    assert.equal(options.redirect, 'manual');
    const data = JSON.parse(options.body);
    assert.deepEqual(data.to, [{ email: 'notifications@example.test', name: 'Admin' }]);
    assert.equal(data.replyTo.email, 'owner@example.test');
    return Response.json({ messageId: 'accepted' });
  });
  assert.equal((await (await f.call(`/inquiries/${inquiryIdRef}`)).json()).notificationEnabled, true);
  const responses = await Promise.all(Array.from({ length: 20 }, () => f.send()));
  assert.equal(responses.filter(r => r.status === 200).length, 1);
  assert.equal(responses.filter(r => r.status === 409).length, 19);
  assert.equal(f.emails, 1);
  const saved = await (await f.call(`/inquiries/${inquiryIdRef}`)).json();
  assert.equal(saved.notificationStatus, 'accepted');
  assert.equal(saved.notificationRetryable, false);
  assert.notEqual(saved.notificationAttemptedAtUtc, attemptedAtRef);
  assert.equal((await f.send()).status, 409);
  assert.equal(f.emails, 1);
});

testRef('missing provider, invalid revisions, permissions and rate limits never send or claim an inquiry', async t => {
  const f = await notificationFixtureRef(t);
  for (const body of [{}, { expectedNotificationAttemptedAtUtc: 'invalid' }]) assert.equal((await f.send(body)).status, 400);
  assert.equal((await f.call(`/inquiries/${inquiryIdRef}/notification`, { method: 'POST', body: { expectedNotificationAttemptedAtUtc: attemptedAtRef } })).status, 403);
  f.env.ADMIN_REPLY_RATE_LIMITER = { limit: async () => ({ success: false }) };
  assert.equal((await f.send()).status, 429);
  f.env.ADMIN_REPLY_RATE_LIMITER = { limit: async () => ({ success: true }) };
  delete f.env.BREVO_API_KEY;
  assert.equal((await f.send()).status, 503);
  const saved = await (await f.call(`/inquiries/${inquiryIdRef}`)).json();
  assert.equal(saved.notificationEnabled, false);
  assert.equal(saved.notificationRetryable, true);
  assert.equal(saved.notificationStatus, 'disabled');
  assert.equal(saved.notificationAttemptedAtUtc, attemptedAtRef);
  assert.equal(f.emails, 0);
});

testRef('uncertain or accepted notifications require review; only a fresh known-failed revision can retry', async t => {
  const f = await notificationFixtureRef(t, async () => new Response('', { status: 400 }));
  for (const state of ['accepted', 'unknown', 'timedOut', null]) {
    await f.db.prepare('UPDATE inquiries SET notification_status=? WHERE id=?').bind(state, inquiryIdRef).run();
    assert.equal((await (await f.call(`/inquiries/${inquiryIdRef}`)).json()).notificationRetryable, false);
    assert.equal((await f.send()).status, 409);
  }
  assert.equal(f.emails, 0);
  await f.db.prepare("UPDATE inquiries SET notification_status='failed' WHERE id=?").bind(inquiryIdRef).run();
  const saved = await (await f.send()).json();
  assert.equal(saved.notificationStatus, 'failed');
  assert.equal(saved.notificationRetryable, true);
  assert.equal((await f.send()).status, 409);
  assert.equal(f.emails, 1);
  assert.equal((await f.send({ expectedNotificationAttemptedAtUtc: saved.notificationAttemptedAtUtc })).status, 200);
  assert.equal(f.emails, 2);
});

testRef('disconnect and completion failure keep an uncertain durable claim that cannot send again', { timeout: 15000 }, async t => {
  let accept, started;
  const sending = new Promise(resolve => { started = resolve; });
  const f = await notificationFixtureRef(t, async () => { started(); return new Promise(resolve => { accept = resolve; }); });
  const db = f.env.DB;
  f.env.DB = { prepare(sql) {
    if (sql.startsWith('UPDATE inquiries SET notification_status=?')) return { bind: () => ({ run: async () => { throw new Error('completion unavailable'); } }) };
    return db.prepare(sql);
  } };
  const lifetimes = [], controller = new AbortController();
  const request = new Request(adminRequestRef(f, `/inquiries/${inquiryIdRef}/notification`, { method: 'POST', ...f.session,
    body: { expectedNotificationAttemptedAtUtc: attemptedAtRef } }), { signal: controller.signal });
  const response = f.api.fetch(request, f.env, { waitUntil: promise => lifetimes.push(promise) });
  await sending;
  assert.equal(lifetimes.length, 1);
  controller.abort(); accept(Response.json({ messageId: 'accepted' }));
  assert.equal((await response).status, 500);
  await Promise.all(lifetimes);
  const stored = await f.db.prepare('SELECT notification_status FROM inquiries WHERE id=?').bind(inquiryIdRef).first();
  assert.equal(stored.notification_status, 'unknown');
  assert.equal((await f.send()).status, 409);
  assert.equal(f.emails, 1);
});
