// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath as filePath } from 'node:url';
import { experimental_readRawConfig as readRawConfig } from 'wrangler';

const readConfig = async () => readRawConfig({ config: filePath(new URL('../wrangler.preview.jsonc', import.meta.url)) }).rawConfig;
const readConfigRef = readConfig;
// codeguard:components:end

test('preview deployment targets the approved account and has no public URLs or automatic database jobs', async () => {
  const config = await readConfigRef();
  assert.equal(config.account_id, 'fe25e25f13db2c636fd743e41c8a47e1');
  assert.equal(config.name, 'ahmad-makatreh-preview');
  assert.notEqual(config.name, 'ahmad-makatreh-site');
  assert.equal(config.main, 'src/index.js');
  assert.equal(config.compatibility_date, '2026-09-05');
  assert.equal(config.workers_dev, false);
  assert.equal(config.preview_urls, false);
  assert.deepEqual(config.routes, []);
  assert.deepEqual(config.triggers, { crons: [] });
});

test('preview storage bindings point only to the resources owned by this plan', async () => {
  const config = await readConfigRef();
  assert.deepEqual(config.d1_databases, [{
    binding: 'DB',
    database_name: 'ahmad-makatreh-preview',
    database_id: '7b1d12c7-8d63-49c2-b9ec-fec22dfc5f3f',
    migrations_dir: 'migrations',
  }]);
  assert.match(config.d1_databases[0].database_id, /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/);
  assert.notEqual(config.d1_databases[0].database_id, '20f591eb-d67d-4163-bb6f-370abc6c20bf');
  assert.equal(config.r2_buckets, undefined);
  assert.deepEqual(config.vars, {
    MEDIA_PROVIDER: 'supabase',
    SUPABASE_URL: 'https://kghmejpjvbmcivnlnkgf.supabase.co',
    SUPABASE_STORAGE_BUCKET: 'ahmad-makatreh-media-preview',
  });
});

test('preview rate limits are isolated from the local and production namespaces', async () => {
  const config = await readConfigRef();
  assert.deepEqual(config.ratelimits, [
    { name: 'BOOKING_RATE_LIMITER', namespace_id: '10122030', simple: { limit: 9, period: 60 } },
    { name: 'ADMIN_RATE_LIMITER', namespace_id: '10122031', simple: { limit: 120, period: 60 } },
    { name: 'ADMIN_REPLY_RATE_LIMITER', namespace_id: '10122032', simple: { limit: 6, period: 60 } },
    { name: 'ADMIN_UPLOAD_RATE_LIMITER', namespace_id: '10122033', simple: { limit: 6, period: 60 } },
  ]);
});

test('preview config contains no environment overrides, credentials or unexpected remote bindings', async () => {
  const config = await readConfigRef();
  assert.deepEqual(Object.keys(config).sort(), [
    '$schema', 'account_id', 'compatibility_date', 'd1_databases', 'main', 'name',
    'preview_urls', 'vars', 'ratelimits', 'routes', 'triggers', 'workers_dev',
  ].sort());
  assert.equal(config.$schema, 'node_modules/wrangler/config-schema.json');
});
