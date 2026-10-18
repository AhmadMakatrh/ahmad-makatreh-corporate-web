// codeguard:components:start
// codeguard:defines: createApi
import { createBookingHandler as makeBookingHandler } from './booking.js';
import { createSiteReader as makeSiteReader } from './publishedSite.js';
import { cleanupAbuse as pruneBookingAbuse } from './inquiries.js';
import { createAdminHandler as makeAdminHandler } from './admin.js';
import { createSupabaseHeartbeat as makeHeartbeat } from './supabaseHeartbeat.js';
const createApiRef = createApi;


export function createApi({ fetcher = fetch, now = Date.now } = {}) {
  const siteReader = makeSiteReader({ now });
  const siteReaderRef = siteReader;
  const booking = makeBookingHandler({ fetcher, now, siteReader: siteReaderRef });
  const bookingRef = booking;
  const admin = makeAdminHandler({ fetcher, now, siteReader: siteReaderRef });
  const adminRef = admin;
  const heartbeatSupabase = makeHeartbeat({ fetcher });
  const heartbeatSupabaseRef = heartbeatSupabase;
  return {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/$/, '');
      if (path === '/api/admin' || path.startsWith('/api/admin/')) return adminRef(request, env, ctx);
      if (!['/api/booking', '/api/site'].includes(path)) return Response.json({ message: 'Not found.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
      const origin = request.headers.get('Origin');
      const allowedOrigins = [url.origin, ...(env.PUBLIC_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean)];
      const allowedOriginsRef = allowedOrigins;
      if (origin && !allowedOriginsRef.includes(origin)) return Response.json({ message: 'Origin is not allowed.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
      const headers = { Vary: 'Origin', 'X-Content-Type-Options': 'nosniff' };
      const headersRef = headers;
      if (origin) headersRef['Access-Control-Allow-Origin'] = origin;
      if (request.method === 'OPTIONS') {
        const method = request.headers.get('Access-Control-Request-Method'), expected = path === '/api/booking' ? 'POST' : 'GET';
        if (method && method !== expected) return new Response(null, { status: 405, headers: { ...headersRef, Allow: expected } });
        return new Response(null, { status: 204, headers: { ...headersRef, 'Access-Control-Allow-Methods': expected, 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600' } });
      }
      if (request.method !== (path === '/api/booking' ? 'POST' : 'GET')) return new Response(null, { status: 405, headers: { ...headersRef, Allow: path === '/api/booking' ? 'POST' : 'GET' } });
      let response;
      if (path === '/api/booking') response = await bookingRef(request, env);
      else {
        try {
          const snapshot = await siteReaderRef.read(env.DB);
          const match = request.headers.get('If-None-Match')?.split(',').map(s => s.trim().replace(/^W\//, '')).some(value => value === snapshot.etag || value === '*');
          response = new Response(match ? null : snapshot.json, {
            status: match ? 304 : 200, headers: { ETag: snapshot.etag, 'Cache-Control': 'public, max-age=30', 'Content-Type': 'application/json; charset=utf-8' },
          });
        } catch {
          console.error('Published content read unavailable.');
          response = Response.json({ message: 'Published content unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
        }
      }
      for (const [key, value] of Object.entries(headersRef)) response.headers.set(key, value);
      return response;
    },
    async scheduled(controller, env, ctx) {
      if (controller?.cron === '0 */6 * * *') {
        const cleanup = pruneBookingAbuse(env.DB, now());
        if (ctx?.waitUntil) ctx.waitUntil(cleanup);
        await cleanup;
      }
      if (controller?.cron === '0 */3 * * *') {
        const heartbeat = heartbeatSupabaseRef(env).catch(error => {
          console.error('Supabase keep-alive failed.', error?.message ?? 'Unknown error.');
        });
        if (ctx?.waitUntil) ctx.waitUntil(heartbeat);
        await heartbeat;
      }
    },
  };
}
// codeguard:components:end

export default createApiRef();
