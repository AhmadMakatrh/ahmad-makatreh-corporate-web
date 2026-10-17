# Supabase Storage Phase 5B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans task-by-task. Native execution in the current session is already selected; do not ask again. Steps use checkbox (`- [ ]`) syntax. The owner approved the written spec and this plan on2026-10-13; execution is in progress. Project instructions prohibit automatic commits, pushes and branch switches. Approval authorizes the isolated private resources described below; it does not authorize production or billing changes.

**Goal:** Add Supabase Storage to the existing media workflow, preserve its contracts and database budgets, and prepare/test private hosted preview resources without adding a payment method.

**Architecture:** A small storage adapter isolates R2 binding calls from Supabase HTTPS calls. Existing Workers authentication, upload identity, D1 metadata, reference checks and React client stay in place. Separate operator commands copy/verify file bytes for recovery; the library never lists Storage objects or signs each image.

**Tech Stack:** Existing JavaScript ESM, Node>=22, Wrangler4.149.0/workerd, D1, Web Crypto, built-in fetch and Node file tools. Existing R2 local tests remain. No new dependency or schema migration.

**Spec:** `docs/superpowers/specs/2026-10-13-supabase-storage-design.md`. Resume: `docs/cloudflare-integration-progress.md`. This plan replaces only the pending storage/private-Worker parts of Phase5A; its D1 task is complete. General site/Access/Turnstile/Brevo/media publication and production rollout remain subsequent Phase5 work.

## Global Constraints

- Preserve the existing API fields/statuses, UTF-8/Arabic, UTC/cursors, Access identity/email/host/Origin/CSRF checks, upload6/60 and admin120/60; booking9/60 and reply6/60 remain unchanged.
- One binary POST from the client. UUID remains stable on retry; PNG/JPEG/WebP/PDF only, maximum10485760bytes. No autosave, polling, per-field request, HEAD/list before upload, automatic write retry, database keep-alive, or new browser dependency.
- Target Cloudflare account `fe25e25f13db2c636fd743e41c8a47e1`; Worker `ahmad-makatreh-preview`; existing D1 `ahmad-makatreh-preview`, UUID `7b1d12c7-8d63-49c2-b9ec-fec22dfc5f3f`. Do not recreate/reapply0001–0004, query `data_base_1`, or modify Worker `ahmad-makatreh-site`.
- Supabase project URL `https://kghmejpjvbmcivnlnkgf.supabase.co`, shown as **Ahmad Porto/RUQOSH/Free** in the owner's screenshot. API key/account permissions and live settings are not verified. Pin project and bucket before any operation.
- Main preview bucket `ahmad-makatreh-media-preview`; isolated recovery bucket `ahmad-makatreh-media-restore-preview`. Both private, limit10485760bytes, allowed MIME types `image/png,image/jpeg,image/webp,application/pdf`. Reuse only resources proven to belong to this plan; an unexpected collision requires clarification, not deletion.
- Worker config keeps `workers_dev:false`, `preview_urls:false`, `routes:[]`, `triggers:{crons:[]}`, compatibility_date`2026-09-05` and namespaces10122030–10122033. No public endpoint, DNS, cron activation, production traffic, paid upgrade, R2 activation or subscription.
- Runtime secret `SUPABASE_SECRET_KEY` is server-only and stored in Cloudflare secrets. Never print/read it into chat, logs, artifacts or source; never use `VITE_*` or modify real environment files. A one-time operator test may receive the owner's key in the child process environment, in memory only, without saving it to a file; the agent does not request its value.
- Preserve all previous uncommitted files, especially the four .NET test fixes. Client source, .NET, local/test Wrangler configs, package manifests and locks require no changes. Archived or uncertain objects are retained; no lifecycle/prune/orphan job.
- Record per-operation SQL statements and available rows-read/written separately from Storage HTTP and provider-managed metadata. Budgets are measured, not capacity guarantees. Restore/test data are synthetic and isolated; no third-party stress test.

## Review Focus

1. A partially configured Supabase mode with an existing R2 binding must fail closed; a redirect/error must not leak a secret or silently write to R2. Task1 pins this.
2. Twenty competing uploads, uncertain commits, late Storage completion and failed cleanup must preserve the D1 winner and its bytes. Task2 pins these outcomes and their additional operations.
3. A private bucket can still have unsafe existing RLS write policies for publishable-key callers. Task5 checks both private reads and anonymous writes; a missing API key is not proof of the actual policy.
4. A copy into a different bucket may contain correct bytes while document URLs still point at the source. Tasks3/5 verify destination downloads explicitly and report URL remapping as a later integration gate.
5. An unknown provisioning outcome, wrong account or mistaken restore destination must not recreate/overwrite production resources or claim readiness. Tasks3/4 require explicit targets, emptiness and recorded outcomes.

---

## File map

| File | Responsibility |
| --- | --- |
| Create `server/cloudflare/src/mediaStorage.js` | Provider selection, safe URL generation, PUT-equivalent upload and own-key cleanup |
| Modify `server/cloudflare/src/adminMedia.js` | Use the adapter with current validation, deadline and D1 workflow |
| Modify `server/cloudflare/src/admin.js` | Pass its existing `fetcher` into the media handler |
| Create `server/cloudflare/tests/mediaStorage.test.js` | Adapter contract, configuration, HTTP/errors/secret safety |
| Create `server/cloudflare/tests/helpers/supabaseStorageFixture.js` | Test-only HTTP responses and stored bytes/counters/failure controls |
| Create `server/cloudflare/tests/supabaseMedia.test.js` | Existing API contracts, true local D1 and Storage fixture |
| Create `server/cloudflare/tests/helpers/supabaseRuntimeWorker.js` and `tests/supabaseMediaRuntime.test.js` | Compiled Worker, unchanged client and counted outbound calls |
| Create `server/cloudflare/scripts/supabaseMediaTools.js` | Explicit operator probe, file backup and empty-target restore; no scheduled execution |
| Create `server/cloudflare/tests/supabaseMediaBackup.test.js` | Manifest/bytes recovery plus real local D1 export/import |
| Modify `server/cloudflare/wrangler.preview.jsonc` and `tests/previewConfig.test.js` | Approved storage-provider switch with existing safety guards |
| Modify `server/cloudflare/.dev.vars.example` and `README.md` | Blank/example settings and safe operator instructions; never real secrets |
| Update this plan, spec status and `docs/cloudflare-integration-progress.md` | Accurate state and restart instructions |

Evidence/ledger: `.superpowers/sdd/2026-10-13-supabase-storage-phase-5b/`. Synthetic test artifacts may live there; real backup files must be private and outside Git. Do not put credentials in evidence.

### Task 1: Tested storage adapter

**Interfaces:** Create `getMediaStorage(env,{fetcher=fetch}={}) -> null | Storage` in `src/mediaStorage.js`. `Storage` exposes `urlFor(key,contentType)->string`, `put(key,bytes,{sha256,contentType,metadata={},cacheControl,signal})->Promise<void>` and `remove(key)->Promise<void>`. `metadata` is an optional JSON object for restoring available custom metadata; normal uploads supply only their hash. Optional cacheControl preserves copied headers while defaulting to the current directive (Task1 ledger ruling). The factory performs no network/SQL.

- [x] Record working-tree baseline and file hashes before source changes. Read the approved spec, AGENTS and existing media tests in full; preserve previous edits.
- [x] Write `mediaStorage.test.js` failing tests named `providerSelectionFailsClosed`, `supabaseBinaryUploadAndUrl`, `storageErrorsAndSecretSafety`, `boundedCleanup` and `r2AdapterCompatibility`. Assert missing provider selects current R2, explicit `r2`/`supabase` work, unknown mode and missing/malformed Supabase settings returnnull, and R2 is never called after selected Supabase fails. No config check may issue HTTP.
- [x] Pin HTTP assertions: POST to the encoded `/storage/v1/object/{bucket}/{key}`, exact binary bytes, detected Content-Type, current cache directive, `x-upsert:false`, modern key on `apikey`, no Bearer legacy JWT, redirect rejection and custom hash metadata. Assert image URL is canonical and PDF URL ends with `?download`. URI construction rejects traversal/control characters and never accepts caller-supplied origin/path.

```js
assert.equal(request.method,'POST'); assert.equal(request.headers.get('x-upsert'),'false');
assert.equal(request.headers.get('apikey'),fakeSecret);
assert.equal(request.redirect,'error');
assert.deepEqual(new Uint8Array(await request.arrayBuffer()),bytes);
assert.equal(getMediaStorage(partiallyConfiguredEnv,{fetcher}),null);
assert.equal(r2Calls,0);
```
- [x] Pin failures: non-2xx, malformed/unexpected acknowledgment, redirect, network rejection, abort and an oversized error response never resolve as saved. Capture console/error strings and assert the fake secret and raw provider error body are absent. Storage response parsing is bounded to16KiB; logs use fixed messages/error classes.
- [x] Run `node --test tests/mediaStorage.test.js` from `server/cloudflare`; expected RED from missing export/module.
- [x] Implement the factory. Default R2 uses existing HTTPS base validation, conditional `If-None-Match:*`, SHA-256 and HTTP metadata. Supabase validates root HTTPS `*.supabase.co` origin, bucket identifier and nonempty `sb_secret_` key without control/whitespace characters; no client key or automatic fallback. Encode key segments and reject empty/dot/backslash/control segments. Parse acknowledgment according to the verified official API contract; don't accept a mismatched returned object key.
- [x] Implement Supabase cleanup as one DELETE to `/storage/v1/object/{bucket}` with `{prefixes:[key]}`, exact own key and an independent3000ms abort deadline. No list, retry or broad prefix deletion. `put` accepts the operation signal from Task2. HTTP fixtures stay under `tests/`; product uses real fetch.
- [x] Run the adapter tests; expected GREEN. Verify R2 HTTP/custom behavior matches the original product. Do not commit.

### Task 2: Integrate with the protected upload and prove budgets

**Interfaces:** Extend `createAdminMediaHandler({now=Date.now,fetcher=fetch}={})`, without changing its returned `(request,env,identity,access,ctx)` handler. `createAdminHandler` passes its existing `fetcher`; `createApi({fetcher,now})` needs no signature change. Consume Task1 `Storage`; retain `getMediaAsset/insertMediaAsset/listMediaAssets/archiveMediaAsset` unchanged.

- [x] Create test-only `createSupabaseStorageFixture({origin,bucket,secret}) -> {fetcher,objects,counts:{uploads,removals,list,downloads,upserts},reset}` in the mapped helper. Store actual copied bytes and metadata, return documented acknowledgments, enforce upsertfalse, and count HTTP operations/upsert attempts. Per-test handlers can delay/fail a response; unmatched requests throw. Compose its fetcher with the existing Access fixture for JWKS rather than bypassing authentication.
- [x] Write `supabaseMedia.test.js` failing tests `oneRequestSupabaseUpload`, `supabaseUploadConcurrency`, `supabasePartialFailures`, `supabaseLateUpload`, `supabaseAuthorizationBudget` and `supabaseArchiveHistory`. Use `mediaApiFixture`'s actual local D1 and signed test identity; override its API fetcher/env locally. Core assertions:

```js
assert.equal(f.counts.statements,2); assert.equal(storage.counts.uploads,1);
// Reset counters; explicit same-ID retry must return exactly the first asset.
assert.equal(f.counts.statements,1); assert.equal(storage.counts.uploads,0);
assert.equal(storage.counts.list,0);
```

- [x] Pin20 same-ID concurrent uploads to one D1 row/one returned URL, and mixed bytes to200/409. Failed Storage leaves no metadata; successful Storage with both precommit and committed-but-reported-failed INSERT retains the object. Same-ID retry after an actual commit recovers without a new upload. A losing INSERT deletes only its own key; failed deletion keeps it and logs safely. Missing `meta.changes` remains unknown.
- [x] Pin abort/deadline45s, late fulfillment and client disconnect, using mock timers and controlled promises. No INSERT after unconfirmed upload. Wrong JWT/CSRF/host/Origin, limiter failure, invalid file and10485761bytes produce zero SQL/Storage writes. Selected but incomplete Supabase configuration returns503 on upload and `configured:false` on library GET without Storage traffic.
- [x] Pin current reference/revision/archive/history behavior and pagination:25items with LIMIT26 and one SELECT, repeated archive1SELECT, normal archive3–9SQL, no Storage call on list/archive. Query counts include concurrent loser read/cleanup; don't present all concurrent uploads as one Storage operation.
- [x] Run `node --test tests/supabaseMedia.test.js`; expected RED because the media handler still requires R2.
- [x] Modify only media factory/URL/write/cleanup use in `adminMedia.js`, and pass `fetcher` in `admin.js`. Reuse the current45s deadline and `waitUntil`; provide an AbortController signal to Supabase while R2 preserves its noncancelable semantics. Keep D1 writes and cleanup decisions in their original order, with no speculative read/delete after uncertain outcomes.
- [x] Run both `supabaseMedia.test.js` and existing `adminMedia.test.js`; expected all GREEN. No weakening of identity, size, type or database tests.
- [x] Create the mapped compiled-runtime helper/test using existing Wrangler `createTestHarness`, signed identity, true local D1 and test-only Storage transport backed by actual local bytes. Reuse the unchanged `createAdminClient`. Assert client upload sends one POST, retry sends no extra Storage upload, and library cache/local update causes no fetch after upload/archive. Exercise all4types, PDFdownload,10MiB, pagination and independent Storage/SQL counters. The helper's fake key/policy controls never enter product or preview config.
- [x] Run `node --test tests/supabaseMediaRuntime.test.js`; expected GREEN in compiled workerd. Keep the existing R2 runtime test unchanged; this fixture is a local contract check, not evidence of Supabase hosted operation.

### Task 3: Operator file probe/backup/restore with verified recovery

**Interfaces:** Export `probeSupabaseMedia({env,directory,fetcher=fetch})`, `backupSupabaseMedia({env,directory,fetcher=fetch})` and `restoreSupabaseMedia({env,directory,fetcher=fetch})` from `scripts/supabaseMediaTools.js`; each returns `{files,bytes,httpRequests}`. Backup writes actual copied file bytes/manifest to the requested private directory; probe writes its synthetic evidence, and restore reads a backup. `env` uses Task1 names; probe additionally requires `SUPABASE_PUBLISHABLE_KEY`. CLI subcommands are `probe`, `backup`, `restore`, with required `--project-ref`, `--bucket`, `--directory`; flags must match the validated environment exactly. No secret-valued CLI argument.

- [x] Write `supabaseMediaBackup.test.js` failing tests `storageBackupAndEmptyRestore`, `restoreRefusesUnsafeTarget`, `corruptManifestOrBytesFails` and `probePoliciesAndSize`. Test103files over multiple bounded list pages, at least one folder, archived/uncertain orphan files, Arabic names/custom metadata, portable Content-Type/cache/hash, and downloads from the destination bucket itself. Use Task2 fixture instances `sourceStorage`/`destinationStorage`, resetting source counters after backup to detect a restore that reads the wrong bucket.
- [x] Pin rejection of wrong project/bucket confirmation, source==destination restore, nonempty destination, duplicate keys, unsafe disk paths, malformed manifest, mismatched hash/size and unsupported metadata/file limits. No failed validation may delete or overwrite a destination object. Manifest object keys map to safe disk file names rather than becoming filesystem paths.
- [x] Pin `existingProbeEvidenceRefusesAnotherUpload`: an existing probe/backup output is not overwritten or silently repeated. Use exclusive artifact writes; preserve unknown-outcome keys/evidence for inspection. This prevents a resumed operator command from creating another set of files merely to obtain a green report.

```js
assert.equal(restored.files,103);
assert.deepEqual(destinationBytes,sourceBytes);
assert.equal(restoredRevision,9007199254740993n);
assert.equal(sourceStorage.counts.uploads+sourceStorage.counts.downloads+sourceStorage.counts.list,0);
assert.equal(destinationStorage.counts.upserts,0);
```
- [x] Include real local D1 SQL export/import using the existing Phase4 precision-preserving helper with a closed database. Seed all8tables, media rows, draft/published/history, Arabic and revision9007199254740993. Restore into empty local D1; compare rows and exact Int64 values and resolve all referenced keys against restored bytes. Explicitly keep source URLs unchanged and record that destination-bucket publication needs later URL remapping.
- [x] Run `node --test tests/supabaseMediaBackup.test.js`; expected RED from missing tools.
- [x] Implement the operators with built-in fetch/crypto/fs only. List via documented POST `/storage/v1/object/list/{bucket}`,100entries/page with stable sort, recurse folders, and guard against repeated pages/prefix loops. Download sequentially with authenticated GET; limit each body to10485760bytes and compute SHA-256. Capture available custom metadata and portable headers; provider-generated IDs/timestamps are recorded, not forced onto restored objects.
- [x] Write manifest format `ahmad-site-supabase-media`, version1, containing source project/bucket and each key's safe disk file, byte length/hash/type/cache/custom metadata. No secrets/tokens or raw errors. Restore checks every file/hash before starting uploads, confirms an empty different private destination, preserves keys and portable metadata via Task1 adapter without upsert, and re-downloads every destination object for comparison. Do not delete partial results or retry an unknown write.
- [x] Implement `probe`: create5synthetic files (4formats plus10485760byte PNG-signature fixture), upload/download/hash each, and retain known keys for the recovery drill. Reject a larger file locally before any HTTP. Check both public URL and publishable-key private reads/writes: missing publishable key makes the policy check incomplete, and an unexpected successful anonymous write stops the probe. Do not delete existing policies or unrelated files to fix it. Limit requests with explicit deadlines and no retry.
- [x] CLI entrypoint validates exact target before work; reads credentials from its process environment and outputs only counts/outcomes. Owner injects a key temporarily through a hidden local prompt/secret manager; no environment file, shell-history secret, log or evidence value. Commands never run automatically or periodically. Follow original backups procedure to quiesce writes; unsafe snapshots are not called complete.
- [x] Run operator/recovery tests; expected GREEN. Add README instructions distinguishing files from SQL backup, private preview from public URLs, same-origin recovery from changed-origin remapping, and local fixtures from hosted proof. Leave the previous R2 recovery instructions intact as the still-supported local path.

### Task 4: Preview config and real private resources

**Interfaces:** Consume Tasks1–3 verified local implementation. Output actual bucket settings, Worker deployment/version and pinned bindings to the ledger. Resource operations require the owner's plan approval and usable account access; blocked account/UI work does not block independent local tasks.

- [x] Update `previewConfig.test.js`'s R2-specific expectation to the officially changed Supabase design before editing config: no `r2_buckets`, vars exactly `MEDIA_PROVIDER:'supabase'`, `SUPABASE_URL:'https://kghmejpjvbmcivnlnkgf.supabase.co'`, `SUPABASE_STORAGE_BUCKET:'ahmad-makatreh-media-preview'`. Keep exact account/Worker/D1, false URL flags, empty routes/crons and9/120/6/6 isolated namespaces; reject secrets/extra environments/bindings. Expected RED only for the requested provider switch.

```js
assert.equal(config.workers_dev,false); assert.equal(config.preview_urls,false);
assert.deepEqual(config.routes,[]); assert.deepEqual(config.triggers,{crons:[]});
assert.equal(config.r2_buckets,undefined);
assert.equal(config.vars.MEDIA_PROVIDER,'supabase');
assert.equal(config.vars.SUPABASE_SECRET_KEY,undefined);
```
- [x] Modify `wrangler.preview.jsonc` accordingly, retaining DB UUID and all guards. Add blank/nonsecret Supabase examples and `MEDIA_PROVIDER='r2'` to `.dev.vars.example`; do not edit real `.dev.vars`. Run config tests; expected GREEN. This changes the required behavior of the test, not a workaround for a failure.
- [x] Run complete Worker tests serially and preview dry-run as in final verification before deployment. Record bundle output without claiming10ms CPU fit.
- [x] Confirm Cloudflare identity with installed `wrangler whoami`, and record current `ahmad-makatreh-site` deployment for before/after comparison. On account mismatch stop external work. Record known D1 UUID; do not repeat schema queries or migrations merely for this storage switch.
- [ ] Inspect Supabase project/settings through a working approved browser/API session, or ask the owner to perform exact dashboard steps if tools remain unavailable. Do not read Edge profile/cookies. Check projectref, Free plan, existing buckets and policies; no card or paid addon. If the named bucket is absent, create it private with the exact size/MIME limits; record the real result. Unknown creation result requires an exact-name check before retry, not another create.
- [ ] Confirm that the bucket's existing/global policies do not grant anonymous INSERT/UPDATE/DELETE. An unsafe global policy can affect other buckets; report it for a scoped owner decision rather than deleting/replacing unrelated policies. Do not create public rules to make preview pictures render.
- [ ] Recheck private preparation Worker absence/recorded ID; deploy once with installed `wrangler deploy --config wrangler.preview.jsonc --message 'Phase5B private Supabase preparation'`. It may be deployed without the secret as a preparation resource; it is not operational until secret verification. Record version and D1/vars/rate bindings via `deployments list`/`versions view`, and verify no routes/workers.dev/version URLs/crons remotely.
- [ ] The owner places an existing suitable modern Supabase secret in Cloudflare's encrypted Worker secret `SUPABASE_SECRET_KEY`; credentials are entered by the owner, never posted in chat. A named new secret key requires the owner's explicit choice of that elevated access; do not silently rotate/delete existing keys. Verify secret name/type only, not value. Preserve fail-closed behavior when absent; do not inject a fake key to deploy.
- [ ] Recheck production deployment remains unchanged. Document provisioning separately from actual upload/Access/browser readiness. No live source resource is overwritten to resolve an unexpected collision.

### Task 5: Limited hosted Storage probe and recovery

**Interfaces:** Real private source bucket and operator tools fromTasks3–4. Temporary owner-provided `SUPABASE_SECRET_KEY` and nonsecret `SUPABASE_PUBLISHABLE_KEY` in the operator process; actual values remain private. A second private recovery bucket is explicitly within this plan's scope. This is not a product authentication bypass: it is an owner-operated storage test with no public app endpoint.

- [ ] Confirm source bucket limits/private settings and current quota once, without polling. Run from `server/cloudflare`: `node scripts/supabaseMediaTools.js probe --project-ref kghmejpjvbmcivnlnkgf --bucket ahmad-makatreh-media-preview --directory <private-synthetic-evidence>`. Expected5uploads/authorized byte/hash checks, including10MiB, and denied publishable-key/public access; record actual counts and statuses. A quota error/timeout is not a passing privacy check.
- [ ] If owner policy/key/account/UI setup is incomplete, leave this task pending and report the exact missing step. No automatic write retry, guessed success, global policy change, hosted traffic load or real customer file.
- [ ] After checking absence, create `ahmad-makatreh-media-restore-preview` private with the same limits in the same project; unknown outcomes are inspected first. No new Supabase project or unrelated D1 database is needed for this file drill.
- [ ] Run explicit `backup` against the source, then `restore` against the different empty recovery bucket using the recorded manifest. Expected all copied file hashes/sizes/types/cache/custom metadata verified by destination downloads; no source deletion and no overwrite. Include retained fixture/orphan files. Record HTTP/bytes against Supabase quotas. A metadata-only SQL dump or HTTP request to the source is not recovery evidence.
- [ ] Keep the files private and retained unless the owner requests removal of known test objects later. No lifecycle/prune policy. Store only synthetic counts/hashes/IDs and private test manifest, with no secret or user data in Git.
- [ ] Record limits of this result: direct Storage checks do not verify private Worker admin routes, Access, full hosted D1 export/Int64, production URLs, live browser/CPU or email. Those remain Phase5 integration gates, including URL mapping if publishing to another bucket/project.

### Task 6: Final verification, independent review and handoff

**Interfaces:** Completed local tasks and actual hosted results or explicitly pending steps. Output a truthful resumable ledger and scoped review; do not mark the whole plan complete while resource/policy/recovery steps remain outstanding.

- [x] From `server/cloudflare`, run `node --test --test-concurrency=1 tests/*.test.js` and `node node_modules/wrangler/bin/wrangler.js deploy --dry-run --config wrangler.preview.jsonc --outdir <evidence>/preview-bundle`. Expected all existing/new tests pass with no skips and a real bundle; config guards/pinned bindings match. Investigate actual regressions; don't broaden testing without a concrete risk.
- [x] Run client contract regression `node --test tests/*.test.js` from `client`; source client is unchanged. Run its build only if compiled integration reveals a client risk or another applicable gate requires it; a docs-only plan does not need a production build. No production deploy.
- [x] Review each current-task diff and baseline hashes, `git status` and `git diff --check`, scoped lint with the installed tools where applicable, apparent secrets and debug code. Existing unrelated edits/warnings stay untouched. Preserve .NET changes and all completed D1 setup.
- [x] Use executing-plans' one fresh independent final reviewer for all implemented changes, with the spec, plan, baseline and evidence. No per-task implementer/reviewer agents. Fix its concrete findings, rerun affected checks and record results. If hosted steps are blocked, review the implemented local scope and label the plan partial; finish hosted verification/review on resume.
- [x] Update README, this plan's checked steps and progress ledger: real account/buckets/version, SQL/Storage measurements, what actually ran, missing configuration and later Phase5 gates. Do not claim deployment or private permissions from a dry-run/name alone. Report no automatic commit/push and request only remaining necessary owner input.

## Self-review and scope coverage

- Spec goals/auth/compatibility/configuration: Tasks1/2/4; retry/failure/concurrency/budgets: Tasks1/2; private delivery/policy checks: Tasks4/5.
- Full file/SQL preservation and source-vs-destination references: Task3 local tests andTask5 real file drill. Hosted D1 export precision and changed-origin URL transformation remain explicitly later Phase5 requirements, not omitted readiness claims.
- Limits/costs and owner account/secret handling: global constraints andTasks4/5. No scheduled file scan, Storage list on library reads, new DB schema or product UI.
- Each of the five Review Focus conditions has an owning failing test or explicit hosted control. Interfaces and paths are named; no unused subsystem/dependency or placeholder implementation.
- A successful private resource setup is an intermediate result. Public media activation, unified site/API preview, Access/Turnstile/Brevo, email inbox and production publishing require their own reviewed Phase5 handoff.

## Local handoff — 2026-10-13

Tasks1–3 locally complete; Task4 config/account inspection complete but bucket/policy/secret/deployment pending; Task5 hosted probe/recovery pending. Task6 local review and verification complete for implemented scope, full plan partial. Final suite150/150Worker plus16/16client, scoped lint/diff clean, preview dry-run165.67KiB/gzip41.10KiB. One fresh review found3Important operator issues, all reproducedRED→GREEN and fixed in one pass; no deferredMinors. Classic list omits custom metadata: explicit backup/restore now fetch object info (210/314HTTP for103files in fixture), probe has one bounded positive publishable-key check (15HTTP). No product upload/library request budget change. SourceURL mapping, account policies/UPDATE/DELETE, hosted credentials/recovery/Access/CPU/browser/email remain later gates; no production deploy/commit/push.
