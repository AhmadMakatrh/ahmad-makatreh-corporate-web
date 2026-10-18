// codeguard:components:start
// codeguard:defines: createAdminAuth
import { createClient as createClientRef } from '@supabase/supabase-js';
import { readJson as parseJsonRequest } from './httpJson.js';
import { clearAdminSessionCookie as clearAdminSessionCookieRef, createAdminSession as makeAdminSession } from './adminSession.js';

const reply = (body, status = 200, headers = {}) => Response.json(body, { status, headers: {
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers,
} });
const respond = reply;
const failure = (message, status = 400) => respond({ message }, status);
const fail = failure;
const cookieFrom = value => value.split(';')[0];
const sessionCookie = cookieFrom;

export function createAdminAuth({ fetcher = fetch, now = Date.now, clientFactory, session = makeAdminSession({ fetcher, now }) } = {}) {
  const verifiedCookieRef = verifiedCookie;
  const refreshStoredRef = refreshStored;
  const clearedCookiesRef = clearedCookies;
  const boundClientRef = boundClient;

  const makeClient = clientFactory ?? (env => createClientRef(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { fetch: fetcher },
  }));
  const makeClientRef = makeClient;
  const pendingRefreshes = new Map();

  async function verifiedCookie(tokens, signedInAt, env, { allowAal1 = false, recovery = false, emailChallenge = null } = {}) {
    if (typeof tokens?.access_token !== 'string' || typeof tokens?.refresh_token !== 'string') return null;
    const cookie = await session.seal({ accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token, signedInAt, recovery, emailChallenge }, env);
    const identity = await session.verify(new Request(`${env.ADMIN_ORIGIN}/auth/status`, {
      headers: { Cookie: sessionCookie(cookie) },
    }), env, { allowAal1, allowRecovery: recovery });
    if (identity instanceof Response) return null;
    return { cookie, identity };
  }

  async function refreshStored(stored, env) {
    const key = `${env.SUPABASE_URL}:${stored.refreshToken}`;
    let pending = pendingRefreshes.get(key);
    if (!pending) {
      pending = makeClientRef(env).auth.refreshSession({ refresh_token: stored.refreshToken })
        .then(result => result.error ? null : result.data.session)
        .finally(() => pendingRefreshes.delete(key));
      pendingRefreshes.set(key, pending);
    }
    const tokens = await pending;
    if (!tokens) return null;
    return verifiedCookieRef(tokens, stored.signedInAt, env,
      { allowAal1: true, recovery: stored.recovery === true, emailChallenge: stored.emailChallenge });
  }

  function clearedCookies(status, body) {
    const headers = new Headers({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    if (body) headers.set('Content-Type', 'application/json');
    headers.append('Set-Cookie', clearAdminSessionCookieRef());
    headers.append('Set-Cookie', '__Host-AdminAntiforgery=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0');
    return new Response(body ? JSON.stringify(body) : null, { status, headers: headers });
  }

  async function boundClient(request, env, { allowAal1 = true, allowRecovery = false } = {}) {
    const identity = await session.verify(request, env, { allowAal1, allowRecovery });
    if (identity instanceof Response) return identity;
    const client = makeClientRef(env);
    const clientRef = client;
    const loaded = await clientRef.auth.setSession({ access_token: identity.accessToken,
      refresh_token: identity.refreshToken });
    if (loaded.error) return fail('انتهت الجلسة. سجل الدخول مجددًا.', 401);
    return { client: clientRef, identity };
  }

  return {
    async refreshForAsset(request, env) {
      const stored = await session.read(request, env);
      if (stored instanceof Response) return stored;
      if (stored.recovery === true) return fail('Administrator permission is required.', 403);
      if (!env.SUPABASE_PUBLISHABLE_KEY) return fail('الدخول غير مهيأ.', 503);
      try {
        const renewed = await refreshStoredRef(stored, env);
        if (!renewed) return fail('انتهت الجلسة. سجل الدخول مجددًا.', 401);
        if (renewed.identity.emailChallenge === 'pending'
          || renewed.identity.aal !== 'aal2' && renewed.identity.emailChallenge !== 'verified')
          return fail('Administrator permission is required.', 403);
        return renewed;
      } catch { return fail('تعذر الاتصال بخدمة الدخول. حاول مجددًا.', 503); }
    },
    async handle(request, env) {
      const url = new URL(request.url);
      if (!env.ADMIN_ORIGIN || url.origin !== env.ADMIN_ORIGIN) return fail('Not found.', 404);
      if (typeof env.SUPABASE_PUBLISHABLE_KEY !== 'string' || !env.SUPABASE_PUBLISHABLE_KEY
        || typeof env.ADMIN_LOGIN_RATE_LIMITER?.limit !== 'function') return fail('الدخول غير مهيأ.', 503);
      const route = url.pathname;
      if (route === '/auth/status' && request.method === 'GET') {
        try {
          let identity = await session.verify(request, env, { allowAal1: true, allowRecovery: true });
          let cookie;
          if (identity instanceof Response && identity.status === 401) {
            const stored = await session.read(request, env);
            if (!(stored instanceof Response)) {
              const renewed = await refreshStoredRef(stored, env);
              if (renewed) ({ identity, cookie } = renewed);
            }
          }
          if (identity instanceof Response) return identity;
          const headers = cookie ? { 'Set-Cookie': cookie } : {};
          if (identity.emailChallenge === 'pending') return respond({ stage: 'email-code', email: identity.email }, 200, headers);
          if (identity.aal === 'aal2' || identity.emailChallenge === 'verified')
            return respond({ stage: identity.recovery ? 'password' : 'ready',
            email: identity.email }, 200, headers);
          if (!identity.recovery) return respond({ stage: 'login' }, 200, headers);
          const client = makeClientRef(env);
          const clientRef2 = client;
          const loaded = await clientRef2.auth.setSession({ access_token: identity.accessToken,
            refresh_token: identity.refreshToken });
          if (loaded.error) return fail('انتهت الجلسة. سجل الدخول مجددًا.', 401);
          const factors = await clientRef2.auth.mfa.listFactors();
          if (factors.error) return fail('تعذر تحميل عوامل التحقق.', 503);
          if (identity.recovery && !factors.data.totp?.length && factors.data.all?.some(item => item.status === 'verified'))
            return fail('لا يوجد تطبيق تحقق متاح لهذا الحساب.', 403);
          return respond({ stage: factors.data.totp?.length ? 'challenge' : identity.recovery ? 'password' : 'enroll',
            factors: (factors.data.totp ?? []).map(({ id }) => ({ id })) }, 200, headers);
        } catch { return fail('تعذر الاتصال بخدمة الدخول. حاول مجددًا.', 503); }
      }
      if (request.method !== 'POST') return fail('Method not allowed.', 405);
      const fetchSite = request.headers.get('Sec-Fetch-Site');
      if (request.headers.get('Origin') !== env.ADMIN_ORIGIN || fetchSite !== null && fetchSite !== 'same-origin')
        return fail('مصدر الطلب غير مسموح.', 403);
      if (route !== '/auth/logout') {
        const limited = await env.ADMIN_LOGIN_RATE_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') ?? 'unknown' });
        if (limited.success !== true) return respond({ message: 'محاولات كثيرة. انتظر دقيقة ثم أعد المحاولة.' }, 429, { 'Retry-After': '60' });
      }
      const contentType = (request.headers.get('Content-Type') ?? '').split(';')[0].toLowerCase();
      if (contentType !== 'application/json') return fail('بيانات الطلب غير صالحة.', 415);
      const parsed = await parseJsonRequest(request, 4096);
      if (parsed.oversized) return fail('الطلب كبير جدًا.', 413);
      const body = parsed.value;
      if (parsed.invalid || !body || typeof body !== 'object' || Array.isArray(body)) return fail('بيانات الطلب غير صالحة.');
      try {
        if (route === '/auth/login') {
          if (typeof body.email !== 'string' || body.email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)
            || typeof body.password !== 'string' || !body.password || body.password.length > 1024) return fail('بيانات الدخول غير صحيحة.', 401);
          const client = makeClientRef(env);
          const clientRef3 = client;
          const { data, error } = await clientRef3.auth.signInWithPassword({ email: body.email, password: body.password });
          if (error || data.user?.id !== env.ADMIN_ALLOWED_SUB) return fail('بيانات الدخول غير صحيحة.', 401);
          const sealed = await verifiedCookieRef(data.session, now(), env,
            { allowAal1: true, emailChallenge: 'pending' });
          if (!sealed) return fail('تعذر التحقق من الجلسة.', 401);
          const sent = await clientRef3.auth.signInWithOtp({ email: sealed.identity.email,
            options: { shouldCreateUser: false } });
          if (sent.error) return fail('تعذر إرسال رمز الدخول إلى البريد. حاول مجددًا.', 503);
          return respond({ stage: 'email-code', email: sealed.identity.email }, 200,
            { 'Set-Cookie': sealed.cookie });
        }
        if (route === '/auth/email-resend' || route === '/auth/email-verify') {
          const stored = await session.read(request, env);
          if (stored instanceof Response) return stored;
          if (stored.recovery === true || stored.emailChallenge !== 'pending')
            return fail('ابدأ تسجيل الدخول أولًا.', 403);
          let bound = await boundClientRef(request, env);
          let renewedCookie;
          if (bound instanceof Response && bound.status === 401) {
            const renewed = await refreshStoredRef(stored, env);
            if (!renewed) return bound;
            const client = makeClientRef(env);
            const clientRef4 = client;
            const loaded = await clientRef4.auth.setSession({ access_token: renewed.identity.accessToken,
              refresh_token: renewed.identity.refreshToken });
            if (loaded.error) return fail('انتهت الجلسة. سجل الدخول مجددًا.', 401);
            bound = { client: clientRef4, identity: renewed.identity };
            renewedCookie = renewed.cookie;
          }
          if (bound instanceof Response) return bound;
          const reject = (message, status) => respond({ message }, status,
            renewedCookie ? { 'Set-Cookie': renewedCookie } : {});
          const rejectRef = reject;
          if (route === '/auth/email-resend') {
            const sent = await bound.client.auth.signInWithOtp({ email: bound.identity.email,
              options: { shouldCreateUser: false } });
            return sent.error ? rejectRef('تعذر إعادة إرسال الرمز. حاول لاحقًا.', 503)
              : respond({ message: 'أُرسل رمز جديد إلى بريدك.' }, 200,
                renewedCookie ? { 'Set-Cookie': renewedCookie } : {});
          }
          if (typeof body.code !== 'string' || !/^\d{6}$/.test(body.code))
            return rejectRef('أدخل رمز البريد المكون من 6 أرقام.', 400);
          const verified = await bound.client.auth.verifyOtp({ email: bound.identity.email,
            token: body.code, type: 'email' });
          if (verified.error || verified.data?.user?.id !== env.ADMIN_ALLOWED_SUB
            || typeof verified.data.user.email !== 'string'
            || verified.data.user.email.toLowerCase() !== bound.identity.email.toLowerCase())
            return rejectRef('رمز البريد غير صحيح أو منتهي.', 401);
          const sealed = await verifiedCookieRef(verified.data.session, bound.identity.signedInAt, env,
            { allowAal1: true, emailChallenge: 'verified' });
          return sealed && sealed.identity.email.toLowerCase() === bound.identity.email.toLowerCase()
            ? respond({ stage: 'ready' }, 200, { 'Set-Cookie': sealed.cookie })
            : rejectRef('تعذر التحقق من الجلسة.', 401);
        }
        if (route === '/auth/recover') {
          if (typeof body.email !== 'string' || body.email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email))
            return fail('أدخل بريدًا إلكترونيًا صالحًا.');
          const result = await makeClientRef(env).auth.resetPasswordForEmail(body.email,
            { redirectTo: `${env.ADMIN_ORIGIN}/auth/callback` });
          if (result.error) return fail('تعذر إرسال رسالة الاستعادة. حاول مجددًا.', 503);
          return respond({ message: 'إذا كان البريد مسجلاً، ستصلك رسالة للاستعادة.' });
        }
        if (route === '/auth/callback' || route === '/auth/recovery-code') {
          const byCode = route === '/auth/recovery-code';
          if (byCode) {
            if (typeof body.email !== 'string' || body.email.length > 254
              || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)
              || typeof body.token !== 'string' || !/^\d{6}$/.test(body.token)) return fail('رمز الاستعادة غير صالح.');
          } else if (body.type !== 'recovery' || typeof body.token_hash !== 'string'
            || !/^[A-Za-z0-9_-]{1,256}$/.test(body.token_hash)) return fail('رابط الاستعادة غير صالح.');
          const params = byCode ? { email: body.email, token: body.token, type: 'recovery' }
            : { token_hash: body.token_hash, type: 'recovery' };
          const result = await makeClientRef(env).auth.verifyOtp(params);
          if (result.error || result.data?.user?.id !== env.ADMIN_ALLOWED_SUB)
            return fail(byCode ? 'رمز الاستعادة غير صالح أو منتهي.' : 'رابط الاستعادة غير صالح أو منتهي.', 401);
          const sealed = await verifiedCookieRef(result.data.session, now(), env, { allowAal1: true, recovery: true });
          if (!sealed) return fail('تعذر التحقق من الاستعادة.', 401);
          const client = makeClientRef(env);
          const clientRef5 = client;
          const loaded = await clientRef5.auth.setSession({ access_token: sealed.identity.accessToken,
            refresh_token: sealed.identity.refreshToken });
          if (loaded.error) return fail('انتهت الجلسة. سجل الدخول مجددًا.', 401);
          const factors = await clientRef5.auth.mfa.listFactors();
          if (factors.error) return fail('تعذر تحميل عوامل التحقق.', 503);
          if (!factors.data.totp?.length && factors.data.all?.some(item => item.status === 'verified'))
            return fail('لا يوجد تطبيق تحقق متاح لهذا الحساب.', 403);
          return respond({ stage: factors.data.totp?.length ? 'challenge' : 'password',
            factors: (factors.data.totp ?? []).map(({ id }) => ({ id })) }, 200, { 'Set-Cookie': sealed.cookie });
        }
        if (route === '/auth/password') {
          const stored = await session.read(request, env);
          if (stored instanceof Response) return stored;
          if (stored.recovery !== true) return fail('رابط الاستعادة مطلوب.', 403);
          let bound = await boundClientRef(request, env, { allowRecovery: true });
          let renewedCookie;
          if (bound instanceof Response && bound.status === 401) {
            const renewed = await refreshStoredRef(stored, env);
            if (!renewed) return bound;
            const client = makeClientRef(env);
            const clientRef6 = client;
            const loaded = await clientRef6.auth.setSession({ access_token: renewed.identity.accessToken,
              refresh_token: renewed.identity.refreshToken });
            if (loaded.error) return fail('انتهت الجلسة. سجل الدخول مجددًا.', 401);
            bound = { client: clientRef6, identity: renewed.identity };
            renewedCookie = renewed.cookie;
          }
          if (bound instanceof Response) return bound;
          const reject = (message, status) => respond({ message }, status,
            renewedCookie ? { 'Set-Cookie': renewedCookie } : {});
          const rejectRef2 = reject;
          if (bound.identity.aal !== 'aal2') {
            const factors = await bound.client.auth.mfa.listFactors();
            if (factors.error) return rejectRef2('تعذر تحميل عوامل التحقق.', 503);
            if (factors.data.all?.some(item => item.status === 'verified'))
              return rejectRef2('أدخل رمز تطبيق التحقق أولًا.', 403);
          }
          if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 1024)
            return rejectRef2('اختر كلمة مرور من 12 حرفًا على الأقل.', 400);
          const changed = await bound.client.auth.updateUser({ password: body.password });
          if (changed.error) return rejectRef2('تعذر تغيير كلمة المرور.', 503);
          const signedOut = await bound.client.auth.signOut().catch(() => ({ error: true }));
          return signedOut.error
            ? clearedCookiesRef(503, { stage: 'login', message: 'تم تغيير كلمة المرور، لكن تعذر تأكيد إنهاء الجلسة لدى خدمة الدخول.' })
            : clearedCookiesRef(200, { stage: 'login' });
        }
        if (route === '/auth/refresh') {
          const stored = await session.read(request, env);
          if (stored instanceof Response) return stored;
          const sealed = await refreshStoredRef(stored, env);
          return sealed ? respond({ stage: sealed.identity.recovery
            ? sealed.identity.aal === 'aal2' ? 'password' : 'challenge'
            : sealed.identity.emailChallenge === 'pending' ? 'email-code'
              : sealed.identity.aal === 'aal2' || sealed.identity.emailChallenge === 'verified' ? 'ready' : 'login' },
            200, { 'Set-Cookie': sealed.cookie })
            : fail('انتهت الجلسة. سجل الدخول مجددًا.', 401);
        }
        if (route === '/auth/logout') {
          const stored = await session.read(request, env);
          if (!(stored instanceof Response)) {
            const client = makeClientRef(env);
            const clientRef7 = client;
            const loaded = await clientRef7.auth.setSession({ access_token: stored.accessToken, refresh_token: stored.refreshToken });
            if (loaded.error) return fail('تعذر تسجيل الخروج. حاول مجددًا.', 503);
            const signedOut = await clientRef7.auth.signOut();
            if (signedOut.error) return fail('تعذر تسجيل الخروج. حاول مجددًا.', 503);
          }
          return clearedCookiesRef(204, null);
        }
        if (route === '/auth/enroll') {
          const bound = await boundClientRef(request, env);
          if (bound instanceof Response) return bound;
          if (bound.identity.emailChallenge === 'pending') return fail('أدخل رمز البريد أولًا.', 403);
          if (bound.identity.aal !== 'aal2' && bound.identity.emailChallenge !== 'verified')
            return fail('سجّل الدخول مجددًا.', 403);
          const factors = await bound.client.auth.mfa.listFactors();
          if (factors.error) return fail('تعذر تحميل عوامل التحقق.', 503);
          if (bound.identity.aal !== 'aal2' && factors.data.totp?.length) return fail('أدخل رمز التحقق الحالي أولًا.', 403);
          const enrolled = await bound.client.auth.mfa.enroll({ factorType: 'totp' });
          if (enrolled.error) return fail('تعذر إعداد تطبيق التحقق.', 503);
          return respond({ factorId: enrolled.data.id, secret: enrolled.data.totp?.secret });
        }
        if (route === '/auth/challenge' || route === '/auth/verify') {
          if (typeof body.factorId !== 'string' || body.factorId.length > 128 || !body.factorId) return fail('عامل التحقق غير صالح.');
          const bound = await boundClientRef(request, env, { allowRecovery: true });
          if (bound instanceof Response) return bound;
          if (bound.identity.emailChallenge === 'pending') return fail('أدخل رمز البريد أولًا.', 403);
          if (!bound.identity.recovery && bound.identity.aal !== 'aal2'
            && bound.identity.emailChallenge !== 'verified') return fail('سجّل الدخول مجددًا.', 403);
          if (route === '/auth/challenge') {
            const challenged = await bound.client.auth.mfa.challenge({ factorId: body.factorId });
            return challenged.error ? fail('تعذر بدء التحقق.', 401) : respond({ challengeId: challenged.data.id });
          }
          if (typeof body.challengeId !== 'string' || body.challengeId.length > 128
            || !/^\d{6}$/.test(body.code ?? '')) return fail('رمز التحقق غير صالح.');
          const verified = await bound.client.auth.mfa.verify({ factorId: body.factorId,
            challengeId: body.challengeId, code: body.code });
          if (verified.error) return fail('رمز التحقق غير صحيح.', 401);
          const sealed = await verifiedCookieRef(verified.data, bound.identity.signedInAt, env,
            { recovery: bound.identity.recovery });
          return sealed ? respond({ stage: bound.identity.recovery ? 'password' : 'ready' }, 200, { 'Set-Cookie': sealed.cookie })
            : fail('تعذر التحقق من الجلسة.', 401);
        }
        return fail('Not found.', 404);
      } catch {
        return fail('تعذر الاتصال بخدمة الدخول. حاول مجددًا.', 503);
      }
    },
  };
}
// codeguard:components:end
