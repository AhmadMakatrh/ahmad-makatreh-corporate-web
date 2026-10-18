// codeguard:components:start
// codeguard:defines: clearAdminSessionCookie, createAdminSession, sealAdminSession, verifyAdminSession
import { base64url as base64urlRef, createRemoteJWKSet as createRemoteJWKSetRef, customFetch as customFetchRef, EncryptJWT as EncryptJWTRef, jwtDecrypt as jwtDecryptRef, jwtVerify as jwtVerifyRef } from 'jose';
const settingsRef = settings;
const sessionCookieRef = sessionCookie;
const createAdminSessionRef = createAdminSession;


const cookieName = '__Host-AdminSession';
const cookieNameRef = cookieName;
const lifetime = 8 * 60 * 60 * 1000;
const lifetimeRef = lifetime;
const deny = (status, message) => Response.json({ message }, { status, headers: { 'Cache-Control': 'no-store' } });
const denyRef = deny;

function settings(env) {
  try {
    const origin = new URL(env.ADMIN_ORIGIN);
    const supabase = new URL(env.SUPABASE_URL);
    const allowedSub = env.ADMIN_ALLOWED_SUB;
    const key = base64urlRef.decode(env.ADMIN_SESSION_KEY ?? '');
    if (origin.protocol !== 'https:' || origin.pathname !== '/' || origin.search || origin.hash
      || origin.username || origin.password || supabase.protocol !== 'https:' || supabase.pathname !== '/'
      || supabase.search || supabase.hash || supabase.username || supabase.password
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(allowedSub ?? '')
      || key.length !== 32) return null;
    return { origin: origin.origin, issuer: `${supabase.origin}/auth/v1`, allowedSub, key };
  } catch { return null; }
}

function sessionCookie(request) {
  const matches = (request.headers.get('Cookie') ?? '').split(';').map(value => value.trim())
    .filter(value => value.startsWith(`${cookieNameRef}=`));
  if (matches.length !== 1) return null;
  const token = matches[0].slice(cookieNameRef.length + 1);
  return token.length <= 8192 ? token : null;
}

export function clearAdminSessionCookie() {
  return `${cookieNameRef}=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0`;
}

export function createAdminSession({ fetcher = fetch, now = Date.now } = {}) {
  const keysRef = keys;
  const readRef = read;

  let jwksIssuer = null, resolver = null;

  function keys(issuer) {
    if (jwksIssuer !== issuer) {
      jwksIssuer = issuer;
      let pendingFetch = null;
      resolver = createRemoteJWKSetRef(new URL(`${issuer}/.well-known/jwks.json`), {
        timeoutDuration: 5000, cacheMaxAge: 3600000, cooldownDuration: 60000,
        [customFetchRef]: async (url, options) => {
          pendingFetch ??= fetcher(url, { ...options, redirect: 'manual' }).then(async response => ({
            status: response.status, body: await response.text(),
          }));
          const current = pendingFetch;
          try { const response = await current; return new Response(response.body, { status: response.status }); }
          finally { if (pendingFetch === current) pendingFetch = null; }
        },
      });
    }
    return resolver;
  }

  async function read(request, env) {
    const config = settingsRef(env);
    if (!config) return denyRef(503, 'Admin authentication is not configured.');
    if (new URL(request.url).origin !== config.origin) return denyRef(404, 'Not found.');
    const token = sessionCookieRef(request);
    if (!token) return denyRef(401, 'Administrator login is required.');
    try {
      const { payload } = await jwtDecryptRef(token, config.key, {
        keyManagementAlgorithms: ['dir'], contentEncryptionAlgorithms: ['A256GCM'],
        issuer: config.origin, audience: 'admin-session', currentDate: new Date(now()),
        requiredClaims: ['exp', 'iat'],
      });
      if (typeof payload.accessToken !== 'string' || typeof payload.refreshToken !== 'string'
        || !Number.isSafeInteger(payload.signedInAt) || payload.signedInAt > now()
        || now() >= payload.signedInAt + lifetimeRef) return denyRef(401, 'Administrator login is required.');
      return { ...payload, origin: config.origin };
    } catch { return denyRef(401, 'Administrator login is required.'); }
  }

  return {
    read: readRef,
    async seal({ accessToken, refreshToken, signedInAt, recovery = false, emailChallenge = null }, env) {
      const config = settingsRef(env);
      if (!config || !Number.isSafeInteger(signedInAt) || typeof accessToken !== 'string'
        || typeof refreshToken !== 'string') throw new Error('Admin session cannot be sealed.');
      const token = await new EncryptJWTRef({ accessToken, refreshToken, signedInAt, recovery, emailChallenge })
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' }).setIssuer(config.origin)
        .setAudience('admin-session').setIssuedAt(Math.floor(now() / 1000))
        .setExpirationTime(Math.floor((signedInAt + lifetimeRef) / 1000)).encrypt(config.key);
      const remaining = Math.max(0, Math.floor((signedInAt + lifetimeRef - now()) / 1000));
      return `${cookieNameRef}=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${remaining}`;
    },
    async verify(request, env, { allowAal1 = false, allowRecovery = false } = {}) {
      const stored = await readRef(request, env);
      if (stored instanceof Response) return stored;
      if (stored.recovery === true && !allowRecovery) return denyRef(403, 'Administrator permission is required.');
      const config = settingsRef(env);
      let payload;
      try {
        ({ payload } = await jwtVerifyRef(stored.accessToken, keysRef(config.issuer), {
          algorithms: ['ES256'], issuer: config.issuer, audience: 'authenticated',
          requiredClaims: ['sub', 'exp', 'aal'], currentDate: new Date(now()), clockTolerance: 0,
        }));
      } catch { return denyRef(401, 'Administrator login is required.'); }
      if (payload.sub !== config.allowedSub || typeof payload.email !== 'string'
        || !['aal1', 'aal2'].includes(payload.aal)
        || !allowAal1 && (stored.emailChallenge === 'pending'
          || payload.aal !== 'aal2' && stored.emailChallenge !== 'verified'))
        return denyRef(403, 'Administrator permission is required.');
      return { email: payload.email, sub: payload.sub, aal: payload.aal, origin: config.origin,
        recovery: stored.recovery === true, emailChallenge: stored.emailChallenge,
        accessToken: stored.accessToken, refreshToken: stored.refreshToken, signedInAt: stored.signedInAt };
    },
  };
}

const defaultSession = createAdminSessionRef();
const defaultSessionRef = defaultSession;
export const sealAdminSession = (session, env) => defaultSessionRef.seal(session, env);
export const verifyAdminSession = (request, env, options) => defaultSessionRef.verify(request, env, options);
// codeguard:components:end
