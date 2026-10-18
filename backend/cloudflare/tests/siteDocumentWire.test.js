// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { parseDocumentRequest as parseDocumentRequestRef, parseDocumentRevision as parseDocumentRevisionRef, revisionJson as revisionJsonRef } from '../src/siteDocumentWire.js';
import { readJson as readJsonRef } from '../src/httpJson.js';
// codeguard:components:end

testRef('exactLongRevisionWire', async () => {
  const value = parseDocumentRequestRef('{"expectedRevision":9223372036854775806,"data":{"revision":2}}');
  assert.equal(value.expectedRevision, 9223372036854775806n); assert.equal(value.data.revision, 2);
  assert.equal(JSON.stringify({ revision: revisionJsonRef(value.expectedRevision + 1n) }), '{"revision":9223372036854775807}');
  for (const input of ['-1','1.0','1e0','9223372036854775808','"1"','NaN']) assert.equal(parseDocumentRevisionRef(input), null, input);
  assert.equal(parseDocumentRevisionRef('0'), 0n); assert.equal(parseDocumentRevisionRef('0', 1n), null);
  const parsed = await readJsonRef(new Request('https://example.test', { method: 'POST', body: '{"expectedRevision":9223372036854775806}' }), 1000, parseDocumentRequestRef);
  assert.equal(parsed.value.expectedRevision, 9223372036854775806n);
  assert.equal((await readJsonRef(new Request('https://example.test', { method: 'POST', body: '{"a":1}' }))).value.a, 1);
});

testRef('nestedEmptyPropertiesKeepSourceData', () => {
  for (const revision of [2, 'version-two']) {
    const data = { pages: [], '': { revision, expectedRevision: revision, '': { revision } } };
    const parsed = parseDocumentRequestRef(JSON.stringify({ expectedRevision: 0, data: data }));
    assert.equal(parsed.expectedRevision, 0n); assert.deepEqual(parsed.data, data);
    assert.equal(JSON.stringify(parsed.data), JSON.stringify(data));
  }
});
