# Admin Authentication and Private Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve only the login and recovery pages to unauthenticated visitors of `admin.ahmad-makatreh.vip`; require password and TOTP before serving the dashboard files or API.

**Architecture:** Keep one repository and D1 database. Build the public React site and admin React app separately. A dedicated admin Worker runs before every admin asset, handles Supabase Auth and serves the existing admin API; the public Worker retains asset-first routing and rejects admin API requests.

**Tech Stack:** Existing React 19, Vite 8, Cloudflare Workers/Wrangler 4, D1 and `jose`; Supabase Auth via `@supabase/supabase-js`, with Brevo SMTP for recovery mail. Confirm Worker compatibility before adding the Auth dependency.

**Spec:** `docs/superpowers/specs/2026-10-14-admin-auth-and-private-assets-design.md`

## ملخص للمالك

1. نفصل ملفات الموقع العام وملفات اللوحة داخل المشروع نفسه.
2. نمنع تنزيل ملفات اللوحة وطلب بياناتها قبل الدخول، ونبقي صفحة دخول صغيرة متاحة.
3. نضيف كلمة المرور ورمز تطبيق التحقق وجلسة لا تتجاوز 8 ساعات.
4. نجهز استعادة كلمة المرور وعامل تحقق احتياطيًا دون طريق يتجاوز التحقق.
5. نختبر ذلك على نسخة معزولة، ثم ننقل نطاق الإدارة بعد نجاح الاختبارات؛ يبقى الموقع العام يعمل أثناء التجهيز.

## Global Constraints

- Keep the dashboard source in `client/src/admin/`; preserve its features and `/api/admin/*` JSON contracts.
- Public `ahmad-makatreh.vip` stays asset-first. Admin Worker alone uses `assets.run_worker_first: true`.
- The dashboard and admin API require a verified Supabase JWT with exact issuer, audience, allowed `sub`, expiry and `aal2`; first-factor setup alone grants no access.
- Admin cookies are host-only `__Host-` cookies with `Secure; HttpOnly; SameSite=Strict; Path=/`. No access or refresh token in browser JavaScript or localStorage; the Auth client uses the Supabase publishable key, never its Storage secret key.
- Supabase access JWT expires after 15 minutes; admin session has an enforced absolute limit of 8 hours. Refresh only on actual use, never by polling.
- Keep Origin and CSRF checks for writes; fail closed when auth configuration is absent. Auth and asset checks use zero D1 operations.
- Keep existing uncommitted changes, production resources and deployment intact until isolated checks pass. No real secrets in files, tests, logs or chat; no commit or push without a user request.

## Review Focus

1. A direct request for a known or stale admin chunk on the public hostname must not return dashboard code; Task 1 tests both builds and Task 2 tests routing.
2. Unauthenticated HTML navigation, asset GET and `/api/admin/session` must never receive dashboard HTML or data; Task 2 tests all three.
3. An `aal1` session, valid JWT for another `sub`, expired JWT or missing signing configuration must fail before any asset or D1 work; Task 2 tests each.
4. Concurrent refreshes must not rotate one refresh token into conflicting cookies, and failed writes must not be replayed automatically; Task 3 tests both.
5. Password reset must not bypass TOTP, and losing both factors must not expose a public bypass; Task 4 tests recovery and permission boundaries.

---

### Task 1: Separate the two build artifacts

**Files:** Modify `client/src/main.jsx`, `client/package.json`; create `client/admin/index.html`, `client/src/admin/main.jsx`, `client/vite.admin.config.js`, `client/tests/adminBuild.test.js`.

**Interfaces:** `npm run build` produces `client/dist` with only the public site. `npm run build:admin` produces `client/dist-admin` with `index.html` and dashboard assets. `admin.localhost` development behavior remains available through the existing development branch until an equivalent local admin entry is verified.

- [ ] Add `adminBuild.test.js`: run both builds and assert public output has no admin entry/chunks or dashboard-only strings, admin output has an entry and all current dashboard tabs, and sourcemaps are absent.
- [ ] Run `node --test tests/adminBuild.test.js` from `client/`; expect failure with the current shared build.
- [ ] Make production `main.jsx` import only the public app; add the separate admin entry/config and the `build:admin` script. Keep output directories separate and do not copy admin files into `dist`.
- [ ] Run the targeted test, `npm run build`, `npm run build:admin`, `node --test tests/admin.test.js`, and `npm run lint`; require all new checks to pass.

### Task 2: Gate every admin asset and the existing API

**Files:** Create `client/admin-worker.js`, `client/wrangler.admin.jsonc`, `client/tests/adminWorker.test.js`; modify `client/worker.js`, `server/cloudflare/src/adminAccess.js`, `server/cloudflare/tests/adminAccess.test.js`, `server/cloudflare/tests/helpers/adminFixtures.js` and the admin-authenticated runtime fixtures found by `rg 'Cf-Access-Jwt-Assertion' server/cloudflare/tests`.

**Interfaces:** `sealAdminSession({ accessToken, refreshToken, signedInAt }, env)` produces a host-only Cookie; `verifyAdminSession(request, env)` in `adminAccess.js` returns a verified identity or an HTTP denial. The existing `createAdminAccess().authenticate` uses it. `admin-worker.js` applies verification before `env.ASSETS.fetch` and sends `/api/admin/*` to the existing `createApi()` handler. Until Task 3 adds login, unauthenticated admin requests fail closed. Other `/api/*` paths return 404 on the admin host.

- [ ] Add tests for absent/incorrect host, root and deep-link navigations, direct current/stale asset paths, admin API, `aal1`, wrong `sub`, expired/tampered JWT, missing config, and zero D1 calls on denial. Before Task 3, assert that no admin content is public.
- [ ] Run the targeted worker and access tests; expect failure with the current asset-first/Access behavior.
- [ ] Configure admin assets with `run_worker_first: true`, fail-closed host and path checks, no shared cache for protected responses, and asset delivery only after `verifyAdminSession`. Keep the public Worker asset-first and return 404 for every admin API path.
- [ ] Reuse `jose` to seal the cookie and validate the Supabase ES256 JWKS with bounded key caching and exact claims. Replace Access JWT verification inside `adminAccess.js` while preserving its session and mutation interfaces for `admin.js`; update all affected test fixtures rather than bypassing authentication.
- [ ] Run targeted tests and Wrangler dry-run for both Workers. Inspect that no protected asset is served by the public Worker or before authentication.

### Task 3: Add password, TOTP and bounded sessions

**Files:** Create `server/cloudflare/src/adminAuth.js`, `client/adminAuthPage.js`, `server/cloudflare/tests/adminAuth.test.js`; modify `client/admin-worker.js`, `server/cloudflare/src/adminAccess.js`, `client/src/admin/AdminApp.jsx`, `client/src/admin/adminApi.js`, configuration examples and focused client tests. Add `@supabase/supabase-js` to `server/cloudflare/package.json` and its lock file after checking Worker compatibility and current dependencies.

**Interfaces:** `createAdminAuth({ fetcher, now }).handle(request, env)` handles `/auth/login`, `/auth/enroll`, `/auth/challenge`, `/auth/verify`, `/auth/refresh` and `/auth/logout`. It seals Supabase access/refresh tokens and sign-in time in host-only cookies. The existing `/api/admin/session` still returns `{ email, csrfToken }` after `aal2`.

- [ ] Add tests for an allowlisted pre-created Auth user, wrong password, first TOTP enrollment, correct/incorrect code, second factor enrollment only at `aal2`, eight-hour absolute expiry, fifteen-minute access expiry, logout, CSRF and Origin rejection, rate limiting and no D1 queries for auth.
- [ ] Run `node --test tests/adminAuth.test.js tests/adminAccess.test.js` from `server/cloudflare/`; expect failure.
- [ ] Implement Worker-side Supabase Auth calls with a new per-request client, the sealed session cookie from Task 2, no browser token exposure, and a login/MFA page styled from existing admin colors. Provisioning uses the owner's Auth user UUID (`ADMIN_ALLOWED_SUB`) rather than email-only authorization; disable public signup in the Supabase project before release.
- [ ] Make refresh single-flight in the browser and safe under concurrent Worker requests. Retry only safe reads after an expired session; for writes show an explicit session-expired error and let the user decide whether to resubmit. Replace the Access-specific logout link and wording only where the new flow requires it.
- [ ] Run the new and existing admin API/client tests, `npm run build:admin`, `npm run lint`, and Workers dry-run. Verify the browser's storage contains no auth tokens and the login page loads no dashboard chunk.

### Task 4: Recovery without an MFA bypass

**Files:** Extend `server/cloudflare/src/adminAuth.js`, `client/adminAuthPage.js`, `server/cloudflare/tests/adminAuth.test.js`; update the focused deployment documentation.

**Interfaces:** `/auth/recover` requests a Supabase password-reset email with a redirect confined to the admin origin; `/auth/callback` verifies the one-time recovery link; `/auth/password` changes the password but never grants dashboard access without subsequent TOTP. The owner configures Brevo SMTP in Supabase outside source control.

- [ ] Add tests for nonexistent email indistinguishability, invalid/expired/replayed recovery link, open redirect rejection, password change followed by `aal1` denial, and no public route to remove MFA factors.
- [ ] Run the targeted test; expect failure.
- [ ] Implement recovery and a second TOTP enrollment path after `aal2`. Document manual owner recovery through the Supabase project account if both factors are lost; no application bypass endpoint.
- [ ] Run targeted auth tests and a local browser flow using a nonproduction Auth user and email sink. Do not send real test mail until the owner has configured Brevo SMTP and the receiving mailbox.

### Task 5: Integration, account setup and controlled cutover

**Files:** Modify only focused tests, `server/cloudflare/README.md` and `docs/cloudflare-integration-progress.md` if required by verified results. Update Wrangler bindings with verified resource IDs and secret **names**, never values.

**Interfaces:** Public Worker serves `ahmad-makatreh.vip`; admin Worker serves `admin.ahmad-makatreh.vip`. Both use the existing production D1 where needed, but only admin Worker can serve the admin shell and API. Keep the prior deployment ID for rollback.

- [ ] Run the complete client and Workers suites, both Vite builds, Wrangler dry-runs, lint and `git diff --check`; review scoped diff, debug output, secrets and pre-existing changes.
- [ ] In an isolated preview, test unauthenticated and authenticated network responses for every admin page and asset, all dashboard tabs, session refresh, logout/back button, recovery, a booking, public content and media. Record requests and D1 reads/writes; do not load-test production.
- [ ] Have the owner create/confirm the Auth user, disable public signup, set the Supabase JWT lifetime to 900 seconds, register two TOTP factors, and verify Brevo SMTP reset-mail receipt. Verify secret presence and exact `sub` without displaying credentials.
- [ ] Switch the admin custom domain only after the preview passes. Then recheck direct asset URLs on both hosts, dashboard API authorization, the public site and rollback readiness. Record measured results; do not claim full production readiness from local tests alone.
