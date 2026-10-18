// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { sendInquiryNotification as sendInquiryNotificationRef } from '../src/email.js';
import { createInquiry as createInquiryRef } from '../src/bookingCrypto.js';
import { bookingInput as bookingInputRef, testTime as testTimeRef } from './helpers/bookingFixtures.js';
const config = { apiKey: 'test-api-key', senderEmail: 'sender@example.test', senderName: 'Ahmad Makatreh Site', recipientEmail: 'owner@example.test' };
const configRef = config;
// codeguard:components:end

testRef('sends exactly one plaintext email with Arabic category tag and client Reply-To', async () => {
  const inquiry = createInquiryRef({ ...bookingInputRef, serviceKey: 'landing', projectDetails: '<script>literal text</script>' }, testTimeRef);
  const inquiryRef = inquiry;
  let calls = 0;
  const status = await sendInquiryNotificationRef(inquiryRef, configRef, async (url, options) => {
    calls++; assert.equal(url, 'https://api.brevo.com/v3/smtp/email'); assert.equal(options.redirect, 'manual');
    assert.equal(options.headers['api-key'], 'test-api-key');
    const payload = JSON.parse(options.body);
    assert.equal(payload.subject, `[مشروع برمجي] New Landing page Inquiry [${inquiryRef.referenceId}] from Ahmad`);
    assert.deepEqual(payload.replyTo, { email: 'owner@example.test', name: 'Ahmad' });
    assert.deepEqual(payload.to, [{ email: 'owner@example.test', name: 'Admin' }]);
    assert.equal(payload.sender.email, 'sender@example.test'); assert.ok(!('htmlContent' in payload));
    assert.ok(payload.textContent.includes('<script>literal text</script>')); assert.ok(!payload.textContent.includes('test-api-key'));
    return Response.json({ messageId: '<accepted@example.test>' }, { status: 201 });
  });
  assert.equal(status, 'accepted'); assert.equal(calls, 1);
});
testRef('distinguishes disabled, rejection, uncertain and accepted outcomes without retries', async () => {
  const inquiry = createInquiryRef(bookingInputRef, testTimeRef);
  const inquiryRef2 = inquiry;
  assert.equal(await sendInquiryNotificationRef(inquiryRef2, {}, () => { throw new Error('Must not call provider'); }), 'disabled');
  for (const [response, expected] of [
    [new Response('', { status: 429 }), 'failed'], [new Response('', { status: 401 }), 'failed'],
    [new Response(null, { status: 302, headers: { Location: 'https://untrusted.test/' } }), 'unknown'],
    [new Response('', { status: 500 }), 'unknown'], [Response.json({}, { status: 201 }), 'unknown'],
    [new Response('invalid-json', { status: 201 }), 'unknown'],
  ]) {
    let calls = 0;
    assert.equal(await sendInquiryNotificationRef(inquiryRef2, configRef, async () => { calls++; return response; }), expected); assert.equal(calls, 1);
  }
  assert.equal(await sendInquiryNotificationRef(inquiryRef2, configRef, async () => { throw new TypeError('Connection lost'); }), 'unknown');
});
testRef('mail times out after five seconds and never resends uncertain delivery', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] }); let calls = 0;
  const promise = sendInquiryNotificationRef(createInquiryRef(bookingInputRef, testTimeRef), configRef, async (_url, { signal }) => {
    calls++; return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Timeout', 'AbortError')), { once: true }));
  });
  t.mock.timers.tick(5000); assert.equal(await promise, 'timedOut'); assert.equal(calls, 1);
});
