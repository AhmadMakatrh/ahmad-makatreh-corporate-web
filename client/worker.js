// codeguard:components:start
// codeguard:defines: handleRequest
import { createApi as makeApi } from '../server/cloudflare/src/index.js';
const handleRequestRef = handleRequest;


const api = makeApi();
const apiRef = api;

export async function handleRequest(request, env, ctx, handler = apiRef) {
  const url = new URL(request.url);
  const adminRoute = url.pathname === '/api/admin' || url.pathname.startsWith('/api/admin/');
  if (adminRoute) return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return handler.fetch(request, env, ctx);
  return env.ASSETS.fetch(request);
}
// codeguard:components:end

export default { fetch: handleRequestRef, scheduled: (...args) => apiRef.scheduled(...args) };
