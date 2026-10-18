// codeguard:components:start
// codeguard:defines: handleRequest
import { createApi as makeApi } from '../../backend/cloudflare/src/index.js';
import { createAdminSession as makeAdminSession } from '../../backend/cloudflare/src/adminSession.js';
import { createAdminAuth as makeAdminAuth } from '../../backend/cloudflare/src/adminAuth.js';
import { adminAuthPage as adminAuthPageRef } from './admin-auth-page.js';
const handleRequestRef = handleRequest;


const api = makeApi();
const apiRef = api;
const session = makeAdminSession();
const sessionRef = session;
const auth = makeAdminAuth();
const authRef = auth;
const notFound = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
const notFoundRef = notFound;

export async function handleRequest(request, env, ctx, handler = apiRef, verifier = sessionRef, authHandler = authRef) {
  const authorizeRef = authorize;

  const url = new URL(request.url);
  if (!env.ADMIN_ORIGIN || url.origin !== env.ADMIN_ORIGIN) return notFoundRef();
  async function authorize() {
    const identity = await verifier.verify(request, env);
    if (!(identity instanceof Response) || identity.status !== 401) return { identity };
    const renewed = await authHandler.refreshForAsset(request, env);
    return renewed instanceof Response ? { identity: renewed } : { identity: renewed.identity, cookie: renewed.cookie };
  }
  if (request.method === 'GET' && url.pathname === '/auth/callback') return adminAuthPageRef();
  if (request.method === 'GET' && url.pathname === '/auth/backup') {
    const { identity, cookie } = await authorizeRef();
    if (identity instanceof Response) return identity;
    const response = adminAuthPageRef();
    if (cookie) response.headers.set('Set-Cookie', cookie);
    return response;
  }
  if (url.pathname === '/auth' || url.pathname.startsWith('/auth/')) return authHandler.handle(request, env);
  let authorized;
  if (request.method === 'GET' && ['/', '/login', '/recover'].includes(url.pathname)) {
    authorized = await authorizeRef();
    const { identity, cookie } = authorized;
    if (identity instanceof Response) return adminAuthPageRef();
    if (url.pathname !== '/') {
      return new Response(null, { status: 302, headers: { Location: `${env.ADMIN_ORIGIN}/`,
        'Cache-Control': 'no-store', ...(cookie ? { 'Set-Cookie': cookie } : {}) } });
    }
  }
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
    if (url.pathname !== '/api/admin' && !url.pathname.startsWith('/api/admin/')) return notFoundRef();
    return handler.fetch(request, env, ctx);
  }
  authorized ??= await authorizeRef();
  const { identity, cookie } = authorized;
  if (identity instanceof Response) return identity;
  const asset = await env.ASSETS.fetch(request);
  const headers = new Headers(asset.headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  if (cookie) headers.set('Set-Cookie', cookie);
  return new Response(asset.body, { status: asset.status, statusText: asset.statusText, headers: headers });
}
// codeguard:components:end

export default {
  async fetch(request, env, ctx) {
    const response = await handleRequestRef(request, env, ctx);
    const result = new Response(response.body, response);
    result.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    if (!result.headers.has('Content-Security-Policy')) {
      result.headers.set('Content-Security-Policy', "frame-ancestors 'none'");
    }
    return result;
  },
};
