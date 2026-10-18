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
  let assetRequest = request;
  const filename = url.pathname.split('/').at(-1);
  if (['GET', 'HEAD'].includes(request.method) && (request.headers.get('Sec-Fetch-Mode') === 'navigate'
    || request.headers.get('Accept')?.includes('text/html') || !filename.includes('.') || filename.endsWith('.html'))) {
    // A cached HTML body cannot be reused with a different response's CSP nonce.
    assetRequest = new Request(request);
    assetRequest.headers.delete('If-None-Match');
    assetRequest.headers.delete('If-Modified-Since');
  }
  const asset = await env.ASSETS.fetch(assetRequest);
  if (!asset.headers.get('Content-Type')?.startsWith('text/html')) return asset;
  const policy = asset.headers.get('Content-Security-Policy');
  if (!policy?.includes('script-src '))
    return new Response('The page security policy is unavailable.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  const withNonce = value => value.replace('script-src ', `script-src 'nonce-${nonce}' `);
  const headers = new Headers(asset.headers);
  headers.set('Content-Security-Policy', withNonce(policy));
  headers.set('Cache-Control', 'private, no-store');
  for (const name of ['ETag', 'Last-Modified', 'Content-Length']) headers.delete(name);
  const response = new Response(asset.body, { status: asset.status, statusText: asset.statusText, headers });
  if (request.method === 'HEAD') return response;
  return new HTMLRewriter().on('meta[http-equiv="Content-Security-Policy"]', {
    element(element) {
      element.setAttribute('content', withNonce(element.getAttribute('content') ?? ''));
    },
  }).transform(response);
}
// codeguard:components:end

export default { fetch: handleRequestRef, scheduled: (...args) => apiRef.scheduled(...args) };
