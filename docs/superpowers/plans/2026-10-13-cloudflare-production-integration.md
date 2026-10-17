# Cloudflare production integration plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task by task. Steps use checkbox syntax. The owner requested the final production release on 2026-10-13; retain the existing site until all account and hosted checks pass. No automatic Git commit or push.

**Goal:** Run the existing bilingual site, booking API, administration, D1 data, Supabase media and email together on the owner's Cloudflare domain.

**Architecture:** Extend the currently deployed `ahmad-makatreh-site` Worker to call the already implemented Workers API in the same invocation for `/api/site`, `/api/booking` and `/api/admin/*`; leave static assets on the existing assets binding. Use a separate production D1 database, Cloudflare Access on `admin.ahmad-makatreh.vip`, Turnstile, Brevo and a dedicated Supabase Storage bucket. Preserve the current `.NET` source and the isolated preview D1.

**Tech stack:** Existing React/Vite, JavaScript Workers, Wrangler 4.149.0, D1, Supabase Storage REST, Cloudflare Access/Turnstile and Brevo. No new product dependency.

**Specs:** `docs/superpowers/specs/2026-10-12-cloudflare-integration-design.md`; `docs/superpowers/specs/2026-10-13-supabase-storage-design.md` (Supabase supersedes R2 in the cloud).

## Global constraints

- Never print, commit or send secret values. Owner enters Supabase/Brevo/Turnstile and HMAC/CSRF keys directly into encrypted Cloudflare secrets. Keep `.env.production` private.
- No data migration from `data_base_1` or reuse of the isolated `ahmad-makatreh-preview` D1. Inspect existing resources before creating production names.
- No public admin API on the main host, no Access bypass, no anonymous Storage write policy, no card or paid upgrade.
- Preserve the existing booking body, status/error codes, admin contracts, bilingual content, same-origin client cache and duplicate-submission limits.
- Use one API request for a booking, one initial site snapshot and no D1 query while editing, navigating, changing language or moving the slider.
- Keep the current production Worker version and backup/recovery evidence for rollback; no destructive cleanup or automatic retry after an unknown write.
- A private preview bucket and a separate recovery bucket must pass the already approved Phase 5B hosted probe before the production Storage bucket is activated.

## Review focus

1. A missing API secret, D1 binding or Access configuration must fail closed; a deploy must not make an admin route usable without verified identity.
2. Assets must never swallow `/api/site`, `/api/booking` or `/api/admin/*` into the SPA HTML fallback, including a trailing slash.
3. Requests to the public hostname must never reach admin state, while a valid admin JWT, Origin and CSRF still reach the same API implementation.
4. A production media URL must load from the chosen bucket, and recovery into another bucket must not leave published documents pointing at missing source URLs.
5. Real service errors, 10 MiB uploads, 10-second booking deadline and Workers Free CPU usage must be measured or reported unverified, not inferred from local fixtures.

## Task 1: Confirm account and service gates

**Files:** Update only `docs/cloudflare-integration-progress.md` with verified names/statuses. The owner performs account login, secret entry and any action requiring an authentication credential.

**Interfaces:** Confirm Cloudflare account `fe25e25f13db2c636fd743e41c8a47e1`, site version, DNS/zone, production D1 absence/presence, existing secret names, Supabase project `kghmejpjvbmcivnlnkgf`, bucket settings/policies, recipient mailbox, verified Brevo sender, Turnstile widget and Access owner email/team/audience.

- [ ] Compare the live site and `wrangler deployments list`, D1 list and current DNS. Record what exists; never infer bucket/policy/secret readiness from a local configuration file.
- [ ] Complete the approved private Supabase preview bucket and the Phase 5B probe, backup and restore with synthetic files only. Check private read/write denials and the absence of anonymous INSERT/UPDATE/DELETE policies.
- [x] The owner selected a dedicated public-read production bucket for nonsensitive site images and PDFs, with uploads restricted to the protected administration API. The existing Supabase adapter produces direct public URLs; no Worker media-delivery route is needed. The private preview and recovery buckets remain separate. A draft URL is readable by anyone who possesses it, so sensitive files must not be uploaded to the public bucket. A restore into a different bucket still requires remapping stored media URLs.
- [ ] Confirm the real receiving mailbox, allowed administrator email and sender identity. Verify Brevo domain/sender records against existing DNS before editing records; test actual delivery only to the owner's mailbox.

## Task 2: Integrate the existing API into the site Worker

**Files:** `client/worker.js`, `client/wrangler.jsonc`, `client/src/api/httpClient.js`, the production client environment override if necessary, focused client Worker tests and a compiled integration test. Reuse `server/cloudflare/src/index.js` without changing its public contracts.

**Interfaces:** `/api/site` GET, `/api/booking` POST/OPTIONS and `/api/admin/*` call the existing API handler directly. `env.ASSETS.fetch` handles other paths. `ADMIN_ORIGIN` is the exact admin host. Workers run first for `/api/*` only. The browser calls the same origin for the public API.

- [ ] Write failing tests for all three API route families, host isolation, missing bindings/configuration, SPA asset fallback, unchanged booking/admin payloads and no second Worker fetch.
- [ ] Implement the smallest route/configuration change and run those tests GREEN. Retain asset-first behavior for ordinary static files.
- [ ] Compile the integrated Worker with the installed Wrangler and run existing client and backend contract tests. Check bundle size, imports and compatibility without changing unrelated UI.

## Task 3: Provision production resources securely

**Files:** Production Wrangler binding configuration and progress/README only. Secrets reside in Cloudflare, not repository files.

**Interfaces:** New production D1 `ahmad-makatreh` with migrations `0001`–`0004`; four production limiter namespaces with existing 9/120/6/6 per-minute limits; production `MEDIA_PROVIDER=supabase`, URL and bucket. `ADMIN_ORIGIN=https://admin.ahmad-makatreh.vip`.

- [x] Create D1 only after an exact-name/UUID check, then apply additive migrations once to the new empty database. Query migration names and eight table counts; preserve `ahmad-makatreh-preview` and `data_base_1`. Created `ahmad-makatreh` (`c1653642-1587-474e-8160-aa45ffdee878`) in WEUR; four migrations present and all eight application tables empty on 2026-10-13.
- [ ] Create and verify production bucket `ahmad-makatreh-media` with public read, size 10485760 and PNG/JPEG/WebP/PDF only. Inspect global and bucket policies; never open anonymous writes to make upload succeed.
- [ ] Owner adds `BOOKING_HMAC_KEY`, `ADMIN_CSRF_KEY`, `TURNSTILE_SECRET_KEY`, `BREVO_API_KEY` and `SUPABASE_SECRET_KEY` as encrypted Worker secrets. Record only their names/presence. Configure validated non-secret hostnames, audience, allowed email, sender and recipient.
- [ ] Protect the complete admin hostname with a Cloudflare Access self-hosted application and exact-email Allow policy before serving the admin shell. Verify DNS/custom domain and the signed assertion at the API.

## Task 4: Hosted end-to-end proof and release

**Files:** Progress/README and evidence only unless a measured defect requires a focused code fix with RED→GREEN coverage.

**Interfaces:** A controlled preview or staging route with isolated D1 and synthetic data precedes promotion of the production Worker. Production version remains available for rollback.

- [ ] Verify the full chain in a safe isolated environment: one booking POST, one D1 inquiry, one accepted Brevo send delivered to owner, duplicate/blocked behavior, admin login and logout, inbox, note, reply, document edit/publish, image/PDF upload and public rendering where intended.
- [ ] Measure actual HTTP requests, D1 rows/round trips, CPU, memory/timeout where exposed, 10 MiB upload and booking deadline. Stop and fix any failure before release; do not run load tests against production or Supabase.
- [ ] Export and verify D1 plus actual Storage bytes before changing the live Worker. Record source-to-destination URL mapping for recovery, not only copied object bytes.
- [ ] Deploy the integrated site once to `ahmad-makatreh-site` after service gates pass. Verify public and admin host behavior, real receiving mailbox and current deployment ID. Keep prior version ID for rollback; do not delete resources.
- [ ] Run final focused tests, full backend/client suites, lint, build, `git diff --check`, secret/debug scan and read-only hosted smoke checks. Record exact modified files, successes and limits. Do not commit or push unless asked.

## Account actions still needed

The owner must finish the Supabase private preview bucket and provide settings evidence; create and verify the public-read production bucket; choose which email can enter Access and where `info@ahmad-makatreh.vip` receives mail; configure or authorize the external account settings and encrypted secrets. No secret value belongs in this chat. Production publishing remains conditional on these checks.
