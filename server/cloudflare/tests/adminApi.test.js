// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { createApi as createApiRef } from '../src/index.js';
import { adminApiFixture as fixture } from './helpers/adminFixtures.js';

const id = '11111111-1111-4111-8111-111111111111';
const idRef = id;
// codeguard:components:end

testRef('signed session, list and detail preserve contract with zero session SQL and no public cache', async (t) => {
  const f = await fixture(t);
  const fRef = f; await fRef.login(); assert.equal(fRef.counts.statements, 0);
  const list = await fRef.call('/inquiries'); assert.equal(list.status, 200); assert.equal(list.headers.get('Cache-Control'), 'no-store'); assert.equal((await list.json()).items[0].status, 'New'); assert.equal(fRef.counts.statements, 1);
  const detail = await fRef.call(`/inquiries/${idRef}`); const data = await detail.json();
  assert.equal(data.projectDetails, 'A real project'); assert.equal(data.adminNotes, ''); assert.equal(data.replyEnabled, false); assert.equal(fRef.counts.statements, 2);
  assert.equal((await fRef.call('/inquiries/00000000-0000-0000-0000-000000000000')).status, 404);
  assert.equal((await fRef.api.fetch(new Request('https://ahmad-makatreh.vip/api/admin/inquiries', { headers: { 'Cf-Access-Jwt-Assertion': fRef.accessToken } }), fRef.env)).status, 404);
});
testRef('invalid filters, revisions, CSRF and rate rejection do no data SQL', async (t) => {
  const f = await fixture(t);
  const fRef2 = f;
  const session = await fRef2.login();
  for (const query of ['pageSize=101', 'pageSize=0', 'pageSize=1.5', 'cursor=bad', 'status=invalid', 'category=bad', 'notificationStatus=delivered', 'from=2026-02-29', 'to=9999-12-31', 'from=2026-10-13&to=2026-10-12', `search=${'x'.repeat(101)}`]) assert.equal((await fRef2.call(`/inquiries?${query}`)).status, 400, query);
  assert.equal((await fRef2.call(`/inquiries/${idRef}/notes`, { method: 'PATCH', body: { notes: '', expectedUpdatedAtUtc: '2026-10-12T08:00:00Z' } })).status, 403);
  for (const body of [{ notes: null, expectedUpdatedAtUtc: '2026-10-12T08:00:00Z' }, { notes: 'x'.repeat(10001), expectedUpdatedAtUtc: '2026-10-12T08:00:00Z' }, { notes: '', expectedUpdatedAtUtc: 'not-utc' }]) assert.equal((await fRef2.call(`/inquiries/${idRef}/notes`, { method: 'PATCH', ...session, body })).status, 400);
  assert.equal(fRef2.counts.statements, 0);
  fRef2.env.ADMIN_RATE_LIMITER = { limit: async () => ({ success: false }) };
  assert.equal((await fRef2.call('/inquiries')).status, 429); assert.equal(fRef2.counts.statements, 0);
});
testRef('same-millisecond simultaneous HTTP saves return one 200 and one 409, actor cannot be spoofed', async (t) => {
  const f = await fixture(t);
  const fRef3 = f;
  const session = await fRef3.login();
  const clock = Date.now();
  fRef3.api = createApiRef({ now: () => clock, fetcher: fRef3.fetcher });
  const options = { method: 'PATCH', ...session, body: { notes: 'ملاحظة', actor: 'attacker@example.test', expectedUpdatedAtUtc: '2026-10-12T08:00:00.000Z' } };
  const responses = await Promise.all([fRef3.call(`/inquiries/${idRef}/notes`, options), fRef3.call(`/inquiries/${idRef}/status`, { ...options, body: { status: '1', expectedUpdatedAtUtc: '2026-10-12T08:00:00Z' } })]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]); assert.equal(fRef3.counts.statements, 2);
  const saved = await (await fRef3.call(`/inquiries/${idRef}`)).json(); assert.ok(saved.updatedAtUtc > '2026-10-12T08:00:00.0000000Z');
  if (saved.notesUpdatedBy) assert.equal(saved.notesUpdatedBy, 'owner@example.test');
});
testRef('oversized streamed admin JSON is rejected before D1, malformed JSON and methods fail clearly', async (t) => {
  const f = await fixture(t);
  const fRef4 = f;
  const session = await fRef4.login();
  const body = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(2097153)); controller.close(); } });
  const request = new Request(`${fRef4.env.ADMIN_ORIGIN}/api/admin/inquiries/${idRef}/notes`, { method: 'PATCH', body: body, duplex: 'half', headers: { Origin: fRef4.env.ADMIN_ORIGIN, Cookie: `${fRef4.sessionCookie}; ${session.cookie}`, 'X-Admin-CSRF': session.csrf, 'Content-Type': 'application/json' } });
  assert.equal((await fRef4.api.fetch(request, fRef4.env)).status, 413); assert.equal(fRef4.counts.statements, 0);
  assert.equal((await fRef4.call('/inquiries', { method: 'POST', ...session, body: {} })).status, 405);
  assert.equal((await fRef4.call('/missing')).status, 404);
});
testRef('measured normal admin actions meet their bounded SQL budgets without hidden reads', async t => {
  const f = await fixture(t);
  const fRef5 = f;
  const session = await fRef5.login();
  assert.equal(fRef5.counts.statements, 0);
  const perform = async (label, expected, path, options) => {
    const before = { ...fRef5.counts };
    const result = await fRef5.call(path, options); assert.equal(result.status, 200, label);
    assert.equal(fRef5.counts.statements - before.statements, expected, label);
    t.diagnostic(`${label}: SQL=${fRef5.counts.statements - before.statements}, batches=${fRef5.counts.batches - before.batches}, exposed rows_read=${fRef5.counts.reads - before.reads}, rows_written=${fRef5.counts.writes - before.writes}, results without metadata=${fRef5.counts.missingMetadata - before.missingMetadata}`);
    return result.json();
  };
  const performRef = perform;
  await performRef('list', 1, '/inquiries'); const detail = await performRef('detail', 1, `/inquiries/${idRef}`);
  const status = await performRef('status', 1, `/inquiries/${idRef}/status`, { method: 'PATCH', ...session, body: { status: 'Contacted', expectedUpdatedAtUtc: detail.updatedAtUtc } });
  await performRef('notes', 1, `/inquiries/${idRef}/notes`, { method: 'PATCH', ...session, body: { notes: 'Note', expectedUpdatedAtUtc: status.updatedAtUtc } });
  await performRef('history', 1, `/inquiries/${idRef}/replies`);
  const backup = await performRef('export', 1, '/inquiries/export', { method: 'POST', ...session, body: { ids: [idRef] } });
  await performRef('import-existing', 1, '/inquiries/import', { method: 'POST', ...session, body: backup });
});
