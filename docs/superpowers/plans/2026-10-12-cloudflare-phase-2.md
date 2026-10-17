# Cloudflare Phase 2: Access and Inquiry Administration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Native execution in the current session is already selected. Steps use checkbox (`- [ ]`) syntax for tracking. Do not commit, push, change branches, or deploy without a current owner request.

**Goal:** Connect the existing inquiry administration contracts to a locally tested Workers/D1 implementation with Access authentication, CSRF, conditional updates, Brevo replies, and safe import/export.

**Architecture:** Extend the isolated API in `server/cloudflare/`; preserve `client/src/admin/`, the .NET reference implementation, and production routing. Authenticate before reading D1, use bounded prepared queries and atomic conditional writes, and insert a durable reply operation before making one email attempt. This phase does not create an Access application, DNS record, or cloud database.

**Tech Stack:** Existing JavaScript ESM, Node >=22, Wrangler 4.149.0/workerd, D1 SQLite, Web Crypto, Brevo HTTPS API; add `jose` 6.2.12 for JWT validation and signing because the current Workers dependencies provide no JWT/JWKS implementation.

**Spec:** `docs/superpowers/specs/2026-10-12-cloudflare-integration-design.md`, stage 2. Resume context: `docs/cloudflare-integration-progress.md` and completed phase-1 plan.

## Global Constraints

- الإدارة: `admin.ahmad-makatreh.vip`؛ يبقى مصدر الواجهة داخل `client/src/admin/`.
- تُحفظ عقود JSON وأسماء الحقول والحالات وHTTP status codes التي تستعملها الواجهة الحالية.
- لا يتطلب فتح الجلسة استعلام D1.
- لا polling ولا autosave ولا refresh API لكل render.
- لا caching لبيانات الإدارة في cache عام، ولا إعادة محاولة غير محدودة أو إعادة إرسال بريد غير مؤكدة.
- القوائم 25 عنصرًا افتراضيًا مع cursor وحد أعلى 100 للطلبات حيث يدعمه العقد؛ التاريخ والردود والوسائط صفحات من 25 عنصرًا.
- لا كلمات مرور أو مفاتيح في المحادثة أو المصدر. يدخل المالك بيانات الدخول والتحقق بنفسه، وتوضع أسرار التشغيل في إدارة الأسرار الخاصة بالخدمة.
- No changes to unrelated UI, .NET behavior, live bindings, real `.env`, or existing uncommitted work. Provider/session configuration examples contain names or empty values only.
- The existing booking limit stays **9/60 seconds**. Preserve the existing admin limits **120/60 seconds per authenticated email**, and replies **6/60 seconds per authenticated email**; Workers limits are approximate per Cloudflare location, not global counters.

## Review Focus

1. A public-host request, expired Access assertion, service identity, or missing configuration must not read D1 or expose a session; task 1 tests each case.
2. A rotated signing key or a cold burst must not cause a JWKS fetch for every action; task 1 tests shared retrieval, cooldown, and rejection on provider failure.
3. Old backups and equal creation times must retain exact UTC ordering and cursor precision; tasks 2 and 5 test .NET ticks, numeric backup statuses, Unicode, and repeat import.
4. Two saves with the same revision, including within one millisecond, must not both succeed; task 3 uses real concurrent D1 writes and monotonic update timestamps.
5. A timeout, disconnected browser, or repeated reply operation must not send the same email again or report unverified delivery; tasks 4 and 6 test atomic claiming and ambiguous completion.

## Inspected source and file boundaries

Read before execution: `server/src/AhmadMakatreh.Api/Security/AdminAccess.cs`, `Endpoints/AdminInquiryEndpoints.cs`, `Program.cs`, `AhmadMakatreh.Application/Models/AdminInquiryModels.cs`, `AhmadMakatreh.Domain/Entities/Inquiry.cs`, `InquiryReply.cs`, `Enums/InquiryStatus.cs`, and the PostgreSQL inquiry/reply repositories and `Notifications/MailKitReplySender.cs`. Paths after `Program.cs` are under their corresponding existing `server/src/` project directories.

Client consumers: `client/src/admin/adminApi.js`, `InquiryInbox.jsx`, `InquiryActions.jsx`, `InquiryBackupImporter.jsx`, `inquiryExport.js`, `AdminApp.jsx`. No new dashboard or login UI is needed. Client GET cache remains 60 seconds/max 40 entries, with shared in-flight requests and explicit invalidation.

New focused modules: `adminAccess.js` (identity/session/CSRF), `inquiryTime.js` (UTC and cursors), `adminInquiries.js` (query/update/backup storage), `inquiryReplies.js` (durable reply operations), and `admin.js` (authenticated routes). Extend `email.js` for the new provider operation. Extract only the existing bounded JSON reader into `httpJson.js` for the booking/admin consumers; retain booking's existing 64 KiB limit. All module paths below are within `server/cloudflare/src/` unless fully qualified.

## Contracts pinned from the actual source

| Endpoint under `/api/admin` | Request | Result / limits |
|---|---|---|
| `GET /session` | Access assertion | `{email,csrfToken}`; `AdminAntiforgery` cookie; zero D1 |
| `GET /inquiries` | search/category/status/notificationStatus/from/to/pageSize/cursor | `{items,nextCursor}`; default 25, range 1–100; select `pageSize+1`; no COUNT |
| `GET /inquiries/{id}` | GUID | Full inquiry, notes, `replyEnabled`; 404 if absent |
| `PATCH /inquiries/{id}/status` | `{status,expectedUpdatedAtUtc}` | `{id,status,updatedAtUtc}`; 409 if stale or absent |
| `PATCH /inquiries/{id}/notes` | `{notes,expectedUpdatedAtUtc}` | `{id,adminNotes,notesUpdatedBy,updatedAtUtc}`; notes <=10000 UTF-16 units; actor from verified email; 409 if stale or absent |
| `GET /inquiries/{id}/replies` | cursor | `{items,nextCursor}`; 25 plus one look-ahead; absent inquiry returns an empty page as in the source |
| `POST /inquiries/{id}/replies` | `{operationId,subject,body}` | Reply DTO; subject <=200, body <=10000 UTF-16 units; nonempty operation GUID; duplicate same payload 200, changed payload 409 |
| `POST /inquiries/export` | `{ids}` | 1–100 unique GUIDs; `{format:'ahmad-site-inquiries',version:1,exportedAtUtc,items}` |
| `POST /inquiries/import` | Same backup envelope | 0–100 records; `{imported,skipped}`; add missing IDs/references only; no emails or overwrite |

List/status/detail use names `New`, `Contacted`, `InProgress`, `Closed`, `Archived`. The source's default JSON serialization of the `Inquiry` entity uses numeric enum values **0–4 in backup items**; export/import must preserve that contract. Query/PATCH status strings also accept the source enum's numeric strings `0`–`4`. Do not silently convert backup status to a name.

Inquiry DTO keys: `id,referenceId,name,email,projectDetails,serviceKey,inquiryCategory,status,createdAtUtc,updatedAtUtc,notificationStatus,notificationAttemptedAtUtc,adminNotes,notesUpdatedBy`; detail additionally has `replyEnabled`. Summary excludes details/notes/notification-attempt timestamp. Reply DTO keys: `id,inquiryId,subject,body,actor,status,createdAtUtc,completedAtUtc` with status `pending,accepted,failed,unknown`.

The cursor is **decimal .NET DateTime ticks + '.' + GUID in N format**, not Base64. Ticks range 0–3155378975999999999 and require `BigInt`; do not round through a JavaScript Number. SQL ordering is creation UTC descending, then canonical GUID descending, matching PostgreSQL UUID ordering.

## Task 1: Verified Access session and mutation boundary

**Files:** Create `src/adminAccess.js`, `src/httpJson.js`, `tests/adminAccess.test.js`, `tests/helpers/adminFixtures.js`; modify `src/booking.js` only to reuse its extracted reader, `package.json`, lockfile, `.dev.vars.example`, and local `wrangler.jsonc`.

**Interfaces:**
- `readJson(request: Request, maxBytes = 65536): Promise<{value?:unknown,invalid?:true,oversized?:true}>` in `httpJson.js`; preserve the existing streamed-size/UTF-8/error behavior.
- `createAdminAccess({fetcher=fetch,now=Date.now}={}): {authenticate(request,env):Promise<AdminIdentity|Response>, session(request,env,identity):Promise<Response>, validateMutation(request,env,identity):Promise<Response|null>}`.
- `AdminIdentity` is `{email:string,origin:string}`; email is verified and compared case-insensitively. Preserve its claim value in responses/actors; normalize only limiter keys and CSRF identity comparisons. A Response is an early rejection.
- Test-only `createAdminFixture(): Promise<{env,accessToken,fetcher,jwksCalls}>` signs RSA tokens and serves public JWKS through the injected fetcher. Private signing keys exist only in the isolated test fixture; no production bypass or bearer fallback.

- [x] **Step 1: Add failing auth/session/CSRF tests.** Missing, malformed, oversized (>16384), multiple/comma-joined assertions, wrong signature/issuer/audience, missing exp, expired beyond 30-second skew, non-RS256, wrong email, and type other than `app` must fail. Signed valid claims grant only the configured admin origin. Every rejection and `/session` has zero D1 calls.

```js
const fixture = await createAdminFixture();
const access = createAdminAccess({ fetcher: fixture.fetcher });
const denied = await access.authenticate(new Request('https://ahmad-makatreh.vip/api/admin/session'), fixture.env);
assert.equal(denied.status, 404);
```

- [x] **Step 2: Run `node --test tests/adminAccess.test.js` from `server/cloudflare/`.** Expected RED: missing module/exports, then assertions for security behavior; do not disable checks to pass.
- [x] **Step 3: Install only `jose@6.2.12`; implement the Access verifier.** Config names: `ADMIN_ORIGIN`, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUDIENCE`, `ADMIN_ALLOWED_EMAILS`, secret `ADMIN_CSRF_KEY`. Only an exact configured origin is allowed; HTTP is allowed only for loopback development, HTTPS elsewhere. Team domain is an HTTPS root under `.cloudflareaccess.com`, without userinfo/query/hash; fetch only `/cdn-cgi/access/certs`. Reject public/unconfigured hosts before D1; incomplete required configuration returns 503. Accept only `Cf-Access-Jwt-Assertion`; JWT verification uses issuer/audience, required `exp`, RS256, clockTolerance 30, type `app`, allowlisted email. Invalid JWT 401, unauthorized identity 403.
- [x] **Step 4: Implement session/CSRF with JOSE HS256 and a >=32-byte secret.** Issue a signed token bound to authenticated email and origin with a random nonce; return it as `csrfToken` and a host-only `AdminAntiforgery` cookie: HttpOnly, SameSite=Strict, Path=/api/admin, Secure outside HTTP loopback. Reuse a valid same-identity cookie on subsequent session reads. Every mutation needs exact Origin, matching header/cookie, and valid signature/identity binding. Cookie alone, forged token, stale identity, absent Origin or foreign Origin returns 403. Session cookie has no persistent Max-Age; every request independently checks Access expiration. There is no D1 session table.
- [x] **Step 5: Pin JWKS request efficiency and local limits.** Use `createRemoteJWKSet` with `customFetch`, timeoutDuration 5000, cacheMaxAge 3600000, cooldownDuration 60000 and no retry. Keep one resolver for the active configured team per API instance; simultaneous initial checks share its fetch. Add local `ADMIN_RATE_LIMITER` 120/60 namespace `10122027` and `ADMIN_REPLY_RATE_LIMITER` 6/60 namespace `10122028`; check namespace collisions before future cloud binding. Missing required limiter fails closed, no D1. Preserve booking namespace/behavior.
- [x] **Step 6: Add/re-run cold burst, key rotation/cooldown, provider timeout, session reuse, tampered-cookie, cross-identity and old CSRF-key tests.** `node --test tests/adminAccess.test.js tests/bookingApi.test.js` must pass, with one JWKS retrieval for concurrent checks within the fresh cache. No new network call on each action and no secrets in errors.

## Task 2: Additive reply schema and exact UTC/cursor utilities

**Files:** Create `migrations/0002_admin_inquiries.sql`, `src/inquiryTime.js`, `tests/inquiryTime.test.js`; modify `tests/helpers/d1.js`, `tests/schema.test.js`, `src/inquiries.js` for normalized persisted inquiry timestamps only.

**Interfaces:**
- `normalizeUtc(value:string): string|null` -> valid year 0001–9999 UTC ISO timestamp with exactly seven fractional digits; reject invalid calendars, non-UTC, precision >7, and wrong types.
- `utcNow(nowMs:number):string`; `nextUpdatedAt(expected:string,nowMs:number):string|null` -> at least one millisecond after expected when the clock is not later; null on DateTime overflow.
- `cursorFor(createdAtUtc:string,id:string):string`; `parseCursor(value:string|null):{beforeUtc:string,beforeId:string}|null` for nonempty valid input. Empty cursor is handled by the route as no cursor; invalid nonempty is 400.
- Extend test helper with `applyAdminMigration(db):Promise<void>` after `applyInitialMigration(db)`.

- [x] **Step 1: Write failing precision, ordering and migration preservation tests.** Pin ticks at 0, a modern UTC value with `.1234567Z`, maximum ticks, equal timestamps with distinct GUIDs, and cursor round-trip with no Number conversion.

```js
assert.equal(normalizeUtc('2026-10-12T08:00:00.1234567Z'), '2026-10-12T08:00:00.1234567Z');
assert.equal(parseCursor(cursorFor('2026-10-12T08:00:00.1234567Z', '11111111-1111-4111-8111-111111111111')).beforeUtc,
  '2026-10-12T08:00:00.1234567Z');
assert.notEqual(nextUpdatedAt('2026-10-12T08:00:00.0000000Z', Date.parse('2026-10-12T08:00:00Z')),
  '2026-10-12T08:00:00.0000000Z');
```

- [x] **Step 2: Run `node --test tests/inquiryTime.test.js tests/schema.test.js`; expect RED before implementation.** Include invalid leap dates and UTC offset/local timestamps, not only Date.parse's permissive normalization.
- [x] **Step 3: Implement the utilities and additive migration.** Create `inquiry_replies` with operation `id` PK, `inquiry_id` FK, subject/body/actor, allowed status default pending, created/completed UTC; lengths mirror the API. Add `(created_at_utc DESC,id DESC)` index for the default inquiry paging query and `(inquiry_id,created_at_utc DESC,id DESC)` for reply history. Do not add speculative filter indexes or drop/rebuild the inquiry table.
- [x] **Step 4: Canonicalize only existing phase-1 inquiry timestamp representations in migration, preserving their instants and nullable notification time.** Phase 1 writes fixed millisecond ISO strings; pad their fractions to seven digits. For future submissions, normalize timestamps at the persistence boundary in `storeInquiry` and `recordNotification`; do not change the public booking response, generated reference ID or abuse gate. Imports and admin writes use the same utility. Do not edit applied `0001_public_api.sql` or mutate a remote database.
- [x] **Step 5: Re-run schema/time/inquiry tests with real local D1.** Existing inquiry fields, status, notes, notification state, submission guards and site chunks remain intact; applying migration twice is safe. `node --test tests/inquiryTime.test.js tests/schema.test.js tests/inquiries.test.js` must pass. Update only timestamp expectations that intentionally reflect canonical persistence, not failed behavior.

## Task 3: Bounded inbox reads and atomic status/notes updates

**Files:** Create `src/adminInquiries.js`, `src/admin.js`, `tests/adminInquiries.test.js`, `tests/adminApi.test.js`; modify `src/index.js` to dispatch `/api/admin` before the public CORS branch.

**Interfaces:**
- `listInquiries(db,filter):Promise<{items,nextCursor}>`, `getInquiry(db,id):Promise<Inquiry|null>` in `adminInquiries.js`. Filter keys: `search,category,status,notificationStatus,fromUtc,toExclusiveUtc,pageSize,beforeUtc,beforeId`.
- `updateInquiryStatus(db,id,status,expected,updated):Promise<boolean>`; `updateInquiryNotes(db,id,notes,actor,expected,updated):Promise<boolean>`.
- `createAdminHandler({fetcher=fetch,now=Date.now}={}): (request:Request,env)=>Promise<Response>`; owns Access instance, rate binding checks, mutation CSRF/body handling, validation and dispatch. `index.js` continues exposing `createApi` without breaking its existing fetcher/now test injection.

- [x] **Step 1: Add failing real-D1 paging/filter/CAS tests and signed route tests.** 26 default rows return 25 and a cursor; following it returns the last row once. With equal timestamps and different GUIDs, no missing/repeated rows. Search is case-sensitive literal Contains for name/email/reference, including Arabic and literal `%/_`; use `instr`, not wildcard LIKE. Date `to` is inclusive by next-day-exclusive boundary, with the source's rejection of 9999-12-31 as `to`. Invalid pageSize, filters, cursor/status/date range are 400 with zero data queries.
- [x] **Step 2: Run `node --test tests/adminInquiries.test.js tests/adminApi.test.js`; expect RED for unimplemented routes/storage.** The default summary projection must not contain details or notes, and response cache headers are no-store.
- [x] **Step 3: Implement prepared SELECTs and routes.** List does one SELECT `LIMIT pageSize+1`, no existence check or COUNT; detail one SELECT plus config-only `replyEnabled`. Preserve nullable category/service/notification values and exact response keys. Missing valid ID detail returns 404. Apply authenticated 120/60 rate binding before D1. Parse mutation JSON through `readJson(request,2097152)`, preserving the current 2 MiB server cap; check declared and streamed size, returning 413 before D1 on overflow and 400 for malformed JSON. Add a chunked oversized-body test. Unsupported routes stay 404; unsupported methods return 405 without a data query. Admin requests never inherit public CORS/cache behavior.
- [x] **Step 4: Implement status/notes CAS in one UPDATE.** Match `id` AND normalized `expectedUpdatedAtUtc`, set monotonic `nextUpdatedAt`, and use `meta.changes` to distinguish success/409 without a pre-read. Actor comes solely from `AdminIdentity.email`. Validation rejects wrong types, unrecognized status, non-UTC revision and notes >10000; all lengths use UTF-16, not SQLite character count alone. DateTime overflow yields 409 without a write. Return the current endpoint's success/error messages.
- [x] **Step 5: Verify simultaneous status and notes saves from the same revision.** On isolated D1, assert sorted statuses `[200,409]`, unchanged unrelated fields and a revision strictly later than expected even with frozen same-millisecond `now`. Re-run `node --test tests/adminInquiries.test.js tests/adminApi.test.js tests/bookingApi.test.js tests/publishedSite.test.js`; all pass and public endpoints retain their contracts.

## Task 4: Durable manual replies through Brevo

**Files:** Create `src/inquiryReplies.js`, `tests/inquiryReplies.test.js`; modify `src/email.js`, `src/admin.js`, `tests/email.test.js`, `tests/adminApi.test.js`.

**Interfaces:**
- `getReply(db,id):Promise<Reply|null>`; `addReply(db,reply):Promise<boolean>` (one atomic INSERT ON CONFLICT(id) DO NOTHING); `completeReply(db,id,status,completedAtUtc,{timeoutMs=5000}={}):Promise<void>`; `listReplies(db,inquiryId,beforeUtc,beforeId):Promise<{items,nextCursor}>` using 26 rows.
- `sendInquiryReply(inquiry,reply,{apiKey,senderEmail,senderName},fetcher=fetch,{timeoutMs=12000}={}):Promise<'accepted'|'failed'|'unknown'>` in `email.js`. Reuse provider transport inside that module without altering notification's 5-second timeout/status mapping.

- [x] **Step 1: Add failing concurrent/retry/failure tests.** Twenty simultaneous POSTs with one operation ID and identical inquiry/subject/body must create one row and call the injected email provider once; all return 200 with a valid pending or completed Reply DTO. A reused operation ID with changed content/inquiry returns 409; actor cannot be supplied by the client.

```js
assert.equal(providerCalls, 1);
assert.equal(await db.prepare('SELECT count(*) AS n FROM inquiry_replies').first('n'), 1);
assert.deepEqual(new Set(responses.map(r => r.status)), new Set([200]));
```

- [x] **Step 2: Run `node --test tests/inquiryReplies.test.js tests/email.test.js tests/adminApi.test.js`; expect RED.** Cover zero operation GUID, UTF-16 limits, Unicode whitespace-only subject/body, CR/LF/control characters in subject, and missing provider settings.
- [x] **Step 3: Implement the source's durable operation flow.** Apply 6/60 reply limiter before D1. Check existing operation first; exact existing payload returns 200 even when provider config is now absent. Otherwise require configured provider, select inquiry (404 if absent), attempt atomic pending insert. Only the insertion winner sends; a losing insert fetches the stored operation and returns it or 409. A failed initial database operation sends no email.
- [x] **Step 4: Extend Brevo HTTPS email for replies.** Fixed transactional URL, no redirects, no retries, plaintext subject/body, recipient is the inquiry's validated email/name; sender comes only from secret/config settings. Provider messageId plus successful response means accepted, 4xx rejection means failed, timeout/network/5xx/invalid success body means unknown. `accepted` means provider acceptance, not delivery. Do not register contacts/campaigns or send to a test visitor. Keep the legacy missing-provider response status 503 and contract; explain the new provider in docs, not through an unrelated UI rewrite.
- [x] **Step 5: Save completion with a bounded 5-second wait, independently of browser disconnect.** On uncertain/failed completion, preserve durable pending/unknown and return the existing generic operation error if persistence cannot be confirmed; never claim confirmed storage or resend. D1 writes cannot be cancelled after dispatch; do not retry them automatically. A client retry must reuse operationId and resolve via the durable record.
- [x] **Step 6: Verify zero provider calls on duplicate retries, DB rejection, rate rejection, and missing config.** Simulate provider timeout/lost response and browser abort, then retry the same ID; one total attempt, no automatic resend. Page history with one SELECT and no parent existence query. Re-run tests including phase-1 notification outcomes; all pass.

## Task 5: Compatible bounded inquiry export and add-only import

**Files:** Modify `src/adminInquiries.js`, `src/admin.js`; create `tests/inquiryBackup.test.js`; extend `tests/adminApi.test.js`. Existing client CSV generation stays unchanged.

**Interfaces:**
- `exportInquiries(db,ids):Promise<BackupInquiry[]>` where BackupInquiry is the full Inquiry DTO above with numeric `status` 0–4 and no `replyEnabled`.
- `validateInquiryBackup(value:unknown):{items:BackupInquiry[]|null,message?:string}`; validates before any D1 call; normalized UTC storage representation preserves every instant.
- `importMissingInquiries(db,items):Promise<{imported:number,skipped:number}>` using one atomic batch of up to 100 per-record INSERTs, skipping only uniqueness collisions on ID/reference. Constraint/storage errors must fail/rollback, not be swallowed.

- [x] **Step 1: Add failing round-trip/legacy/duplicate tests.** Use a .NET-shaped version-1 fixture with numeric status, seven-digit UTC, Arabic/surrogate pairs, optional category/service/notification fields, and notes. Export 1–100 selected IDs in one SELECT; duplicate IDs and >100 fail before D1. Import the same fixture twice; first inserts missing records, second skips them without changing existing fields or calling email.
- [x] **Step 2: Run `node --test tests/inquiryBackup.test.js tests/adminApi.test.js`; expect RED.** Reject wrong format/version, null items/rows, >100 rows, duplicate file IDs/references, zero GUID, non-UTC timestamps, updated before created, invalid notification/category/status/email, and raw UTF-16 limits. Empty items return `{imported:0,skipped:0}` without a batch.
- [x] **Step 3: Implement validation matching `ValidBackupInquiry`.** Limits: reference nonblank <=50, name <=100, email <=255, details <=4000, notes required <=10000, nullable notes actor <=255, nullable service <=30. Use `validateBooking(row,{allowPublishedService:true})` for existing field validity, but preserve the backup's original valid field contents rather than silently trimming historical data. All timestamps must be valid UTC, nullable notification-attempt allowed, statuses as specified. Export numeric status and full entity fields; do not expose replyEnabled in backup items.
- [x] **Step 4: Implement one SELECT export and one transactional batch import.** Do not combine 100 records into one INSERT exceeding D1's parameter limit. Each prepared INSERT has only the entity's bound fields, `ON CONFLICT DO NOTHING` for either existing ID/reference; sum `meta.changes`. There is no pre-read, overwrite, abuse guard recreation, notification dispatch, or COUNT request. Distinguish batch round trips from its SQL statements when reporting efficiency.
- [x] **Step 5: Verify two concurrent imports of the same backup and rollback on a real constraint failure.** Total inserted equals distinct missing inquiries, unchanged existing rows, zero emails, bounded statements. `node --test tests/inquiryBackup.test.js tests/adminInquiries.test.js tests/adminApi.test.js` passes. Compare source JSON fixtures against .NET serialization; do not assume backup and list statuses share a type.

## Task 6: Compiled runtime, client contract checks, and durable handoff

**Files:** Modify `tests/runtime.test.js` to account for both migrations and admin bindings, create `tests/adminRuntime.test.js`, update `server/cloudflare/README.md`, this checklist, and `docs/cloudflare-integration-progress.md`. No production route or client configuration change in this task.

**Interfaces:** Test the actual `createApi` entry point and bundled Worker, not a replacement router. Use the existing Wrangler `createTestHarness` and isolated D1 with envFiles disabled. Provider/JWKS substitutions live solely in test harness outbound fetch interception; no local-admin bypass binding/header is added to the product.

- [x] **Step 1: Add failing compiled-runtime tests.** Build the real bundle, apply both migrations twice, exercise signed session/cookie/CSRF, list/detail, concurrent CAS, operation-ID replies, export/import, rejected public-host access, actual admin 120/60 and reply 6/60 bindings, and existing booking 9/60/cron. The test harness must prove signed RSA verification works in workerd; if its interception is insufficient, add only a test wrapper binding around the real `createApi` with injected fetcher, preserving production verification.
- [x] **Step 2: Run the targeted runtime test; expect RED for any unintegrated binding/route.** Do not replace a failed real-runtime assertion with a fake DB success. Clock/rate test identities are isolated between cases.
- [x] **Step 3: Run the full relevant checks from their package directories.**

```powershell
# From server/cloudflare/
npm test
npm run build
# From client/
node --test tests/admin.test.js
npm run lint
npm run build
# From repository root; read-only diff checks
& 'E:/Git/cmd/git.exe' diff --check
& 'E:/Git/cmd/git.exe' status --short
```

Expected: no failed/skipped Workers tests, dry-run build success, existing 14 client admin tests still pass, no new lint findings or client build failures. Record the existing nine unrelated lint warnings accurately. Use the project's already available oxlint for new backend modules; do not install another formatter or disable rules.

- [x] **Step 4: Record actual HTTP/SQL and metadata counts in the progress log and README.** Measure valid session =0 SQL; list/detail/history =1 SELECT each; valid status/notes =1 conditional UPDATE each; export =1 bounded SELECT; import =1 batch/up to100 INSERT statements. New reply normally = existing-op SELECT + inquiry SELECT + conditional INSERT + completion UPDATE; repeated reply =1 SELECT, with an extra operation SELECT for the concurrent loser. Provider/JWKS requests are separate from D1 and occur only when required. Unauthorized/CSRF/invalid input/rate-rejected paths =0 data SQL. Do not equate row/statement counts or claim a user capacity without a measured production result.
- [x] **Step 5: Review the scoped diff and run the one independent completion review required by the chosen native workflow.** No automatic commits, push, branch switching, or cleanup of unrelated changes. Record any corrections with their failed-then-passing tests. Preserve the execution ledger for context recovery.
- [x] **Step 6: Update completion boundaries.** Mark stage 2 locally implemented only after its tests. Access application enrollment, owner identity, verified Brevo sender/domain and mailbox, real delivery/logout, admin browser/network behavior and Workers CPU Free measurements remain stage-5 gates. Do not claim the admin hostname is live or the whole dashboard is ready; document that document/media APIs are implemented in stages 3/4 before final integration.

## Request/database budget for owner review

| Action | Browser HTTP | D1 work, excluding tests |
|---|---:|---|
| Open admin session | 1 GET on load/explicit retry | 0 |
| Search/filter | 1 GET on explicit application | 1 bounded SELECT; none on typing |
| Open list page/detail/reply page | 1 GET unless existing client cache hits | 1 bounded SELECT per miss |
| Save status/notes | 1 PATCH | 1 conditional UPDATE |
| New manual reply | 1 POST | Up to 4 normal SQL statements; atomic operation claim; one Brevo attempt |
| Repeat same reply | 1 POST | 1 SELECT; no email; concurrent loser may need one additional SELECT |
| Export selected inquiries | 1 POST | 1 SELECT, max100 items; CSV conversion remains client-side |
| Import missing inquiries | 1 POST after local file validation | 1 transactional batch, 0–100 INSERT statements; no email |
| Unauthorized/invalid/rate-rejected operation | 1 rejected request | 0 data SQL |

An empty/stale cache does not cause automatic refresh. The existing explicit refresh and 401/403 cache clearing remain intact. SQL rows read/written and cold JWKS CPU are measured separately during integration; this table is an implementation budget, not a production capacity claim.

## Self-review and handoff

- [x] Spec stage-2 scope mapped to tasks 1–6; production/account setup and unrelated stages are separated.
- [x] Actual source types checked, including numeric backup status, DateTime ticks cursor, 2 MiB admin JSON body cap, UTF-16 field limits, and accepted/unknown reply semantics.
- [x] Shared interfaces/signatures consistent across tasks; existing modules reused where suitable; only JOSE is a necessary new dependency.
- [x] All five Review Focus conditions have specific tests; no unbounded query, COUNT/polling, D1 session row, automatic mail retry, placeholder product UI, or source secret is planned.
- [x] Steps and file scope checked against AGENTS.md. Commit/deployment instructions omitted because no current authorization exists for them.
- [x] Owner review of this stage-2 plan before changing authentication/server behavior, as required by writing-plans. Preserve the already selected native execution method.

## Primary references verified during planning

- [Cloudflare Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/).
- [JOSE remote JWKS](https://github.com/panva/jose/blob/main/docs/jwks/remote/functions/createRemoteJWKSet.md) and [customFetch](https://github.com/panva/jose/blob/main/docs/jwks/remote/variables/customFetch.md); JWT algorithms/claims must still be pinned by this API.
- [D1 Worker API and atomic batch](https://developers.cloudflare.com/d1/worker-api/d1-database/).
- [Brevo transactional email API](https://developers.brevo.com/docs/send-a-transactional-email).
