// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { verifyTurnstile as verifyTurnstileRef } from '../src/turnstile.js';
const config = { token: 'a-token', clientIp: '192.0.2.1', secret: 'test-secret', allowedHostnames: ['example.test'] };
const configRef = config;
// codeguard:components:end
testRef('verifies Siteverify success and trusted hostname with a fixed HTTPS endpoint', async () => {
  const result = await verifyTurnstileRef(configRef, async (url, options) => {
    assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    const body = new URLSearchParams(options.body);
    assert.equal(body.get('secret'), 'test-secret'); assert.equal(body.get('remoteip'), '192.0.2.1');
    assert.equal(options.redirect, 'manual');
    return Response.json({ success: true, hostname: 'example.test', 'error-codes': [] });
  });
  assert.deepEqual(result, { valid: true, error: null });
});
testRef('fails closed for missing settings, expired tokens, malformed replies and untrusted hostname', async () => {
  const never = () => { throw new Error('Must not call provider'); };
  const neverRef = never;
  for (const override of [{ token: null }, { secret: '' }, { allowedHostnames: [] }]) assert.equal((await verifyTurnstileRef({ ...configRef, ...override }, neverRef)).valid, false);
  for (const body of [{ success: false, 'error-codes': ['timeout-or-duplicate'] }, { success: true, hostname: 'attacker.test' }, {}, { success: true }]) {
    assert.equal((await verifyTurnstileRef(configRef, async () => Response.json(body))).valid, false);
  }
  assert.equal((await verifyTurnstileRef(configRef, async () => new Response('bad-json'))).valid, false);
  assert.equal((await verifyTurnstileRef(configRef, async () => new Response('', { status: 500 }))).valid, false);
  assert.equal((await verifyTurnstileRef(configRef, async () => new Response(null, { status: 302, headers: { Location: 'https://untrusted.test/' } }))).valid, false);
});
testRef('security verification times out after 3 seconds without retry', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] }); let calls = 0;
  const promise = verifyTurnstileRef(configRef, async (_url, { signal }) => {
    calls++; return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Timeout', 'AbortError')), { once: true }));
  });
  t.mock.timers.tick(3000); assert.equal((await promise).valid, false); assert.equal(calls, 1);
});
