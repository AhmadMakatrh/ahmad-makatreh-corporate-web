// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { createApi as createApiRef } from '../src/index.js';
import { createSupabaseHeartbeat as createSupabaseHeartbeatRef } from '../src/supabaseHeartbeat.js';

const origin = 'https://kghmejpjvbmcivnlnkgf.supabase.co';
const originRef = origin;
const secretKey = 'sb_secret_test-key';
const secretKeyRef = secretKey;
// codeguard:components:end

testRef('Supabase heartbeat calls a read-only RPC with the server secret key', async () => {
  let call;
  const heartbeat = createSupabaseHeartbeatRef({ fetcher: async (url, options) => {
    call = { url: String(url), options };
    return Response.json(true);
  } });
  const heartbeatRef = heartbeat;

  await heartbeatRef({ SUPABASE_URL: originRef, SUPABASE_SECRET_KEY: secretKeyRef });

  assert.equal(call.url, `${originRef}/rest/v1/rpc/project_heartbeat`);
  assert.equal(call.options.method, 'POST');
  assert.equal(call.options.headers.apikey, secretKeyRef);
  assert.equal(call.options.headers['Content-Type'], 'application/json');
  assert.equal(call.options.body, '{}');
  assert.equal(call.options.redirect, 'error');
  assert.ok(call.options.signal instanceof AbortSignal);
});

testRef('Supabase heartbeat rejects unsafe configuration and failed responses without exposing key', async () => {
  let calls = 0;
  const heartbeat = createSupabaseHeartbeatRef({ fetcher: async () => { calls++; return new Response('upstream detail', { status: 500 }); } });
  const heartbeatRef2 = heartbeat;

  await assert.rejects(heartbeatRef2({ SUPABASE_URL: 'https://attacker.test', SUPABASE_SECRET_KEY: secretKeyRef }), /configuration/i);
  await assert.rejects(heartbeatRef2({ SUPABASE_URL: originRef, SUPABASE_SECRET_KEY: 'sb_publishable_do-not-use' }), /configuration/i);
  await assert.rejects(heartbeatRef2({ SUPABASE_URL: originRef, SUPABASE_SECRET_KEY: secretKeyRef }), /500/);
  assert.equal(calls, 1);
});

testRef('three-hour scheduled heartbeat does not query D1 and six-hour cleanup does not ping Supabase', async () => {
  const calls = [];
  const db = {
    prepare(sql) {
      calls.push({ kind: 'd1', sql });
      return { bind() { return this; } };
    },
    async batch(statements) { return statements.map(() => ({ meta: { changes: 0 } })); },
  };
  const dbRef = db;
  const api = createApiRef({ fetcher: async (url, options) => {
    calls.push({ kind: 'supabase', url: String(url), options });
    return Response.json(true);
  } });
  const apiRef = api;
  const env = { DB: dbRef, SUPABASE_URL: originRef, SUPABASE_SECRET_KEY: secretKeyRef };

  await apiRef.scheduled({ cron: '0 */3 * * *', scheduledTime: new Date('2026-10-14T03:00:00Z') }, env);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].kind, 'supabase');

  calls.length = 0;
  await apiRef.scheduled({ cron: '0 */6 * * *', scheduledTime: new Date('2026-10-14T06:00:00Z') }, env);
  assert.equal(calls.filter(call => call.kind === 'supabase').length, 0);
  assert.equal(calls.filter(call => call.kind === 'd1').length, 2);
});
