// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest as handleRequestRef } from '../../deploy/cloudflare/public-worker.js';

const publicHost = 'https://ahmad-makatreh.vip';
const publicHostRef = publicHost;
const adminHost = 'https://admin.ahmad-makatreh.vip';
const adminHostRef = adminHost;
// codeguard:components:end

testRef('site Worker routes API requests into the existing API without a second HTTP request', async () => {
  const seen = [];
  const env = { ASSETS: { fetch: () => { throw new Error('API reached assets'); } } };
  const api = { fetch: (request, bindings, context) => {
    seen.push({ request, bindings, context });
    return Response.json({ path: new URL(request.url).pathname });
  } };
  const apiRef = api;
  const context = { waitUntil() {} };
  const contextRef = context;
  for (const [host, path, method] of [
    [publicHostRef, '/api/site', 'GET'],
    [publicHostRef, '/api/site/', 'GET'],
    [publicHostRef, '/api/booking', 'POST'],
    [publicHostRef, '/api/booking', 'OPTIONS'],
  ]) {
    const request = new Request(host + path, { method, headers: host === adminHostRef ? { 'Cf-Access-Jwt-Assertion': 'signed-test' } : {} });
    const response = await handleRequestRef(request, env, contextRef, apiRef);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).path, path);
    assert.equal(seen.at(-1).request, request);
    assert.equal(seen.at(-1).bindings, env);
    assert.equal(seen.at(-1).context, contextRef);
  }
  assert.equal(seen.length, 4);
});

testRef('public host cannot reach administration and assets stay on the asset binding', async () => {
  const env = { ASSETS: { fetch: () => new Response('asset response') } };
  const api = { fetch: () => { throw new Error('unexpected API request'); } };
  const apiRef2 = api;
  assert.equal((await handleRequestRef(new Request(publicHostRef + '/api/admin/session'), env, null, apiRef2)).status, 404);
  assert.equal((await handleRequestRef(new Request(adminHostRef + '/api/admin/session'), env, null, apiRef2)).status, 404);
  assert.equal(await (await handleRequestRef(new Request(publicHostRef + '/'), env, null, apiRef2)).text(), 'asset response');
  assert.equal(await (await handleRequestRef(new Request(publicHostRef + '/about'), env, null, apiRef2)).text(), 'asset response');
});

testRef('missing API bindings fail as API responses rather than returning the site HTML', async () => {
  const env = { ASSETS: { fetch: () => new Response('<html>site</html>', { headers: { 'Content-Type': 'text/html' } }) } };
  const site = await handleRequestRef(new Request(publicHostRef + '/api/site'), env);
  assert.equal(site.status, 503);
  assert.match(site.headers.get('Content-Type'), /json/);
  const admin = await handleRequestRef(new Request(adminHostRef + '/api/admin/session', {
    headers: { 'Cf-Access-Jwt-Assertion': 'signed-test' },
  }), env);
  assert.equal(admin.status, 404);
});

testRef('HTML without the canonical CSP fails closed before serving a page', async () => {
  const env = { ASSETS: { fetch: () => new Response('<html>site</html>', { headers: { 'Content-Type': 'text/html' } }) } };
  const response = await handleRequestRef(new Request(publicHostRef + '/'), env);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.doesNotMatch(await response.text(), /<html>/);
});
