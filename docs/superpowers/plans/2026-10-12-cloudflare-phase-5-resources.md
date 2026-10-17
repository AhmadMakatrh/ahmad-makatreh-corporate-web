# Cloudflare Phase 5A: Workers, D1 and R2 Resource Setup Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans task-by-task. Preserve the owner's previously chosen native execution. Steps use checkbox (`- [ ]`) syntax. Owner approved option 1 on 2026-10-12, then declined adding a payment method currently. D1 setup is authorized; R2 activation and the dependent Worker deployment remain pending. No checkout or production deployment is authorized.

**Goal:** Prepare real, isolated Cloudflare resources for the existing API, with verified bindings and schema, before connecting the site or starting hosted integration tests.

**Architecture:** Deploy the existing `server/cloudflare/src/index.js` to a private preparation Worker bound to a dedicated D1 database and Standard R2 bucket. It is the starting point for the isolated hosted preview; the later site/API integration follows the approved single-Worker design. Production continues on its existing Worker while preparation resources contain no user data.

**Tech Stack:** Installed Wrangler4.149.0, Node>=22, existing JavaScript API, D1 migrations0001–0004, R2 Workers binding. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-12-cloudflare-integration-design.md`, stage5 resource preparation only. Full Access/Turnstile/Brevo/domain setup, hosted browser/CPU/recovery tests and production deployment are subsequent Phase5 tasks requiring their own concrete handoff.

## Verified preflight — 2026-10-12

- `wrangler whoami` confirms the approved account `ahmadthemakatrh@gmail.com`, account ID `fe25e25f13db2c636fd743e41c8a47e1`. Workers/D1 permissions exist. Missing `k2.read/k2.write` concern K2 streams in the installed CLI, not an instruction to refresh unrelated permissions.
- `d1 list` reports `data_base_1`, ID `20f591eb-d67d-4163-bb6f-370abc6c20bf`, zero tables in provider metadata. Its purpose is unknown; no SQL was executed and no ownership/reuse is inferred.
- `deployments list --name ahmad-makatreh-site` confirms the active version `fce28771-76c9-469e-a461-a399388a996c` from 2026-10-10T21:54:21.267Z.
- `deployments list --name ahmad-makatreh-preview --json` returns10007: the proposed preparation Worker does not exist.
- `r2 bucket list` returns10042: R2 is not enabled. Owner checkout/explicit financial approval is required before bucket creation.
- The API and media paths passed local verification in Phase4; this inventory does not establish hosted operation or free-plan CPU fit.

## Global constraints

- Account is fixed to the ID above; stop on a different identity/account. Do not change subscriptions or upgrade Workers.
- Proposed names: Worker `ahmad-makatreh-preview`, D1 `ahmad-makatreh-preview`, R2 `ahmad-makatreh-media-preview`. Record real creation IDs before using them; no invented UUIDs or copied production bindings.
- Recheck exact names before creating. Reuse only a resource proven to belong to this plan by its recorded ID; an unrelated name collision requires owner clarification. Never overwrite/delete a resource to resolve a collision.
- Keep `data_base_1`, the existing production Worker/version, routing and DNS intact. Do not import production records or old local test files.
- R2 Standard only. The free allowance is10GB-month storage,1million ClassA and10million ClassB operations/month; excess usage is billable. It is not a hard spending cap. Owner enters payment details/verification and accepts checkout personally if required. No card/key/password in chat, source or logs.
- Preparation Worker config explicitly sets `workers_dev:false`, `preview_urls:false`, `routes:[]`, `triggers:{crons:[]}`. There is no public preview endpoint, custom domain or automatic DB cleanup schedule in this preparation step. Existing scheduled handler remains implemented; activate its existing `0 */6 * * *` schedule when inquiry processing is enabled in later hosted integration.
- R2 stays private: no r2.dev/custom-domain/public access, object upload, lifecycle/prune or orphan deletion. Public media routing is a later reviewed step.
- Preserve existing local `wrangler.jsonc`, client files, real `.env`/`.dev.vars`, .NET fixes and previous uncommitted work. No automatic commit/push.
- No UI/API behavior changes, polling, autosave or background database checks. Provisioning commands and explicit verification are one-time operations.

## Review Focus

1. Wrong account/config/name must never mutate the live site or the unrelated existing database; pin config identity and compare the production deployment before/after.
2. A timed-out creation may already have succeeded; inspect exact-name inventory/recorded ID before retrying, never recreate blindly or delete to recover.
3. `workers_dev:false` alone does not disable version URLs; explicitly disable `preview_urls`, verify routes/subdomain settings remotely and keep the bucket private.
4. R2 checkout can create ongoing charges despite a free allowance; owner approval/checkout is a separate gate, and Standard storage must be confirmed.
5. A migration/deployment failure must remain a reported partial setup; no success claim without four applied migrations, empty application tables and actual D1/R2 binding IDs.

## Files

- Create after approval: `server/cloudflare/wrangler.preview.jsonc` — exact private preparation configuration, with real D1 UUID and R2 bucket name.
- Create after approval: `server/cloudflare/tests/previewConfig.test.js` — safety boundaries against accidental production targeting/public exposure/cron activation.
- Update during execution: `docs/cloudflare-integration-progress.md`, `server/cloudflare/README.md` — IDs, exact commands, verification and remaining gates.
- Evidence and resumable ledger: `.superpowers/sdd/2026-10-12-cloudflare-phase-5-resources/`; never put auth/payment values there.

## Task 1: Owner gates and dedicated D1 schema

**Interfaces:** Confirmed account ID and owner plan approval; output the D1 creation UUID, name and four applied migration names in the ledger. Later tasks consume this exact UUID.

- [x] Record the working-tree baseline and protected .NET hashes. Confirm identity with installed `wrangler whoami`; expected: the approved email/account above.
- [x] Resolve owner R2 activation choice and record its scope. The D1 task can proceed after plan approval while R2 waits; no checkout/upgrade is inferred from general Cloudflare setup approval.
- [x] Run `wrangler d1 list` immediately before creation. Expected: no database owned by this plan, or the exact previously recorded resource on resume. On unknown outcomes, inspect rather than retry automatically.
- [x] Create `ahmad-makatreh-preview` with `wrangler d1 create ahmad-makatreh-preview --update-config=false`. Expected: success and a real UUID. Do not use `data_base_1` or automatically edit the local config.
- [x] Write the safety regression test before adding the new config. `JSON.parse` is sufficient because this project writes pure JSON in its `.jsonc` configs. Test asserts exact approved account/name, Worker name differs from production, `main:'src/index.js'`, compatibility date `2026-09-05`, explicit false URL flags, empty routes/crons, exactly one `DB`/`MEDIA` binding, matching D1 name and a valid UUID. It also rejects any var/secret value or remote/local binding pointing to production.
- [x] Run `node --test tests/previewConfig.test.js`; expected RED: preparation config missing. Populate the new config using the real creation UUID and planned bucket name, with `$schema:'node_modules/wrangler/config-schema.json'` and `migrations_dir:'migrations'`. Preserve rate limits9/120/6/6 per60seconds using preview-only namespace IDs10122030–10122033. Do not enable remote automatic development writes.
- [x] Run the config test; expected GREEN. Run installed `wrangler d1 migrations list DB --remote --config wrangler.preview.jsonc`, then `wrangler d1 migrations apply DB --remote --config wrangler.preview.jsonc`. The approved operation applies existing additive migrations only to the new empty DB; noninteractive execution skips the CLI prompt without disabling constraints.
- [x] Verify once with `d1 execute DB --remote --config wrangler.preview.jsonc --command <schema-and-empty-count-query> --json`: migration table contains exactly0001–0004; all eight application tables exist and contain zero rows. Query names are fixed from the existing migrations, not user input. A partial failure preserves the DB and ledger; resume only unapplied migrations.

Task1 result: real UUID `7b1d12c7-8d63-49c2-b9ec-fec22dfc5f3f`, region WEUR; four migrations applied and eight empty tables verified. The first verification used nine UNION branches and was rejected by hosted SQLite (`too many terms in compound SELECT`,7500); one SELECT with scalar counts then succeeded,4rows read/0written. No migrations were repeated. Evidence: `.superpowers/sdd/2026-10-12-cloudflare-phase-5-resources/`.

## Task 2: Standard private R2 bucket

**Interfaces:** Same confirmed account and resolved owner checkout; output exact bucket name and Standard/private settings. Task3 consumes the `MEDIA` binding.

- [ ] Owner completes R2 activation in Cloudflare Dashboard after reviewing allowance, excess pricing and any payment requirement. If not approved/activated, mark this task pending and finish unaffected D1/config work; do not substitute another storage provider.
- [ ] Run `wrangler r2 bucket list`; expected: list succeeds after activation. On10042 keep activation pending; on permission failure report the actual permission and obtain login/permission through official tooling without requesting secret values in chat.
- [ ] Recheck exact planned name. Create with `wrangler r2 bucket create ahmad-makatreh-media-preview --storage-class Standard --update-config=false` only when absent and owned names do not collide. Expected: successful creation under the confirmed account.
- [ ] Run `wrangler r2 bucket info ahmad-makatreh-media-preview --json`; expected: matching name, Standard default, private/empty resource. Verify disabled public access via the dashboard/API metadata if bucket info does not expose it; do not infer it from a missing media URL alone.
- [ ] Record returned metadata/operation outcomes. No test file upload/delete or periodic object listing is needed to prove bucket provisioning; actual PUT/GET/archive and recovery are later isolated integration checks.

## Task 3: Private API Worker with verified bindings and handoff

**Interfaces:** Exact D1 UUID fromTask1 and private R2 fromTask2; output deployment/version ID, verified bindings and disabled routes. No public origin/domain is produced in this step.

- [ ] Run `node --test --test-concurrency=1 tests/*.test.js` and `wrangler deploy --dry-run --config wrangler.preview.jsonc --outdir <plan-evidence>/bundle`. Expected: existing tests plus config test pass; dry-run compiles the existing real API and lists exactDB/MEDIA and four rate bindings. No schema/config error or new warning.
- [ ] Reconfirm preparation Worker absence or the exact version previously recorded by this plan; preserve any unexpected remote change. Deploy once with `wrangler deploy --config wrangler.preview.jsonc --message 'Phase5A private resource preparation'`. Approval of this written plan authorizes this isolated private Worker deployment only.
- [ ] Read `wrangler deployments list --name ahmad-makatreh-preview --json` and `wrangler versions view <returned-version-id> --name ahmad-makatreh-preview --json`. Expected: real deployment/version and D1/R2 bindings matching the ledger. Redact secret values if later configuration introduces them.
- [ ] Verify account Worker routes, workers.dev/version-URL settings and cron triggers once through official dashboard/API read-only controls. Expected: no route/custom domain, both public URL flags disabled and no cron. No private-access or synthetic-token bypass is introduced to perform a public HTTP test.
- [ ] Re-read the existing production deployment: its active version remains `fce28771-76c9-469e-a461-a399388a996c`. Review `git diff --check`, scoped changes and protected hashes. Update README/progress with created IDs and verified facts; use one final independent review as required by executing-plans.
- [ ] Report this resource setup separately from live feature verification. Remaining: site/API unified preview entry point, Access+CSRF identity, Turnstile, Brevo, public media domain, browser/CPU/memory/request budgets, remote export/recovery, then production approval. No readiness/capacity guarantee follows from resource creation.

## Provisioning cost and database request policy

Creation/list/config operations use Cloudflare control-plane APIs, not a D1 query for every form field. D1 work here consists of applying the four migrations once and one explicit verification query. Migration CLI may perform its own bookkeeping reads/writes; record observed outcomes without calling it one SQL statement. Empty preparation Worker has no cron or incoming public traffic, so it does not poll D1. Rate limit bindings require no database query. Later API operation budgets remain those measured in phases1–4.

Workers Free includes100,000requests/day and10ms CPU per invocation; D1 Free includes5million rows read/day,100,000written/day and5GB total storage. These are platform limits, not proof of this application's hosted CPU fit. Confirm the account's actual plan in the dashboard; do not change it silently. R2 excess has separate usage billing and no spending cap is promised.

## Self-review and scope

- The approved spec's stage5 resource prerequisites are covered by Tasks1–3; other independent account/integration work is explicitly outside this narrow setup.
- No new application endpoint or replacement technology; existing API/validation/security is deployed privately as-is.
- Each Review Focus condition is checked in its owning task; configuration safety has a failing-then-passing local test, resource outcomes have actual provider checks.
- Partial setup is resumable by recorded IDs without destructive cleanup or blind retries. The existing database and production version are protected.

## Checked references

- [R2 activation](https://developers.cloudflare.com/r2/get-started/) and [pricing](https://developers.cloudflare.com/r2/pricing/): checkout, Standard free allowance and billed excess.
- [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) and [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/): free usage limits.
- [workers.dev settings](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/) and [Version URLs](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/): disable both URL families explicitly.
- Installed CLI help forD1create/migrations, R2create/info, deploy/deployments/versionview; installed `getSubdomainValues` implementation and config schema. Preflight commands were read-only; no resource or subscription was created.
