// codeguard:components:start
// codeguard:defines: public HTML CSP runtime regression
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { execFile as execFileRef } from 'node:child_process';
import { promisify as promisifyRef } from 'node:util';
import { mkdtemp as mkdtempRef, mkdir as mkdirRef, readFile as readFileRef, writeFile as writeFileRef } from 'node:fs/promises';
import { tmpdir as tmpdirRef } from 'node:os';
import { join as joinRef } from 'node:path';
import { fileURLToPath as filePath } from 'node:url';
import { createTestHarness as createTestHarnessRef } from 'wrangler';
// codeguard:components:end

testRef('public HTML gets a fresh CSP nonce without authorizing arbitrary inline scripts or changing static caching', async t => {
  const directory = await mkdtempRef(joinRef(tmpdirRef(), 'public-csp-runtime-'));
  const assets = joinRef(directory, 'assets');
  await mkdirRef(joinRef(assets, 'assets'), { recursive: true });
  const template = await readFileRef(new URL('../../../frontend/index.html', import.meta.url), 'utf8');
  const policy = template.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  await writeFileRef(joinRef(assets, 'index.html'), `<!doctype html><html lang="ar" dir="rtl"><head><meta http-equiv="Content-Security-Policy" content="${policy}"></head><body><h1>صفحة آمنة</h1><script>window.untrustedMarker = true;</script></body></html>`);
  await writeFileRef(joinRef(assets, '_headers'), await readFileRef(new URL('../../../frontend/public/_headers', import.meta.url)));
  await writeFileRef(joinRef(assets, 'assets', 'app.js'), 'window.publicMarker = true;');
  const configPath = joinRef(directory, 'wrangler.json');
  const sourceConfig = JSON.parse((await readFileRef(new URL('../../../deploy/cloudflare/wrangler.public.jsonc', import.meta.url), 'utf8')).replace(/^\s*\/\/.*$/gm, ''));
  await writeFileRef(configPath, JSON.stringify({ name: 'isolated-public-csp',
    main: filePath(new URL('../../../deploy/cloudflare/public-worker.js', import.meta.url)), compatibility_date: sourceConfig.compatibility_date,
    assets: { ...sourceConfig.assets, directory: assets } }));
  await promisifyRef(execFileRef)(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'deploy',
    '--dry-run', '--config', configPath, '--outdir', joinRef(directory, 'dist')], { cwd: filePath(new URL('../', import.meta.url)) });
  const server = createTestHarnessRef({ root: directory,
    workers: [{ configPath, prebuiltWorkerDir: joinRef(directory, 'dist') }] });
  t.after(() => server.close());
  await server.listen();
  const nonces = new Set();
  for (const path of ['/', '/page/ar/work/tammivo']) {
    const response = await server.fetch(`https://public.example.test${path}`, {
      headers: { 'Sec-Fetch-Mode': 'navigate', 'If-None-Match': '*', 'If-Modified-Since': 'Wed, 01 Jan 2098 00:00:00 GMT' },
    });
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('X-Frame-Options'), 'DENY');
    const csp = response.headers.get('Content-Security-Policy');
    const nonce = csp.match(/'nonce-([^']+)'/)?.[1];
    assert.ok(nonce, 'The response header must allow Cloudflare to nonce its injected bot-detection script');
    assert.ok(!nonces.has(nonce)); nonces.add(nonce);
    assert.equal(atob(nonce).length, 16);
    assert.doesNotMatch(csp.match(/script-src\s+([^;]+)/)[1], /unsafe-inline|unsafe-eval/);
    assert.match(response.headers.get('Cache-Control'), /no-store/);
    assert.equal(response.headers.get('ETag'), null);
    assert.ok(html.includes(`'nonce-${nonce}'`));
    assert.ok(html.includes('<script>window.untrustedMarker = true;</script>'));
    assert.ok(html.includes('<h1>صفحة آمنة</h1>'));
  }
  const script = await server.fetch('https://public.example.test/assets/app.js');
  assert.equal(await script.text(), 'window.publicMarker = true;');
  assert.doesNotMatch(script.headers.get('Cache-Control'), /no-store/);
  const conditional = await server.fetch('https://public.example.test/assets/app.js', { headers: { 'If-None-Match': script.headers.get('ETag') } });
  assert.equal(conditional.status, 304);
  const head = await server.fetch('https://public.example.test/', { method: 'HEAD' });
  assert.equal(await head.text(), '');
  assert.match(head.headers.get('Content-Security-Policy'), /'nonce-/);
});
