// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { storeInquiry as storeInquiryRef, recordNotification as recordNotificationRef, cleanupAbuse as cleanupAbuseRef } from '../src/inquiries.js';
import { createInquiry as createInquiryRef } from '../src/bookingCrypto.js';
import { bookingInput as bookingInputRef, testTime as testTimeRef } from './helpers/bookingFixtures.js';
import { openTestDatabase as openTestDatabaseRef, applyInitialMigration as applyInitialMigrationRef } from './helpers/d1.js';
const fixtureRef = fixture;

async function fixture(t) {
  const { db: dbRef, dispose: disposeRef } = await openTestDatabaseRef(); t.after(disposeRef); await applyInitialMigrationRef(dbRef); return dbRef;
}
const candidate = () => createInquiryRef(bookingInputRef, testTimeRef);
const candidateRef = candidate;
// codeguard:components:end

testRef('fifth repeat blocks the whole IP for 30 minutes without extending the block', async (t) => {
  const db = await fixtureRef(t);
  const dbRef2 = db;
  assert.deepEqual(await storeInquiryRef(dbRef2, candidateRef(), 'ip-a', 'body-a', testTimeRef), { disposition: 'stored' });
  for (let i = 1; i <= 4; i++) assert.deepEqual(await storeInquiryRef(dbRef2, candidateRef(), 'ip-a', 'body-a', testTimeRef + i * 1000), { disposition: 'duplicate' });
  assert.deepEqual(await storeInquiryRef(dbRef2, candidateRef(), 'ip-a', 'body-a', testTimeRef + 5000), { disposition: 'blocked', retryAfterSeconds: 1800 });
  assert.deepEqual(await storeInquiryRef(dbRef2, candidateRef(), 'ip-a', 'body-b', testTimeRef + 6000), { disposition: 'blocked', retryAfterSeconds: 1799 });
  assert.deepEqual(await storeInquiryRef(dbRef2, candidateRef(), 'ip-a', 'body-a', testTimeRef + 1805000), { disposition: 'stored' });
  assert.equal((await dbRef2.prepare('SELECT COUNT(*) AS n FROM inquiries').first()).n, 2);
});
testRef('alternating messages retain separate duplicate windows, expiry allows new submission', async (t) => {
  const db = await fixtureRef(t);
  await storeInquiryRef(db, candidateRef(), 'ip-a', 'body-a', testTimeRef);
  assert.equal((await storeInquiryRef(db, candidateRef(), 'ip-a', 'body-b', testTimeRef + 1000)).disposition, 'stored');
  assert.equal((await storeInquiryRef(db, candidateRef(), 'ip-a', 'body-a', testTimeRef + 2000)).disposition, 'duplicate');
  assert.equal((await storeInquiryRef(db, candidateRef(), 'ip-b', 'body-a', testTimeRef + 2000)).disposition, 'stored');
  assert.equal((await storeInquiryRef(db, candidateRef(), 'ip-a', 'body-a', testTimeRef + 1800000)).disposition, 'stored');
});
testRef('twenty concurrent identical submissions store only one inquiry', async (t) => {
  const db = await fixtureRef(t);
  const dbRef3 = db;
  const outcomes = await Promise.all(Array.from({ length: 20 }, () => storeInquiryRef(dbRef3, candidateRef(), 'ip-a', 'body-a', testTimeRef)));
  assert.equal(outcomes.filter(o => o.disposition === 'stored').length, 1);
  assert.equal(outcomes.filter(o => o.disposition === 'duplicate').length, 4);
  assert.equal(outcomes.filter(o => o.disposition === 'blocked').length, 15);
  assert.equal((await dbRef3.prepare('SELECT COUNT(*) AS n FROM inquiries').first()).n, 1);
});
testRef('reference collision rolls back guard, and SQL-like text is stored literally', async (t) => {
  const db = await fixtureRef(t);
  const dbRef4 = db; const first = candidateRef(); await storeInquiryRef(dbRef4, first, 'ip-a', 'body-a', testTimeRef);
  await assert.rejects(storeInquiryRef(dbRef4, { ...candidateRef(), referenceId: first.referenceId }, 'ip-b', 'body-b', testTimeRef), /UNIQUE/);
  assert.equal((await dbRef4.prepare("SELECT COUNT(*) AS n FROM booking_submission_guards WHERE ip_hash='ip-b'").first()).n, 0);
  const second = { ...candidateRef(), projectDetails: "'); DROP TABLE inquiries;--" };
  await storeInquiryRef(dbRef4, second, 'ip-b', 'body-b', testTimeRef);
  await recordNotificationRef(dbRef4, second.id, 'timedOut', '2026-10-12T08:00:05.000Z');
  const row = await dbRef4.prepare('SELECT project_details,notification_status FROM inquiries WHERE id=?').bind(second.id).first();
  assert.equal(row.project_details, "'); DROP TABLE inquiries;--"); assert.equal(row.notification_status, 'timedOut');
});
testRef('cleanup deletes at most 1000 expired rows from each table and preserves live rows', async (t) => {
  const db = await fixtureRef(t);
  const dbRef5 = db; const statements = [];
  for (let i = 0; i < 1001; i++) {
    statements.push(dbRef5.prepare('INSERT INTO booking_submission_guards VALUES (?, ?, 1, ?, ?, ?)').bind(`ip-${i}`, 'body', 0, 0, `id-${i}`));
    statements.push(dbRef5.prepare('INSERT INTO booking_ip_blocks VALUES (?, ?)').bind(`ip-${i}`, 0));
  }
  for (let i = 0; i < statements.length; i += 90) await dbRef5.batch(statements.slice(i, i + 90));
  await dbRef5.prepare("INSERT INTO booking_ip_blocks VALUES ('live',?)").bind(testTimeRef + 1000).run();
  assert.deepEqual(await cleanupAbuseRef(dbRef5, testTimeRef), { guardsDeleted: 1000, blocksDeleted: 1000 });
  assert.equal((await dbRef5.prepare('SELECT COUNT(*) AS n FROM booking_submission_guards').first()).n, 1);
  assert.equal((await dbRef5.prepare('SELECT COUNT(*) AS n FROM booking_ip_blocks').first()).n, 2);
  assert.deepEqual(await cleanupAbuseRef(dbRef5, testTimeRef), { guardsDeleted: 1, blocksDeleted: 1 });
});
