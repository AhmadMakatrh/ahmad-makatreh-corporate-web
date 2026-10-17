# Cloudflare Phase 3: Pricing, Content and Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Native execution in the current session is already selected. Steps use checkbox (`- [ ]`) syntax for tracking. No commit, push, branch switch, cloud resource creation, or deployment is authorized by this plan.

**Goal:** Connect the existing pricing/offers, bilingual content, pages, publication, history and document-backup controls to a locally tested Workers/D1 implementation, with no database requests while editing.

**Architecture:** Extend `server/cloudflare/` using the existing Access/CSRF boundary and public snapshot reader. Keep immutable chunked document bodies; change document pointers and append history in one conditional D1 transaction. Preserve the current React editors and .NET reference contracts; make only the narrowly scoped backup-file adjustment described below.

**Tech Stack:** Existing JavaScript ESM, Node >=22, Wrangler 4.149.0/workerd, D1 SQLite, Web Crypto SHA-256, existing `jose` 6.2.12. No new product dependencies.

**Spec:** `docs/superpowers/specs/2026-10-12-cloudflare-integration-design.md`, stage 3. Resume context: `docs/cloudflare-integration-progress.md`; phases 1 and 2 are complete locally. Status: owner approved this written plan on 2026-10-12; all five tasks and the single final review/fix pass are complete locally. Final verification: Worker105/105 and client16/16, both builds pass. Hosted integration remains phases4/5.

## Global Constraints

- الإدارة: `admin.ahmad-makatreh.vip`؛ يبقى مصدر الواجهة داخل `client/src/admin/`.
- تُحفظ عقود JSON وأسماء الحقول والحالات وHTTP status codes التي تستعملها الواجهة الحالية.
- نقل الحفظ والنشر واستعادة المنشور والتاريخ واستعادة المسودة ونسخ المستندات؛ revision متفائل يمنع فقد تعديل جلسة أخرى.
- تحديث المستند وسجل النسخة في عملية ذرية. لا حفظ تلقائي أثناء التحرير أو ترتيب الأقسام.
- `GET /api/site` يرجع snapshot المنشور فقط؛ لا مسودات أو بيانات طلبات أو سجل خاص داخل الاستجابة العامة أو cache المشترك.
- TTL لا يتجاوز 30 ثانية، وETag، وإبطال cache المحلي عند النشر. Do not promise immediate invalidation of another isolate or an already cached browser response.
- لا polling ولا autosave ولا refresh API لكل render. Client GET cache remains 60 seconds, 40 entries, with shared pending reads and action-specific invalidation.
- Preserve admin Access, CSRF and 120/60 authenticated-email limit, booking 9/60, reply 6/60, existing inquiry endpoints, .NET source and production configuration.
- Reject bad authentication, key, method, CSRF, body or schema before D1 where applicable. Admin responses are `no-store`; no private shared cache, automatic write retries, or sensitive log values.
- R2 uploads/media-reference administration remain phase 4; live accounts, Access logout, network/browser checks and deployed CPU/quota measurement remain phase 5.

## Review Focus

1. Simultaneous first saves, duplicate retries, save-versus-publish and restore-versus-save must produce one winning revision/history entry without orphan chunks. Task 2 tests real D1 concurrency and failed-batch rollback.
2. Arabic and emoji across chunk boundaries, large valid bodies, and malformed UTF-8 must neither corrupt content nor exceed a D1 row limit. Tasks 1, 2 and 5 test the actual Worker path.
3. Publication during a pending public read must not make that old promise serve new requests or overwrite the new cache. Task 3 tests two gated reads and stable/changed ETags.
4. A backup taken during saves/publication must retain matching revision/body pointers and restore only a selected draft. Task 4 tests immutable pointers, all six maximum-size bodies and the client's file acceptance.
5. Unsafe URLs, prototype paths, unsupported dataset fields, numeric/date boundaries, and a stale or overflowing revision must fail without altering publication/history. Tasks 1–3 pin these inputs and long-integer wire behavior.

## Inspected source and change boundaries

Contract references, all read before planning:

- `server/src/AhmadMakatreh.Api/Endpoints/AdminSiteEndpoints.cs`.
- `server/src/AhmadMakatreh.Application/Validation/SiteDocumentValidator.cs`, `Models/SiteContentModels.cs`, `Interfaces/ISiteDocumentRepository.cs`.
- `server/src/AhmadMakatreh.Domain/Entities/SiteDocument.cs`, `SiteDocumentVersion.cs`.
- `server/src/AhmadMakatreh.Infrastructure/Persistence/PostgreSql/PostgreSqlSiteDocumentRepository.cs`.
- `server/tests/AhmadMakatreh.UnitTests/Application/SiteDocumentValidatorTests.cs`, `Infrastructure/SiteDocumentHistoryTests.cs`.
- `client/src/admin/{adminApi.js,DocumentEditor.jsx,DocumentHistory.jsx,PricingEditor.jsx,ContentEditor.jsx,PagesEditor.jsx,BackupEditor.jsx}`, `client/tests/admin.test.js`.
- `server/cloudflare/src/{admin.js,adminAccess.js,httpJson.js,publishedSite.js,index.js}`, both existing migrations and isolated D1/runtime test helpers.

Proposed focused modules: `siteDocumentValidator.js` (schema), `siteDocumentWire.js` (revision JSON), `documentBodies.js` (bounded encoding/decoding), `siteDocuments.js` (D1), `adminDocuments.js` (routes). Add migration `0003_site_documents.sql`. Modify `admin.js` only to dispatch authenticated document routes; pass the same `siteReader` from `index.js`. Extend `httpJson.js` with an optional parse callback while preserving its current default behavior and inquiry/booking limits. Reuse body decoding in `publishedSite.js` and repair its pending-read invalidation.

The existing client backup reader accepts only 10,000,000 bytes, whereas three drafts plus three published Arabic bodies can exceed that. Scope a compact JSON export and **32 MiB** import-file limit to `BackupEditor.jsx` via a small tested helper `documentBackup.js`; keep the same format, confirmations, selected-document restoration and UI. All other client and .NET files are protected from implementation changes.

## Contracts and validation

Only `pricing`, `content`, `pages` are valid document keys. Unknown keys return 404; unsupported methods 405.

| Endpoint under `/api/admin` | Request | Response / behavior |
| --- | --- | --- |
| `GET /documents/{key}` | None | `{key,revision,draft,publishedAtUtc,hasPrevious,isPublished}`; absent document is revision 0, draft/timestamp null, flags false |
| `PUT /documents/{key}` | `{expectedRevision,data}` | `{revision:expectedRevision+1}`; invalid input 400, stale revision 409 |
| `POST /documents/{key}/publish` | `{expectedRevision,restorePrevious:false}` | `{revision,publishedAtUtc}`; revision >=1; already-published/stale/unavailable previous version 409 |
| `GET /documents/{key}/history` | Optional `before` positive Int64 | `{items,nextBefore}`; 25 summaries plus one look-ahead, no COUNT and no document bodies |
| `POST /documents/{key}/restore` | `{revision,expectedRevision}` positive Int64 | `{revision,draft}`; missing history version 404, invalid stored schema 400, stale current revision 409; never publishes |
| `GET /backup/documents` | None | `{format:'ahmad-site-documents',version:1,exportedAtUtc,documents:[{key,revision,draft,published}]}`; max three documents; no history or previous-publication payload |

History summary fields: `revision,action,actor,createdAtUtc`. Actions: `save`, `publish`, `rollbackPublished`, `restore:<sourceRevision>`. Actor always comes from verified Access email; timestamps use existing `utcNow(now())`. Previous-publication restoration swaps the two published pointers and leaves the draft unchanged. Repeating a stale save/publication returns 409 without a second version; it does not automatically reload and retry.

Revision counters are .NET `long`, not DateTime ticks. Preserve numeric JSON, use BigInt internally for 0–9223372036854775807, bind decimal strings to SQLite INTEGER comparisons, and select revisions as text to avoid D1 Number rounding. Require room for increment before mutation; reject overflow without SQL. Root request integer literals and response integer serialization use built-in JSON source context / `JSON.rawJSON`; verify them in compiled workerd before relying on them. The existing browser parses numbers as before; no new string revision contract.

Document JSON: object, <=1,500,000 UTF-16 units of its serialized body and depth <=24. Document-mutation envelopes alone get a bounded **6 MiB** request limit; other admin JSON stays **2 MiB**, booking **64 KiB**. Keep UTF-8 and RTL text; preserve valid data rather than applying generic sanitization. Mirror source error messages.

- Identifiers: `^[a-z][a-z0-9-]{0,29}$`, unique within the relevant collection. Reserved pages: `admin,api,home,about,services,capabilities,work,journal,booking,start-project,startproject,page,contact,assets,images`.
- Pricing: <=50 packages and <=50 offers. Nonblank bilingual titles <=200 units; descriptions <=2000. Package prices null or 0–1,000,000 with <=2 decimal places; each language <=20 features, each <=500. Offers <=50 distinct known priced packages, discount >0 and <=100; optional price >=0, below base price, <=2 decimals. Date values null or valid explicitly zoned instants, with start < end when both are set. Validate optional booleans/arrays/strings as the .NET deserializer does; preserve its defaults.
- Pages: <=100 pages, <=40 sections/page, types `hero,text,image,cards,cta`; unique section IDs, bilingual section title/alt/link label <=300, body <=20000. <=30 cards/section, title <=300, body <=4000. Preserve visibility/navigation flags and section order.
- Content: only `ar,en,assets,overrides,datasets`. Copy <=2000 keys/language, key <=120, string <=20000; forbid `__proto__,constructor,prototype`. Assets whitelist `heroImageUrl,brandLogoAr,brandLogoEn,cvUrl,linkedinUrl,instagramUrl,whatsappUrl`, <=30 entries.
- Overrides: <=10000 scalar entries; 2–16 path parts <=120 each, rooted in `projectCards,projectContributions,caseStudies,projects,articles`; reject empty parts and `__proto__,constructor,prototype,length,id,slug,key,mode,type,descriptionKey`. String <=40000; validate URL/src endings.
- Datasets: only `projectCards` (<=100), `projectContributions` (<=100), `articles` (<=200). `caseStudies`/`projects` remain valid override roots, **not** new datasets. Reject unknown properties, including nested dataset properties, as `DatasetOptions` requires. Preserve all optional fields from `SiteContentModels.cs`; media modes `single,slideshow,stack`, <=30 images with bilingual captions <=300; contribution lines <=50/language, each <=2000. Articles unique by slug+language, plain text only, title <=200 (required when visible), summary <=4000, content <=40000, date <=100, <=20 labels each <=100.
- URLs: empty/null allowed where the source permits; <=2048, no backslash/control characters, a local leading `/` without `//`, or absolute HTTPS without credentials. Reject unsafe schemes and malformed values before SQL.

Offer start/end evaluation remains in existing client catalog functions using published data; no periodic database checks or new cron.

## Storage and database budget

Add `revision INTEGER NOT NULL DEFAULT 0`, `draft_body_id`, `previous_published_body_id`, three nullable SHA-256 metadata fields (`draft_sha256,published_sha256,previous_published_sha256`), nullable `updated_at_utc,published_at_utc`, and `mutation_id` to `site_documents`. Keep `published_body_id` and existing chunk rows untouched. Existing published rows become revision 1 with draft pointing to their existing publication; unknown timestamps/hashes stay null. Do not fabricate historical versions or dates. Unpublished empty slots stay revision 0.

Create `site_document_versions(document_key,revision,action,actor,created_at_utc,body_id)` with primary key `(document_key,revision)` and constrained actions/keys. This primary key serves bounded descending history pagination; do not add speculative indexes. Versions reference immutable bodies; publication and history restore reuse body pointers instead of copying chunks. Retain historical bodies, with no unapproved retention policy or scheduled garbage collection.

Reuse **524288-byte** BLOB parts, numbers 0–9, from migration 0001. Validate complete contiguous parts, fatal UTF-8 decoding, object/length/depth. A UUID identifies each newly saved body; its SHA-256 supports equality without rereading full bodies in common publication checks. For pre-migration bodies with unknown hashes, use indexed bounded chunk equality within the same query; do not mutate data just to fill a cache/hash during GET.

Atomic new-body save: insert P chunks with `INSERT ... SELECT` guarded by the expected document revision; CAS insert/update the document and a unique mutation ID; insert history only where that mutation ID owns the resulting revision. All **P+2 statements in one `DB.batch`**. Identical guards and no gaps between operations are essential: a stale request writes zero chunks/history, and any constraint error rolls back the whole batch. Existing-body restore and publication each use two conditional statements in a batch. No write is scheduled after returning success.

| Action | HTTP when not served by existing client memory | D1 budget target |
| --- | ---: | --- |
| Typing, local search, changing fields/order/language, preview, offer timing | 0 | 0 |
| Session | 1 GET | 0 SQL |
| Open/refresh one document | 1 GET | 1 SELECT, metadata + <=10 draft chunks; use look-ahead limit 11 to detect corrupt excess |
| Save entire draft | 1 PUT | 1 atomic batch, P+2 statements (3–12), no pre-read or post-save reload |
| Publish / restore previous publication | 1 POST | 1 atomic batch, 2 statements; reuse stored bodies |
| Open history / older page | 1 GET | 1 SELECT <=26 metadata rows |
| Restore historical draft | 1 POST | 1 bounded SELECT of version body, then 1 batch of 2 statements; no chunk duplication |
| Export document backup | 1 GET | 1 metadata SELECT <=3 rows, then <=6 bounded body SELECTs, deduplicated by body ID; <=7 statements total |
| Import selected backup document | 1 GET review + 1 PUT confirmation | Same document-read and draft-save budgets; local file selection/validation does 0 SQL |
| Public snapshot cache hit | 1 GET per full page load | 0 SQL |
| Public snapshot cache miss | 1 GET | Existing 1 SELECT <=30 published chunks; concurrent reads share one pending request |
| Invalid identity/CSRF/key/schema/overflow | As attempted | 0 SQL |

P is 1–10. A batch is one database round trip, **not** one SQL statement or one billed row. Measure `rows_read/rows_written` where D1 metadata is exposed, and report unavailable values as unavailable. Chunk inserts and history writes affect storage/index billing; no capacity claim follows from these targets.

Backup body reads are intentional: snapshot <=3 rows' immutable pointers once, then decode one distinct body at a time to avoid holding six large BLOB result arrays simultaneously in a 128 MB Worker. No N+1 per field/page/card. Neither a concurrent save nor publication can change those bodies after the metadata snapshot. Compact export is <=six validated bodies plus the small envelope; 32 MiB covers their <=27,000,000 UTF-8 bytes plus metadata. Test maximum data in workerd; real hosted CPU/peak memory and Workers Free suitability remain deployment gates in phase 5.

## Task 1: Complete schema and revision wire validation

**Files:** Create `server/cloudflare/src/siteDocumentValidator.js`, `siteDocumentWire.js`, `tests/siteDocumentValidator.test.js`, `tests/siteDocumentWire.test.js`; modify `src/httpJson.js` only for an optional parser callback.

**Interfaces:** `validateSiteDocument(key, data, serializedJson = JSON.stringify(data)): string|null`; `safeDocumentUrl(value): boolean`. `parseDocumentRequest(text): object` preserves only root `revision/expectedRevision` as BigInt; `parseDocumentRevision(text, minimum = 0n): bigint|null`; `revisionJson(revision): JSON raw-number object`. `readJson(request,maxBytes,parse = JSON.parse)` retains the existing result shape. Tests must prove nested content fields named revision are not converted.

- [x] Write failing Node tests named `pricingLimitsAndSchedule`, `pagesLimitsAndReservedSlugs`, `bilingualCopyAndLegacyOverrides`, `datasetsAndNestedUnknownFields`, `unicodeAndDepthLimits`, `urlAndPrototypeBoundaries`, `exactLongRevisionWire`. Assert every numeric/count/string boundary above, source unit-test fixtures, and current client default catalog/copy/dataset values.
- [x] Run `node --test tests/siteDocumentValidator.test.js tests/siteDocumentWire.test.js`; confirm failure from missing production exports, not a fixture error.
- [x] Implement these functions with source-compatible null/default/type behavior and error messages. Validate money decimals without floating-point multiplication equality; compare zoned instants at source precision. Keep serialized data numeric types, avoid string coercion and prototype mutation.
- [x] Run the same tests plus `tests/bookingApi.test.js tests/adminApi.test.js`; expect all passing with existing body limits unchanged. Record the task's scoped diff and evidence, without a commit.

## Task 2: Atomic chunked documents and bounded history

**Files:** Create `server/cloudflare/migrations/0003_site_documents.sql`, `src/documentBodies.js`, `src/siteDocuments.js`, `tests/siteDocuments.test.js`; extend `tests/helpers/d1.js` with `applyDocumentMigration(db)`.

**Interfaces:** `prepareDocumentBody(json): Promise<{json,parts:Uint8Array[],sha256:string}>`; `decodeDocumentBody(rows): {json,data}`. Repository exports `getDocument(db,key)`, `saveDraft(db,key,prepared,expectedRevision,actor,time,{action='save',existingBodyId=null}={})`, `publishDocument(db,key,expectedRevision,restorePrevious,actor,time)`, `listDocumentHistory(db,key,beforeRevision)`, `getDocumentVersion(db,key,revision)`. Save/publish return boolean CAS outcome; getDocument/history use the contract DTOs with BigInt revision internally. getDocumentVersion returns `{revision,bodyId,json,data}` or null for the internal restore flow. History default before is 9223372036854775807n, matching .NET, 26 rows maximum. Existing-body IDs come only from validated internal version reads, never a caller-supplied pointer.

- [x] Write failing real-D1 tests `migrateEmptyAndPreviouslyPublished`, `saveAllThreeKinds`, `twentyConcurrentFirstSaves`, `staleSaveLeavesNoOrphanBodies`, `savePublishAndRestoreRace`, `historyTwentyFivePlusOne`, `reusePublicationAndRestoredBodies`, `rollbackOnHistoryConstraintFailure`, `identicalPublicationRejected`, `unicodeAcrossChunksAndLongRevision`. Assert one winner/one version, unchanged other keys/publication, complete rollback and the budget table.
- [x] Run `node --test tests/siteDocuments.test.js`; confirm missing migration/module failures. Use isolated local databases only.
- [x] Implement the additive migration and repository algorithm above. Select revision integers with `CAST(... AS TEXT)` and return exact wire values through task 1. Check equality for identical data, not UUID equality alone. Stored-body errors must surface, with no partial successful result.
- [x] Run that test file and `tests/schema.test.js tests/publishedSite.test.js`; expect preserved phase-1 publication bytes and no additional scheduled cleanup. Record SQL statements, batches, available row metadata and body/version counts.

## Task 3: Authenticated document routes and safe publication invalidation

**Files:** Create `src/adminDocuments.js`, `tests/adminDocuments.test.js`; modify `src/admin.js`, `src/index.js`, `src/publishedSite.js`; extend `tests/publishedSite.test.js` with the pending-invalidation race test.

**Interfaces:** `createAdminDocumentHandler({now=Date.now,siteReader})` returns `(request,env,identity,access):Promise<Response|null>`; null means path not owned. `createAdminHandler({fetcher=fetch,now=Date.now,siteReader}={})` preserves its existing callers; `createApi` supplies its shared reader. Dispatch after Access and the existing general admin limit, before inquiry-only route rejection. Reuse `access.validateMutation`, `readJson`, task-1 validation and task-2 repositories.

- [x] Write failing tests `exactAdminDocumentContracts`, `allInvalidInputsBeforeD1`, `privateDraftsAndHistoryNeverPublic`, `publishAndPreviousSwapPreserveDraft`, `historicalRestoreValidatesSchema`, `publicEtagAndLocalInvalidation`, `pendingReadCannotServePostPublishRequest`. Pin the endpoint table, error statuses/messages, and zero SQL for rejected requests.
- [x] Run `node --test tests/adminDocuments.test.js tests/publishedSite.test.js`; confirm document routes currently return 404 and the newly covered in-flight case fails.
- [x] Implement GET/PUT/publish/history/restore. Each route enforces its method/schema/CSRF before SQL, applies the 6 MiB limit only to document mutations, and reports successful revision without refetching. Invalidate the shared reader only after committed publication. In `invalidate()`, detach the old pending promise; its completion must not clear/repopulate a newer pending read/cache. Reuse task-2 chunk decoder for the public reader while preserving its single-query budget.
- [x] Run those tests and all existing admin/inquiry/access tests; assert inquiry response contracts and rate settings are unchanged. Failed/conflicting publication must not invalidate a valid snapshot.

## Task 4: Consistent backup and selected draft restoration

**Files:** Extend `src/siteDocuments.js`, `src/adminDocuments.js`; create `tests/documentBackup.test.js`, `client/src/admin/documentBackup.js`, `client/tests/documentBackup.test.js`; modify `client/src/admin/BackupEditor.jsx` only to use the helper.

**Interfaces:** `readDocumentBackup(db,exportedAtUtc)` returns the existing envelope via snapshot metadata + sequential distinct-body reads. Client helper `serializeDocumentBackup(data):string` returns compact JSON; `parseDocumentBackup(text,byteLength):object` enforces 32 MiB and the existing format/version/unique-known-key/draft-object checks. Server still revalidates selected data on PUT; opening a file is not server trust.

- [x] Write failing tests `backupEnvelopeAndSixBodies`, `backupSnapshotDuringPublication`, `duplicatePointersReadOnce`, `emptyBackupUsesOneSelect`, `selectedRestoreDoesNotPublishOrReplaceOtherKeys`, `largeUnicodeBackupCanBeReopened`, `malformedOrOversizedBackupRejectedLocally`. Assert max 7 SQL statements, max 10 parts per body, same chosen source/review/confirm workflow and no API call on file read.
- [x] Run `node --test tests/documentBackup.test.js` in the backend and `node --test tests/documentBackup.test.js` in the client; expect missing exports/route failures.
- [x] Implement only the listed helper calls and export route; do not add a bulk import endpoint or auto-publish. Snapshot metadata once, retain stable old body pointers during concurrent mutations, and surface missing/corrupt bodies as failure. Keep backup-history/media/full-database exclusions explicit.
- [x] Run both new test files and `client/tests/admin.test.js`; verify compact export bytes are below 32 MiB for maximum valid fixtures and invalid files cause zero requests. Record the two narrow client changes and preserve its confirmations/messages.

## Task 5: Compiled runtime, request accounting and handoff

**Files:** Create `tests/documentsRuntime.test.js`; modify only migration-count assertions from 2 to 3 in `tests/runtime.test.js` and `tests/adminRuntime.test.js`. Update `server/cloudflare/README.md` and `docs/cloudflare-integration-progress.md` with actual results/budgets.

- [x] Write compiled-workerd tests `realDocumentLifecycleAndIsolation`, `largeArabicDocumentAndSixBodyBackup`, `exactInt64WireInWorkerd`, `documentRequestBudget`. Reuse real RSA Access/CSRF and isolated D1 migrations; stub outbound providers only inside test helpers. Assert the third migration applies once, then save/publish/history/restore/export work with unchanged publication/privacy and actual limits. Validate each maximum fixture against task 1 before seeding it directly in the isolated database; also submit a large valid Arabic document through the actual PUT endpoint to prove its request limit and encoding.
- [x] Run `node --test tests/documentsRuntime.test.js`; confirm the scoped failures, then implement only missing integration behavior exposed by those failures. Verify no document-edit autosave, polling, new cron, or post-save GET is introduced using existing client API/cache tests and inspected editor event handlers.
- [x] Run backend `node --test tests/*.test.js`, backend oxlint, and `node node_modules/wrangler/bin/wrangler.js deploy --dry-run --outdir dist`. Run client `node --test tests/*.test.js`, oxlint and `node node_modules/vite/bin/vite.js build`. Require zero failed/skipped tests and no new lint/build errors; distinguish existing warnings.
- [x] Review scoped before/after diffs, protected .NET/client hashes, secrets/debug/whitespace scans and migration preservation. Obtain one fresh independent final review under executing-plans, resolve material findings with their regression tests, and update the ledger after every task. No implementation-agent delegation.
- [x] Report implemented vs tested vs pending hosted verification, exact file list and measured query metadata. CPU/peak memory/free-tier adequacy, browser/network trace, cloud resources and production deployment remain unverified until phase 5; never claim local work proves those.

## Self-review and execution handoff

Stage-3 spec coverage: pricing/offers/schema (task 1), save/history/CAS (task 2), authenticated publication/previous version/draft restore/cache privacy (task 3), document backup/selected restoration (task 4), runtime/accounting/regression evidence (task 5). All five review-focus risks have named tests. Interface names and body/revision types are consistent across tasks. The client backup helper is necessary for the promised round trip; its scope is included explicitly.

Native execution remains the previously approved method. The owner approved this new phase-3 plan before implementation; that review gate is satisfied. Do not re-request the approved architectural design or phases 1/2.

## Official references verified 2026-10-12

- [D1 database / batch](https://developers.cloudflare.com/d1/worker-api/d1-database/): batch rollback/transaction semantics and statement metadata.
- [D1 limits](https://developers.cloudflare.com/d1/platform/limits/): 2,000,000-byte row/BLOB limit; 100 parameters/query; 50 queries/invocation on Workers Free. A batch still counts its statements.
- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/): 128 MB memory, Free CPU 10 ms; local tests are not deployed measurements.
- [ECMAScript structured data](https://tc39.es/ecma262/multipage/structured-data.html#sec-json.rawjson): JSON source context and raw numeric serialization. An isolated Node v24.18.0 capability probe preserved `9223372036854775806` and left nested revision data numeric; compiled workerd verification is still required in task 5.
