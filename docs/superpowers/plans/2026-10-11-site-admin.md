# Site Administration Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement and verify this plan inline, in the agreed order.

**Goal:** Implement the approved bilingual site administration under `client/src/admin/`, beginning with inquiries, followed by pricing/offers and content/pages.

**Architecture:** Reuse React/Vite and the existing ASP.NET Core/PostgreSQL layers. Cloudflare Access assertions are validated by the API; the static Worker proxies same-host admin calls. Keep edits local until explicit save/publish; public pages use a published snapshot, separate from drafts.

**Tech Stack:** React 19, Vite 8, ASP.NET Core 10, EF Core/PostgreSQL, Cloudflare Workers/Access.

**Spec:** `docs/superpowers/specs/2026-10-10-admin-dashboard-inbox-design.md` and `docs/site-admin-plan.md` (approved chat requirements take precedence over stale status labels).

## Global Constraints

- Preserve existing uncommitted work and public behavior.
- No commits, pushes, production migrations, DNS/Access changes, or deployment in this task.
- No authentication bypass; local admin without valid Access credentials shows permission state.
- Admin has no automatic polling, per-keystroke requests, or autosave.
- Bounded server-side inquiry lists (25 by default, maximum 100), explicit filter application, no separate count query.
- Preserve Arabic/English content, existing design tokens and booking contracts.

## Review Focus

- Authentication absent/forged/expired/wrong audience and rotated signing keys must fail closed or validate correctly without database access.
- Foreign Origin and absent CSRF must reject admin writes.
- Concurrent edits must return conflict instead of silently overwriting data.
- Empty/error/offline states must remain recoverable without request loops.
- Existing rows and public pages must remain readable while new nullable fields and additive tables are introduced.

## Task 1: Secure inquiry API

Files: API `Security/AdminAccess.cs`, `Endpoints/AdminInquiryEndpoints.cs`; application `Interfaces/IAdminInquiryRepository.cs`, `Models/AdminInquiryModels.cs`; domain `Entities/Inquiry.cs`; both persistence adapters, `AppDbContext.cs`, an additive migration; booking service; integration tests.

- [x] Test unauthorized endpoints (401, no persistence calls), signed Access identities, invalid tokens and CSRF.
- [x] Validate RS256 JWT issuer/audience/expiry/allowlisted email using Microsoft's maintained JWT middleware and cached JWKS configuration manager.
- [x] Implement session/CSRF endpoint (zero DB queries), paged list using pageSize+1 (one query), detail (one), conditional status update (one returning updated row).
- [x] Persist notification result/timestamp independently; booking remains saved if that write fails.
- [x] Verify filters, stable ordering, pagination, stale writes, nullable historic values, Dev JSON parity and API build.

## Task 2: Inquiry dashboard and Worker

Files: `client/src/admin/{AdminApp,InquiryInbox,adminApi}.jsx/js`, `admin.css`; `main.jsx`; `client/worker.js`, `wrangler.jsonc`; Node tests.

- [x] Select admin shell only on exact admin host (plus admin.localhost for local development); lazy-load public/admin roots separately.
- [x] Build Arabic RTL shell, explicit filters, list/details/status save, loading/empty/error/unauthorized states using site tokens.
- [x] Deduplicate in-flight GETs; bounded session memory; no storage of private inquiries in localStorage; update loaded data after writes without redundant fetch.
- [x] Proxy only admin API paths to fixed HTTPS API_ORIGIN; forward Access assertion; never leak it to public paths or redirect destinations; serve all other routes as assets.
- [x] Verify Worker routing, network counts, build/lint, desktop/mobile and public site regression.

## Task 3: Packages and offers

- [x] Inspect existing package/service keys and pricing/offer rendering before modifying.
- [x] Add durable versioned draft/published pricing documents and validation, with creation/edit/order/hide and scheduling of offers.
- [x] Add admin bilingual editor and explicit save/publish; protect writes and concurrent revision checks.
- [x] Connect public pricing and offer rendering to the same published source, preserving existing defaults until first publication.
- [x] Test prices/discount dates, visibility, validation, conflicts and request counts.

## Task 4: Site content and pages

- [x] Inspect language provider, navigation, project/article/image data and existing pages.
- [x] Add draft/published bilingual copy and media data editing using existing sources as initial values; no arbitrary HTML execution.
- [x] Add page templates with ordered sections, slugs, navigation visibility, preview and explicit publish plus retained previous published version.
- [x] Serve published snapshots efficiently (bounded reads, cached snapshot with defined invalidation/TTL), with no database requests caused by language switches or rerenders.
- [x] Test bilingual publication, unchanged public defaults, invalid/slugs/URLs, draft isolation, permission denial, restoration and build.

## Verification and delivery

- [x] Run targeted tests then full existing server tests and frontend build/lint.
- [x] Inspect additive migration SQL; use no production data.
- [x] Fresh review of security, persistence, UI flows and final diff; fix material findings.
- [x] Document exact request/query budgets and operational prerequisites. Report implemented versus verified versus configuration still required.

## Execution record

- Final implementation includes all four dashboard areas and public publication binding. Access/DNS settings and production deployment were not changed; image replacement uses existing paths or HTTPS URLs, with no file-upload storage configured.
- Verification: frontend and API builds passed (API zero warnings/errors); 39 targeted backend tests and 8 frontend/Worker tests passed. Full suite: 101 passed, 7 existing failures (6 integration, 1 unit). Lint completes with existing warnings. Additive SQL was generated and inspected; PostgreSQL was not run.
- Browser plugin is unavailable in this session; bundled regular Playwright with isolated Chrome contexts was used. Real unconfigured API rejects one session request. Full UI workflow used isolated network fixtures and made 13 HTTP requests with zero requests during typing/search/reordering/preview. Public CMS navigation and language changes share one snapshot; custom-package booking submits one POST; edited article HTML is escaped; a failed CMS load retries only after explicit action. Desktop/mobile screenshots were inspected.
- Fresh independent reviewer found package selection, competing metadata, destructive content paths, duplicate publication history and failed-load/route-alias issues. These were corrected and verified; no Critical or Important findings remain from that review.
- Query budgets and operational prerequisites are recorded in `docs/admin-dashboard.md`. Production Access, real PostgreSQL execution, production mail delivery, and media uploads remain unverified or unconfigured.

- Initial inspection: no admin UI/API/authentication existed; public booking protection changes are pre-existing and preserved.
- Ruling: implementation proceeds under the user's explicit request to start the already approved design; no repeated approval gate or Git commit is introduced.
- Early verification after tasks 1–2: secure inquiry API, notification outcome persistence, keyset pagination, conditional status updates, admin shell and explicit filter/detail/save UI, protected Worker proxy. First unauthorized test failed 404 then passed 401; 12 admin integration tests and 4 frontend/Worker tests passed. Later verification of all phases is recorded above.
- Existing full server suite: 6 booking/startup integration failures and 1 configuration unit failure relate to pre-existing IP/HMAC guard changes (TestServer has no RemoteIpAddress; configuration tests expect missing connection before HMAC). No security checks weakened to satisfy them.
- Dependency audit: the newly added JwtBearer package has no reported vulnerabilities; existing MailKit/MimeKit 4.14.0 advisories remain outside this task.
