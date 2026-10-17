// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { execFile as execFileRef } from 'node:child_process';
import { promisify as promisifyRef } from 'node:util';
import { fileURLToPath as fileURLToPathRef } from 'node:url';
import { createTestHarness as createTestHarnessRef } from 'wrangler';
import { bookingInput as bookingInputRef, testKey as testKeyRef } from './helpers/bookingFixtures.js';
// codeguard:components:end

testRef('bundled Worker runs real D1 migrations, 9/60 rate binding, and scheduled cleanup locally', async (t) => {
  const root = fileURLToPathRef(new URL('../', import.meta.url));
  await promisifyRef(execFileRef)(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'deploy', '--dry-run', '--outdir', 'dist'], { cwd: root });
  const server = createTestHarnessRef({ root, workers: [{ config: {
    name: 'isolated-runtime-test', main: fileURLToPathRef(new URL('../dist/index.js', import.meta.url)), compatibility_date: '2026-09-05',
    d1_databases: [{ binding: 'DB', database_name: 'isolated-runtime-test', migrations_dir: fileURLToPathRef(new URL('../migrations', import.meta.url)) }],
    ratelimits: [{ name: 'BOOKING_RATE_LIMITER', namespace_id: '10122026', simple: { limit: 9, period: 60 } }],
  }, vars: { TURNSTILE_ALLOWED_HOSTNAMES: 'example.test', PUBLIC_ORIGINS: '' }, secrets: {
    BOOKING_HMAC_KEY: testKeyRef, TURNSTILE_SECRET_KEY: 'test-secret', BREVO_API_KEY: '', BREVO_SENDER_EMAIL: '', BREVO_RECIPIENT_EMAIL: '', BREVO_SENDER_NAME: '',
  } }] });
  const serverRef = server;
  t.after(() => serverRef.close()); await serverRef.listen();
  const worker = serverRef.getWorker(); await worker.applyD1Migrations('DB'); await worker.applyD1Migrations('DB');
  const env = await worker.getEnv();
  assert.equal((await env.DB.prepare('SELECT COUNT(*) AS n FROM d1_migrations').first()).n, 4);
  const site = await serverRef.fetch('https://example.test/api/site'); assert.equal(site.status, 200); assert.deepEqual(await site.json(), {});
  for (let i = 0; i < 9; i++) {
    const response = await serverRef.fetch('https://example.test/api/booking', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' },
      body: JSON.stringify({ ...bookingInputRef, turnstileToken: null }),
    });
    assert.equal(response.status, 400); assert.equal((await response.json()).message, 'Verification token is required.');
  }
  const limited = await serverRef.fetch('https://example.test/api/booking', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' }, body: JSON.stringify({ ...bookingInputRef, turnstileToken: null }),
  });
  assert.equal(limited.status, 429); assert.equal((await limited.json()).code, 'rate_limited');
  assert.equal((await env.DB.prepare('SELECT COUNT(*) AS n FROM inquiries').first()).n, 0);
  await env.DB.prepare("INSERT INTO booking_ip_blocks VALUES ('expired',0)").run();
  const scheduled = await worker.scheduled({ cron: '0 */6 * * *', scheduledTime: new Date() });
  assert.equal(scheduled.outcome, 'ok'); assert.equal((await env.DB.prepare('SELECT COUNT(*) AS n FROM booking_ip_blocks').first()).n, 0);
});
