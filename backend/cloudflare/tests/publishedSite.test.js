// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { applyInitialMigration as applyInitialMigrationRef, openTestDatabase as openTestDatabaseRef } from './helpers/d1.js';
import { createSiteReader as createSiteReaderRef } from '../src/publishedSite.js';
const fixtureRef = fixture;
const publishRef = publish;


async function fixture(t) {
  const { db: dbRef, dispose: disposeRef } = await openTestDatabaseRef(); t.after(disposeRef); await applyInitialMigrationRef(dbRef);
  return dbRef;
}
async function publish(db, key, body, id = key) {
  const bytes = new TextEncoder().encode(JSON.stringify(body));
  const statements = [db.prepare('INSERT OR REPLACE INTO site_documents VALUES (?, ?)').bind(key, id)];
  for (let offset = 0, part = 0; offset < bytes.length; offset += 524288, part++) {
    statements.push(db.prepare('INSERT INTO site_document_chunks VALUES (?, ?, ?)').bind(id, part, bytes.slice(offset, offset + 524288)));
  }
  await db.batch(statements);
}
// codeguard:components:end

testRef('empty database yields only an empty published snapshot', async (t) => {
  const db = await fixtureRef(t);
  const snapshot = await createSiteReaderRef().read(db);
  assert.equal(snapshot.json, '{}'); assert.deepEqual(snapshot.documents, {});
  assert.match(snapshot.etag, /^"[a-fA-F0-9]{64}"$/);
});
testRef('concurrent reads share one select, expire after 30 seconds, and retain stable etag', async (t) => {
  const db = await fixtureRef(t);
  const dbRef3 = db; await publishRef(dbRef3, 'pricing', { packages: [] });
  let now = 0, reads = 0;
  const tracked = { prepare(sql) { reads++; return dbRef3.prepare(sql); } };
  const trackedRef = tracked;
  const reader = createSiteReaderRef({ now: () => now });
  const readerRef = reader;
  const snapshots = await Promise.all(Array.from({ length: 100 }, () => readerRef.read(trackedRef)));
  assert.equal(reads, 1); assert.equal(snapshots[0].json, '{"pricing":{"packages":[]}}');
  now = 29999; await readerRef.read(trackedRef); assert.equal(reads, 1);
  now = 30000; const next = await readerRef.read(trackedRef); assert.equal(reads, 2);
  assert.equal(next.etag, snapshots[0].etag);
  await publishRef(dbRef3, 'content', { copy: { ar: { headline: 'أهلًا' } } });
  readerRef.invalidate(); const changed = await readerRef.read(trackedRef);
  assert.notEqual(changed.etag, next.etag);
});
testRef('large Arabic document survives UTF-8 chunk boundaries, and unpublished bodies stay private', async (t) => {
  const db = await fixtureRef(t);
  const dbRef4 = db; const body = { copy: { ar: { headline: 'أه'.repeat(700000) } } };
  await publishRef(dbRef4, 'content', body);
  await dbRef4.prepare("INSERT INTO site_document_chunks VALUES ('draft', 0, ?)").bind(new TextEncoder().encode('{"secret":"draft"}')).run();
  const snapshot = await createSiteReaderRef().read(dbRef4);
  assert.deepEqual(snapshot.documents, { content: body }); assert.ok(!snapshot.json.includes('draft'));
});
testRef('corrupt, missing, and noncontiguous published chunks are rejected', async (t) => {
  const db = await fixtureRef(t);
  const dbRef5 = db;
  await dbRef5.prepare("INSERT INTO site_documents VALUES ('content','missing')").run();
  await assert.rejects(createSiteReaderRef().read(dbRef5), /Published content/);
  await dbRef5.prepare("INSERT INTO site_document_chunks VALUES ('missing',1,?)").bind(new TextEncoder().encode('{}')).run();
  await assert.rejects(createSiteReaderRef().read(dbRef5), /Published content/);
  await dbRef5.prepare('DELETE FROM site_document_chunks').run();
  await dbRef5.prepare("INSERT INTO site_document_chunks VALUES ('missing',0,?)").bind(new Uint8Array([0xff])).run();
  await assert.rejects(createSiteReaderRef().read(dbRef5), /Published content/);
});
testRef('invalidation during a read does not repopulate an obsolete snapshot', async (t) => {
  const db = await fixtureRef(t);
  const dbRef6 = db; let release; let calls = 0;
  const gate = new Promise(resolve => { release = resolve; });
  const delayed = { prepare(sql) { const statement = dbRef6.prepare(sql); return { async all() { calls++; if (calls === 1) await gate; return statement.all(); } }; } };
  const delayedRef = delayed;
  const reader = createSiteReaderRef();
  const readerRef2 = reader; const pending = readerRef2.read(delayedRef);
  readerRef2.invalidate(); release(); await pending; await readerRef2.read(delayedRef);
  assert.equal(calls, 2);
});

testRef('pendingReadCannotServePostPublishRequest', async () => {
  const gates = [];
  const reader = createSiteReaderRef();
  const readerRef3 = reader;
  const db = { prepare() { return { all() { return new Promise(resolve => gates.push(resolve)); } }; } };
  const dbRef2 = db;
  const old = readerRef3.read(dbRef2); readerRef3.invalidate(); const fresh = readerRef3.read(dbRef2);
  assert.equal(gates.length, 2);
  gates[0]({ results: [] }); await old;
  const shared = readerRef3.read(dbRef2); assert.equal(gates.length, 2);
  gates[1]({ results: [{ key: 'content', part_number: 0, content: [...new TextEncoder().encode('{"new":true}')] }] });
  assert.equal((await fresh).json, '{"content":{"new":true}}');
  assert.equal((await shared).json, (await readerRef3.read(dbRef2)).json);
});
