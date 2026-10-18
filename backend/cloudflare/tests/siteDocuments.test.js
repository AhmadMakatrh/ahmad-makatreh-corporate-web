// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import test from 'node:test';
import assert from 'node:assert/strict';
import { openTestDatabase as openTestDatabaseRef, applyInitialMigration as applyInitialMigrationRef, applyDocumentMigration as applyDocumentMigrationRef } from './helpers/d1.js';
import { trackDatabase as trackDatabaseRef } from './helpers/adminFixtures.js';
import { prepareDocumentBody as prepareDocumentBodyRef, decodeDocumentBody as decodeDocumentBodyRef } from '../src/documentBodies.js';
import { getDocument as getDocumentRef, saveDraft as saveDraftRef, publishDocument as publishDocumentRef, listDocumentHistory as listDocumentHistoryRef, getDocumentVersion as getDocumentVersionRef } from '../src/siteDocuments.js';
const fixtureRef = fixture;


const time = '2026-10-12T10:00:00.0000000Z';
const timeRef = time;
const actor = 'owner@example.test';
const actorRef = actor;
const body = data => prepareDocumentBodyRef(JSON.stringify(data));
const bodyRef = body;
async function fixture(t) {
  const f = await openTestDatabaseRef();
  const fRef = f; t.after(fRef.dispose);
  await applyInitialMigrationRef(fRef.db); await applyDocumentMigrationRef(fRef.db);
  return fRef.db;
}
const count = async (db, table) => Number((await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first()).n);
const countRef = count;
// codeguard:components:end

test('migrateEmptyAndPreviouslyPublished', async t => {
  const f = await openTestDatabaseRef();
  const fRef2 = f; t.after(fRef2.dispose); const db = fRef2.db;
  const dbRef = db;
  await applyInitialMigrationRef(dbRef);
  const old = await bodyRef({ old: 'منشور' });
  await dbRef.prepare('INSERT INTO site_document_chunks VALUES (?,0,?)').bind('old', old.parts[0]).run();
  await dbRef.prepare("INSERT INTO site_documents VALUES ('content','old')").run();
  await dbRef.prepare("INSERT INTO site_documents VALUES ('pages',NULL)").run();
  await applyDocumentMigrationRef(dbRef);
  assert.deepEqual(await getDocumentRef(dbRef, 'content'), { key: 'content', revision: 1n, draft: { old: 'منشور' }, publishedAtUtc: null, hasPrevious: false, isPublished: true });
  assert.equal((await getDocumentRef(dbRef, 'pages')).revision, 0n);
  assert.equal((await getDocumentRef(dbRef, 'pricing')).draft, null);
  assert.equal(await countRef(dbRef, 'site_document_versions'), 0);
});
test('saveAllThreeKinds', async t => {
  const db = await fixtureRef(t), { tracked: trackedRef, counts } = trackDatabaseRef(db);
  for (const key of ['pricing','content','pages']) {
    assert.equal(await saveDraftRef(trackedRef, key, await bodyRef({ key }), 0n, actorRef, timeRef), true);
    assert.equal((await getDocumentRef(trackedRef, key)).revision, 1n);
  }
  assert.equal(counts.batches, 3); assert.equal(counts.statements, 12);
  assert.equal(await countRef(db, 'site_document_versions'), 3);
});
test('twentyConcurrentFirstSaves', async t => {
  const db = await fixtureRef(t), data = await bodyRef({ ar: 'مرحبا' });
  const results = await Promise.all(Array.from({ length: 20 }, () => saveDraftRef(db, 'content', data, 0n, actorRef, timeRef)));
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(await countRef(db, 'site_document_chunks'), 1); assert.equal(await countRef(db, 'site_document_versions'), 1);
});
test('staleSaveLeavesNoOrphanBodies', async t => {
  const db = await fixtureRef(t); await saveDraftRef(db, 'pages', await bodyRef({ pages: [] }), 0n, actorRef, timeRef);
  assert.equal(await saveDraftRef(db, 'pages', await bodyRef({ pages: [1] }), 0n, actorRef, timeRef), false);
  assert.equal(await countRef(db, 'site_document_chunks'), 1); assert.equal(await countRef(db, 'site_document_versions'), 1);
});
test('savePublishAndRestoreRace', async t => {
  const db = await fixtureRef(t), data = await bodyRef({ v: 1 }); await saveDraftRef(db, 'content', data, 0n, actorRef, timeRef);
  const results = await Promise.all([saveDraftRef(db, 'content', await bodyRef({ v: 2 }), 1n, actorRef, timeRef), publishDocumentRef(db, 'content', 1n, false, actorRef, timeRef)]);
  assert.equal(results.filter(Boolean).length, 1); assert.equal((await getDocumentRef(db, 'content')).revision, 2n);
  const version = await getDocumentVersionRef(db, 'content', 1n);
  const next = await Promise.all([saveDraftRef(db, 'content', data, 2n, actorRef, timeRef, { action: 'restore:1', existingBodyId: version.bodyId }), saveDraftRef(db, 'content', await bodyRef({ v: 3 }), 2n, actorRef, timeRef)]);
  assert.equal(next.filter(Boolean).length, 1); assert.equal(await countRef(db, 'site_document_versions'), 3);
});
test('historyTwentyFivePlusOne', async t => {
  const db = await fixtureRef(t), data = await bodyRef({ v: 1 });
  for (let i = 0n; i < 27n; i++) await saveDraftRef(db, 'content', data, i, actorRef, timeRef);
  const { tracked: trackedRef2, counts } = trackDatabaseRef(db), page = await listDocumentHistoryRef(trackedRef2, 'content');
  assert.equal(page.items.length, 25); assert.equal(page.nextBefore, 3n); assert.equal(counts.statements, 1);
  assert.deepEqual(Object.keys(page.items[0]).sort(), ['action','actor','createdAtUtc','revision']);
  assert.equal((await listDocumentHistoryRef(db, 'content', page.nextBefore)).items.length, 2);
});
test('reusePublicationAndRestoredBodies', async t => {
  const db = await fixtureRef(t), data = await bodyRef({ v: 1 }); await saveDraftRef(db, 'content', data, 0n, actorRef, timeRef);
  const { tracked: trackedRef3, counts } = trackDatabaseRef(db);
  assert.equal(await publishDocumentRef(trackedRef3, 'content', 1n, false, actorRef, timeRef), true);
  assert.equal(counts.statements, 2); assert.equal(counts.batches, 1);
  const old = await getDocumentVersionRef(db, 'content', 1n);
  await saveDraftRef(db, 'content', await bodyRef({ v: 2 }), 2n, actorRef, timeRef); await publishDocumentRef(db, 'content', 3n, false, actorRef, timeRef);
  await publishDocumentRef(db, 'content', 4n, true, actorRef, timeRef);
  assert.deepEqual((await getDocumentRef(db, 'content')).draft, { v: 2 });
  await saveDraftRef(db, 'content', data, 5n, actorRef, timeRef, { action: 'restore:1', existingBodyId: old.bodyId });
  assert.equal(await countRef(db, 'site_document_chunks'), 2);
});
test('rollbackOnHistoryConstraintFailure', async t => {
  const db = await fixtureRef(t);
  await assert.rejects(saveDraftRef(db, 'content', await bodyRef({ v: 1 }), 0n, actorRef, timeRef, { action: 'invalid' }));
  assert.equal(await countRef(db, 'site_documents'), 0); assert.equal(await countRef(db, 'site_document_chunks'), 0); assert.equal(await countRef(db, 'site_document_versions'), 0);
});
test('identicalPublicationRejected', async t => {
  const db = await fixtureRef(t);
  const dbRef2 = db;
  const data = await bodyRef({ v: 1 });
  await saveDraftRef(dbRef2, 'content', data, 0n, actorRef, timeRef); await publishDocumentRef(dbRef2, 'content', 1n, false, actorRef, timeRef);
  await saveDraftRef(dbRef2, 'content', data, 2n, actorRef, timeRef);
  assert.equal((await getDocumentRef(dbRef2, 'content')).isPublished, true);
  assert.equal(await publishDocumentRef(dbRef2, 'content', 3n, false, actorRef, timeRef), false);
  await dbRef2.prepare("UPDATE site_documents SET draft_sha256=NULL,published_sha256=NULL WHERE key='content'").run();
  assert.equal(await publishDocumentRef(dbRef2, 'content', 3n, false, actorRef, timeRef), false);
});
test('unicodeAcrossChunksAndLongRevision', async t => {
  const db = await fixtureRef(t);
  const dbRef3 = db;
  const value = { ar: 'أ🙂'.repeat(210000) };
  const data = await bodyRef(value);
  assert.ok(data.parts.length > 1); assert.ok(data.parts.every(p => p.length <= 524288));
  await saveDraftRef(dbRef3, 'content', data, 0n, actorRef, timeRef);
  assert.deepEqual((await getDocumentRef(dbRef3, 'content')).draft, value);
  await dbRef3.prepare("UPDATE site_documents SET revision=9223372036854775806 WHERE key='content'").run();
  assert.equal(await saveDraftRef(dbRef3, 'content', data, 9223372036854775806n, actorRef, timeRef), true);
  assert.equal((await getDocumentRef(dbRef3, 'content')).revision, 9223372036854775807n);
  assert.equal(await saveDraftRef(dbRef3, 'content', data, 9223372036854775807n, actorRef, timeRef), false);
  assert.throws(() => decodeDocumentBodyRef([{ part_number: 0, content: [255] }]));
  assert.throws(() => decodeDocumentBodyRef([{ part_number: 1, content: [123,125] }]));
});
