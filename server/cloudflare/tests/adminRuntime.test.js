// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { execFile as execFileRef } from 'node:child_process';
import { promisify as promisifyRef } from 'node:util';
import { mkdir as mkdirRef, mkdtemp as mkdtempRef, writeFile as writeFileRef } from 'node:fs/promises';
import { fileURLToPath as fileURLToPathRef } from 'node:url';
import { createTestHarness as createTestHarnessRef } from 'wrangler';
import { createAdminFixture as createAdminFixtureRef, adminRequest as adminRequestRef } from './helpers/adminFixtures.js';
// codeguard:components:end

testRef('compiled workerd verifies Supabase session/CSRF, durable replies, backup, CAS and actual limits', async t => {
  const root = fileURLToPathRef(new URL('../', import.meta.url)), f = await createAdminFixtureRef();
  const fRef = f;
  const workspace = fileURLToPathRef(new URL('../../../.superpowers/sdd/2026-10-12-cloudflare-phase-2/', import.meta.url));
  await mkdirRef(workspace, { recursive: true });
  const directory = await mkdtempRef(`${workspace}runtime-`), configPath = `${directory}/wrangler.json`;
  const vars = Object.fromEntries(Object.entries(fRef.env).filter(([, value]) => typeof value === 'string'));
  await writeFileRef(configPath, JSON.stringify({ name: 'isolated-admin-runtime', main: fileURLToPathRef(new URL('./helpers/adminRuntimeWorker.js', import.meta.url)), compatibility_date: '2026-09-05', dev: { local_protocol: 'https' },
    vars: { ...vars, TEST_PUBLIC_JWKS: fRef.publicJwks, BREVO_API_KEY: 'isolated-test-provider-key', BREVO_SENDER_EMAIL: 'sender@example.test' },
    d1_databases: [{ binding: 'DB', database_name: 'isolated-admin-runtime', migrations_dir: fileURLToPathRef(new URL('../migrations', import.meta.url)) }],
    ratelimits: [{ name: 'ADMIN_RATE_LIMITER', namespace_id: '10122037', simple: { limit: 120, period: 60 } }, { name: 'ADMIN_REPLY_RATE_LIMITER', namespace_id: '10122038', simple: { limit: 6, period: 60 } }],
  }));
  await promisifyRef(execFileRef)(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'deploy', '--dry-run', '--config', configPath, '--outdir', `${directory}/dist`], { cwd: root });
  const server = createTestHarnessRef({ root: directory, workers: [{ configPath: configPath, prebuiltWorkerDir: `${directory}/dist` }] });
  const serverRef = server;
  t.after(() => serverRef.close()); await serverRef.listen(); const worker = serverRef.getWorker();
  await worker.applyD1Migrations('DB'); await worker.applyD1Migrations('DB'); const env = await worker.getEnv();
  assert.equal(env.ADMIN_ORIGIN, fRef.env.ADMIN_ORIGIN);
  assert.equal(await env.DB.prepare('SELECT count(*) AS n FROM d1_migrations').first('n'), 4);
  const call = async (path, options) => {
    const request = adminRequestRef(fRef, path, options);
    return serverRef.fetch(request.url, { method: request.method, headers: Object.fromEntries(request.headers), ...(request.method === 'GET' ? {} : { body: await request.text() }) });
  };
  const callRef = call;
  // Miniflare's actual rate buckets reset at wall-clock minute boundaries. Start the short sequence with a full test window.
  const windowRemaining = 60000 - Date.now() % 60000;
  if (windowRemaining < 15000) await new Promise(resolve => setTimeout(resolve, windowRemaining + 25));
  const coldSessions = await Promise.all(Array.from({ length: 20 }, () => callRef('/session')));
  assert.ok(coldSessions.every(result => result.status === 200));
  const sessionResponse = coldSessions[0];
  assert.match(sessionResponse.headers.get('Set-Cookie'), /Secure; HttpOnly; SameSite=Strict/);
  const session = { cookie: sessionResponse.headers.get('Set-Cookie').split(';')[0], csrf: (await sessionResponse.json()).csrfToken };
  assert.equal((await serverRef.fetch('https://ahmad-makatreh.vip/api/admin/session', { headers: { Cookie: fRef.sessionCookie } })).status, 404);
  const expired = await fRef.token({ exp: Math.floor(Date.now() / 1000) - 31 });
  const expiredCookie = (await fRef.session.seal({ accessToken: expired, refreshToken: 'test-refresh-token', signedInAt: Date.now() }, fRef.env)).split(';')[0];
  assert.equal((await callRef('/session', { headers: { Cookie: expiredCookie } })).status, 401);
  const id = '11111111-1111-4111-8111-111111111111';
  const idRef = id;
  const item = { id: idRef, referenceId: 'RUNTIME-1', name: 'أحمد', email: 'visitor@example.test', projectDetails: 'تفاصيل المشروع', serviceKey: null, inquiryCategory: 'other', status: 0,
    createdAtUtc: '2026-10-12T08:00:00.1234567Z', updatedAtUtc: '2026-10-12T08:00:00.1234567Z', adminNotes: '', notificationStatus: null, notificationAttemptedAtUtc: null, notesUpdatedBy: null };
  const document = { format: 'ahmad-site-inquiries', version: 1, items: [item] };
  const post = body => ({ method: 'POST', ...session, body });
  const postRef = post;
  assert.equal((await callRef('/inquiries/import', { method: 'POST', body: document })).status, 403);
  assert.deepEqual(await (await callRef('/inquiries/import', postRef(document))).json(), { imported: 1, skipped: 0 });
  assert.deepEqual((await (await callRef('/inquiries')).json()).items.map(r => r.id), [idRef]);
  assert.equal((await (await callRef(`/inquiries/${idRef}`)).json()).replyEnabled, true);
  const saves = await Promise.all([callRef(`/inquiries/${idRef}/status`, { method: 'PATCH', ...session, body: { status: 'Contacted', expectedUpdatedAtUtc: item.updatedAtUtc } }), callRef(`/inquiries/${idRef}/notes`, { method: 'PATCH', ...session, body: { notes: 'ملاحظة', expectedUpdatedAtUtc: item.updatedAtUtc } })]);
  assert.deepEqual(saves.map(r => r.status).sort(), [200, 409]);
  assert.equal((await (await callRef('/inquiries/export', postRef({ ids: [idRef] }))).json()).items[0].id, idRef);
  assert.deepEqual(await (await callRef('/inquiries/import', postRef(document))).json(), { imported: 0, skipped: 1 });
  const reply = { operationId: '22222222-2222-4222-8222-222222222222', subject: 'Subject', body: 'Body' };
  const replyRef = reply;
  for (let n = 0; n < 2; n++) assert.equal((await (await callRef(`/inquiries/${idRef}/replies`, postRef(replyRef))).json()).status, 'accepted');
  assert.equal((await (await callRef(`/inquiries/${idRef}/replies`)).json()).items.length, 1);
  for (let n = 0; n < 4; n++) assert.equal((await callRef(`/inquiries/${idRef}/replies`, postRef({ ...replyRef, subject: '' }))).status, 400);
  assert.equal((await callRef(`/inquiries/${idRef}/replies`, postRef(replyRef))).status, 429);
  const other = await fRef.token({ email: 'Owner@EXAMPLE.test' });
  const otherCookie = (await fRef.session.seal({ accessToken: other, refreshToken: 'test-refresh-token', signedInAt: Date.now() }, fRef.env)).split(';')[0];
  // Thirty-six earlier authenticated actions consumed this identity's admin limit, including rejected mutations.
  let accepted = 0, limited;
  while (accepted < 121) { const result = await callRef('/session', { headers: { Cookie: otherCookie } }); if (result.status === 429) { limited = result; break; } assert.equal(result.status, 200); accepted++; }
  assert.ok(limited); assert.equal(accepted, 84);
  const counters = await (await serverRef.fetch('https://admin.example.test/__test/counters')).json();
  assert.equal(counters.emails, 1); assert.equal(counters.jwks, 1);
  assert.equal(counters.lifetimes, 1);
  assert.equal(await env.DB.prepare('SELECT count(*) AS n FROM inquiry_replies').first('n'), 1);
});
