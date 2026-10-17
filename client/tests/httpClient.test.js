// codeguard:components:start
// codeguard:defines: public HTTP response-body and error regression tests
import { test as testRef, before as beforeRef, after as afterRef } from 'node:test';
import assert from 'node:assert/strict';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath as filePath } from 'node:url';

let server;
let request;
// codeguard:components:end

beforeRef(async () => {
  server = await createViteServer({ root: filePath(new URL('..', import.meta.url)), configFile: false,
    cacheDir: 'node_modules/.vite-http-tests', server: { middlewareMode: true, hmr: false },
    appType: 'custom', logLevel: 'error' });
  ({ request } = await server.ssrLoadModule('/src/api/httpClient.js'));
});

afterRef(async () => { await server?.close(); });

testRef('timeout aborts the response body after headers have arrived', async context => {
  let aborted = false;
  context.mock.method(globalThis, 'fetch', async (_url, { signal }) => new Response(new ReadableStream({
    start(controller) {
      const timer = setTimeout(() => { controller.enqueue(new TextEncoder().encode('[]')); controller.close(); }, 150);
      signal.addEventListener('abort', () => {
        aborted = true;
        clearTimeout(timer);
        controller.error(new DOMException('Aborted while reading body', 'AbortError'));
      }, { once: true });
    },
  }), { headers: { 'Content-Type': 'application/json' } }));
  await assert.rejects(request('/api/site', { timeout: 25 }), error => error.status === 408 && /timed out/.test(error.message));
  assert.equal(aborted, true);
});

testRef('non-JSON HTTP failures preserve the actual response status', async context => {
  context.mock.method(globalThis, 'fetch', async () => new Response('Service unavailable', { status: 503 }));
  await assert.rejects(request('/api/site'), error => error.status === 503 && error.message === 'Request failed with status 503');
});

testRef('timeout terminates a response stream that never completes', { timeout: 1000 }, async context => {
  let responseSignal;
  context.mock.method(globalThis, 'fetch', async (_url, { signal }) => new Response(new ReadableStream({
    start(controller) {
      responseSignal = signal;
      signal.addEventListener('abort', () => controller.error(new DOMException('Unfinished body aborted', 'AbortError')), { once: true });
    },
  })));
  await assert.rejects(request('/api/site', { timeout: 25 }), error => error.status === 408);
  assert.equal(responseSignal.aborted, true);
});

testRef('successful JSON and malformed-body compatibility settle before timeout cleanup', async context => {
  let signal;
  context.mock.method(globalThis, 'fetch', async (_url, options) => {
    signal = options.signal;
    return Response.json({ message: 'تم التحميل' });
  });
  assert.deepEqual(await request('/api/site', { timeout: 10 }), { message: 'تم التحميل' });
  await new Promise(resolve => setTimeout(resolve, 25));
  assert.equal(signal.aborted, false);
  context.mock.method(globalThis, 'fetch', async () => new Response('not json'));
  assert.equal(await request('/api/site'), null);
});
