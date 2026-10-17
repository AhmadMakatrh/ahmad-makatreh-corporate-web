# Cloudflare Phase 4: Media and Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans task-by-task. Native execution in the current session is already selected. Steps use checkbox (`- [x]`) syntax. This plan does not authorize a commit, push, branch switch, paid subscription, remote resource creation or production deployment.

**Goal:** Connect the existing media library to Workers/D1/R2, preserve safe upload and archive behavior, and prove full database/object recovery using isolated local resources.

**Architecture:** Add authenticated media routes beside the existing inquiry/document routes. D1 owns media metadata and R2 owns immutable public file bytes; upload identity and SHA-256 preserve retries without duplicate assets. Reuse the existing React library, Access/CSRF boundary, cursor helpers and document-backup reader; retain objects when archiving or when a database write is uncertain.

**Tech Stack:** Existing JavaScript ESM, Node >=22, Wrangler 4.149.0/workerd, D1 SQLite, R2 binding, Web Crypto SHA-256 and existing `jose`. No new product dependencies.

**Spec:** `docs/superpowers/specs/2026-10-12-cloudflare-integration-design.md`, stage 4. Resume context: `docs/cloudflare-integration-progress.md`. Status: owner approved on 2026-10-12; all four tasks, local verification and independent review complete. Phases 1–4 are complete locally; hosted bindings, domain connection and CPU measurements remain phase 5.

## Global Constraints

- الإدارة: `admin.ahmad-makatreh.vip`؛ يبقى مصدر الواجهة داخل `client/src/admin/`.
- Preserve existing JSON fields, HTTP statuses, UTF-8/Arabic names, UTC timestamps and .NET ticks/GUID cursors. Keep the existing .NET implementation and public site design.
- PNG/JPEG/WebP/PDF only; inspect actual signatures. Maximum size **10 MiB = 10,485,760 bytes**, including streamed bodies without a trustworthy Content-Length.
- One raw-binary POST per upload; reuse its upload UUID on a retry. No multipart/presign round trips, automatic write retries, per-field requests, polling or autosave.
- Keep authenticated email limits: general admin **120/60 seconds**, upload **6/60 seconds** matching the .NET upload policy. Booking **9/60** and reply **6/60** stay unchanged. The Cloudflare limiter is approximate per location, not a global exact counter.
- Client GET cache remains **60 seconds, 40 entries**, sharing pending reads and invalidating only relevant media lists after a write. Selection, local editing and preview do not query D1.
- Invalid authentication, host, mutation Origin/CSRF, upload identity/name, size, format or unavailable configuration fails before media SQL where applicable. Private responses use `no-store` and `nosniff`.
- R2 is for public site assets only. Private inquiry backups, secrets and tokens never enter the public bucket, URL, log or Git.
- No successful metadata after a failed object write. Never delete an object whose metadata write may have committed, or an archived object with potential historical references.
- Tests use separate local D1/R2 resources and synthetic data. Current R2 account activation is outstanding and can involve billing; approval of this code plan does not activate it.
- Protect the four existing uncommitted .NET test fixes. Record the baseline; no changes to them, real `.env`, existing production routing or unrelated files.

## Review Focus

1. Two simultaneous uploads with the same ID, including different bytes, must produce one metadata owner. Task 2 proves the losing request can delete only its own unclaimed key.
2. A successful R2 write followed by a committed-but-reported-failed D1 write must retain the file; a same-ID retry must recover the recorded asset. Task 2 exercises both database failure outcomes.
3. Missing/false Content-Length, thousands of small chunks, a read error, misleading extensions/MIME and late storage completion must stay bounded and never claim a saved asset incorrectly. Tasks 1–2 pin these paths.
4. A new image reference added while archive checks are running must conflict rather than silently pass a stale check; past publications/history must still load archived bytes. Task 3 exercises both races and restoration.
5. Full recovery must preserve archived media, Arabic metadata, file keys/bytes/headers, document history and long revision values. Task 4 restores a real SQL export plus R2 bytes into empty resources and compares references.

## Inspected contracts and intended files

Read the .NET `AdminMediaEndpoints`, `MediaValidator`, `MediaAsset`, `IMediaRepository`, `IMediaStorage`, `PostgreSqlMediaRepository` and `R2MediaStorage`; React `MediaLibrary.jsx` and `adminApi.js`; Workers `admin.js`, `adminAccess.js`, `inquiryTime.js`, `adminInquiries.js`, `siteDocuments.js`, `documentBodies.js`, migrations and runtime fixtures before implementation.

Focused additions under `server/cloudflare/`:

- `migrations/0004_media_assets.sql`: additive metadata table and pagination index.
- `src/mediaValidation.js`: upload identity/name, bounded raw bytes and actual signature detection.
- `src/mediaAssets.js`: bounded metadata reads, conditional insert/archive and public projection.
- `src/adminMedia.js`: authenticated library/upload/archive routes and R2 options/failure handling.
- Tests: `mediaValidation.test.js`, `mediaAssets.test.js`, `adminMedia.test.js`, `mediaRuntime.test.js`, `mediaBackup.test.js`; shared fixtures in `tests/helpers/mediaFixtures.js`, a test-only compiled wrapper in `mediaRuntimeWorker.js`, and native local SQL export in `exportLocalDatabase.py`.
- Modify `src/admin.js` only to dispatch media routes with the same verified identity, Access instance and execution context.
- Extend `tests/helpers/d1.js` and `tests/wrangler.test.jsonc` for isolated R2 and migration 0004; preserve existing helper consumers.
- Extend local `wrangler.jsonc` with `MEDIA` and `ADMIN_UPLOAD_RATE_LIMITER` (namespace `10122029`, limit 6, period 60). Add blank nonsecret `MEDIA_PUBLIC_BASE_URL` to `.dev.vars.example`.
- Update the three existing runtime migration-count assertions from 3 to 4; update `README.md` and the progress ledger with measured costs and recovery instructions.

No new client controls are needed. Existing upload ID lifetime, one binary POST, cache invalidation, local list updates, preview and archive controls remain the integration contract.

## HTTP and storage contracts

Public asset projection: `{id,url,originalName,contentType,size,createdAtUtc}`. Never expose `actor`, SHA-256 or internal object key as extra response fields.

| Endpoint under `/api/admin` | Behavior |
| --- | --- |
| `GET /media?cursor=...` | `{items,configured,nextCursor}`; 25 items plus one look-ahead, active assets only, newest UTC/id first. Invalid cursor 400; no COUNT or bucket listing. |
| `POST /media/{uploadId}?name=...` | Raw bytes; 200 asset for new upload or matching active retry. Invalid ID/name/format 400; oversize 413; reused ID with different bytes or archived asset 409; unavailable storage 503. |
| `POST /media/{id}/archive` | 204 on archive/already archived; missing 404; current draft/published reference 409 with `code:'media_referenced'`. Retain object bytes. |

Use existing canonical GUID parsing, reject all-zero upload IDs, and preserve filenames after removing `/` or `\\` path prefixes. Names must be nonblank, <=200 UTF-16 units and contain no control characters. Validate the supplied name before taking its basename, as the .NET endpoint does.

Mirror `MediaValidator`: >=12 bytes; PNG 8-byte signature; JPEG starts `FF D8 FF` and ends `FF D9`; WebP `RIFF`/`WEBP`; PDF `%PDF-` and `%%EOF` within the last 1024 bytes. These are signature checks, not full decoding or malware scanning. Ignore the declared extension and Content-Type when choosing stored type/extension.

New `media_assets` fields: `id` primary key, unique `object_key`, `url`, `original_name`, `content_type`, `sha256`, `size`, `created_at_utc`, `actor`, `archived` default 0. Constrain boolean, size and supported types. Index `(archived,created_at_utc DESC,id DESC)` serves the actual bounded library query. Do not modify existing tables or invent old media records.

Require `MEDIA` binding and a configured absolute HTTPS `MEDIA_PUBLIC_BASE_URL` with no credentials, query or fragment. Construct URLs from the trusted base and a server-generated 32-hex UUID key plus detected extension. Public-domain provisioning belongs to the account setup step; tests use reserved `media.example.test` only.

R2 PUT uses detected `contentType`, `cacheControl:'public, max-age=31536000, immutable'`, PDF `contentDisposition:'attachment'` and image `'inline'`, plus the computed SHA-256 checksum. A create-only condition prevents overwriting an accidental key collision. No filename/identity in R2 public HTTP metadata.

Accepted upload sequence: bounded validation/hash → lookup ID → one immutable R2 PUT → `INSERT ... ON CONFLICT(id) DO NOTHING`. There is no shared transaction between D1 and R2. Register the accepted storage/metadata work with `ctx.waitUntil` to give interrupted clients the platform's supported completion window; do not promise unlimited background execution.

Bound the R2 wait at the existing storage timeout of 45 seconds. The binding has no cancellable PUT contract: if the deadline fires, skip the metadata INSERT, retain any object that completes later, and return storage failure. Hold/handle late completion through the execution context without retrying or deleting an uncertain object. A metadata error after confirmed PUT returns an error with sanitized logging, keeps the object, and relies on a same-ID retry to find a commit if it happened.

For a known INSERT loser, delete only that attempt's own unclaimed random key, then read the winning record. Same hash and active returns the winner; otherwise 409. Cleanup failure is recorded without deleting anything else or hiding a confirmed winner.

## Database and R2 budget

These are design targets, to be confirmed by real local bindings. One HTTP action can require more than one SQL statement; R2 operations are accounted separately.

| Action | HTTP | D1 | R2 binding operations |
| --- | ---: | --- | --- |
| Select a library image / change a form field | 0 | 0 | 0; a displayed image may fetch its public URL |
| Open a cached library list | 0 | 0 | 0 |
| Library list cache miss | 1 GET | 1 SELECT, <=26 rows | 0 |
| Invalid identity/CSRF/upload/file or unconfigured upload | 1 rejected request | 0 | 0 |
| New upload | 1 POST | 1 SELECT + 1 INSERT | 1 PUT |
| Same-ID retry or known conflicting ID | 1 POST | 1 SELECT | 0 |
| Concurrent INSERT loser | 1 POST | 1 SELECT + 1 INSERT + 1 SELECT | 1 PUT + 1 DELETE of its own unclaimed key |
| R2 failure/timeout | 1 POST | 1 initial SELECT, 0 INSERT | 1 attempted PUT; no automatic retry |
| D1 write outcome uncertain | 1 POST | initial SELECT + attempted INSERT | 1 PUT, 0 DELETE |
| Archive missing/already archived | 1 POST | 1 SELECT | 0 |
| Archive active, unreferenced | 1 POST | 1 asset SELECT + existing backup reader (1 metadata SELECT + 0–6 distinct bounded body SELECTs) + 1 guarded UPDATE: **3–9 SQL** | 0 |
| Archive referenced | 1 POST | asset SELECT + snapshot/body reads: **2–8 SQL**, no UPDATE | 0 |
| Archive concurrent conflict | 1 POST | at most one extra asset SELECT to distinguish already archived | 0 |

Archive reuses `readDocumentBackup(db,utc)` rather than aggregating up to six large document bodies into one oversized query. It shares identical immutable body pointers, reads each distinct body once and examines only the three current drafts/publications. No history scan and no SELECT per rendered item. Current revisions, including absent keys as 0, guard the final UPDATE; corrupted bodies fail closed.

Full recovery is an explicit offline operation, not an admin page load or polling endpoint. Export D1 once, copy R2 with bounded pagination and one file at a time, verify the manifest, then restore into fresh resources. No background bucket scans or orphan deletion policy are introduced.

## Task 1: Additive metadata storage and bounded library reads

**Files:** Create migration 0004, `mediaValidation.js`, `mediaAssets.js`, `adminMedia.js`, `mediaValidation.test.js`, `mediaAssets.test.js` and `adminMedia.test.js`. Modify `admin.js`, local/test Wrangler configs, `.dev.vars.example`, D1 helper and existing runtime migration counts.

**Interfaces:**

- `detectMediaFormat(bytes:Uint8Array) -> {contentType,extension}|null`; `readMediaBody(request:Request) -> Promise<{bytes:Uint8Array}|{status:400|413}>`; exported `maxMediaBytes=10485760`.
- `validateMediaUpload(id:string,name:string|null) -> {id,originalName}|null`.
- `getMediaAsset(db,id) -> Promise<asset|null>`; `listMediaAssets(db,before:{beforeUtc,beforeId}|null) -> Promise<{items,nextCursor}>`; `publicMediaAsset(asset) -> public projection`.
- `createAdminMediaHandler({now=Date.now}) -> async(request,env,identity,access,ctx):Promise<Response|null>`; return null only outside owned routes. Reuse `inquiryId`, `parseCursor`, `cursorFor`, `utcNow` and existing mutation validation.

- [x] Record baseline Git status/diff hashes and task ledger under `.superpowers/sdd/2026-10-12-cloudflare-phase-4/` before implementation.
- [x] Add failing `signatureAndNameContract`, `boundedRawBody` and `pagedLibrary` tests: all four signatures, MIME spoof, PDF EOF, empty/zero ID, Arabic basename, controls, 200/201 UTF-16 units, exactly 10485760 and 10485761 bytes, unknown/false length and tiny chunks/read failure. Assert read cancellation/released lock on rejection; 25 active items plus cursor, ties without duplicates and invalid cursor zero SQL.
- [x] Run `node --test tests/mediaValidation.test.js tests/mediaAssets.test.js tests/adminMedia.test.js` in `server/cloudflare`; expect missing exports/routes before product changes.
- [x] Implement the interfaces and additive migration. Use parameterized SQL, bounded binary allocation and the existing cursor/date helpers. Extend D1 helper return with R2 while keeping `db`/`dispose` intact. Wire GET through the authenticated handler, configured flag and no-store responses.
- [x] Run the same focused tests; expect all pass. Verify migration on an existing phases1–3 fixture preserves inquiry/document rows, and an empty database applies all four migrations exactly once.

## Task 2: One-request R2 uploads with safe retries and partial failures

**Files:** Extend `mediaAssets.js`, `adminMedia.js`, `adminMedia.test.js`; add `tests/helpers/mediaFixtures.js` for isolated signed session, R2 and SQL/R2 counters.

**Interfaces:** `insertMediaAsset(db,asset) -> Promise<boolean>` for confirmed INSERT ownership. Upload uses Task 1 byte/name/public-projection helpers and the existing Access `validateMutation`. Keep storage/deadline handling private to `adminMedia.js`; no additional public API or environment timeout switch.

- [x] Add failing `oneRequestUpload`, `duplicateAndConcurrentUpload`, `partialUploadFailures`, `latePutAndClientDisconnect` and `uploadAuthorizationBudget`. Assert one HTTP POST, 2 SQL/1 PUT for a new asset, 1 SQL/0 PUT for an active retry, correct checksum/headers and safe random key. Race 20 same-ID uploads and two different payloads; one metadata owner, no deletion of its object.
- [x] Pin failures: PUT reject produces no INSERT; INSERT throw before commit retains unclaimed bytes; commit-then-throw retains winner bytes and same-ID retry recovers; cleanup failure retains loser bytes and records a sanitized error. Fake-clock 45-second storage timeout followed by a late PUT must never insert metadata. A disconnected response may complete once through the registered lifetime, never retry automatically.
- [x] Run `node --test tests/adminMedia.test.js`; expect upload routes/counters to fail before implementation.
- [x] Implement authenticated binary POST, 6/min binding, validation, SHA-256, one R2 PUT and conditional metadata insert using the sequence above. Reject CSRF/rate before reading the body and reject invalid data before D1. Preserve the exact existing 400/409/413/503 messages where the .NET contract defines them.
- [x] Run the focused tests; expect pass, including missing limiter/storage configuration failing closed. Record measured statements/rows and R2 operations; never count a failed/unknown operation as successful.

## Task 3: Archive with current-reference checks and preserved history

**Files:** Extend `mediaAssets.js`, `adminMedia.js` and `adminMedia.test.js`. Reuse `siteDocuments.js` unchanged unless a demonstrated contract issue requires a scoped correction.

**Interfaces:** `archiveMediaAsset(db,id,revisions:Map<string,bigint>) -> Promise<boolean>`. `readDocumentBackup(db,time)` supplies current drafts/publications plus exact revisions; fill absent `pricing/content/pages` revisions with `0n`. Private iterative JSON traversal checks exact string equality with the asset URL.

- [x] Add failing `archiveReferenceAndHistory`, `archiveRevisionRace` and `archiveDatabaseBudget`: references nested in all three document types block with `media_referenced`; URL substrings do not block; duplicate archive 204; missing 404; corrupt chunks fail without UPDATE. Match budgets for empty, shared-body and six-body snapshots.
- [x] Race a save/new document/publication against the archive check. Expect 409 when captured revisions change; no accidental archive or SQL retry. Remove current references, archive, then restore an older draft/publication: R2 bytes and the same URL remain available.
- [x] Run `node --test tests/adminMedia.test.js`; expect archive route/checks to fail.
- [x] Implement one revision-guarded UPDATE after the bounded snapshot checks. On zero changes, read the asset once to distinguish a completed concurrent archive from a changed document; return conflict for the latter. Never issue R2 DELETE on archive and never scan history.
- [x] Run the focused tests; expect pass, recorded normal archive cost 3–9 SQL, no R2 request and no private reference data in errors.

## Task 4: Compiled integration, full local recovery and handoff

**Files:** Add `tests/mediaRuntime.test.js`, `tests/mediaBackup.test.js`; extend only necessary test helpers. Modify `server/cloudflare/README.md` and `docs/cloudflare-integration-progress.md` with observed results/runbook.

**Interfaces:** Reuse existing Wrangler `createTestHarness`, test-only signed Access wrapper and actual D1/R2 bindings. Backup fixtures use isolated persistent source/destination folders beneath the phase4 task ledger, not root `.wrangler` or remote resources. Test-only public asset reads must not create a product authentication bypass or public backup endpoint.

- [x] Add failing `compiledMediaLifecycle`: compiled Worker with actual R2 PUT, all formats, 10 MiB bound, real limiter/CSRF, pagination, retries, reference conflicts and historical restoration. Exercise existing client `adminApi.upload` contract; assert no extra list GET after upload/archive and no SQL when selecting/editing locally.
- [x] Add `fullDatabaseAndR2Recovery`: populate a local source with synthetic inquiries/replies/documents/history, active+archived media and retained orphans; export SQL using installed Wrangler `d1 export DB --local --output <private-file> --config <source-config>`. The actual export exposed Int64 rounding; preserve that evidence, then export the closed local SQLite database read-only with installed Python stdlib. Restore the exact SQL with `d1 execute DB --local --file <private-file> --config <fresh-destination-config> --yes` into an empty destination. Native export emits schema first and rows in foreign-key dependency order; constraints remain enabled.
- [x] Copy actual R2 keys with paged `list` (`limit:100`, honor `truncated/cursor`), `get` and `put` one file at a time; preserve bytes and HTTP/custom metadata. Store a checksum/size/key manifest outside public R2/Git. Assert hashes, original keys/URLs, archived metadata, headers, all D1 rows/history/revisions and current/historical references match. No synthetic success response may substitute for a real binding or SQL export.
- [x] Run `node --test tests/mediaRuntime.test.js tests/mediaBackup.test.js`; expect missing routes/recovery assertions before completion, then pass after integrating Tasks 1–3 and test-local recovery tooling. Preserve RED evidence from earlier tasks; recovery exercise itself uses the installed tools rather than inventing a production export API.
- [x] Document manual operational recovery: a consistent D1 export plus complete R2 copy into private storage; pause operator media mutations during copying, verify manifests/referenced keys before claiming completion, restore to **empty isolated resources** first. Use non-destructive `rclone copy` for eventual remote object copies, not `sync`/prune. Actual account activation/custom domain and hosted restore verification remain phase 5 prerequisites.
- [x] Run `node --test --test-concurrency=1 tests/*.test.js` and existing Worker `npm run build` (dry-run). From `client`, run `node --test tests/admin.test.js`, `npm run lint` and `npm run build`. Worker123/123 and client16/16 pass; both builds pass. Server lint is clean; scoped client lint confirms nine unchanged warnings. Because .NET product code is untouched, preserve its last verified 127-test evidence rather than running live PostgreSQL fixtures.
- [x] Review complete diff/status for scope, secrets, debug code and preserved prior .NET changes; run `git diff --check`. The single fresh independent review found no Critical, Important or Minor issues. All four protected .NET hashes match the baseline. Measured SQL/R2 budgets and hosted limitations are recorded in the README and ledger; no commit or deployment occurred.

## Acceptance and next phase

- Existing library works against real local Worker/D1/R2, including actual upload bytes and archive controls, without product mocks or client redesign.
- The request/SQL/R2 table has measured evidence for success, rejection, duplicate, concurrency and archive paths.
- SQL/object export and restore preserve metadata, history, immutable bytes/URLs and references on fresh local resources.
- Failed/uncertain writes do not delete potentially committed assets or claim success; current references and previous published/history links remain protected.
- Progress ledger and task evidence support resuming after context compaction. No automatic commit or deployment.
- Local verification does **not** establish live R2 availability, cache/domain headers, Access login/logout in a real browser, remote backup recovery or Workers Free CPU fit. Configure/test those in phase 5 with the owner's accounts before production review.

## References checked for this plan

- Existing .NET and React contracts above are the primary application references.
- [R2 Workers binding API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/): PUT bytes, conditional creation, checksum/HTTP metadata and cursor-based listing.
- [R2 public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/): dedicated public custom domain; `r2.dev` is for development.
- [R2 with rclone](https://developers.cloudflare.com/r2/examples/rclone/): non-destructive object-copy tooling for the operational runbook.
- Installed Wrangler 4.149.0 `d1 export --help`, `d1 execute --help` and local export implementation: verified SQL export/import options and source persistence behavior. No remote command was run.

## Plan self-review

- Spec stage4 is covered by metadata/library (Task 1), upload/idempotency (Task 2), references/history (Task 3), and SQL/R2 recovery (Task 4); live account/domain provisioning is explicitly dependent on stage5 account setup.
- Named interfaces match across tasks; existing document reader handles bounded body sharing and preserves BigInt revisions for the archive guard.
- Each Review Focus condition has concrete assertions in its owning task. Counts are targets until actual binding tests measure them.
- Scope stays inside media/recovery integration. Existing UI, .NET fixes, production resources, design and earlier features remain protected.
