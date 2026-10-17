// codeguard:components:start
// codeguard:defines: createAdminFixture, adminRequest, trackDatabase, adminApiFixture
import assert from 'node:assert/strict';
import { base64url as base64urlRef, exportJWK as exportJWKRef, generateKeyPair as generateKeyPairRef, SignJWT as SignJWTRef } from 'jose';
import { createApi as createApiRef } from '../../src/index.js';
import { createAdminSession as createAdminSessionRef } from '../../src/adminSession.js';
import { openTestDatabase as openTestDatabaseRef, applyInitialMigration as applyInitialMigrationRef, applyAdminMigration as applyAdminMigrationRef, seedInquiry as seedInquiryRef } from './d1.js';
const createAdminFixtureRef = createAdminFixture;
const adminRequestRef = adminRequest;
const trackDatabaseRef = trackDatabase;


const pair = generateKeyPairRef('ES256', { extractable: true });
const pairRef = pair;
const rotationPair = generateKeyPairRef('ES256', { extractable: true });
const rotationPairRef = rotationPair;

export async function createAdminFixture() {
  const key = await pairRef, rotatedKey = await rotationPairRef;
  const jwk = await exportJWKRef(key.publicKey), rotatedJwk = await exportJWKRef(rotatedKey.publicKey);
  const env = {
    ADMIN_ORIGIN: 'https://admin.example.test', SUPABASE_URL: 'https://kghmejpjvbmcivnlnkgf.supabase.co',
    ADMIN_ALLOWED_SUB: 'a028014a-923e-4eec-a6b0-5c01a89ec9ee',
    ADMIN_SESSION_KEY: base64urlRef.encode(crypto.getRandomValues(new Uint8Array(32))),
    ADMIN_CSRF_KEY: 'isolated-test-csrf-key-not-a-live-secret',
    ADMIN_RATE_LIMITER: { limit: async () => ({ success: true }) },
    ADMIN_REPLY_RATE_LIMITER: { limit: async () => ({ success: true }) },
    DB: { prepare: () => { throw new Error('Unexpected database access.'); } },
  };
  const fixture = {
    env: env, jwksCalls: 0, publicJwks: { keys: [{ ...jwk, alg: 'ES256', use: 'sig', kid: 'first' }, { ...rotatedJwk, alg: 'ES256', use: 'sig', kid: 'rotated' }] },
    async token(overrides = {}, signer, header = {}) {
      const claims = { iss: `${env.SUPABASE_URL}/auth/v1`, aud: 'authenticated', sub: env.ADMIN_ALLOWED_SUB,
        exp: Math.floor(Date.now() / 1000) + 900, email: 'owner@example.test', aal: 'aal2', ...overrides };
      return new SignJWTRef(claims).setProtectedHeader({ alg: 'ES256', kid: 'first', ...header })
        .sign(signer ?? (header.kid === 'rotated' ? rotatedKey.privateKey : key.privateKey));
    },
    async fetcher(url, options) {
      assert.equal(String(url), `${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`);
      assert.equal(options?.redirect, 'manual');
      fixtureRef.jwksCalls++;
      return Response.json(fixtureRef.publicJwks);
    },
  };
  const fixtureRef = fixture;
  fixtureRef.accessToken = await fixtureRef.token();
  fixtureRef.session = createAdminSessionRef({ fetcher: fixtureRef.fetcher });
  fixtureRef.sessionCookie = (await fixtureRef.session.seal({ accessToken: fixtureRef.accessToken,
    refreshToken: 'test-refresh-token', signedInAt: Date.now() }, env)).split(';')[0];
  return fixtureRef;
}

export function adminRequest(fixture, path = '/session', { method = 'GET', body, cookie, csrf, headers = {} } = {}) {
  return new Request(`${fixture.env.ADMIN_ORIGIN}/api/admin${path}`, {
    method, headers: {
      Cookie: [fixture.sessionCookie, cookie].filter(Boolean).join('; '),
      ...(method === 'GET' ? {} : { Origin: fixture.env.ADMIN_ORIGIN, 'Content-Type': 'application/json' }),
      ...(csrf ? { 'X-Admin-CSRF': csrf } : {}), ...headers,
    }, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

export function trackDatabase(db) {
  const wrapRef = wrap;

  const counts = { statements: 0, batches: 0, reads: 0, writes: 0, missingMetadata: 0 };
  const countsRef = counts;
  const record = result => {
    if (!result?.meta) countsRef.missingMetadata++;
    countsRef.reads += result?.meta?.rows_read ?? 0; countsRef.writes += result?.meta?.rows_written ?? 0; return result;
  };
  const recordRef = record;
  function wrap(statement) {
    return new Proxy(statement, { get(target, key) {
      if (key === 'bind') return (...args) => wrapRef(target.bind(...args));
      if (['run', 'all', 'first'].includes(key)) return async (...args) => { countsRef.statements++; return recordRef(await target[key](...args)); };
      const value = target[key];
      const valueRef = value; return typeof valueRef === 'function' ? valueRef.bind(target) : valueRef;
    } });
  }
  return { counts: countsRef, tracked: { prepare: sql => wrapRef(db.prepare(sql)), async batch(statements) {
    countsRef.batches++; countsRef.statements += statements.length; return (await db.batch(statements)).map(recordRef);
  } } };
}

export async function adminApiFixture(t, fetcher) {
  const { db: dbRef, dispose: disposeRef } = await openTestDatabaseRef(); t.after(disposeRef);
  await applyInitialMigrationRef(dbRef); await seedInquiryRef(dbRef); await applyAdminMigrationRef(dbRef);
  const f = await createAdminFixtureRef();
  const fRef = f;
  const { tracked: trackedRef, counts } = trackDatabaseRef(dbRef);
  Object.assign(fRef, { db: dbRef, counts }); fRef.env.DB = trackedRef;
  fRef.api = createApiRef({ fetcher: fetcher ?? fRef.fetcher });
  fRef.call = (path, options) => fRef.api.fetch(adminRequestRef(fRef, path, options), fRef.env);
  fRef.login = async () => {
    const result = await fRef.call('/session'); assert.equal(result.status, 200);
    return { cookie: result.headers.get('Set-Cookie').split(';')[0], csrf: (await result.json()).csrfToken };
  };
  return fRef;
}
// codeguard:components:end
