// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDocumentBackup as parseDocumentBackupRef, serializeDocumentBackup as serializeDocumentBackupRef } from '../src/admin/documentBackup.js';
const envelope = documents => ({ format: 'ahmad-site-documents', version: 1, documents });
const envelopeRef = envelope;
// codeguard:components:end

test('largeUnicodeBackupCanBeReopened', () => {
  const body = { value: 'ࠀ'.repeat(1499900) };
  const value = envelopeRef(['content','pricing','pages'].map(key => ({ key, revision: 1, draft: body, published: body })));
  const text = serializeDocumentBackupRef(value), bytes = new TextEncoder().encode(text).length;
  assert.ok(bytes > 10000000 && bytes < 32 * 1024 * 1024);
  assert.deepEqual(parseDocumentBackupRef(text, bytes), value); assert.ok(!text.includes('\n'));
});
test('malformedOrOversizedBackupRejectedLocally', () => {
  for (const value of [null, {}, envelopeRef([null]), envelopeRef([{ key: 'other', draft: {} }]), envelopeRef([{ key: 'content', draft: [] }]), envelopeRef([{ key: 'content', draft: {} }, { key: 'content', draft: {} }])]) {
    assert.throws(() => parseDocumentBackupRef(JSON.stringify(value), 100), /غير صالحة/);
  }
  assert.throws(() => parseDocumentBackupRef('{', 1), /غير صالحة/);
  assert.throws(() => parseDocumentBackupRef('{}', 32 * 1024 * 1024 + 1), /32 MB/);
  assert.deepEqual(parseDocumentBackupRef(JSON.stringify(envelopeRef([])), 100), envelopeRef([]));
});
