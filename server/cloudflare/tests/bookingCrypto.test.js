// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { hashBookingIdentity as hashBookingIdentityRef, createInquiry as createInquiryRef } from '../src/bookingCrypto.js';
import { bookingInput as bookingInputRef, testKey as testKeyRef, testTime as testTimeRef } from './helpers/bookingFixtures.js';
// codeguard:components:end

testRef('hashes canonical IPv6-mapped IP and length-prefixed UTF-8 with independent vectors', async () => {
  const identity = await hashBookingIdentityRef(testKeyRef, '192.0.2.1', bookingInputRef);
  assert.equal(identity.ipHash, '6082DF36B02DDF40C06575811A9E10A58AEE1D40C452EBFA4DF462C46F09E81A');
  assert.equal(identity.payloadHash, 'DEA1FABF7A6D29AFDA6F8594632E5BCC98D03B0D34988854829C526C84AB0519');
  assert.deepEqual(await hashBookingIdentityRef(testKeyRef, '::ffff:192.0.2.1', bookingInputRef), identity);
  assert.deepEqual(await hashBookingIdentityRef(testKeyRef, '2001:db8::1', bookingInputRef), await hashBookingIdentityRef(testKeyRef, '2001:0db8:0:0:0:0:0:1', bookingInputRef));
  for (const address of ['invalid', '1.2.3.999', '192.0.2.1/24', 'fe80::1%eth0']) await assert.rejects(hashBookingIdentityRef(testKeyRef, address, bookingInputRef), /network address/);
  await assert.rejects(hashBookingIdentityRef('short', '192.0.2.1', bookingInputRef), /32 bytes/);
});
testRef('duplicate identity includes exactly the four contact fields', async () => {
  const original = await hashBookingIdentityRef(testKeyRef, '192.0.2.1', bookingInputRef);
  for (const field of ['name', 'email', 'inquiryCategory', 'projectDetails']) {
    assert.notEqual((await hashBookingIdentityRef(testKeyRef, '192.0.2.1', { ...bookingInputRef, [field]: bookingInputRef[field] + 'x' })).payloadHash, original.payloadHash);
  }
  assert.equal((await hashBookingIdentityRef(testKeyRef, '192.0.2.1', { ...bookingInputRef, serviceKey: 'landing', turnstileToken: 'different' })).payloadHash, original.payloadHash);
  assert.notEqual((await hashBookingIdentityRef(testKeyRef, '192.0.2.2', bookingInputRef)).ipHash, original.ipHash);
});
testRef('creates unique UUIDs, UTC timestamps and cryptographic reference IDs', () => {
  const first = createInquiryRef(bookingInputRef, testTimeRef);
  const firstRef = first;
  const second = createInquiryRef(bookingInputRef, testTimeRef);
  const secondRef = second;
  assert.notEqual(firstRef.id, secondRef.id); assert.notEqual(firstRef.referenceId, secondRef.referenceId);
  assert.match(firstRef.id, /^[a-f0-9-]{36}$/); assert.match(firstRef.referenceId, /^REQ-20261012-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
  assert.equal(firstRef.createdAtUtc, '2026-10-12T08:00:00.000Z'); assert.equal(firstRef.updatedAtUtc, firstRef.createdAtUtc);
  assert.equal(firstRef.status, 'New'); assert.equal(firstRef.name, 'Ahmad'); assert.ok(!('turnstileToken' in firstRef));
});
