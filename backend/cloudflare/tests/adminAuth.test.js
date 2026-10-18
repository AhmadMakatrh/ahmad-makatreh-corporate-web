// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { createAdminFixture as createAdminFixtureRef } from './helpers/adminFixtures.js';

const module = await import('../src/adminAuth.js').catch(() => null);
const moduleRef = module;
// codeguard:components:end

testRef('auth mutations reject foreign Fetch Metadata before invoking identity or email services', async () => {
  let attempts = 0;
  const env = { ADMIN_ORIGIN: 'https://admin.example.test', SUPABASE_PUBLISHABLE_KEY: 'isolated',
    ADMIN_LOGIN_RATE_LIMITER: { limit: async () => { attempts++; return { success: true }; } } };
  const auth = moduleRef.createAdminAuth({ clientFactory() { throw new Error('Unexpected identity request'); } });
  for (const site of ['cross-site', 'same-site', 'none']) {
    const response = await auth.handle(new Request(`${env.ADMIN_ORIGIN}/auth/login`, {
      method: 'POST', headers: { Origin: env.ADMIN_ORIGIN, 'Sec-Fetch-Site': site, 'Content-Type': 'application/json' }, body: '{}',
    }), env);
    assert.equal(response.status, 403);
  }
  assert.equal(attempts, 0);
});

testRef('password and email code are both required for an eight-hour admin cookie without D1', async () => {
  assert.ok(moduleRef?.createAdminAuth, 'admin Auth handler must exist');
  const f = await createAdminFixtureRef();
  const fRef = f;
  const aal1 = await fRef.token({ aal: 'aal1' });
  const aal2 = await fRef.token({ aal: 'aal2' });
  let calls = 0, sent = 0;
  const fake = { auth: {
    signInWithPassword: async ({ email, password }) => {
      calls++;
      return password === 'right-password' && email === 'owner@example.test'
        ? { data: { user: { id: fRef.env.ADMIN_ALLOWED_SUB }, session: { access_token: aal1, refresh_token: 'refresh-1' } }, error: null }
        : { data: {}, error: new Error('Invalid credentials') };
    },
    signInWithOtp: async ({ email, options }) => {
      assert.equal(email, 'owner@example.test');
      assert.equal(options.shouldCreateUser, false);
      sent++;
      return { error: null };
    },
    verifyOtp: async ({ email, token, type }) => {
      assert.equal(email, 'owner@example.test');
      assert.equal(type, 'email');
      if (token === '654321') return { data: { user: { id: 'other-user', email },
        session: { access_token: aal1, refresh_token: 'other-refresh' } }, error: null };
      return token === '123456'
        ? { data: { user: { id: fRef.env.ADMIN_ALLOWED_SUB, email },
          session: { access_token: aal1, refresh_token: 'refresh-2' } }, error: null }
        : { data: {}, error: new Error('Invalid code') };
    },
    setSession: async () => ({ data: {}, error: null }),
    refreshSession: async () => ({ data: { session: { access_token: aal1,
      refresh_token: 'refresh-after-expiry' } }, error: null }),
    signOut: async () => ({ error: null }),
    mfa: {
      listFactors: async () => ({ data: { totp: [{ id: 'factor-1', status: 'verified' }] }, error: null }),
      challenge: async () => ({ data: { id: 'challenge-1' }, error: null }),
      verify: async ({ code }) => code === '123456'
        ? { data: { access_token: aal2, refresh_token: 'refresh-2' }, error: null }
        : { data: null, error: new Error('Invalid code') },
    },
  } };
  const fakeRef = fake;
  const env = { ...fRef.env, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_isolated-test',
    ADMIN_LOGIN_RATE_LIMITER: { limit: async () => ({ success: true }) } };
  const auth = moduleRef.createAdminAuth({ clientFactory: () => fakeRef, session: fRef.session });
  const send = (path, body, cookie = '') => auth.handle(new Request(`${env.ADMIN_ORIGIN}${path}`, {
    method: 'POST', headers: { Origin: env.ADMIN_ORIGIN, 'Content-Type': 'application/json',
      'CF-Connecting-IP': '192.0.2.10', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body),
  }), env);
  const sendRef = send;
  assert.equal((await sendRef('/auth/login', { email: 'owner@example.test', password: 'wrong' })).status, 401);
  const login = await sendRef('/auth/login', { email: 'owner@example.test', password: 'right-password' });
  assert.equal(login.status, 200);
  assert.equal((await login.json()).stage, 'email-code');
  const firstCookie = login.headers.get('Set-Cookie').split(';')[0];
  assert.match(login.headers.get('Set-Cookie'), /__Host-AdminSession=.*Secure; HttpOnly; SameSite=Strict/);
  assert.equal((await fRef.session.verify(new Request(`${env.ADMIN_ORIGIN}/`, { headers: { Cookie: firstCookie } }), env)).status, 403);
  const pendingStatus = await auth.handle(new Request(`${env.ADMIN_ORIGIN}/auth/status`, {
    headers: { Cookie: firstCookie },
  }), env);
  assert.deepEqual(await pendingStatus.json(), { stage: 'email-code', email: 'owner@example.test' });
  const oldCookie = (await fRef.session.seal({ accessToken: aal1, refreshToken: 'old-refresh',
    signedInAt: Date.now() }, env)).split(';')[0];
  const oldStatus = await auth.handle(new Request(`${env.ADMIN_ORIGIN}/auth/status`, {
    headers: { Cookie: oldCookie },
  }), env);
  assert.equal((await oldStatus.json()).stage, 'login');
  assert.equal((await sendRef('/auth/challenge', { factorId: 'factor-1' }, oldCookie)).status, 403);
  assert.equal((await sendRef('/auth/enroll', {}, firstCookie)).status, 403);
  assert.equal((await sendRef('/auth/challenge', { factorId: 'factor-1' }, firstCookie)).status, 403);
  assert.equal((await sendRef('/auth/verify', { factorId: 'factor-1', challengeId: 'challenge-1',
    code: '123456' }, firstCookie)).status, 403);
  assert.equal((await sendRef('/auth/email-verify', { code: '000000' }, firstCookie)).status, 401);
  assert.equal((await sendRef('/auth/email-verify', { code: '654321' }, firstCookie)).status, 401);
  assert.equal((await sendRef('/auth/email-resend', {}, firstCookie)).status, 200);
  assert.equal(sent, 2);
  const verified = await sendRef('/auth/email-verify', { code: '123456' }, firstCookie);
  assert.equal(verified.status, 200);
  const secondCookie = verified.headers.get('Set-Cookie').split(';')[0];
  const identity = await fRef.session.verify(new Request(`${env.ADMIN_ORIGIN}/`, { headers: { Cookie: secondCookie } }), env);
  assert.equal(identity.aal, 'aal1');
  assert.equal(identity.emailChallenge, 'verified');
  assert.equal(calls, 2);
  const expired = await fRef.token({ aal: 'aal1', exp: Math.floor(Date.now() / 1000) - 1 });
  const expiredCookie = (await fRef.session.seal({ accessToken: expired, refreshToken: 'refresh-before-expiry',
    signedInAt: Date.now(), emailChallenge: 'verified' }, env)).split(';')[0];
  const status = await auth.handle(new Request(`${env.ADMIN_ORIGIN}/auth/status`, {
    headers: { Cookie: expiredCookie },
  }), env);
  assert.equal(status.status, 200);
  assert.equal((await status.json()).stage, 'ready');
  assert.ok(status.headers.get('Set-Cookie'));
  fakeRef.auth.signInWithOtp = async () => ({ error: new Error('SMTP unavailable') });
  const mailFailure = await sendRef('/auth/login', { email: 'owner@example.test', password: 'right-password' });
  assert.equal(mailFailure.status, 503);
  assert.equal(mailFailure.headers.get('Set-Cookie'), null);
  env.ADMIN_LOGIN_RATE_LIMITER = { limit: async () => ({ success: false }) };
  const logout = await sendRef('/auth/logout', {}, secondCookie);
  assert.equal(logout.status, 204);
  assert.match(logout.headers.get('Set-Cookie'), /Max-Age=0/);
  fakeRef.auth.signOut = async () => ({ error: new Error('Auth service unavailable') });
  const failedLogout = await sendRef('/auth/logout', {}, secondCookie);
  assert.equal(failedLogout.status, 503);
  assert.equal(failedLogout.headers.get('Set-Cookie'), null);
});

testRef('an expired pending email session keeps its renewed cookie after a wrong code', async () => {
  const f = await createAdminFixtureRef();
  const fRef2 = f;
  const expired = await fRef2.token({ aal: 'aal1', exp: Math.floor(Date.now() / 1000) - 1 });
  const renewed = await fRef2.token({ aal: 'aal1' });
  const cookie = (await fRef2.session.seal({ accessToken: expired, refreshToken: 'old-refresh',
    signedInAt: Date.now(), emailChallenge: 'pending' }, fRef2.env)).split(';')[0];
  let refreshes = 0;
  const auth = moduleRef.createAdminAuth({ session: fRef2.session, clientFactory: () => ({ auth: {
    refreshSession: async () => {
      refreshes++;
      return { data: { session: { access_token: renewed, refresh_token: 'new-refresh' } }, error: null };
    },
    setSession: async () => ({ error: null }),
    verifyOtp: async ({ token }) => token === '123456'
      ? { data: { user: { id: fRef2.env.ADMIN_ALLOWED_SUB, email: 'owner@example.test' },
        session: { access_token: renewed, refresh_token: 'verified-refresh' } }, error: null }
      : { data: {}, error: new Error('Invalid code') },
  } }) });
  const env = { ...fRef2.env, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_isolated-test',
    ADMIN_LOGIN_RATE_LIMITER: { limit: async () => ({ success: true }) } };
  const send = (code, sessionCookie) => auth.handle(new Request(`${env.ADMIN_ORIGIN}/auth/email-verify`, {
    method: 'POST', headers: { Origin: env.ADMIN_ORIGIN, 'Content-Type': 'application/json',
      Cookie: sessionCookie }, body: JSON.stringify({ code }),
  }), env);
  const sendRef2 = send;
  const rejected = await sendRef2('000000', cookie);
  assert.equal(rejected.status, 401);
  const rotatedCookie = rejected.headers.get('Set-Cookie')?.split(';')[0];
  assert.ok(rotatedCookie);
  assert.equal((await sendRef2('123456', rotatedCookie)).status, 200);
  assert.equal(refreshes, 1);
});

testRef('password recovery requires TOTP before changing a password and never grants dashboard access', async () => {
  const f = await createAdminFixtureRef();
  const fRef3 = f;
  const aal1 = await fRef3.token({ aal: 'aal1' });
  const aal2 = await fRef3.token({ aal: 'aal2' });
  const calls = [];
  let activeAccessToken;
  const fake = { auth: {
    resetPasswordForEmail: async (email, options) => { calls.push(['recover', email, options.redirectTo]); return { error: null }; },
    verifyOtp: async ({ token_hash, type }) => {
      calls.push(['verifyOtp', token_hash, type]);
      return token_hash === 'valid-token' && type === 'recovery'
        ? { data: { user: { id: fRef3.env.ADMIN_ALLOWED_SUB }, session: { access_token: aal1, refresh_token: 'recovery-refresh' } }, error: null }
        : { data: {}, error: new Error('Invalid token') };
    },
    setSession: async ({ access_token }) => { activeAccessToken = access_token; return { data: {}, error: null }; },
    refreshSession: async ({ refresh_token }) => ({ data: { session: { access_token: aal1,
      refresh_token: `${refresh_token}-new` } }, error: null }),
    updateUser: async ({ password }) => {
      calls.push(['password', password]);
      return { error: activeAccessToken === aal2 ? null : new Error('AAL2 required') };
    },
    signOut: async () => ({ error: null }),
    mfa: {
      listFactors: async () => ({ data: { all: [{ id: 'factor-1', status: 'verified' }],
        totp: [{ id: 'factor-1', status: 'verified' }] }, error: null }),
      challenge: async () => ({ data: { id: 'challenge-1' }, error: null }),
      verify: async ({ code }) => code === '123456'
        ? { data: { access_token: aal2, refresh_token: 'recovery-aal2-refresh' }, error: null }
        : { data: null, error: new Error('Invalid code') },
    },
  } };
  const fakeRef2 = fake;
  const env = { ...fRef3.env, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_isolated-test',
    ADMIN_LOGIN_RATE_LIMITER: { limit: async () => ({ success: true }) } };
  const auth = moduleRef.createAdminAuth({ clientFactory: () => fakeRef2, session: fRef3.session });
  const send = (path, body, cookie = '') => auth.handle(new Request(`${env.ADMIN_ORIGIN}${path}`, {
    method: 'POST', headers: { Origin: env.ADMIN_ORIGIN, 'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body),
  }), env);
  const sendRef3 = send;
  assert.equal((await sendRef3('/auth/password', { password: 'a-long-new-password' })).status, 401);
  assert.equal((await sendRef3('/auth/callback', { token_hash: 'bad', type: 'recovery' })).status, 401);
  assert.equal((await sendRef3('/auth/recover', { email: 'owner@example.test' })).status, 200);
  assert.deepEqual(calls[1], ['recover', 'owner@example.test', `${env.ADMIN_ORIGIN}/auth/callback`]);
  const callback = await sendRef3('/auth/callback', { token_hash: 'valid-token', type: 'recovery' });
  assert.equal(callback.status, 200);
  assert.equal((await callback.json()).stage, 'challenge');
  const cookie = callback.headers.get('Set-Cookie').split(';')[0];
  assert.equal((await fRef3.session.verify(new Request(`${env.ADMIN_ORIGIN}/`, { headers: { Cookie: cookie } }), env)).status, 403);
  assert.equal((await sendRef3('/auth/password', { password: 'a-long-new-password' }, cookie)).status, 403);
  assert.equal((await sendRef3('/auth/enroll', {}, cookie)).status, 403);
  const refreshed = await sendRef3('/auth/refresh', {}, cookie);
  assert.equal(refreshed.status, 200);
  assert.equal((await refreshed.json()).stage, 'challenge');
  const refreshedCookie = refreshed.headers.get('Set-Cookie').split(';')[0];
  assert.equal((await fRef3.session.read(new Request(`${env.ADMIN_ORIGIN}/`, { headers: { Cookie: refreshedCookie } }), env)).recovery, true);
  assert.equal((await sendRef3('/auth/challenge', { factorId: 'factor-1' }, refreshedCookie)).status, 200);
  assert.equal((await sendRef3('/auth/verify', { factorId: 'factor-1', challengeId: 'challenge-1',
    code: '000000' }, refreshedCookie)).status, 401);
  const verified = await sendRef3('/auth/verify', { factorId: 'factor-1', challengeId: 'challenge-1',
    code: '123456' }, refreshedCookie);
  assert.equal(verified.status, 200);
  assert.equal((await verified.json()).stage, 'password');
  const verifiedCookie = verified.headers.get('Set-Cookie').split(';')[0];
  assert.equal((await fRef3.session.verify(new Request(`${env.ADMIN_ORIGIN}/`, {
    headers: { Cookie: verifiedCookie },
  }), env)).status, 403);
  const changed = await sendRef3('/auth/password', { password: 'a-long-new-password' }, verifiedCookie);
  assert.equal(changed.status, 200);
  assert.match(changed.headers.get('Set-Cookie'), /Max-Age=0/);
  assert.ok(calls.some(call => call[0] === 'password'));
  fakeRef2.auth.resetPasswordForEmail = async () => ({ error: new Error('SMTP unavailable') });
  assert.equal((await sendRef3('/auth/recover', { email: 'owner@example.test' })).status, 503);
  fakeRef2.auth.signOut = async () => ({ error: new Error('Auth service unavailable') });
  const partial = await sendRef3('/auth/password', { password: 'another-long-password' }, verifiedCookie);
  assert.equal(partial.status, 503);
  assert.equal((await partial.json()).stage, 'login');
  assert.match(partial.headers.get('Set-Cookie'), /Max-Age=0/);
});

testRef('password recovery refreshes an expired aal2 access token before saving', async () => {
  const f = await createAdminFixtureRef();
  const fRef4 = f;
  const expired = await fRef4.token({ aal: 'aal2', exp: Math.floor(Date.now() / 1000) - 1 });
  const renewed = await fRef4.token({ aal: 'aal2' });
  const cookie = (await fRef4.session.seal({ accessToken: expired, refreshToken: 'recovery-refresh',
    signedInAt: Date.now(), recovery: true }, fRef4.env)).split(';')[0];
  let refreshes = 0, updated = false;
  const auth = moduleRef.createAdminAuth({ session: fRef4.session, clientFactory: () => ({ auth: {
    refreshSession: async ({ refresh_token }) => {
      assert.equal(refresh_token, 'recovery-refresh');
      refreshes++;
      return { data: { session: { access_token: renewed, refresh_token: 'renewed-refresh' } }, error: null };
    },
    setSession: async ({ access_token }) => {
      assert.equal(access_token, renewed);
      return { error: null };
    },
    updateUser: async () => { updated = true; return { error: null }; },
    signOut: async () => ({ error: null }),
  } }) });
  const env = { ...fRef4.env, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_isolated-test',
    ADMIN_LOGIN_RATE_LIMITER: { limit: async () => ({ success: true }) } };
  const result = await auth.handle(new Request(`${env.ADMIN_ORIGIN}/auth/password`, {
    method: 'POST', headers: { Origin: env.ADMIN_ORIGIN, 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ password: 'new-long-password' }),
  }), env);
  assert.equal(result.status, 200);
  assert.equal(refreshes, 1);
  assert.equal(updated, true);
});

testRef('password recovery accepts a six-digit email code without a tracked link', async () => {
  const f = await createAdminFixtureRef();
  const fRef5 = f;
  const aal1 = await fRef5.token({ aal: 'aal1' });
  const calls = [];
  const changedPasswords = [];
  const auth = moduleRef.createAdminAuth({ session: fRef5.session, clientFactory: () => ({ auth: {
    verifyOtp: async params => {
      calls.push(params);
      return params.email === 'owner@example.test' && params.token === '012345' && params.type === 'recovery'
        ? { data: { user: { id: fRef5.env.ADMIN_ALLOWED_SUB }, session: { access_token: aal1, refresh_token: 'recovery-refresh' } }, error: null }
        : { data: {}, error: new Error('Invalid token') };
    },
    setSession: async () => ({ data: {}, error: null }),
    mfa: { listFactors: async () => ({ data: { all: [], totp: [] }, error: null }) },
    updateUser: async ({ password }) => { changedPasswords.push(password); return { error: null }; },
    signOut: async () => ({ error: null }),
  } }) });
  const env = { ...fRef5.env, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_isolated-test',
    ADMIN_LOGIN_RATE_LIMITER: { limit: async () => ({ success: true }) } };
  const send = body => auth.handle(new Request(`${env.ADMIN_ORIGIN}/auth/recovery-code`, {
    method: 'POST', headers: { Origin: env.ADMIN_ORIGIN, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }), env);
  const sendRef4 = send;
  assert.equal((await sendRef4({ email: 'owner@example.test', token: '12345' })).status, 400);
  assert.equal((await sendRef4({ email: 'owner@example.test', token: '999999' })).status, 401);
  const verified = await sendRef4({ email: 'owner@example.test', token: '012345' });
  assert.equal(verified.status, 200);
  assert.equal((await verified.json()).stage, 'password');
  assert.deepEqual(calls, [
    { email: 'owner@example.test', token: '999999', type: 'recovery' },
    { email: 'owner@example.test', token: '012345', type: 'recovery' },
  ]);
  const cookie = verified.headers.get('Set-Cookie').split(';')[0];
  assert.equal((await fRef5.session.verify(new Request(`${env.ADMIN_ORIGIN}/`, { headers: { Cookie: cookie } }), env)).status, 403);
  assert.equal((await fRef5.session.read(new Request(`${env.ADMIN_ORIGIN}/`, { headers: { Cookie: cookie } }), env)).recovery, true);
  const changed = await auth.handle(new Request(`${env.ADMIN_ORIGIN}/auth/password`, {
    method: 'POST', headers: { Origin: env.ADMIN_ORIGIN, 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ password: 'new-long-password' }),
  }), env);
  assert.equal(changed.status, 200);
  assert.deepEqual(changedPasswords, ['new-long-password']);
  assert.match(changed.headers.get('Set-Cookie'), /Max-Age=0/);
});

testRef('concurrent refreshes of one sealed session make one Auth request and retain the eight-hour limit', async () => {
  const f = await createAdminFixtureRef();
  const fRef6 = f;
  const expired = await fRef6.token({ exp: Math.floor(Date.now() / 1000) - 1 });
  const signedInAt = Date.now() - 60_000;
  const cookie = (await fRef6.session.seal({ accessToken: expired, refreshToken: 'shared-refresh', signedInAt }, fRef6.env)).split(';')[0];
  let release, calls = 0;
  const gate = new Promise(resolve => { release = resolve; });
  let reads = 0, bothRead;
  const readGate = new Promise(resolve => { bothRead = resolve; });
  const session = { ...fRef6.session, async read(...args) {
    const stored = await fRef6.session.read(...args);
    if (++reads === 2) bothRead();
    return stored;
  } };
  const sessionRef = session;
  const auth = moduleRef.createAdminAuth({ session: sessionRef, clientFactory: () => ({ auth: {
    refreshSession: async () => { calls++; await gate; return { data: { session: {
      access_token: fRef6.accessToken, refresh_token: 'rotated-refresh',
    } }, error: null }; },
  } }) });
  const env = { ...fRef6.env, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_isolated-test' };
  const request = () => new Request(`${env.ADMIN_ORIGIN}/assets/dashboard.js`, { headers: { Cookie: cookie } });
  const requestRef = request;
  const first = auth.refreshForAsset(requestRef(), env);
  const second = auth.refreshForAsset(requestRef(), env);
  await readGate;
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1);
  release();
  const results = await Promise.all([first, second]);
  for (const result of results) {
    assert.equal(result.identity.aal, 'aal2');
    assert.ok(result.cookie);
    const stored = await fRef6.session.read(new Request(`${env.ADMIN_ORIGIN}/`, {
      headers: { Cookie: result.cookie.split(';')[0] },
    }), env);
    assert.equal(stored.signedInAt, signedInAt);
  }
});
