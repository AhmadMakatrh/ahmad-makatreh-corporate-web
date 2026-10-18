// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { createApi as createApiRef } from '../src/index.js';
import { sendInquiryReply as sendInquiryReplyRef } from '../src/email.js';
import { completeReply as completeReplyRef } from '../src/inquiryReplies.js';
import { adminRequest as adminRequestRef, adminApiFixture as adminApiFixtureRef } from './helpers/adminFixtures.js';
const fixtureRef = fixture;


const id = '11111111-1111-4111-8111-111111111111';
const idRef = id;
const operationId = '22222222-2222-4222-8222-222222222222';
const operationIdRef = operationId;
const reply = { operationId: operationIdRef, subject: 'رد بخصوص المشروع', body: 'تفاصيل الرد <b>نص عادي</b>' };
const replyRef = reply;
async function fixture(t, provider = async () => Response.json({ messageId: 'accepted' })) {
  const f = await adminApiFixtureRef(t);
  const fRef = f; fRef.emails = 0;
  fRef.env.BREVO_API_KEY = 'isolated-provider-key'; fRef.env.BREVO_SENDER_EMAIL = 'sender@example.test';
  fRef.api = createApiRef({ fetcher: (url, options) => String(url).endsWith('/auth/v1/.well-known/jwks.json') ? fRef.fetcher(url, options) : (fRef.emails++, provider(url, options)) });
  fRef.session = await fRef.login(); fRef.send = body => fRef.call(`/inquiries/${idRef}/replies`, { method: 'POST', ...fRef.session, body });
  return fRef;
}
// codeguard:components:end

testRef('20 concurrent identical operations store one reply and attempt one plaintext email; retries never resend', async t => {
  const f = await fixtureRef(t, async (url, options) => {
    assert.equal(url, 'https://api.brevo.com/v3/smtp/email'); assert.equal(options.redirect, 'manual');
    const data = JSON.parse(options.body); assert.deepEqual(data.to, [{ email: 'owner@example.test', name: 'Ahmad' }]);
    assert.equal(data.sender.email, 'sender@example.test'); assert.equal(data.subject, replyRef.subject); assert.equal(data.textContent, replyRef.body); assert.ok(!('htmlContent' in data));
    return Response.json({ messageId: 'accepted' });
  });
  const responses = await Promise.all(Array.from({ length: 20 }, () => f.send(replyRef)));
  assert.deepEqual(new Set(responses.map(r => r.status)), new Set([200])); assert.equal(f.emails, 1);
  assert.equal(await f.db.prepare('SELECT count(*) AS n FROM inquiry_replies').first('n'), 1);
  f.env.BREVO_API_KEY = ''; const before = f.counts.statements;
  const saved = await (await f.send(replyRef)).json(); assert.equal(saved.status, 'accepted'); assert.equal(saved.actor, 'owner@example.test');
  assert.ok(saved.completedAtUtc); assert.equal(f.counts.statements - before, 1); assert.equal(f.emails, 1);
  assert.equal((await f.send({ ...replyRef, subject: 'different' })).status, 409);
});
testRef('invalid replies and reply rate limit reject before D1; missing provider costs only the operation lookup', async t => {
  const f = await fixtureRef(t);
  for (const body of [{ ...replyRef, operationId: '00000000-0000-0000-0000-000000000000' }, { ...replyRef, subject: '\u0085' }, { ...replyRef, subject: 'a\nheader' }, { ...replyRef, subject: '\u0000' }, { ...replyRef, subject: '😀'.repeat(101) }, { ...replyRef, body: '\u2003' }, { ...replyRef, body: '😀'.repeat(5001) }]) assert.equal((await f.send(body)).status, 400);
  assert.equal(f.counts.statements, 0); f.env.ADMIN_REPLY_RATE_LIMITER = { limit: async () => ({ success: false }) };
  assert.equal((await f.send(replyRef)).status, 429); assert.equal(f.counts.statements, 0);
  f.env.ADMIN_REPLY_RATE_LIMITER = { limit: async () => ({ success: true }) }; f.env.BREVO_API_KEY = '';
  assert.equal((await f.send(replyRef)).status, 503); assert.equal(f.counts.statements, 1); assert.equal(f.emails, 0);
});
testRef('failed or unknown provider outcomes stay durable, browser disconnect and retry do not cause a second email', async t => {
  const f = await fixtureRef(t, async () => { throw new TypeError('lost response'); });
  const fRef2 = f;
  const controller = new AbortController();
   const request = adminRequestRef(fRef2, `/inquiries/${idRef}/replies`, { method: 'POST', ...fRef2.session, body: replyRef });
  const pending = fRef2.api.fetch(new Request(request, { signal: controller.signal }), fRef2.env); controller.abort();
  assert.equal((await pending).status, 200); assert.equal((await (await fRef2.send(replyRef)).json()).status, 'unknown'); assert.equal(fRef2.emails, 1);
  const before = fRef2.counts.statements; assert.equal((await fRef2.call(`/inquiries/${idRef}/replies?cursor=bad`)).status, 400); assert.equal(fRef2.counts.statements, before);
  const history = await (await fRef2.call(`/inquiries/${idRef}/replies`)).json(); assert.equal(history.items[0].status, 'unknown'); assert.equal(fRef2.counts.statements - before, 1);
  fRef2.env.DB = { prepare: () => { throw new Error('database unavailable'); } };
  assert.equal((await fRef2.send({ ...replyRef, operationId: crypto.randomUUID() })).status, 500); assert.equal(fRef2.emails, 1);
});
testRef('history is capped at 25 with exact cursor paging and no inquiry pre-read', async t => {
  const f = await fixtureRef(t);
  const fRef3 = f;
  await fRef3.db.batch(Array.from({ length: 26 }, (_, n) => fRef3.db.prepare('INSERT INTO inquiry_replies (id,inquiry_id,subject,body,actor,created_at_utc) VALUES (?,?,?,?,?,?)').bind(`00000000-0000-0000-0000-${String(n + 1).padStart(12, '0')}`, idRef, 'Subject', 'Body', 'owner@example.test', '2026-10-12T08:00:00.1234567Z')));
  const first = await (await fRef3.call(`/inquiries/${idRef}/replies`)).json(); assert.equal(first.items.length, 25); assert.ok(first.nextCursor);
  const second = await (await fRef3.call(`/inquiries/${idRef}/replies?cursor=${first.nextCursor}`)).json(); assert.equal(second.items.length, 1); assert.equal(second.nextCursor, null);
  assert.equal(new Set([...first.items, ...second.items].map(r => r.id)).size, 26); assert.equal(fRef3.counts.statements, 2);
});
testRef('rejection is recorded; failed completion keeps pending and a retry cannot resend', async t => {
  const f = await fixtureRef(t, async () => new Response('', { status: 429 }));
  assert.equal((await (await f.send(replyRef)).json()).status, 'failed'); assert.equal(f.counts.statements, 4);
  const next = { ...replyRef, operationId: crypto.randomUUID() };
  const db = f.env.DB;
  const dbRef = db;
  f.env.DB = { prepare(sql) {
    if (sql.startsWith('UPDATE inquiry_replies')) return { bind: () => ({ run: async () => { throw new Error('completion rejected'); } }) };
    return dbRef.prepare(sql);
  } };
  assert.equal((await f.send(next)).status, 500); f.env.DB = dbRef;
  assert.equal((await (await f.send(next)).json()).status, 'pending'); assert.equal(f.emails, 2);
});
testRef('reply timeout is unknown at 12 seconds with no provider retry; completion wait is bounded', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] }); let calls = 0;
  const pending = sendInquiryReplyRef({ email: 'visitor@example.test', name: 'Visitor' }, replyRef, { apiKey: 'test', senderEmail: 'sender@example.test' }, async (_url, { signal }) => {
    calls++; return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('timeout'))));
  }); t.mock.timers.tick(12000); assert.equal(await pending, 'unknown'); assert.equal(calls, 1);
  const wait = completeReplyRef({ prepare: () => ({ bind: () => ({ run: () => new Promise(() => {}) }) }) }, operationIdRef, 'unknown', '2026-10-12T08:00:00.0000000Z');
  const rejected = assert.rejects(wait, /completion/i); t.mock.timers.tick(5000); await rejected;
});
testRef('winning reply registers one send/completion lifetime promise before browser disconnect, then records its outcome', async t => {
  let accept, started;
  const sending = new Promise(resolve => { started = resolve; });
  const f = await fixtureRef(t, async () => { started(); return new Promise(resolve => { accept = resolve; }); });
  const fRef4 = f;
  const lifetimes = [];
  const lifetimesRef = lifetimes;
  const context = { waitUntil: promise => lifetimesRef.push(promise) };
  const contextRef = context;
  const controller = new AbortController();
  const request = new Request(adminRequestRef(fRef4, `/inquiries/${idRef}/replies`, { method: 'POST', ...fRef4.session, body: replyRef }), { signal: controller.signal });
  const result = fRef4.api.fetch(request, fRef4.env, contextRef); await sending;
  assert.equal(lifetimesRef.length, 1); controller.abort(); accept(Response.json({ messageId: 'accepted' }));
  await Promise.all(lifetimesRef); assert.equal((await result).status, 200);
  assert.equal((await fRef4.db.prepare('SELECT status FROM inquiry_replies WHERE id=?').bind(operationIdRef).first()).status, 'accepted');
  const retry = await fRef4.api.fetch(adminRequestRef(fRef4, `/inquiries/${idRef}/replies`, { method: 'POST', ...fRef4.session, body: replyRef }), fRef4.env, contextRef);
  assert.equal(retry.status, 200); assert.equal(lifetimesRef.length, 1); assert.equal(fRef4.emails, 1);
});
