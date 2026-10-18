import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { access as accessRef, readFile as readFileRef } from 'node:fs/promises';

const rootRef = new URL('../../../', import.meta.url);

for (const [name, entry, assets] of [
  ['public', 'deploy/cloudflare/public-worker.js', 'frontend/dist/'],
  ['admin', 'deploy/cloudflare/admin-worker.js', 'frontend/dist-admin/'],
  ['local', 'backend/cloudflare/src/index.js', null],
  ['preview', 'backend/cloudflare/src/index.js', null],
]) {
  testRef(`${name} deployment resolves its entry, schema, migrations and assets from the shared deployment directory`, async () => {
    const location = new URL(`deploy/cloudflare/wrangler.${name}.jsonc`, rootRef);
    const config = JSON.parse((await readFileRef(location, 'utf8')).replace(/^\s*\/\/.*$/gm, ''));
    assert.equal(new URL(config.main, location).href, new URL(entry, rootRef).href);
    await accessRef(new URL(config.main, location));
    await accessRef(new URL(config.$schema, location));
    assert.equal(new URL(`${config.d1_databases[0].migrations_dir}/`, location).href,
      new URL('backend/cloudflare/migrations/', rootRef).href);
    await accessRef(new URL(config.d1_databases[0].migrations_dir, location));
    if (assets) {
      assert.equal(new URL(`${config.assets.directory}/`, location).href, new URL(assets, rootRef).href);
      assert.deepEqual(config.routes, [{
        pattern: name === 'public' ? 'ahmad-makatreh.vip' : 'admin.ahmad-makatreh.vip',
        zone_name: 'ahmad-makatreh.vip', custom_domain: true, enabled: true, previews_enabled: false,
      }]);
      assert.equal(config.preview_urls, name === 'admin');
    } else {
      assert.equal(config.assets, undefined);
    }
    if (name === 'local') {
      assert.equal(config.d1_databases[0].database_id, undefined);
      assert.equal(config.workers_dev, false);
    }
  });
}
