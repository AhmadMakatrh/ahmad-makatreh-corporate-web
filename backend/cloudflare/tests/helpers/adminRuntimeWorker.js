// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { createApi as createApiRef } from '../../src/index.js';

let api;
const counters = { emails: 0, jwks: 0, lifetimes: 0 };
const countersRef = counters;
// codeguard:components:end

export default {
  async fetch(request, env, ctx) {
    if (new URL(request.url).pathname === '/__test/counters') return Response.json(countersRef);
    api ??= createApiRef({ fetcher: async (url, options) => {
      if (String(url) === `${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`) {
        countersRef.jwks++; return Response.json(env.TEST_PUBLIC_JWKS);
      }
      if (String(url) === 'https://api.brevo.com/v3/smtp/email' && options.method === 'POST' && options.redirect === 'manual') {
        countersRef.emails++; return Response.json({ messageId: 'isolated-runtime-acceptance' });
      }
      throw new Error('Unexpected test outbound request.');
    } });
    return api.fetch(request, env, { waitUntil(promise) { countersRef.lifetimes++; ctx.waitUntil(promise); } });
  },
};
