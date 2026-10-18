// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { validateBooking as validateBookingRef, getCategoryDetails as getCategoryDetailsRef, getServiceName as getServiceNameRef } from '../src/bookingValidation.js';
import { bookingInput as bookingInputRef } from './helpers/bookingFixtures.js';
// codeguard:components:end

testRef('rejects wrong types and invalid JSON shape before storage', () => {
  for (const value of [null, [], 123, 'value', {}, { ...bookingInputRef, name: 12 }, { ...bookingInputRef, turnstileToken: {} }]) {
    assert.equal(validateBookingRef(value).input, null);
  }
  for (const field of ['name', 'email', 'projectDetails']) assert.equal(validateBookingRef({ ...bookingInputRef, [field]: '  ' }).input, null);
});
testRef('preserves Arabic and boundary lengths while trimming required fields', () => {
  const input = { ...bookingInputRef, name: 'أ'.repeat(100), email: 'a'.repeat(245) + '@test.test', projectDetails: '😀'.repeat(2000) };
  assert.ok(validateBookingRef(input).input);
  for (const [field, value] of [['name', 'أ'.repeat(101)], ['email', 'a'.repeat(246) + '@test.test'], ['projectDetails', '😀'.repeat(2001)]]) {
    assert.equal(validateBookingRef({ ...input, [field]: value }).input, null);
  }
  assert.equal(validateBookingRef({ ...bookingInputRef, name: '  Ahmad  ' }).input.name, 'Ahmad');
  assert.equal(validateBookingRef({ ...bookingInputRef, email: 'invalid' }).input, null);
});
testRef('allows legacy null category and rejects unknown categories and services', () => {
  assert.equal(validateBookingRef({ ...bookingInputRef, inquiryCategory: null }).input.inquiryCategory, null);
  assert.equal(validateBookingRef({ ...bookingInputRef, inquiryCategory: 'invalid' }).input, null);
  assert.equal(validateBookingRef({ ...bookingInputRef, serviceKey: 'new-service' }).input, null);
  assert.ok(validateBookingRef({ ...bookingInputRef, serviceKey: 'new-service' }, { allowPublishedService: true }).input);
  assert.equal(validateBookingRef({ ...bookingInputRef, serviceKey: 'a'.repeat(31) }, { allowPublishedService: true }).input, null);
  assert.deepEqual(getCategoryDetailsRef('technical-support'), { tag: 'دعم فني', label: 'Technical support' });
  assert.equal(getServiceNameRef('landing'), 'Landing page');
});

testRef('matches .NET Unicode whitespace for trimming, email and boundary lengths', () => {
  const whitespace = '\u0009\u000A\u000B\u000C\u000D\u0020\u0085\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u2028\u2029\u202F\u205F\u3000';
  const whitespaceRef = whitespace;
  const validated = validateBookingRef({ ...bookingInputRef, name: whitespaceRef + 'أ'.repeat(100) + whitespaceRef, email: whitespaceRef + bookingInputRef.email + whitespaceRef, projectDetails: whitespaceRef + bookingInputRef.projectDetails + whitespaceRef });
  assert.ok(validated.input);
  assert.equal(validated.input.name, 'أ'.repeat(100));
  assert.equal(validated.input.email, bookingInputRef.email);
  assert.equal(validated.input.projectDetails, bookingInputRef.projectDetails);
  assert.equal(validateBookingRef({ ...bookingInputRef, email: 'a\u0085@test.test' }).input, null);
  assert.equal(validateBookingRef({ ...bookingInputRef, name: '\uFEFF' + 'أ'.repeat(100) }).input, null);
  assert.equal(validateBookingRef({ ...bookingInputRef, name: '\uFEFFAhmad\uFEFF' }).input.name, '\uFEFFAhmad\uFEFF');
});
