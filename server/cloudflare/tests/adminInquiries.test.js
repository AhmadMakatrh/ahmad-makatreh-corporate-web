// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { listInquiries as listInquiriesRef, getInquiry as getInquiryRef, updateInquiryStatus as updateInquiryStatusRef, updateInquiryNotes as updateInquiryNotesRef } from '../src/adminInquiries.js';
import { openTestDatabase as openTestDatabaseRef, applyInitialMigration as applyInitialMigrationRef, applyAdminMigration as applyAdminMigrationRef, seedInquiry as seedInquiryRef, sampleInquirySql as sampleInquirySqlRef } from './helpers/d1.js';
import { trackDatabase as trackDatabaseRef } from './helpers/adminFixtures.js';
import { parseCursor as parseCursorRef } from '../src/inquiryTime.js';
// codeguard:components:end

testRef('inbox uses bounded cursor paging with equal times and no private summary fields', async (t) => {
  const { db: dbRef, dispose: disposeRef } = await openTestDatabaseRef(); t.after(disposeRef); await applyInitialMigrationRef(dbRef);
  const ids = Array.from({ length: 26 }, (_, i) => `${String(i + 1).padStart(8, '0')}-1111-4111-8111-111111111111`);
  await dbRef.batch(ids.map((id, i) => dbRef.prepare(sampleInquirySqlRef).bind(id, `ref-${i}`, '2026-10-12T08:00:00.1234567Z', '2026-10-12T08:00:00.1234567Z')));
  await applyAdminMigrationRef(dbRef); const { tracked: trackedRef, counts } = trackDatabaseRef(dbRef);
  const first = await listInquiriesRef(trackedRef, { pageSize: 25 });
  assert.equal(first.items.length, 25); assert.equal(first.items[0].id, ids[25]); assert.ok(first.nextCursor);
  assert.equal('projectDetails' in first.items[0], false); assert.equal('adminNotes' in first.items[0], false);
  const second = await listInquiriesRef(trackedRef, { pageSize: 25, ...parseCursorRef(first.nextCursor) });
  assert.deepEqual(second.items.map(r => r.id), [ids[0]]); assert.equal(second.nextCursor, null); assert.equal(counts.statements, 2);
});
testRef('literal Unicode search and filters select only matching inquiries with one SELECT', async (t) => {
  const { db: dbRef2, dispose: disposeRef2 } = await openTestDatabaseRef(); t.after(disposeRef2); await applyInitialMigrationRef(dbRef2); await seedInquiryRef(dbRef2); await applyAdminMigrationRef(dbRef2);
  await dbRef2.prepare("UPDATE inquiries SET name='أحمد %/_ Test',email='owner@example.invalid',inquiry_category='technical-support',notification_status='failed'").run();
  const { tracked: trackedRef2, counts } = trackDatabaseRef(dbRef2);
  const matched = await listInquiriesRef(trackedRef2, { search: '%/_', category: 'technical-support', notificationStatus: 'failed', status: 'New', fromUtc: '2026-10-12T00:00:00.0000000Z', toExclusiveUtc: '2026-10-13T00:00:00.0000000Z', pageSize: 25 });
  assert.equal(matched.items.length, 1); assert.equal(counts.statements, 1);
  assert.equal((await listInquiriesRef(trackedRef2, { search: 'test', pageSize: 25 })).items.length, 0);
  assert.equal((await listInquiriesRef(trackedRef2, { search: 'أحمد', pageSize: 25 })).items.length, 1);
});
testRef('concurrent status and notes updates claim one exact revision without a pre-read', async (t) => {
  const { db: dbRef3, dispose: disposeRef3 } = await openTestDatabaseRef(); t.after(disposeRef3); await applyInitialMigrationRef(dbRef3); await seedInquiryRef(dbRef3); await applyAdminMigrationRef(dbRef3);
  const { tracked: trackedRef3, counts } = trackDatabaseRef(dbRef3), id = '11111111-1111-4111-8111-111111111111';
  const idRef = id;
  const expected = '2026-10-12T08:00:00.0000000Z';
  const expectedRef = expected;
  const results = await Promise.all([updateInquiryStatusRef(trackedRef3, idRef, 'Contacted', expectedRef, '2026-10-12T08:00:00.0010000Z'), updateInquiryNotesRef(trackedRef3, idRef, 'ملاحظات', 'Owner@example.test', expectedRef, '2026-10-12T08:00:00.0010000Z')]);
  assert.deepEqual(results.sort(), [false, true]); assert.equal(counts.statements, 2);
  const saved = await getInquiryRef(trackedRef3, idRef); assert.equal(saved.updatedAtUtc, '2026-10-12T08:00:00.0010000Z'); assert.equal(saved.projectDetails, 'A real project');
});
