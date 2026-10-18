// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUtc as normalizeUtcRef, utcNow as utcNowRef, nextUpdatedAt as nextUpdatedAtRef, cursorFor as cursorForRef, parseCursor as parseCursorRef } from '../src/inquiryTime.js';

const id = '11111111-1111-4111-8111-111111111111';
const idRef = id;
// codeguard:components:end

testRef('UTC normalization preserves .NET precision and rejects invalid calendars and non-UTC values', () => {
  for (const [input, want] of [['0001-01-01T00:00:00Z', '0001-01-01T00:00:00.0000000Z'], ['2026-10-12T08:00:00.1234567Z', '2026-10-12T08:00:00.1234567Z'], ['2024-02-29T23:59:59.1Z', '2024-02-29T23:59:59.1000000Z']]) assert.equal(normalizeUtcRef(input), want);
  for (const value of ['2026-02-29T00:00:00Z', '2026-04-31T00:00:00Z', '0000-01-01T00:00:00Z', '2026-10-12T24:00:00Z', '2026-10-12T08:00:00+00:00', '2026-10-12T08:00:00.12345678Z', null, 1]) assert.equal(normalizeUtcRef(value), null);
  assert.equal(utcNowRef(0), '1970-01-01T00:00:00.0000000Z');
});
testRef('ticks cursor uses exact 100ns values across the full DateTime range', () => {
  assert.equal(cursorForRef('1970-01-01T00:00:00.1234567Z', idRef), '621355968001234567.11111111111141118111111111111111');
  assert.deepEqual(parseCursorRef('0.11111111111141118111111111111111'), { beforeUtc: '0001-01-01T00:00:00.0000000Z', beforeId: idRef });
  assert.equal(parseCursorRef('3155378975999999999.11111111111141118111111111111111').beforeUtc, '9999-12-31T23:59:59.9999999Z');
  assert.equal(parseCursorRef('621355968000000001.11111111111141118111111111111111').beforeUtc, '1970-01-01T00:00:00.0000001Z');
  for (const cursor of ['-1.11111111111141118111111111111111', '3155378976000000000.11111111111141118111111111111111', '1e3.11111111111141118111111111111111', '0.bad', '0.0.0']) assert.equal(parseCursorRef(cursor), null);
});
testRef('conditional revision moves forward with a frozen or earlier clock and detects overflow', () => {
  assert.equal(nextUpdatedAtRef('1970-01-01T00:00:00.0000001Z', 0), '1970-01-01T00:00:00.0010001Z');
  assert.equal(nextUpdatedAtRef('1970-01-01T00:00:00Z', 20), '1970-01-01T00:00:00.0200000Z');
  assert.equal(nextUpdatedAtRef('9999-12-31T23:59:59.9999999Z', 0), null);
});
