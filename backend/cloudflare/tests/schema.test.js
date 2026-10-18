// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { applyInitialMigration as applyInitialMigrationRef, applyAdminMigration as applyAdminMigrationRef, openTestDatabase as openTestDatabaseRef, seedInquiry as seedInquiryRef } from './helpers/d1.js';
// codeguard:components:end

testRef('migration preserves inquiries and enforces reference, length and state constraints', async (t) => {
  const { db: dbRef, dispose: disposeRef } = await openTestDatabaseRef(); t.after(disposeRef);
  await applyInitialMigrationRef(dbRef);
  await seedInquiryRef(dbRef);
  await applyInitialMigrationRef(dbRef);
  assert.equal((await dbRef.prepare('SELECT COUNT(*) AS count FROM inquiries').first()).count, 1);
  await assert.rejects(seedInquiryRef(dbRef, '22222222-2222-4222-8222-222222222222'), /UNIQUE/);
  await assert.rejects(dbRef.prepare("UPDATE inquiries SET name = ?").bind('x'.repeat(101)).run(), /CHECK/);
  await assert.rejects(dbRef.prepare("UPDATE inquiries SET status = 'Invalid'").run(), /CHECK/);
  for (const status of ['New', 'Contacted', 'InProgress', 'Closed', 'Archived']) {
    await dbRef.prepare('UPDATE inquiries SET status = ?').bind(status).run();
    assert.equal((await dbRef.prepare('SELECT status FROM inquiries').first()).status, status);
  }
  await assert.rejects(dbRef.prepare("UPDATE inquiries SET notification_status = 'delivered'").run(), /CHECK/);
  await assert.rejects(dbRef.prepare("INSERT INTO site_documents (key) VALUES ('private')").run(), /CHECK/);
  await assert.rejects(dbRef.prepare("INSERT INTO site_document_chunks VALUES ('b', 0, ?)").bind(new Uint8Array(524289)).run(), /CHECK/);
});

testRef('admin migration preserves inquiry instants and private fields, is repeatable and enforces reply FK', async (t) => {
  const { db: dbRef2, dispose: disposeRef2 } = await openTestDatabaseRef(); t.after(disposeRef2);
  await applyInitialMigrationRef(dbRef2); await seedInquiryRef(dbRef2);
  await dbRef2.prepare("UPDATE inquiries SET admin_notes='ملاحظة',notification_status='unknown',notification_attempted_at_utc='2026-10-12T08:00:05.123Z'").run();
  await applyAdminMigrationRef(dbRef2); await applyAdminMigrationRef(dbRef2);
  const row = await dbRef2.prepare('SELECT * FROM inquiries').first();
  assert.equal(row.created_at_utc, '2026-10-12T08:00:00.0000000Z');
  assert.equal(row.notification_attempted_at_utc, '2026-10-12T08:00:05.1230000Z');
  assert.equal(row.admin_notes, 'ملاحظة'); assert.equal(row.notification_status, 'unknown');
  await assert.rejects(dbRef2.prepare("INSERT INTO inquiry_replies (id,inquiry_id,subject,body,actor,created_at_utc) VALUES ('r','absent','Reply','Body','owner@example.test','2026-10-12T08:00:00.0000000Z')").run(), /FOREIGN KEY/);
});

testRef('an atomic batch failure rolls back earlier writes', async (t) => {
  const { db: dbRef3, dispose: disposeRef3 } = await openTestDatabaseRef(); t.after(disposeRef3);
  await applyInitialMigrationRef(dbRef3); await seedInquiryRef(dbRef3);
  await assert.rejects(dbRef3.batch([
    dbRef3.prepare("UPDATE inquiries SET admin_notes = 'Must roll back'"),
    dbRef3.prepare("UPDATE inquiries SET status = 'Invalid'"),
  ]), /CHECK/);
  assert.equal((await dbRef3.prepare('SELECT admin_notes FROM inquiries').first()).admin_notes, '');
});
