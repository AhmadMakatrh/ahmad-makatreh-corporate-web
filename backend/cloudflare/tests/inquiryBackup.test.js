// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { exportInquiries as exportInquiriesRef, validateInquiryBackup as validateInquiryBackupRef, importMissingInquiries as importMissingInquiriesRef } from '../src/adminInquiries.js';
import { adminApiFixture as adminApiFixtureRef } from './helpers/adminFixtures.js';

const id = '33333333-3333-4333-8333-333333333333';
const idRef = id;
const row = { id: idRef, referenceId: 'REQ-OLD-123', name: ' أحمد 😀 ', email: ' visitor@example.test ', projectDetails: ' مشروع قديم 😀 ',
  serviceKey: 'historic-service', inquiryCategory: 'technical-support', status: 2, createdAtUtc: '2026-10-11T08:00:00.1234567Z', updatedAtUtc: '2026-10-12T08:00:00.1234567Z',
  notificationStatus: 'unknown', notificationAttemptedAtUtc: '2026-10-11T08:00:01.1234567Z', adminNotes: 'ملاحظة 😀', notesUpdatedBy: 'owner@example.test' };
const rowRef = row;
const backup = items => ({ format: 'ahmad-site-inquiries', version: 1, exportedAtUtc: '2026-10-12T08:00:00Z', items });
const backupRef = backup;
// codeguard:components:end

testRef('legacy numeric-status backup round-trips in one SELECT; add-only imports preserve raw fields and existing notes', async t => {
  const f = await adminApiFixtureRef(t);
  const fRef = f;
  const session = await fRef.login(), send = (path, body) => fRef.call(path, { method: 'POST', ...session, body });
  const sendRef = send;
  const first = await sendRef('/inquiries/import', backupRef([rowRef])); assert.equal(first.status, 200); assert.deepEqual(await first.json(), { imported: 1, skipped: 0 });
  assert.equal(fRef.counts.batches, 1); assert.equal(fRef.counts.statements, 1);
  const exported = await sendRef('/inquiries/export', { ids: [idRef] }); assert.equal(exported.status, 200);
  const document = await exported.json(); assert.equal(document.format, 'ahmad-site-inquiries'); assert.equal(document.version, 1); assert.deepEqual(document.items, [rowRef]);
  assert.equal(fRef.counts.statements, 2); assert.ok(!('replyEnabled' in document.items[0]));
  assert.deepEqual(await (await sendRef('/inquiries/import', backupRef([{ ...rowRef, adminNotes: 'do not overwrite' }]))).json(), { imported: 0, skipped: 1 });
  assert.equal((await exportInquiriesRef(fRef.db, [idRef]))[0].adminNotes, rowRef.adminNotes);
  const before = fRef.counts.statements; assert.deepEqual(await (await sendRef('/inquiries/import', backupRef([]))).json(), { imported: 0, skipped: 0 }); assert.equal(fRef.counts.statements, before);
});
testRef('invalid backups and exports are rejected before SQL, using raw UTF-16 limits and valid UTC metadata', async t => {
  const f = await adminApiFixtureRef(t);
  const fRef2 = f;
  const session = await fRef2.login();
  const invalidRows = [null, { ...rowRef, id: '00000000-0000-0000-0000-000000000000' }, { ...rowRef, referenceId: '\u0085' }, { ...rowRef, status: 'InProgress' }, { ...rowRef, status: 5 }, { ...rowRef, status: 1.5 },
    { ...rowRef, createdAtUtc: '2026-10-11T08:00:00+00:00' }, { ...rowRef, updatedAtUtc: '2026-10-10T08:00:00Z' }, { ...rowRef, notificationStatus: 'delivered' }, { ...rowRef, inquiryCategory: 'invalid' }, { ...rowRef, email: 'invalid' },
    { ...rowRef, adminNotes: null }, { ...rowRef, name: '😀'.repeat(51) }, { ...rowRef, projectDetails: '😀'.repeat(2001) }, { ...rowRef, adminNotes: '😀'.repeat(5001) }, { ...rowRef, notesUpdatedBy: 5 }, { ...rowRef, serviceKey: '' }];
  const invalid = invalidRows.map(r => backupRef([r])).concat([{ ...backupRef([]), version: 2 }, { ...backupRef([]), format: 'other' }, backupRef(null), backupRef([rowRef, rowRef]), backupRef([rowRef, { ...rowRef, id: crypto.randomUUID() }]), backupRef(Array(101).fill(rowRef))]);
  for (const document of invalid) { assert.equal(validateInquiryBackupRef(document).items, null); assert.equal((await fRef2.call('/inquiries/import', { method: 'POST', ...session, body: document })).status, 400); }
  for (const ids of [null, [], [idRef, idRef.toUpperCase()], Array(101).fill(idRef), ['invalid']]) assert.equal((await fRef2.call('/inquiries/export', { method: 'POST', ...session, body: { ids } })).status, 400);
  assert.equal(fRef2.counts.statements, 0);
});
testRef('concurrent 100-row imports use bounded atomic batches and skip ID or reference collisions', async t => {
  const f = await adminApiFixtureRef(t);
  const fRef3 = f;
  const items = Array.from({ length: 100 }, (_, n) => ({ ...rowRef, id: `00000000-0000-0000-0000-${String(n + 1).padStart(12, '0')}`, referenceId: `HISTORY-${n}` }));
  const results = await Promise.all([importMissingInquiriesRef(fRef3.env.DB, items), importMissingInquiriesRef(fRef3.env.DB, items)]);
  assert.equal(results.reduce((n, r) => n + r.imported, 0), 100); assert.equal(fRef3.counts.batches, 2); assert.equal(fRef3.counts.statements, 200);
  assert.deepEqual(await importMissingInquiriesRef(fRef3.env.DB, [{ ...rowRef, referenceId: 'HISTORY-0' }]), { imported: 0, skipped: 1 });
  assert.equal(await fRef3.db.prepare('SELECT count(*) AS n FROM inquiries').first('n'), 101);
});
testRef('real constraint errors roll back the whole import batch instead of silently skipping invalid rows', async t => {
  const f = await adminApiFixtureRef(t);
  const fRef4 = f;
  await assert.rejects(importMissingInquiriesRef(fRef4.env.DB, [rowRef, { ...rowRef, id: crypto.randomUUID(), referenceId: 'INVALID', name: '' }]), /CHECK constraint failed/);
  assert.equal(await fRef4.db.prepare('SELECT count(*) AS n FROM inquiries').first('n'), 1);
  assert.equal(await fRef4.db.prepare('SELECT count(*) AS n FROM booking_submission_guards').first('n'), 0);
});

testRef('100 maximum-length Unicode and escaped inquiries export and restore within the bounded import limit', async t => {
  const source = await adminApiFixtureRef(t), destination = await adminApiFixtureRef(t);
  const sourceRef = source, destinationRef = destination;
  const sourceSession = await sourceRef.login(), destinationSession = await destinationRef.login();
  for (const character of ['ع', '\u0001']) {
    const items = Array.from({ length: 100 }, (_, n) => ({ ...rowRef,
      id: crypto.randomUUID(), referenceId: `${n}-`.padEnd(50, character),
      name: character.repeat(100), email: `${character.repeat(250)}@a.co`, projectDetails: character.repeat(4000),
      serviceKey: character.repeat(30), adminNotes: character.repeat(10000), notesUpdatedBy: character.repeat(255),
    }));
    assert.equal(validateInquiryBackupRef(backupRef(items)).items.length, 100);
    await importMissingInquiriesRef(sourceRef.env.DB, items);
    const exported = await sourceRef.call('/inquiries/export', { method: 'POST', ...sourceSession, body: { ids: items.map(item => item.id) } });
    assert.equal(exported.status, 200);
    const backup = await exported.json(), json = JSON.stringify(backup, null, 2), bytes = new TextEncoder().encode(json).length;
    assert.ok(bytes > 2 * 1024 * 1024 && bytes < 10 * 1024 * 1024);
    const restored = await destinationRef.call('/inquiries/import', { method: 'POST', ...destinationSession, body: backup });
    assert.equal(restored.status, 200);
    assert.deepEqual(await restored.json(), { imported: 100, skipped: 0 });
    const after = await exportInquiriesRef(destinationRef.env.DB, items.map(item => item.id));
    assert.deepEqual(after.sort((a, b) => a.id.localeCompare(b.id)), backup.items.sort((a, b) => a.id.localeCompare(b.id)));
    t.diagnostic(`${character === 'ع' ? 'Arabic' : 'Escaped controls'} backup: ${bytes} bytes`);
  }
});

testRef('inquiry imports accept exactly 10 MiB and reject a streamed extra byte before SQL', async t => {
  const f = await adminApiFixtureRef(t);
  const fRef5 = f;
  const auth = await fRef5.login();
  const json = JSON.stringify(backupRef([]));
  for (const extra of [0, 1]) {
    const body = new ReadableStream({ start(controller) {
      controller.enqueue(new TextEncoder().encode(json));
      controller.enqueue(new Uint8Array(10 * 1024 * 1024 - json.length + extra).fill(32));
      controller.close();
    } });
    const response = await fRef5.api.fetch(new Request(`${fRef5.env.ADMIN_ORIGIN}/api/admin/inquiries/import`, {
      method: 'POST', body, duplex: 'half', headers: { Origin: fRef5.env.ADMIN_ORIGIN, 'Content-Type': 'application/json',
        Cookie: `${fRef5.sessionCookie}; ${auth.cookie}`, 'X-Admin-CSRF': auth.csrf },
    }), fRef5.env);
    assert.equal(response.status, extra ? 413 : 200);
  }
  assert.equal(fRef5.counts.statements, 0);
});
