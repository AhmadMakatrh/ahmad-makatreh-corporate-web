// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { base64url as base64urlRef, exportJWK as exportJWKRef, generateKeyPair as generateKeyPairRef, SignJWT as SignJWTRef } from 'jose';

const module = await import('../src/adminSession.js').catch(() => null);
const moduleRef = module;
// codeguard:components:end

testRef('admin session requires a verified allowed aal2 identity before returning it', async () => {
  assert.ok(moduleRef?.createAdminSession, 'admin session verifier must exist');
  const { publicKey, privateKey } = await generateKeyPairRef('ES256');
  const jwk = { ...await exportJWKRef(publicKey), kid: 'test-key', alg: 'ES256', use: 'sig' };
  const origin = 'https://admin.example.test';
  const originRef = origin;
  const supabase = 'https://project.supabase.co';
  const supabaseRef = supabase;
  const sub = 'a028014a-923e-4eec-a6b0-5c01a89ec9ee';
  const subRef = sub;
  const now = Date.parse('2026-10-14T12:00:00Z');
  const env = { ADMIN_ORIGIN: originRef, SUPABASE_URL: supabaseRef, ADMIN_ALLOWED_SUB: subRef,
    ADMIN_SESSION_KEY: base64urlRef.encode(crypto.getRandomValues(new Uint8Array(32))) };
  let fetches = 0;
  const session = moduleRef.createAdminSession({ now: () => now, fetcher: async url => {
    assert.equal(String(url), `${supabaseRef}/auth/v1/.well-known/jwks.json`);
    fetches++;
    return Response.json({ keys: [jwk] });
  } });
  const token = async (claims = {}) => new SignJWTRef({ email: 'owner@example.test', aal: 'aal2', ...claims })
    .setProtectedHeader({ alg: 'ES256', kid: 'test-key' }).setIssuer(`${supabaseRef}/auth/v1`)
    .setAudience('authenticated').setSubject(claims.sub ?? subRef).setIssuedAt(Math.floor(now / 1000))
    .setExpirationTime(Math.floor(now / 1000) + 900).sign(privateKey);
  const tokenRef = token;
  const request = cookie => new Request(`${originRef}/assets/dashboard.js`, { headers: cookie ? { Cookie: cookie } : {} });
  const requestRef = request;
  assert.equal((await session.verify(requestRef(), env)).status, 401);
  const cookie = await session.seal({ accessToken: await tokenRef(), refreshToken: 'test-refresh', signedInAt: now }, env);
  const identity = await session.verify(requestRef(cookie.split(';')[0]), env);
  assert.equal(identity.sub, subRef);
  assert.equal(identity.email, 'owner@example.test');
  assert.equal(fetches, 1);
  const recoveryCookie = await session.seal({ accessToken: await tokenRef(), refreshToken: 'recovery-refresh',
    signedInAt: now, recovery: true }, env);
  assert.equal((await session.verify(requestRef(recoveryCookie.split(';')[0]), env)).status, 403);
  assert.equal((await session.verify(requestRef(recoveryCookie.split(';')[0]), env,
    { allowRecovery: true })).recovery, true);
  assert.equal((await session.verify(requestRef(cookie.split(';')[0]), env)).sub, subRef);
  assert.equal(fetches, 1);
  const pendingCookie = await session.seal({ accessToken: await tokenRef(), refreshToken: 'pending-refresh',
    signedInAt: now, emailChallenge: 'pending' }, env);
  assert.equal((await session.verify(requestRef(pendingCookie.split(';')[0]), env)).status, 403);
  const verifiedEmailCookie = await session.seal({ accessToken: await tokenRef({ aal: 'aal1' }),
    refreshToken: 'email-refresh', signedInAt: now, emailChallenge: 'verified' }, env);
  assert.equal((await session.verify(requestRef(verifiedEmailCookie.split(';')[0]), env)).emailChallenge, 'verified');
  for (const claims of [{ aal: 'aal1' }, { sub: 'b028014a-923e-4eec-a6b0-5c01a89ec9ee' }]) {
    const bad = await session.seal({ accessToken: await tokenRef(claims), refreshToken: 'test-refresh', signedInAt: now }, env);
    assert.equal((await session.verify(requestRef(bad.split(';')[0]), env)).status, 403);
  }
  const expired = await session.seal({ accessToken: await tokenRef(), refreshToken: 'test-refresh', signedInAt: now - 8 * 3600000 - 1 }, env);
  assert.equal((await session.verify(requestRef(expired.split(';')[0]), env)).status, 401);
  assert.equal((await session.verify(requestRef(cookie.split(';')[0]), { ...env, ADMIN_SESSION_KEY: '' })).status, 503);
});
