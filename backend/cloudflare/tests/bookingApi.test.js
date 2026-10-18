// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { createApi as createApiRef } from '../src/index.js';
import { bookingInput as bookingInputRef, testKey as testKeyRef, testTime as testTimeRef } from './helpers/bookingFixtures.js';
import { openTestDatabase as openTestDatabaseRef, applyInitialMigration as applyInitialMigrationRef } from './helpers/d1.js';
const requestRef = request;
const fixtureRef = fixture;


function request(body = bookingInputRef, headers = {}) {
  return new Request('https://example.test/api/booking', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}
async function fixture(t, { emailStatus = 201, emailBody = { messageId: 'accepted' }, captcha = true, rate = true } = {}) {
  const wrapRef = wrap;

  const { db: dbRef, dispose: disposeRef } = await openTestDatabaseRef(); t.after(disposeRef); await applyInitialMigrationRef(dbRef);
  const counts = { batches: 0, statements: 0, reads: 0, writes: 0, captcha: 0, emails: 0 };
  const countsRef = counts;
  const record = result => {
    countsRef.reads += result.meta?.rows_read ?? 0; countsRef.writes += result.meta?.rows_written ?? 0; return result;
  };
  const recordRef = record;
  function wrap(statement) {
    return new Proxy(statement, { get(target, key) {
      if (key === 'bind') return (...args) => wrapRef(target.bind(...args));
      if (['run', 'all', 'first', 'raw'].includes(key)) return async (...args) => { countsRef.statements++; return recordRef(await target[key](...args)); };
      const value = target[key];
      const valueRef = value; return typeof valueRef === 'function' ? valueRef.bind(target) : valueRef;
    } });
  }
  const tracked = {
    prepare: sql => wrapRef(dbRef.prepare(sql)),
    async batch(statements) { countsRef.batches++; countsRef.statements += statements.length; return (await dbRef.batch(statements)).map(recordRef); },
  };
  const trackedRef = tracked;
  const env = {
    DB: trackedRef, BOOKING_HMAC_KEY: testKeyRef, TURNSTILE_SECRET_KEY: 'test-secret', TURNSTILE_ALLOWED_HOSTNAMES: 'example.test',
    BOOKING_RATE_LIMITER: { async limit({ key }) { assert.match(key, /^[A-F0-9]{64}$/); return { success: rate }; } },
    BREVO_API_KEY: 'test-api-key', BREVO_SENDER_EMAIL: 'sender@example.test', BREVO_RECIPIENT_EMAIL: 'owner@example.test',
  };
  const api = createApiRef({ now: () => testTimeRef, fetcher: async url => {
    if (url === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') { countsRef.captcha++; return Response.json({ success: captcha, hostname: 'example.test', 'error-codes': [] }); }
    if (url === 'https://api.brevo.com/v3/smtp/email') { countsRef.emails++; return Response.json(emailBody, { status: emailStatus }); }
    throw new Error('Unexpected destination');
  } });
  const apiRef = api;
  return { db: dbRef, env: env, api: apiRef, counts: countsRef };
}
// codeguard:components:end

testRef('one booking is durable, emails once, duplicate and fifth-repeat statuses match the client', async (t) => {
  const { db, env, api, counts } = await fixtureRef(t);
  const first = await api.fetch(requestRef(), env); assert.equal(first.status, 200);
  const saved = await first.json(); assert.equal(saved.success, true); assert.equal(saved.notificationStatus, 'accepted');
  assert.match(saved.referenceId, /^REQ-20261012-/); assert.equal(counts.batches, 1); assert.equal(counts.statements, 5);
  t.diagnostic(`D1 first booking: batches=${counts.batches}, statements=${counts.statements}, rows_read=${counts.reads}, rows_written=${counts.writes}`);
  const row = await db.prepare('SELECT * FROM inquiries').first();
  assert.equal(row.project_details, 'أريد موقعًا'); assert.equal(row.notification_status, 'accepted');
  assert.ok(!JSON.stringify(row).includes('192.0.2.1')); assert.ok(!JSON.stringify(row).includes('test-token'));
  for (let i = 0; i < 4; i++) { const repeat = await api.fetch(requestRef(), env); assert.equal(repeat.status, 409); assert.equal((await repeat.json()).code, 'duplicate_submission'); }
  const blocked = await api.fetch(requestRef({ ...bookingInputRef, projectDetails: bookingInputRef.projectDetails }), env);
  assert.equal(blocked.status, 429); assert.equal(blocked.headers.get('Retry-After'), '1800'); assert.equal((await blocked.json()).code, 'ip_blocked');
  const different = await api.fetch(requestRef({ ...bookingInputRef, projectDetails: 'Different message' }), env); assert.equal(different.status, 429);
  assert.equal(counts.emails, 1); assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM inquiries').first()).n, 1);
  t.diagnostic(`D1 booking+6 retries: batches=${counts.batches}, statements=${counts.statements}, rows_read=${counts.reads}, rows_written=${counts.writes}`);
});
testRef('twenty concurrent POSTs create one durable inquiry and one external email', async (t) => {
  const { db, env, api, counts } = await fixtureRef(t);
  const replies = await Promise.all(Array.from({ length: 20 }, () => api.fetch(requestRef(), env)));
  assert.equal(replies.filter(r => r.status === 200).length, 1); assert.equal(counts.emails, 1);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM inquiries').first()).n, 1);
});
testRef('invalid input, untrusted origin, missing IP, rate rejection and captcha failure avoid D1', async (t) => {
  const f = await fixtureRef(t);
  for (const req of [requestRef({ ...bookingInputRef, name: 5 }), requestRef('{'), requestRef({ ...bookingInputRef, name: '' }), requestRef(bookingInputRef, { Origin: 'https://attacker.test' }), requestRef(bookingInputRef, { 'CF-Connecting-IP': '', 'X-Forwarded-For': '192.0.2.2' })]) {
    const response = await f.api.fetch(req, f.env); assert.ok([400, 403].includes(response.status));
  }
  assert.equal(f.counts.statements, 0); assert.equal(f.counts.emails, 0);
  const limited = await fixtureRef(t, { rate: false }); const rateResponse = await limited.api.fetch(requestRef(), limited.env);
  assert.equal(rateResponse.status, 429); assert.equal((await rateResponse.json()).code, 'rate_limited');
  assert.equal(limited.counts.statements, 0); assert.equal(limited.counts.captcha, 0);
  const bot = await fixtureRef(t, { captcha: false }); assert.equal((await bot.api.fetch(requestRef(), bot.env)).status, 400); assert.equal(bot.counts.statements, 0);
});
testRef('body limit, missing configuration, wrong methods and admin routes fail clearly', async (t) => {
  const { env, api, counts } = await fixtureRef(t);
  assert.equal((await api.fetch(requestRef('x'.repeat(65537)), env)).status, 413);
  assert.equal((await api.fetch(requestRef(), { ...env, BOOKING_HMAC_KEY: '' })).status, 503);
  assert.equal((await api.fetch(requestRef(), { ...env, BOOKING_RATE_LIMITER: undefined })).status, 503);
  assert.equal((await api.fetch(new Request('https://example.test/api/booking'), env)).status, 405);
  assert.equal((await api.fetch(new Request('https://example.test/api/admin/session'), env)).status, 503);
  assert.equal((await api.fetch(new Request('https://ahmad-makatreh.vip/api/admin/session'), env)).status, 404);
  assert.equal(counts.statements, 0); assert.equal(counts.emails, 0);
});
testRef('mail rejection preserves successful booking, retry never re-sends', async (t) => {
  const { db, env, api, counts } = await fixtureRef(t, { emailStatus: 429, emailBody: { code: 'quota' } });
  const response = await api.fetch(requestRef(), env); assert.equal(response.status, 200); assert.equal((await response.json()).notificationStatus, 'failed');
  assert.equal((await db.prepare('SELECT notification_status FROM inquiries').first()).notification_status, 'failed');
  assert.equal((await api.fetch(requestRef(), env)).status, 409); assert.equal(counts.emails, 1);
});
testRef('database failures never send mail, and a notification-record failure reports uncertainty', async (t) => {
  const logs = [];
  t.mock.method(console, 'error', (...args) => logs.push(args.join(' ')));
  t.mock.method(console, 'warn', (...args) => logs.push(args.join(' ')));
  const f = await fixtureRef(t); const broken = { ...f.env, DB: { ...f.env.DB, batch: async () => { throw new Error('Database unavailable'); } } };
  assert.equal((await f.api.fetch(requestRef(), broken)).status, 503); assert.equal(f.counts.emails, 0);
  const failedUpdate = { ...f.env, DB: { ...f.env.DB, prepare(sql) {
    if (sql.startsWith('UPDATE inquiries')) return { bind() { return { run: async () => { throw new Error('Write unavailable'); } }; } };
    return f.env.DB.prepare(sql);
  } } };
  const response = await f.api.fetch(requestRef(), failedUpdate); assert.equal(response.status, 200); assert.equal((await response.json()).notificationStatus, 'unknown');
  assert.equal((await f.db.prepare('SELECT COUNT(*) AS n FROM inquiries').first()).n, 1);
  assert.equal((await f.api.fetch(requestRef(), f.env)).status, 409); assert.equal(f.counts.emails, 1);
  assert.equal(logs.length, 2); assert.ok(!logs.join(' ').includes('test-api-key')); assert.ok(!logs.join(' ').includes('owner@example.test'));
});
testRef('GET site shares a cached read, ETag yields 304, OPTIONS and route navigation cost no database calls', async (t) => {
  const { env, api, counts } = await fixtureRef(t);
  const first = await api.fetch(new Request('https://example.test/api/site'), env); assert.equal(first.status, 200); assert.deepEqual(await first.json(), {});
  const etag = first.headers.get('ETag'); assert.ok(etag); assert.equal(counts.statements, 1);
  const repeated = await api.fetch(new Request('https://example.test/api/site', { headers: { 'If-None-Match': etag } }), env);
  assert.equal(repeated.status, 304); assert.equal(await repeated.text(), ''); assert.equal(counts.statements, 1);
  const options = await api.fetch(new Request('https://example.test/api/booking', { method: 'OPTIONS', headers: { Origin: 'https://example.test', 'Access-Control-Request-Method': 'POST' } }), env);
  assert.equal(options.status, 204); assert.equal(options.headers.get('Access-Control-Allow-Origin'), 'https://example.test');
  await api.fetch(new Request('https://example.test/services'), env); assert.equal(counts.statements, 1);
});
testRef('slow notification-record completion returns saved-but-unknown within three seconds', { timeout: 5000 }, async (t) => {
  const f = await fixtureRef(t); t.mock.method(console, 'warn', () => {});
  const slow = { ...f.env, DB: { ...f.env.DB, prepare(sql) {
    if (sql.startsWith('UPDATE inquiries')) return { bind() { return { run() { return new Promise(() => {}); } }; } };
    return f.env.DB.prepare(sql);
  } } };
  const response = await f.api.fetch(requestRef(), slow); assert.equal(response.status, 200); assert.equal((await response.json()).notificationStatus, 'unknown');
  assert.equal((await f.db.prepare('SELECT COUNT(*) AS n FROM inquiries').first()).n, 1); assert.equal(f.counts.emails, 1);
});
testRef('only visible published custom services are accepted, with one cold snapshot query', async (t) => {
  const f = await fixtureRef(t); const body = new TextEncoder().encode('{"packages":[{"key":"new-service","hidden":false},{"key":"hidden-service","hidden":true}]}');
  await f.db.prepare("INSERT INTO site_documents VALUES ('pricing','p')").run(); await f.db.prepare("INSERT INTO site_document_chunks VALUES ('p',0,?)").bind(body).run();
  assert.equal((await f.api.fetch(requestRef({ ...bookingInputRef, serviceKey: 'new-service' }), f.env)).status, 200); assert.equal(f.counts.statements, 6);
  assert.equal((await f.api.fetch(requestRef({ ...bookingInputRef, serviceKey: 'hidden-service' }), f.env)).status, 400); assert.equal(f.counts.statements, 6);
});

testRef('composed slow notification stages acknowledge saved inquiry before the client 10s deadline', { timeout: 12500 }, async (t) => {
  const f = await fixtureRef(t); t.mock.method(console, 'warn', () => {});
  const env = { ...f.env, DB: { ...f.env.DB, prepare(sql) {
    if (sql.startsWith('UPDATE inquiries')) return { bind() { return { run() { return new Promise(() => {}); } }; } };
    return f.env.DB.prepare(sql);
  } } };
  const api = createApiRef({ now: () => testTimeRef, fetcher: async (url, options) => {
    if (url === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
      await new Promise(resolve => setTimeout(resolve, 2500));
      return Response.json({ success: true, hostname: 'example.test' });
    }
    assert.equal(url, 'https://api.brevo.com/v3/smtp/email'); f.counts.emails++;
    return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }));
  } });
  const apiRef2 = api;
  let clientTimedOut = false;
  const started = Date.now();
  const clientTimer = setTimeout(() => { clientTimedOut = true; }, 10000);
  let response;
  try { response = await apiRef2.fetch(requestRef(), env); }
  finally { clearTimeout(clientTimer); }
  t.diagnostic(`Composed slow booking response: ${Date.now() - started}ms; client timeout fired=${clientTimedOut}`);
  assert.equal(clientTimedOut, false);
  assert.equal(response.status, 200); assert.equal((await response.json()).notificationStatus, 'unknown');
  assert.equal((await f.db.prepare('SELECT COUNT(*) AS n FROM inquiries').first()).n, 1); assert.equal(f.counts.emails, 1);
  assert.equal((await f.api.fetch(requestRef(), f.env)).status, 409); assert.equal(f.counts.emails, 1);
});
