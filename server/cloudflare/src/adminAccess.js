// codeguard:components:start
// codeguard:defines: createAdminAccess
import { jwtVerify as jwtVerifyRef, SignJWT as SignJWTRef } from 'jose';
import { createAdminSession as makeAdminSession } from './adminSession.js';
const settingsRef = settings;
const cookieTokenRef = cookieToken;


const encoder = new TextEncoder();
const encoderRef = encoder;
const cookieName = '__Host-AdminAntiforgery';
const cookieNameRef = cookieName;
const reject = (status, message) => Response.json({ message }, { status, headers: { 'Cache-Control': 'no-store' } });
const rejectRef = reject;

function settings(env) {
  const key = typeof env.ADMIN_CSRF_KEY === 'string' ? encoderRef.encode(env.ADMIN_CSRF_KEY) : new Uint8Array();
  if (key.length < 32 || typeof env.ADMIN_RATE_LIMITER?.limit !== 'function'
    || typeof env.ADMIN_REPLY_RATE_LIMITER?.limit !== 'function') return null;
  return { key };
}

function cookieToken(request) {
  const matches = (request.headers.get('Cookie') ?? '').split(';').map(v => v.trim()).filter(v => v.startsWith(`${cookieNameRef}=`));
  if (matches.length !== 1) return null;
  const token = matches[0].slice(cookieNameRef.length + 1);
  return token.length <= 4096 ? token : null;
}

export function createAdminAccess({ fetcher = fetch, now = Date.now } = {}) {
  const validCsrfRef = validCsrf;

  const adminSession = makeAdminSession({ fetcher, now });
  const adminSessionRef = adminSession;
  async function validCsrf(token, config, identity) {
    if (!token) return false;
    try {
      const { payload } = await jwtVerifyRef(token, config.key, {
        algorithms: ['HS256'], issuer: identity.origin, audience: 'admin-csrf',
        requiredClaims: ['sub', 'jti'], currentDate: new Date(now()),
      });
      return payload.sub === identity.sub && typeof payload.jti === 'string' && payload.jti.length >= 32;
    } catch { return false; }
  }
  return {
    async authenticate(request, env) {
      if (['ahmad-makatreh.vip', 'www.ahmad-makatreh.vip'].includes(new URL(request.url).hostname))
        return rejectRef(404, 'Not found.');
      if (!settingsRef(env)) return rejectRef(503, 'Admin access is not configured.');
      return adminSessionRef.verify(request, env);
    },
    async session(request, env, identity) {
      const config = settingsRef(env);
      if (!config) return rejectRef(503, 'Admin access is not configured.');
      let token = cookieTokenRef(request);
      if (!await validCsrfRef(token, config, identity)) {
        token = await new SignJWTRef({}).setProtectedHeader({ alg: 'HS256' }).setIssuer(identity.origin)
          .setAudience('admin-csrf').setSubject(identity.sub).setJti(crypto.randomUUID())
          .setIssuedAt(Math.floor(now() / 1000)).setExpirationTime(Math.floor((now() + 8 * 3600000) / 1000))
          .sign(config.key);
      }
      return Response.json({ email: identity.email, csrfToken: token }, { headers: {
        'Cache-Control': 'no-store', 'Set-Cookie': `${cookieNameRef}=${token}; Path=/; Secure; HttpOnly; SameSite=Strict`,
      } });
    },
    async validateMutation(request, env, identity) {
      const config = settingsRef(env), token = cookieTokenRef(request);
      const fetchSite = request.headers.get('Sec-Fetch-Site');
      if (!config || request.headers.get('Origin') !== identity.origin || fetchSite !== null && fetchSite !== 'same-origin')
        return rejectRef(403, 'Admin origin rejected.');
      if (!token || request.headers.get('X-Admin-CSRF') !== token || !await validCsrfRef(token, config, identity)) return rejectRef(403, 'Admin verification failed. Reload the dashboard.');
      return null;
    },
  };
}
// codeguard:components:end
