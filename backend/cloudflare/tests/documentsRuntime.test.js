// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile as execFileRef } from 'node:child_process';
import { promisify as promisifyRef } from 'node:util';
import { mkdir as mkdirRef, mkdtemp as mkdtempRef, writeFile as writeFileRef } from 'node:fs/promises';
import { fileURLToPath as fileURLToPathRef } from 'node:url';
import { createTestHarness as createTestHarnessRef } from 'wrangler';
import { createAdminFixture as createAdminFixtureRef, adminRequest as adminRequestRef } from './helpers/adminFixtures.js';
import { prepareDocumentBody as prepareDocumentBodyRef } from '../src/documentBodies.js';
import { saveDraft as saveDraftRef, publishDocument as publishDocumentRef } from '../src/siteDocuments.js';
import { validateSiteDocument as validateSiteDocumentRef } from '../src/siteDocumentValidator.js';
import { parseDocumentBackup as parseDocumentBackupRef } from '../../../frontend/src/admin/documentBackup.js';

const time = '2026-10-12T10:00:00.0000000Z';
const timeRef = time;
const actor = 'owner@example.test';
const actorRef = actor;
// codeguard:components:end

test('compiled document API', async t => {
  const root = fileURLToPathRef(new URL('../', import.meta.url)), f = await createAdminFixtureRef();
  const fRef = f;
  const workspace = fileURLToPathRef(new URL('../../../.superpowers/sdd/2026-10-12-cloudflare-phase-3/', import.meta.url));
  await mkdirRef(workspace, { recursive: true });
  const directory = await mkdtempRef(`${workspace}runtime-`), configPath = `${directory}/wrangler.json`;
  const wrapper = fileURLToPathRef(new URL('./helpers/adminRuntimeWorker.js', import.meta.url)).replaceAll('\\', '/');
  await writeFileRef(`${directory}/entry.js`, `import worker from ${JSON.stringify(wrapper)};
let last;
export default { async fetch(request,env,ctx) {
  if(new URL(request.url).pathname==='/__test/document-stats') return Response.json(last);
  last={statements:0,batches:0,reads:0,writes:0,missingMetadata:0}; const counts=last;
  const record=r=>{if(!r.meta)counts.missingMetadata++;counts.reads+=r.meta?.rows_read??0;counts.writes+=r.meta?.rows_written??0;return r;};
  const wrap=s=>new Proxy(s,{get(target,key){if(key==='bind')return(...a)=>wrap(target.bind(...a));if(['all','run','first'].includes(key))return async(...a)=>{counts.statements++;return record(await target[key](...a));};const v=target[key];return typeof v==='function'?v.bind(target):v;}});
  const db={prepare:sql=>wrap(env.DB.prepare(sql)),async batch(s){counts.statements+=s.length;counts.batches++;return(await env.DB.batch(s)).map(record);}};
  return worker.fetch(request,{...env,DB:db},ctx);
}};`);
  const vars = Object.fromEntries(Object.entries(fRef.env).filter(([, value]) => typeof value === 'string'));
  await writeFileRef(configPath, JSON.stringify({ name: 'isolated-documents-runtime', main: `${directory}/entry.js`, compatibility_date: '2026-09-05', dev: { local_protocol: 'https' },
    vars: { ...vars, TEST_PUBLIC_JWKS: fRef.publicJwks },
    d1_databases: [{ binding: 'DB', database_name: 'isolated-documents-runtime', migrations_dir: fileURLToPathRef(new URL('../migrations', import.meta.url)) }],
    ratelimits: [{ name: 'ADMIN_RATE_LIMITER', namespace_id: '10122047', simple: { limit: 120, period: 60 } }, { name: 'ADMIN_REPLY_RATE_LIMITER', namespace_id: '10122048', simple: { limit: 6, period: 60 } }],
  }));
  await promisifyRef(execFileRef)(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'deploy', '--dry-run', '--config', configPath, '--outdir', `${directory}/dist`], { cwd: root });
  const server = createTestHarnessRef({ root: directory, workers: [{ configPath: configPath, prebuiltWorkerDir: `${directory}/dist` }] });
  const serverRef = server;
  t.after(() => serverRef.close()); await serverRef.listen(); const worker = serverRef.getWorker();
  await worker.applyD1Migrations('DB'); await worker.applyD1Migrations('DB'); const env = await worker.getEnv();
  assert.equal(await env.DB.prepare('SELECT count(*) AS n FROM d1_migrations').first('n'), 4);
  const call = async (path, options) => {
    const request = adminRequestRef(fRef, path, options);
    return serverRef.fetch(request.url, { method: request.method, headers: Object.fromEntries(request.headers), ...(request.method === 'GET' ? {} : { body: await request.text() }) });
  };
  const callRef = call;
  const session = await callRef('/session'); assert.equal(session.status, 200, await session.clone().text());
  const auth = { cookie: session.headers.get('Set-Cookie').split(';')[0], csrf: (await session.json()).csrfToken };
  const put = (key, expectedRevision, data) => callRef(`/documents/${key}`, { method: 'PUT', ...auth, body: { expectedRevision, data } });
  const putRef = put;
  const post = (key, action, body) => callRef(`/documents/${key}/${action}`, { method: 'POST', ...auth, body });
  const postRef = post;
  const site = () => serverRef.fetch('https://public.example.test/api/site');
  const siteRef = site;
  const stats = async () => (await serverRef.fetch('https://admin.example.test/__test/document-stats')).json();
  const statsRef = stats;
  await t.test('realDocumentLifecycleAndIsolation', async () => {
    assert.equal((await callRef('/documents/content', { method: 'PUT', body: { data: {} } })).status, 403);
    assert.equal((await serverRef.fetch('https://ahmad-makatreh.vip/api/admin/documents/content', { headers: { 'Cf-Access-Jwt-Assertion': fRef.accessToken } })).status, 404);
    assert.equal((await putRef('content', 0, { en: { title: 'first' } })).status, 200); assert.deepEqual(await (await siteRef()).json(), {});
    assert.equal((await postRef('content', 'publish', { expectedRevision: 1 })).status, 200);
    assert.equal((await putRef('content', 2, { en: { title: 'second' } })).status, 200);
    assert.equal((await postRef('content', 'publish', { expectedRevision: 3 })).status, 200);
    assert.equal((await postRef('content', 'publish', { expectedRevision: 4, restorePrevious: true })).status, 200);
    assert.deepEqual(await (await siteRef()).json(), { content: { en: { title: 'first' } } });
    const history = await (await callRef('/documents/content/history')).json(); assert.equal(history.items.length, 5);
    assert.equal(history.items[0].action, 'rollbackPublished');
    assert.equal((await postRef('content', 'restore', { expectedRevision: 5, revision: 1 })).status, 200);
    assert.equal((await postRef('content', 'restore', { expectedRevision: 5, revision: 1 })).status, 409);
  });
  await t.test('documentRequestBudget', async () => {
    const measured = {};
    const measuredRef = measured;
    await callRef('/session'); measuredRef.session = await statsRef(); assert.equal(measuredRef.session.statements, 0);
    await putRef('pages', 0, { pages: [] }); measuredRef.save = await statsRef(); assert.equal(measuredRef.save.statements, 3); assert.equal(measuredRef.save.batches, 1);
    await callRef('/documents/pages'); measuredRef.get = await statsRef(); assert.equal(measuredRef.get.statements, 1);
    await postRef('pages', 'publish', { expectedRevision: 1 }); measuredRef.publish = await statsRef(); assert.equal(measuredRef.publish.statements, 2);
    await callRef('/documents/pages/history'); measuredRef.history = await statsRef(); assert.equal(measuredRef.history.statements, 1);
    await postRef('pages', 'restore', { expectedRevision: 2, revision: 1 }); measuredRef.restore = await statsRef(); assert.equal(measuredRef.restore.statements, 3);
    await siteRef(); measuredRef.publicCold = await statsRef(); assert.equal(measuredRef.publicCold.statements, 1);
    await siteRef(); measuredRef.publicWarm = await statsRef(); assert.equal(measuredRef.publicWarm.statements, 0);
    await putRef('pages', 3, { pages: null }); measuredRef.invalid = await statsRef(); assert.equal(measuredRef.invalid.statements, 0);
    await callRef('/backup/documents'); measuredRef.backup = await statsRef(); assert.ok(measuredRef.backup.statements <= 7);
    assert.ok(Object.values(measuredRef).every(c => c.missingMetadata === 0));
    await writeFileRef(`${workspace}document-budget.json`, JSON.stringify(measuredRef, null, 2));
  });
  await t.test('exactInt64WireInWorkerd', async () => {
    for (const [i, revision] of [2, 'version-two'].entries()) {
      const data = { pages: [], '': { revision, expectedRevision: revision } };
      assert.equal((await putRef('pages', 3 + i, data)).status, 200);
      assert.deepEqual((await (await callRef('/documents/pages')).json()).draft, data);
    }
    await env.DB.prepare("UPDATE site_documents SET revision=9223372036854775806 WHERE key='pages'").run();
    const request = adminRequestRef(fRef, '/documents/pages', { method: 'PUT', ...auth, body: {} });
    const result = await serverRef.fetch(request.url, { method: 'PUT', headers: Object.fromEntries(request.headers), body: '{"expectedRevision":9223372036854775806,"data":{"pages":[]}}' });
    assert.equal(result.status, 200); assert.equal(await result.text(), '{"revision":9223372036854775807}');
    assert.match(await (await callRef('/documents/pages')).text(), /"revision":9223372036854775807/);
    const overflow = await serverRef.fetch(request.url, { method: 'PUT', headers: Object.fromEntries(request.headers), body: '{"expectedRevision":9223372036854775807,"data":{"pages":[]}}' });
    assert.equal(overflow.status, 400); assert.equal((await statsRef()).statements, 0);
  });
  await t.test('largeArabicDocumentAndSixBodyBackup', async () => {
    const ar = Object.fromEntries(Array.from({ length: 74 }, (_, i) => [`k${i}`, 'أ'.repeat(20000)])); ar.last = 'أ'.repeat(19000);
    const arabic = { ar };
     assert.equal(validateSiteDocumentRef('content', arabic), null);
    const saved = await putRef('content', 6, arabic); assert.equal(saved.status, 200);
    assert.deepEqual((await (await callRef('/documents/content')).json()).draft, arabic);
    assert.equal((await postRef('content', 'publish', { expectedRevision: 7 })).status, 200);
    assert.deepEqual((await (await siteRef()).json()).content, arabic);
    // Maximum valid bodies are distinct and span nine BLOB parts. Direct seeding is isolated test setup only.
    await env.DB.prepare("DELETE FROM site_document_versions").run(); await env.DB.prepare('DELETE FROM site_documents').run();
    for (const key of ['content','pricing','pages']) {
      for (let i = 0; i < 2; i++) {
        const data = key === 'content' ? { ar: Object.fromEntries(Array.from({ length: 74 }, (_, n) => [`k${n}`, 'ࠀ'.repeat(20000)])) }
          : { ...(key === 'pricing' ? { packages: [], offers: [] } : { pages: [] }), padding: 'ࠀ'.repeat(1499900) };
        if (key === 'content') data.ar.last = 'ࠀ'.repeat(19000) + i; else data.padding += i;
        assert.equal(validateSiteDocumentRef(key, data), null);
        assert.equal(await saveDraftRef(env.DB, key, await prepareDocumentBodyRef(JSON.stringify(data)), i === 0 ? 0n : 2n, actorRef, timeRef), true);
        if (i === 0) await publishDocumentRef(env.DB, key, 1n, false, actorRef, timeRef);
      }
    }
    const exported = await callRef('/backup/documents'); assert.equal(exported.status, 200);
    const text = await exported.text(), bytes = new TextEncoder().encode(text).length;
    assert.ok(bytes > 26000000 && bytes < 32 * 1024 * 1024);
    assert.equal(parseDocumentBackupRef(text, bytes).documents.length, 3); assert.equal((await statsRef()).statements, 7);
    await writeFileRef(`${workspace}maximum-backup.json`, JSON.stringify({ bytes, statements: 7, validatedBodies: 6 }));
  });
});
