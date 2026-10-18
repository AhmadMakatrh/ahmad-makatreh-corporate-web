// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { execFile as execFileRef } from 'node:child_process';
import { promisify as promisifyRef } from 'node:util';
import { mkdtemp as mkdtempRef, mkdir as mkdirRef, writeFile as writeFileRef } from 'node:fs/promises';
import { tmpdir as tmpdirRef } from 'node:os';
import { join as joinRef } from 'node:path';
import { fileURLToPath as fileURLToPathRef } from 'node:url';
import { createTestHarness as createTestHarnessRef } from 'wrangler';
import { base64url as base64urlRef } from 'jose';
// codeguard:components:end

testRef('compiled admin Worker gates actual static assets before delivery', async t => {
  const root = fileURLToPathRef(new URL('../', import.meta.url));
  const directory = await mkdtempRef(joinRef(tmpdirRef(), 'admin-assets-runtime-'));
  const assets = joinRef(directory, 'assets');
  await mkdirRef(joinRef(assets, 'assets'), { recursive: true });
  await writeFileRef(joinRef(assets, 'index.html'), '<!doctype html><title>protected-dashboard-marker</title>');
  await writeFileRef(joinRef(assets, 'assets', 'dashboard.js'), 'globalThis.protectedDashboardMarker = true;');
  const configPath = joinRef(directory, 'wrangler.json');
  await writeFileRef(configPath, JSON.stringify({
    name: 'isolated-admin-static-runtime',
    main: fileURLToPathRef(new URL('../../../deploy/cloudflare/admin-worker.js', import.meta.url)),
    compatibility_date: '2026-09-05',
    dev: { local_protocol: 'https' },
    vars: {
      ADMIN_ORIGIN: 'https://admin.example.test',
      ADMIN_ALLOWED_SUB: 'a028014a-923e-4eec-a6b0-5c01a89ec9ee',
      ADMIN_SESSION_KEY: base64urlRef.encode(new Uint8Array(32).fill(7)),
      SUPABASE_URL: 'https://auth.example.test',
    },
    assets: { binding: 'ASSETS', run_worker_first: true, directory: assets,
      not_found_handling: 'single-page-application' },
  }));
  await promisifyRef(execFileRef)(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'deploy',
    '--dry-run', '--config', configPath, '--outdir', joinRef(directory, 'dist')], { cwd: root });
  const server = createTestHarnessRef({ root: directory,
    workers: [{ configPath, prebuiltWorkerDir: joinRef(directory, 'dist') }] });
  const serverRef = server;
  t.after(() => serverRef.close());
  await serverRef.listen();
  const login = await serverRef.fetch('https://admin.example.test/');
  assert.equal(login.status, 200);
  assert.match(await login.text(), /إدارة الموقع/);
  for (const path of ['/assets/dashboard.js', '/assets/stale.js', '/work/crisis-fund']) {
    const response = await serverRef.fetch(`https://admin.example.test${path}`);
    assert.equal(response.status, 401, path);
    assert.doesNotMatch(await response.text(), /protectedDashboardMarker|protected-dashboard-marker/);
  }
  const api = await serverRef.fetch('https://admin.example.test/api/admin/session');
  assert.equal(api.status, 503); // The isolated fixture deliberately omits API secrets and limiters.
  assert.doesNotMatch(await api.text(), /protectedDashboardMarker|protected-dashboard-marker/);
  assert.equal((await serverRef.fetch('https://admin.example.test/api/site')).status, 404);
  assert.equal((await serverRef.fetch('https://wrong.example.test/assets/dashboard.js')).status, 404);
});
