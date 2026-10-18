// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { createAdminAccess as createAdminAccessRef } from '../src/adminAccess.js';
import { readJson as readJsonRef } from '../src/httpJson.js';
import { createAdminFixture as createAdminFixtureRef, adminRequest as adminRequestRef } from './helpers/adminFixtures.js';
// codeguard:components:end

testRef('admin API rejects public hosts, missing configuration and legacy Access assertions', async () => {
  const f = await createAdminFixtureRef();
  const fRef = f;
  const access = createAdminAccessRef({ fetcher: fRef.fetcher });
  const accessRef = access;
  assert.equal((await accessRef.authenticate(new Request('https://ahmad-makatreh.vip/api/admin/session'), fRef.env)).status, 404);
  for (const setting of ['ADMIN_ALLOWED_SUB', 'ADMIN_SESSION_KEY', 'SUPABASE_URL', 'ADMIN_CSRF_KEY', 'ADMIN_RATE_LIMITER', 'ADMIN_REPLY_RATE_LIMITER'])
    assert.equal((await accessRef.authenticate(adminRequestRef(fRef), { ...fRef.env, [setting]: '' })).status, 503, setting);
  assert.equal((await accessRef.authenticate(adminRequestRef(fRef, '/session', {
    headers: { Cookie: '', 'Cf-Access-Jwt-Assertion': fRef.accessToken },
  }), fRef.env)).status, 401);
});

testRef('admin API verifies Supabase identity and AAL before any database work', async () => {
  const f = await createAdminFixtureRef();
  const fRef2 = f;
  const access = createAdminAccessRef({ fetcher: fRef2.fetcher });
  const accessRef2 = access;
  for (const [claims, status] of [
    [{ iss: 'https://other.supabase.co/auth/v1' }, 401],
    [{ aud: 'foreign' }, 401],
    [{ exp: undefined }, 401],
    [{ exp: Math.floor(Date.now() / 1000) - 1 }, 401],
    [{ sub: 'b028014a-923e-4eec-a6b0-5c01a89ec9ee' }, 403],
    [{ aal: 'aal1' }, 403],
    [{ email: null }, 403],
  ]) {
    const cookie = (await fRef2.session.seal({ accessToken: await fRef2.token(claims),
      refreshToken: 'test-refresh-token', signedInAt: Date.now() }, fRef2.env)).split(';')[0];
    assert.equal((await accessRef2.authenticate(adminRequestRef(fRef2, '/session', { headers: { Cookie: cookie } }), fRef2.env)).status, status);
  }
  const identity = await accessRef2.authenticate(adminRequestRef(fRef2), fRef2.env);
  assert.equal(identity.sub, fRef2.env.ADMIN_ALLOWED_SUB);
  assert.equal(identity.email, 'owner@example.test');
});

testRef('concurrent cold verification shares the Supabase JWKS request', async () => {
  const f = await createAdminFixtureRef();
  const fRef3 = f;
  const access = createAdminAccessRef({ fetcher: fRef3.fetcher });
  const accessRef3 = access;
  const results = await Promise.all(Array.from({ length: 20 }, () => accessRef3.authenticate(adminRequestRef(fRef3), fRef3.env)));
  assert.ok(results.every(result => result.email === 'owner@example.test'));
  assert.equal(fRef3.jwksCalls, 1);
});

testRef('CSRF cookie is host-only, signed for the user and required on writes', async () => {
  const f = await createAdminFixtureRef();
  const fRef4 = f;
  const access = createAdminAccessRef({ fetcher: fRef4.fetcher });
  const accessRef4 = access;
  const identity = await accessRef4.authenticate(adminRequestRef(fRef4), fRef4.env);
  const response = await accessRef4.session(adminRequestRef(fRef4), fRef4.env, identity), data = await response.json();
  const setCookie = response.headers.get('Set-Cookie'), cookie = setCookie.split(';')[0];
  assert.equal(data.email, 'owner@example.test');
  assert.match(setCookie, /^__Host-AdminAntiforgery=/);
  assert.match(setCookie, /Path=\/; Secure; HttpOnly; SameSite=Strict/);
  assert.doesNotMatch(setCookie, /Domain=/);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const second = await accessRef4.session(adminRequestRef(fRef4, '/session', { cookie }), fRef4.env, identity);
  assert.equal((await second.json()).csrfToken, data.csrfToken);
  const write = options => adminRequestRef(fRef4, '/inquiries/id/notes', { method: 'PATCH', cookie,
    csrf: data.csrfToken, body: {}, ...options });
  const writeRef = write;
  assert.equal(await accessRef4.validateMutation(writeRef(), fRef4.env, identity), null);
  assert.equal(await accessRef4.validateMutation(writeRef({ headers: { 'Sec-Fetch-Site': 'same-origin' } }), fRef4.env, identity), null);
  for (const options of [{ csrf: 'forged' }, { cookie: '' }, { headers: { Origin: 'https://foreign.example' } },
    ...['cross-site', 'same-site', 'none'].map(site => ({ headers: { 'Sec-Fetch-Site': site } }))])
    assert.equal((await accessRef4.validateMutation(writeRef(options), fRef4.env, identity)).status, 403);
  assert.equal((await accessRef4.validateMutation(writeRef(), fRef4.env, { ...identity, sub: 'different-user' })).status, 403);
});

testRef('JSON reader enforces streamed and declared sizes and rejects malformed UTF-8', async () => {
  const request = body => new Request('https://example.test', { method: 'POST', body });
  const requestRef = request;
  assert.deepEqual(await readJsonRef(requestRef('{"name":"أحمد"}')), { value: { name: 'أحمد' } });
  assert.deepEqual(await readJsonRef(requestRef('12345'), 4), { oversized: true });
  assert.deepEqual(await readJsonRef(new Request('https://example.test', { method: 'POST', body: '{}', headers: { 'Content-Length': '99' } }), 4), { oversized: true });
  assert.deepEqual(await readJsonRef(requestRef(new Uint8Array([0xff]))), { invalid: true });
});
