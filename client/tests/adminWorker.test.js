// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { Script as ScriptRef, createContext as createContextRef } from 'node:vm';
import { createAdminFixture as createAdminFixtureRef } from '../../server/cloudflare/tests/helpers/adminFixtures.js';
import { createApi as createApiRef } from '../../server/cloudflare/src/index.js';
import { createAdminAuth as createAdminAuthRef } from '../../server/cloudflare/src/adminAuth.js';

const module = await import('../workers/admin-worker.js').catch(() => null);
const moduleRef = module;
const authPageFixtureRef = authPageFixture;

async function authPageFixture(fetcher) {
  const elementRef = element;
  class PageElement extends EventTarget {
    constructor(id) { super(); this.id = id; this.value = ''; this.disabled = false; this.children = []; this.parentElement = {}; }
    addEventListener(type, listener) {
      super.addEventListener(type, event => { this.completion = Promise.resolve(listener(event)); });
    }
    replaceChildren() { this.children = []; this.value = ''; }
    append(child) { this.children.push(child); if (this.children.length === 1) this.value = child.value; }
  }
  const PageElementRef = PageElement;
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, new PageElementRef(id));
    return elements.get(id);
  }
  const response = await moduleRef.handleRequest(new Request('https://admin.example.test/recover'), {
    ADMIN_ORIGIN: 'https://admin.example.test',
  });
  const html = await response.text();
  const context = createContextRef({ document: { getElementById: elementRef, createElement: tag => new PageElementRef(tag) },
    location: { pathname: '/recover' }, fetch: fetcher });
  new ScriptRef(html.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]).runInContext(context);
  return {
    element: elementRef,
    stage(data) { context.nextStage = data; new ScriptRef('stageRef(nextStage)').runInContext(context); },
    async dispatch(id, type = 'click') {
      const target = elementRef(id), event = new Event(type, { cancelable: true });
      event.submitter = new PageElementRef('submit');
      target.dispatchEvent(event);
      assert.equal(event.currentTarget, null);
      await target.completion;
    },
  };
}
// codeguard:components:end

testRef('admin Worker denies dashboard HTML, assets and API before asset or database access', async () => {
  assert.ok(moduleRef?.handleRequest, 'admin Worker must exist');
  let assets = 0, database = 0;
  const env = { ADMIN_ORIGIN: 'https://admin.example.test', ASSETS: { fetch: () => { assets++; return new Response('dashboard'); } },
    DB: { prepare: () => { database++; throw new Error('Unexpected D1 access'); } } };
  for (const path of ['/work/crisis-fund', '/assets/current.js', '/assets/stale.js', '/api/admin/session']) {
    const response = await moduleRef.handleRequest(new Request(`https://admin.example.test${path}`), env);
    assert.notEqual(response.status, 200, path);
    assert.equal((await response.text()).includes('dashboard'), false);
  }
  assert.equal(assets, 0);
  assert.equal(database, 0);
  assert.equal((await moduleRef.handleRequest(new Request('https://wrong.example.test/assets/current.js'), env)).status, 404);
});

testRef('login shell is public while dashboard bundles remain inaccessible', async () => {
  const env = { ADMIN_ORIGIN: 'https://admin.example.test', ASSETS: { fetch: () => { throw new Error('Dashboard asset was fetched'); } } };
  for (const path of ['/', '/login', '/recover', '/auth/callback?token_hash=test&type=recovery']) {
    const response = await moduleRef.handleRequest(new Request(`${env.ADMIN_ORIGIN}${path}`), env);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /<form/);
    assert.doesNotMatch(html, /مكتبة الوسائط|BackupEditor|AdminApp/);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
});

testRef('recovery shell accepts an email code without placing it in a URL', async () => {
  const env = { ADMIN_ORIGIN: 'https://admin.example.test', ASSETS: { fetch: () => { throw new Error('Dashboard asset was fetched'); } } };
  const response = await moduleRef.handleRequest(new Request(`${env.ADMIN_ORIGIN}/recover`), env);
  const html = await response.text();
  assert.match(html, /<form id="recover-code"/);
  assert.match(html, /id="recovery-token"[^>]*maxlength="6"/);
  assert.match(html, /sendRef\('\/auth\/recovery-code', \{ email:/);
  assert.doesNotMatch(html, /token=\$\{|token_hash=\$\{/);
  assert.doesNotThrow(() => new ScriptRef(html.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]));
});

testRef('login shell asks for an emailed code without displaying a QR code', async () => {
  const env = { ADMIN_ORIGIN: 'https://admin.example.test', ASSETS: { fetch: () => { throw new Error('Dashboard asset was fetched'); } } };
  const response = await moduleRef.handleRequest(new Request(`${env.ADMIN_ORIGIN}/login`), env);
  const html = await response.text();
  assert.match(html, /<form id="email-code"/);
  assert.match(html, /sendRef\('\/auth\/email-verify', \{ code:/);
  assert.doesNotMatch(html, /id="qr"|qr\.src/);
  assert.doesNotThrow(() => new ScriptRef(html.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]));
});

testRef('backup enrollment page is available only after full MFA', async () => {
  const f = await createAdminFixtureRef();
  const fRef = f;
  const env = { ...fRef.env, ASSETS: { fetch: () => { throw new Error('Unexpected dashboard asset'); } } };
  assert.equal((await moduleRef.handleRequest(new Request(`${env.ADMIN_ORIGIN}/auth/backup`), env, null, undefined, fRef.session)).status, 401);
  const response = await moduleRef.handleRequest(new Request(`${env.ADMIN_ORIGIN}/auth/backup`, { headers: { Cookie: fRef.sessionCookie } }), env, null, undefined, fRef.session);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /إعداد تطبيق التحقق/);
});

testRef('admin Worker serves dashboard assets and API only after completed verification', async () => {
  const f = await createAdminFixtureRef();
  const fRef2 = f;
  let assets = 0;
  const env = { ...fRef2.env, ASSETS: { fetch: async () => { assets++; return new Response('dashboard'); } } };
  const handler = createApiRef({ fetcher: fRef2.fetcher });
  const handlerRef = handler;
  const headers = { Cookie: fRef2.sessionCookie };
  const asset = await moduleRef.handleRequest(new Request(`${env.ADMIN_ORIGIN}/assets/dashboard.js`, { headers: headers }), env, null, handlerRef, fRef2.session);
  assert.equal(asset.status, 200);
  assert.equal(await asset.text(), 'dashboard');
  assert.equal(asset.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(assets, 1);
  assert.equal((await moduleRef.handleRequest(new Request(`${env.ADMIN_ORIGIN}/api/admin/session`, { headers: headers }), env, null, handlerRef, fRef2.session)).status, 200);
  assert.equal((await moduleRef.handleRequest(new Request(`${env.ADMIN_ORIGIN}/api/site`, { headers: headers }), env, null, handlerRef, fRef2.session)).status, 404);
  const aal1 = await fRef2.token({ aal: 'aal1' });
  const cookie = (await fRef2.session.seal({ accessToken: aal1, refreshToken: 'test-refresh', signedInAt: Date.now() }, fRef2.env)).split(';')[0];
  assert.equal((await moduleRef.handleRequest(new Request(`${env.ADMIN_ORIGIN}/assets/dashboard.js`, { headers: { Cookie: cookie } }), env, null, handlerRef, fRef2.session)).status, 403);
  assert.equal((await moduleRef.handleRequest(new Request(`${env.ADMIN_ORIGIN}/api/admin/session`, { headers: { Cookie: cookie } }), env, null, handlerRef, fRef2.session)).status, 403);
  assert.equal(assets, 1);
  const pending = (await fRef2.session.seal({ accessToken: aal1, refreshToken: 'pending-refresh',
    signedInAt: Date.now(), emailChallenge: 'pending' }, env)).split(';')[0];
  assert.equal((await moduleRef.handleRequest(new Request(`${env.ADMIN_ORIGIN}/assets/dashboard.js`, {
    headers: { Cookie: pending },
  }), env, null, handlerRef, fRef2.session)).status, 403);
  const verifiedEmail = (await fRef2.session.seal({ accessToken: aal1, refreshToken: 'email-refresh',
    signedInAt: Date.now(), emailChallenge: 'verified' }, env)).split(';')[0];
  assert.equal((await moduleRef.handleRequest(new Request(`${env.ADMIN_ORIGIN}/assets/dashboard.js`, {
    headers: { Cookie: verifiedEmail },
  }), env, null, handlerRef, fRef2.session)).status, 200);
  assert.equal((await moduleRef.handleRequest(new Request(`${env.ADMIN_ORIGIN}/api/admin/session`, {
    headers: { Cookie: verifiedEmail },
  }), env, null, handlerRef, fRef2.session)).status, 200);
  assert.equal(assets, 2);
});

testRef('a recovery session stays outside dashboard assets and API after TOTP', async () => {
  const f = await createAdminFixtureRef();
  const fRef3 = f;
  let assets = 0;
  const env = { ...fRef3.env, ASSETS: { fetch: () => { assets++; return new Response('dashboard'); } } };
  const handler = createApiRef({ fetcher: fRef3.fetcher });
  const handlerRef2 = handler;
  const cookie = (await fRef3.session.seal({ accessToken: fRef3.accessToken,
    refreshToken: 'recovery-refresh', signedInAt: Date.now(), recovery: true }, env)).split(';')[0];
  const headers = { Cookie: cookie };
  assert.equal((await moduleRef.handleRequest(new Request(`${env.ADMIN_ORIGIN}/assets/dashboard.js`, {
    headers: headers,
  }), env, null, handlerRef2, fRef3.session)).status, 403);
  assert.equal((await moduleRef.handleRequest(new Request(`${env.ADMIN_ORIGIN}/api/admin/session`, {
    headers: headers,
  }), env, null, handlerRef2, fRef3.session)).status, 403);
  assert.equal(assets, 0);
});

testRef('an expired access token refreshes once before serving a protected dashboard asset', async () => {
  const f = await createAdminFixtureRef();
  const fRef4 = f;
  const expired = await fRef4.token({ exp: Math.floor(Date.now() / 1000) - 1 });
  const cookie = (await fRef4.session.seal({ accessToken: expired, refreshToken: 'old-refresh',
    signedInAt: Date.now() }, fRef4.env)).split(';')[0];
  let refreshes = 0, assets = 0;
  const env = { ...fRef4.env, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_isolated-test',
    ASSETS: { fetch: () => { assets++; return new Response('dashboard'); } } };
  const auth = createAdminAuthRef({ session: fRef4.session, clientFactory: () => ({ auth: {
    refreshSession: async () => { refreshes++; return { data: { session: {
      access_token: fRef4.accessToken, refresh_token: 'new-refresh',
    } }, error: null }; },
  } }) });
  const authRef = auth;
  const response = await moduleRef.handleRequest(new Request(`${env.ADMIN_ORIGIN}/assets/dashboard.js`, {
    headers: { Cookie: cookie },
  }), env, null, undefined, fRef4.session, authRef);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'dashboard');
  assert.ok(response.headers.get('Set-Cookie'));
  assert.equal(refreshes, 1);
  assert.equal(assets, 1);
});

testRef('backup enrollment returns the refreshed cookie and preserves private page headers', async () => {
  const f = await createAdminFixtureRef();
  const fRef5 = f;
  const expired = await fRef5.token({ exp: Math.floor(Date.now() / 1000) - 1 });
  const cookie = (await fRef5.session.seal({ accessToken: expired, refreshToken: 'old-refresh',
    signedInAt: Date.now() }, fRef5.env)).split(';')[0];
  let refreshes = 0;
  const env = { ...fRef5.env, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_isolated-test' };
  const auth = createAdminAuthRef({ session: fRef5.session, clientFactory: () => ({ auth: {
    refreshSession: async () => { refreshes++; return { data: { session: {
      access_token: fRef5.accessToken, refresh_token: 'new-refresh',
    } }, error: null }; },
  } }) });
  const authRef2 = auth;
  const response = await moduleRef.handleRequest(new Request(`${env.ADMIN_ORIGIN}/auth/backup`, {
    headers: { Cookie: cookie },
  }), env, null, undefined, fRef5.session, authRef2);
  assert.equal(response.status, 200);
  assert.equal(refreshes, 1);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.match(response.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
  const renewedCookie = response.headers.get('Set-Cookie');
  assert.ok(renewedCookie);
  const identity = await fRef5.session.verify(new Request(`${env.ADMIN_ORIGIN}/auth/enroll`, {
    headers: { Cookie: renewedCookie.split(';')[0] },
  }), env);
  assert.equal(identity.refreshToken, 'new-refresh');
});

testRef('native async resend and enrollment buttons reenable after success and failure', async () => {
  for (const id of ['resend-code', 'enroll']) for (const success of [true, false]) {
    const f = await authPageFixtureRef(async () => Response.json(success
      ? { message: 'Sent', factorId: 'new-factor', secret: 'fixture-secret' }
      : { message: 'Try again' }, { status: success ? 200 : 503 }));
    const fRef6 = f;
    const pending = fRef6.dispatch(id);
    assert.equal(fRef6.element(id).disabled, true);
    await pending;
    assert.equal(fRef6.element(id).disabled, false);
    if (!success) assert.equal(fRef6.element('message').textContent, 'Try again');
    await fRef6.dispatch(id);
    assert.equal(fRef6.element(id).disabled, false);
  }
});

testRef('MFA verifies the selected recovery factor and a newly enrolled factor', async () => {
  const calls = [];
  const f = await authPageFixtureRef(async (path, options) => {
    calls.push({ path, body: JSON.parse(options.body) });
    return Response.json(path === '/auth/enroll' ? { factorId: 'new-factor', secret: 'fixture-secret' }
      : path === '/auth/challenge' ? { challengeId: 'challenge' } : { stage: 'password' });
  });
  const fRef7 = f;
  fRef7.stage({ stage: 'challenge', factors: [{ id: 'first' }, { id: 'second' }] });
  fRef7.element('factor').value = 'second';
  fRef7.element('code').value = '123456';
  await fRef7.dispatch('mfa', 'submit');
  assert.equal(calls[0].body.factorId, 'second');
  assert.equal(calls[1].body.factorId, 'second');
  fRef7.stage({ stage: 'enroll', factors: [] });
  await fRef7.dispatch('enroll');
  await fRef7.dispatch('mfa', 'submit');
  assert.equal(calls[3].body.factorId, 'new-factor');
  assert.equal(calls[4].body.factorId, 'new-factor');
});
