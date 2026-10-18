// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import test from 'node:test';
import assert from 'node:assert/strict';
import { openTestDatabase as openTestDatabaseRef, applyInitialMigration as applyInitialMigrationRef, applyDocumentMigration as applyDocumentMigrationRef } from './helpers/d1.js';
import { trackDatabase as trackDatabaseRef, adminApiFixture as adminApiFixtureRef } from './helpers/adminFixtures.js';
import { prepareDocumentBody as prepareDocumentBodyRef } from '../src/documentBodies.js';
import { saveDraft as saveDraftRef, publishDocument as publishDocumentRef, readDocumentBackup as readDocumentBackupRef } from '../src/siteDocuments.js';
const fixtureRef = fixture;

const time = '2026-10-12T10:00:00.0000000Z';
const timeRef = time;
const actor = 'owner@example.test';
const actorRef = actor;
async function fixture(t) { const f = await openTestDatabaseRef();
const fRef = f; t.after(fRef.dispose); await applyInitialMigrationRef(fRef.db); await applyDocumentMigrationRef(fRef.db); return fRef.db; }
const save = async (db, key, revision, data) => saveDraftRef(db, key, await prepareDocumentBodyRef(JSON.stringify(data)), revision, actorRef, timeRef);
const saveRef = save;
// codeguard:components:end

test('backupEnvelopeAndSixBodies', async t => {
  const db = await fixtureRef(t);
  for (const key of ['content','pricing','pages']) { await saveRef(db, key, 0n, { key, version: 1 }); await publishDocumentRef(db, key, 1n, false, actorRef, timeRef); await saveRef(db, key, 2n, { key, version: 2 }); }
  const { tracked: trackedRef, counts } = trackDatabaseRef(db), result = await readDocumentBackupRef(trackedRef, timeRef);
  assert.equal(result.format, 'ahmad-site-documents'); assert.equal(result.version, 1); assert.equal(result.exportedAtUtc, timeRef);
  assert.equal(result.documents.length, 3); assert.equal(counts.statements, 7);
  for (const d of result.documents) { assert.equal(d.revision, 3n); assert.equal(d.draft.version, 2); assert.equal(d.published.version, 1); assert.deepEqual(Object.keys(d).sort(), ['draft','key','published','revision']); }
});
test('backupSnapshotDuringPublication', async t => {
  const db = await fixtureRef(t);
  const dbRef = db; await saveRef(dbRef, 'content', 0n, { old: true }); await publishDocumentRef(dbRef, 'content', 1n, false, actorRef, timeRef);
  await saveRef(dbRef, 'content', 2n, { next: true });
  let once = true;
  const delayed = { prepare(sql) { const statement = dbRef.prepare(sql);
  const statementRef = statement; return { bind: (...args) => statementRef.bind(...args), async all() {
    const result = await statementRef.all();
    if (once) { once = false; await publishDocumentRef(dbRef, 'content', 3n, false, actorRef, timeRef); await saveRef(dbRef, 'content', 4n, { newest: true }); }
    return result;
  } }; } };
  const delayedRef = delayed;
  const result = await readDocumentBackupRef(delayedRef, timeRef);
  assert.deepEqual(result.documents[0], { key: 'content', revision: 3n, draft: { next: true }, published: { old: true } });
});
test('duplicatePointersReadOnce', async t => {
  const db = await fixtureRef(t); await saveRef(db, 'content', 0n, { v: 1 }); await publishDocumentRef(db, 'content', 1n, false, actorRef, timeRef);
  const { tracked: trackedRef2, counts } = trackDatabaseRef(db); const result = await readDocumentBackupRef(trackedRef2, timeRef);
  assert.deepEqual(result.documents[0].draft, result.documents[0].published); assert.equal(counts.statements, 2);
});
test('emptyBackupUsesOneSelect', async t => {
  const db = await fixtureRef(t), { tracked: trackedRef3, counts } = trackDatabaseRef(db);
  assert.deepEqual((await readDocumentBackupRef(trackedRef3, timeRef)).documents, []); assert.equal(counts.statements, 1);
});
test('selectedRestoreDoesNotPublishOrReplaceOtherKeys', async t => {
  const f = await adminApiFixtureRef(t);
  const fRef2 = f; await applyDocumentMigrationRef(fRef2.db); const auth = await fRef2.login();
  await saveRef(fRef2.db, 'content', 0n, { en: { title: 'live' } }); await publishDocumentRef(fRef2.db, 'content', 1n, false, actorRef, timeRef);
  await saveRef(fRef2.db, 'pages', 0n, { pages: [] });
  const exported = await fRef2.call('/backup/documents'); assert.equal(exported.status, 200); assert.equal(exported.headers.get('Cache-Control'), 'no-store');
  const result = await fRef2.call('/documents/content', { method: 'PUT', ...auth, body: { expectedRevision: 2, data: { en: { title: 'restored' } } } }); assert.equal(result.status, 200);
  const after = await (await fRef2.call('/backup/documents')).json();
  assert.equal(after.documents.find(d => d.key === 'content').published.en.title, 'live'); assert.equal(after.documents.find(d => d.key === 'pages').revision, 1);
  assert.equal((await fRef2.call('/backup/documents', { method: 'POST', ...auth, body: {} })).status, 405);
});
