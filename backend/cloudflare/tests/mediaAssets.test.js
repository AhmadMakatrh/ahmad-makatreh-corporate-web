// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import test from 'node:test';
import assert from 'node:assert/strict';
import { openTestDatabase as openTestDatabaseRef, applyInitialMigration as applyInitialMigrationRef, applyAdminMigration as applyAdminMigrationRef, applyDocumentMigration as applyDocumentMigrationRef, applyMediaMigration as applyMediaMigrationRef, seedInquiry as seedInquiryRef } from './helpers/d1.js';
import { listMediaAssets as listMediaAssetsRef, getMediaAsset as getMediaAssetRef } from '../src/mediaAssets.js';
import { parseCursor as parseCursorRef } from '../src/inquiryTime.js';
// codeguard:components:end

test('pagedLibrary: additive migration preserves existing rows and stable date/id pagination', async t => {
  const {db: dbRef,dispose: disposeRef}=await openTestDatabaseRef();t.after(disposeRef);
  await applyInitialMigrationRef(dbRef);await seedInquiryRef(dbRef);await applyAdminMigrationRef(dbRef);await applyDocumentMigrationRef(dbRef);await applyMediaMigrationRef(dbRef);
  assert.equal(await dbRef.prepare('SELECT count(*) AS n FROM inquiries').first('n'),1);
  for(let i=0;i<28;i++)await dbRef.prepare(`INSERT INTO media_assets (id,object_key,url,original_name,content_type,sha256,size,created_at_utc,actor,archived)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(`11111111-1111-4111-8111-${String(i).padStart(12,'0')}`,`${i}.png`,`https://media.example.test/${i}.png`,'قلعة.png','image/png','a'.repeat(64),12,'2026-10-12T08:00:00.0000000Z','owner@example.test',i===27?1:0).run();
  const first=await listMediaAssetsRef(dbRef,null);assert.equal(first.items.length,25);assert.ok(first.nextCursor);
  const second=await listMediaAssetsRef(dbRef,parseCursorRef(first.nextCursor));assert.equal(second.items.length,2);assert.equal(second.nextCursor,null);
  assert.equal(new Set([...first.items,...second.items].map(v=>v.id)).size,27);
  assert.deepEqual(Object.keys(first.items[0]).sort(),['contentType','createdAtUtc','id','originalName','size','url']);
  const row=await getMediaAssetRef(dbRef,first.items[0].id);assert.equal(row.originalName,'قلعة.png');assert.equal(row.archived,false);
  assert.equal(await getMediaAssetRef(dbRef,crypto.randomUUID()),null);
});
