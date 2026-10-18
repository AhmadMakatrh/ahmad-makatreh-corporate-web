// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import test from 'node:test';
import assert from 'node:assert/strict';
import { adminApiFixture as adminApiFixtureRef } from './helpers/adminFixtures.js';
import { applyDocumentMigration as applyDocumentMigrationRef } from './helpers/d1.js';
import { prepareDocumentBody as prepareDocumentBodyRef } from '../src/documentBodies.js';
import { saveDraft as saveDraftRef } from '../src/siteDocuments.js';
const fixtureRef = fixture;


async function fixture(t) { const f = await adminApiFixtureRef(t);
const fRef = f; await applyDocumentMigrationRef(fRef.db); fRef.auth = await fRef.login(); return fRef; }
const put = (f, key, revision, data) => f.call(`/documents/${key}`, { method: 'PUT', ...f.auth, body: { expectedRevision: revision, data } });
const putRef = put;
const publish = (f, revision, restorePrevious = false) => f.call('/documents/content/publish', { method: 'POST', ...f.auth, body: { expectedRevision: revision, restorePrevious } });
const publishRef = publish;
const site = f => f.api.fetch(new Request('https://public.example.test/api/site'), f.env);
const siteRef = site;
// codeguard:components:end

test('exactAdminDocumentContracts', async t => {
  const f = await fixtureRef(t);
  const fRef2 = f;
  const absent = await fRef2.call('/documents/content');
  assert.equal(absent.status, 200); assert.equal(absent.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(await absent.json(), { key: 'content', revision: 0, draft: null, publishedAtUtc: null, hasPrevious: false, isPublished: false });
  assert.deepEqual(await (await putRef(fRef2, 'content', 0, { en: { title: 'Hi' } })).json(), { revision: 1 });
  assert.equal((await putRef(fRef2, 'content', 0, {})).status, 409);
  assert.deepEqual(await (await fRef2.call('/documents/content')).json(), { key: 'content', revision: 1, draft: { en: { title: 'Hi' } }, publishedAtUtc: null, hasPrevious: false, isPublished: false });
  const history = await (await fRef2.call('/documents/content/history')).json();
  assert.equal(history.items.length, 1); assert.equal(history.items[0].actor, 'owner@example.test'); assert.equal(history.nextBefore, null);
});

test('nestedEmptyPropertiesRoundTripThroughApi', async t => {
  const f = await fixtureRef(t);
  const fRef3 = f;
  for (const [revision, value] of [2, 'version-two'].entries()) {
    const data = { pages: [], '': { revision: value, expectedRevision: value } };
    assert.equal((await putRef(fRef3, 'pages', revision, data)).status, 200);
    assert.deepEqual((await (await fRef3.call('/documents/pages')).json()).draft, data);
  }
});
test('allInvalidInputsBeforeD1', async t => {
  const f = await fixtureRef(t);
  const fRef4 = f;
  const baseline = fRef4.counts.statements;
  for (const [path, options, status] of [
    ['/documents/missing', {}, 404], ['/documents/content', { method: 'DELETE' }, 405],
    ['/documents/content/history?before=0', {}, 400], ['/documents/content/history?before=9223372036854775808', {}, 400],
    ['/documents/content', { method: 'PUT', body: { expectedRevision: 0, data: {} } }, 403],
    ['/documents/pricing', { method: 'PUT', ...fRef4.auth, body: { expectedRevision: 0, data: { packages: null } } }, 400],
    ['/documents/content', { method: 'PUT', ...fRef4.auth, body: { expectedRevision: '1', data: {} } }, 400],
    ['/documents/content/publish', { method: 'POST', ...fRef4.auth, body: { expectedRevision: 0 } }, 400],
    ['/documents/content/publish', { method: 'POST', ...fRef4.auth, body: { expectedRevision: 1, restorePrevious: 'true' } }, 400],
    ['/documents/content/restore', { method: 'POST', ...fRef4.auth, body: { expectedRevision: 1, revision: 0 } }, 400],
    ['/documents/content', { method: 'PUT', ...fRef4.auth, headers: { 'Content-Type': 'text/plain' }, body: {} }, 415],
    ['/documents/content', { method: 'PUT', ...fRef4.auth, headers: { 'Content-Length': String(6291457) }, body: {} }, 413],
  ]) assert.equal((await fRef4.call(path, options)).status, status, path);
  assert.equal(fRef4.counts.statements, baseline);
});
test('privateDraftsAndHistoryNeverPublic', async t => {
  const f = await fixtureRef(t); await putRef(f, 'content', 0, { ar: { title: 'سر خاص' } });
  assert.deepEqual(await (await siteRef(f)).json(), {});
  assert.equal((await publishRef(f, 1)).status, 200);
  await putRef(f, 'content', 2, { ar: { title: 'مسودة أخرى' } });
  const result = await (await siteRef(f)).json(); assert.deepEqual(result, { content: { ar: { title: 'سر خاص' } } });
  assert.ok(!JSON.stringify(result).includes('owner@example.test'));
});
test('publishAndPreviousSwapPreserveDraft', async t => {
  const f = await fixtureRef(t);
  const fRef5 = f; await putRef(fRef5, 'content', 0, { en: { title: 'first' } }); await publishRef(fRef5, 1);
  assert.equal((await publishRef(fRef5, 2)).status, 409);
  await putRef(fRef5, 'content', 2, { en: { title: 'second' } }); await publishRef(fRef5, 3);
  const previous = await publishRef(fRef5, 4, true); assert.equal(previous.status, 200); assert.equal((await previous.json()).revision, 5);
  assert.deepEqual((await (await fRef5.call('/documents/content')).json()).draft, { en: { title: 'second' } });
  assert.deepEqual(await (await siteRef(fRef5)).json(), { content: { en: { title: 'first' } } });
  assert.equal((await (await fRef5.call('/documents/content/history')).json()).items[0].action, 'rollbackPublished');
});
test('historicalRestoreValidatesSchema', async t => {
  const f = await fixtureRef(t);
  const fRef6 = f; await putRef(fRef6, 'pages', 0, { pages: [] }); await putRef(fRef6, 'pages', 1, { pages: [] });
  const restore = body => fRef6.call('/documents/pages/restore', { method: 'POST', ...fRef6.auth, body });
  const restoreRef = restore;
  assert.equal((await restoreRef({ revision: 20, expectedRevision: 2 })).status, 404);
  assert.deepEqual(await (await restoreRef({ revision: 1, expectedRevision: 2 })).json(), { revision: 3, draft: { pages: [] } });
  assert.equal((await restoreRef({ revision: 1, expectedRevision: 2 })).status, 409);
  await saveDraftRef(fRef6.db, 'pages', await prepareDocumentBodyRef('{"pages":null}'), 3n, 'owner@example.test', '2026-10-12T10:00:00.0000000Z');
  assert.equal((await restoreRef({ revision: 4, expectedRevision: 4 })).status, 400);
});
test('publicEtagAndLocalInvalidation', async t => {
  const f = await fixtureRef(t), original = await siteRef(f), originalTag = original.headers.get('ETag');
  await putRef(f, 'content', 0, { en: { title: 'first' } });
  assert.equal((await siteRef(f)).headers.get('ETag'), originalTag);
  await publishRef(f, 1); const published = await siteRef(f); assert.notEqual(published.headers.get('ETag'), originalTag);
  const calls = f.counts.statements; assert.equal((await publishRef(f, 2)).status, 409); await siteRef(f);
  assert.equal(f.counts.statements, calls + 2);
  const unchanged = await f.api.fetch(new Request('https://public.example.test/api/site', { headers: { 'If-None-Match': published.headers.get('ETag') } }), f.env);
  assert.equal(unchanged.status, 304); assert.equal(f.counts.statements, calls + 2);
});
