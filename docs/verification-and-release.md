# Verification and deployment handoff

## Complete alias coverage — 16 October 2026

This completion pass starts from the existing maintained worktree, preserving its earlier uncommitted work in an ignored local snapshot. It adds no project dependency, lockfile, branch, commit, production operation, or deployment.

The source catalog contains 2617 actual native/import/reference aliases in 226 files: 819 JavaScript import bindings, 712 immutable local references, 81 native object-destructuring aliases, 115 native positional React dispatcher bindings, 868 C# type aliases, 19 C# constant aliases, and three Python module aliases. The positional dispatcher bindings already name unnamed returned functions and are used directly without another snapshot binding. Short helpers, tests, scoped callbacks, static local constants/models regardless of name, named service adapters, and the embedded authentication script are included. The source inventory covers 391 owned files. Comment sections were added to 42 owned text-format files, including SVG and JSONC, and their exact non-comment contents match the starting snapshot. Generated EF C# and SQL migration output is retained unchanged.

Current checks after the source changes:

| Check | Result |
| --- | --- |
| Client `node --test tests/*.test.js` | 32 passed, 0 failed/skipped |
| Cloudflare `npm test` | 159 passed, 0 failed/skipped; isolated D1/Storage/HTTP fixtures |
| `.NET` Release solution tests | 94 unit + 35 integration passed, 0 failed/skipped |
| Client `npm run lint` | Exit 0; same nine inherited warnings, no new diagnostics |
| Public/admin Vite builds | Both passed sequentially |
| Cloudflare API build and public/admin Worker builds | All three Wrangler dry runs passed |
| Local `/work` HTTP request | HTTP 200; this is not browser interaction evidence |
| JS/JSX binding coverage | 170 files inspected; review fixes resolved 158 bindings; final constant/service check resolved 78 more; zero pending in the final audit |
| JS/JSX AST comparison | 170 files passed after resolving aliases; original property keys and literal values preserved |
| C# semantic coverage | No eligible type/constant aliases remain pending; required visibility/generic/nameof cases are in the guide |
| Python | Import-alias AST equivalence and compilation passed; exercised by Worker recovery tests |
| Native text-format source | All 42 files passed exact non-comment equivalence; XML and both PowerShell scripts parsed |
| Owned static JavaScript import graph | No cycles found |

Two existing admin HTML source assertions were updated to name the aliased embedded `sendRef` helper. The preview-config test uses the installed Wrangler raw JSONC parser, allowing the requested source comments; all existing configuration assertions remain. No test was skipped or weakened. React built-in hook names remain canonical so dependency and compiler analysis continue to run, and local alias placement was adjusted to avoid new compiler/dependency warnings. Independent review identified conditional/member-factory callables, callable destructuring, and service adapters that escaped the original audit. The combined fix pass also removed the arbitrary naming filter for static local constants and covered database/client references. Final evidence comprises all 320 existing tests, both frontend builds, all three Worker dry runs, lint, and the expanded coverage/equivalence checks.

These are local source/build/test results, not a formal whole-program semantic proof. A fresh in-app browser attempt for `http://localhost:5173/work` failed during runtime initialization with `failed to write kernel assets: The system cannot find the path specified. (os error 3)`, so no new browser interaction or visual result is claimed. No new hosted sign-in, production write, media/email delivery, or load test was performed in this completion pass. The prior browser fixture results below remain historical evidence. Current source constraints are documented in `codeguard-alias-guide.md`, and the full mapping is `alias-index.md`.

## Source organization check — 16 October 2026

The organization pass kept the existing build and deployment commands. `npm ci` completed from both committed lockfiles. The first client attempt met a Windows file lock held by the local Vite process; stopping that process and rerunning `npm ci` succeeded. No lockfile or dependency version changed.

After the shared-code and import-alias changes, client tests passed 32/32, Cloudflare tests passed 159/159, and .NET tests passed 129/129. Focused admin-authentication tests passed 7/7, and admin/booking API tests passed 15/15 after binding their local helpers. Client lint exited successfully with the same nine warnings recorded before the pass. The public and admin Vite builds, Cloudflare API dry run, and public/admin Worker dry runs passed; the latter read 54 and 14 built assets respectively. These dry runs did not deploy or contact production data.

The public site returned HTTP 200 locally. Headless Chrome checks before and after the alias pass at 1440×900 and 390×844 loaded the home page, followed the offer action to `/services`, rendered service pricing, and found no page console errors or mobile horizontal overflow. On desktop, they also followed `/journal` and rendered bundled articles. The browser check supplied an isolated empty `/api/site` response because the local Vite proxy otherwise returned 502 while no backend ran. It therefore does not verify hosted content, sign-in, writes, media storage, email, or the production deployment. The in-app browser automation runtime was unavailable; the check used temporary Playwright tooling outside tracked source.

The built admin preview at 1440×900 opened pricing, content, and pages editors with isolated GET fixtures after the alias pass. At 390×844, the “المزيد” menu opened the pages editor without horizontal overflow. No page console errors appeared. These checks did not submit, save, publish, or contact hosted services.

The client lockfile still reports one high severity transitive advisory from the existing dependency tree. No dependency upgrades were part of this request.

Status of the maintained copy on **15 October 2026**. This page separates local evidence from checks that require hosted credentials or production access. The original repository and production deployment were not changed.

## Commands run in this copy

| Check | Result |
| --- | --- |
| `npm ci` in `client/` and `server/cloudflare/` | Completed from the committed lockfiles |
| `node --test tests/*.test.js` in `client/` | 31 passed, 0 failed |
| `npm run lint` in `client/` | Exit 0; pre-existing React and escape warnings remain |
| `npm run build` and `npm run build:admin` in `client/` | Passed when run sequentially |
| `npm test` in `server/cloudflare/` | 159 passed, 0 failed |
| `npm run build` in `server/cloudflare/` | Wrangler dry run passed |
| `dotnet test server/AhmadMakatrehSite.slnx -c Release` | 94 unit and 35 integration tests passed |
| Wrangler dry run using `client/wrangler.jsonc` | Passed; public Worker read 54 asset files |
| Wrangler dry run using `client/wrangler.admin.jsonc` | Passed; admin Worker read 14 asset files |
| Local browser smoke check | Public home → services/pricing at 1440×900 and 390×844; admin built preview at both sizes, with isolated API fixtures. No page errors or horizontal overflow in these paths |

The initial Cloudflare test run in the fresh copy exposed two tests that assumed an existing local `.superpowers` directory. Those tests now create their own isolated directories and the complete suite passes. One public build collided with the client build test when run concurrently on Windows; a sequential run passed. Keep the two Vite builds and the build-running test sequential.

`npm audit` reported one **high** advisory in transitive `source-map-js@1.2.1`, installed through the Vite/Tailwind build toolchain. It was inherited from the lockfile; this maintenance work did not change dependency versions. Review an upstream-compatible lockfile update separately before a release.

For the browser check, the public Vite server ran at `http://127.0.0.1:5173/`; its `/api/site` response was an empty local fixture. Clicking the visible offer action opened `/services`, where the service packages rendered on desktop and mobile. The built admin app was served with `vite preview --config vite.admin.config.js` at `http://127.0.0.1:4174/`. Its session and document endpoints used isolated local fixtures, with no hosted credentials or writes. Selecting “الأسعار والعروض”, editing the old price from 80 to 81, and observing “تعديلات غير محفوظة” verified UI state. On mobile, “المزيد” opened exactly the pages, media, and backup choices; selecting pages closed the menu and opened that editor. Screenshots were inspected locally; no framework overlay, JavaScript console error, missing first-view asset, or horizontal page overflow appeared in those checked states. These fixtures do not verify live authentication, publication, or persistence.

After consolidating shared admin behavior, a second isolated admin browser check loaded a two-section draft page. Moving the first section down changed the displayed Arabic titles from “الأول” to “الثاني” in the first position and marked the draft unsaved. Selecting the articles collection displayed its existing HTML article as plain text without `<p>` markup. Neither path raised a page error; no save or publish request was sent.

## Feature evidence

| Feature | Local evidence | Hosted check still needed |
| --- | --- | --- |
| Public routes, assets, bilingual content, RTL | Public build, client route/content tests, 54 assets in Worker dry run; desktop/mobile browser check of home → services/pricing | Browser review on real phone/tablet and hosted snapshot |
| Published prices and scheduled offers | Pricing unit tests; common price function is used by editor and public site | Confirm real published D1 snapshot and timing on hosted site |
| Booking and duplicate protection | Cloudflare booking, validation, concurrency and email-result tests | Real Turnstile, D1 and Brevo delivery in a safe preview environment |
| Admin login, session and CSRF | Compiled Workerd runtime tests and admin build; local admin UI check with isolated session fixture | Full sign-in and recovery with configured Supabase preview account |
| Drafts, publication, history and backups | Document API/runtime tests and admin client tests | Preview D1 migration and restore drill with non-production data |
| Media upload and backup | Workerd and Supabase Storage fixtures | Real preview bucket permissions and download checks |
| Alternative .NET API | 129 unit/integration tests | Not part of the active Cloudflare deployment path |

## Build artifacts and deployment boundary

Generated, ignored folders are `client/dist/` (public site), `client/dist-admin/` (administration), and `server/cloudflare/dist/` (local Worker dry run). The two client Workers bundle the shared edge API from `server/cloudflare/src/` directly. Cloudflare preview/production bindings and secrets must be reviewed before deployment; no real secret values are stored in Git.

## Reproducible handoff commands

Run the following from this repository root in PowerShell. They are local builds and checks; they do not upload code or change remote data. Run the two client builds sequentially because the client test suite also invokes Vite.

```powershell
Push-Location server\cloudflare
npm ci
npm test
npm run build
Pop-Location
Push-Location client
npm ci
node --test --test-concurrency=1 tests/*.test.js
npm run lint
npm run build
npm run build:admin
node ..\server\cloudflare\node_modules\wrangler\bin\wrangler.js deploy --config wrangler.jsonc --dry-run --outdir .wrangler\site-review
node ..\server\cloudflare\node_modules\wrangler\bin\wrangler.js deploy --config wrangler.admin.jsonc --dry-run --outdir .wrangler\admin-review
Pop-Location
dotnet test server\AhmadMakatrehSite.slnx -c Release
```

For a later **preview deployment request**, first compare `client/wrangler.admin.jsonc` → `previews` with `server/cloudflare/wrangler.preview.jsonc`: both must identify the intended preview D1 database and private media bucket. Review pending preview migrations with `node node_modules\wrangler\bin\wrangler.js d1 migrations list DB --remote --config wrangler.preview.jsonc` from `server/cloudflare/`. If a migration is pending, review its SQL, take a private backup, then apply it there only after approval. From `client/`, `node ..\server\cloudflare\node_modules\wrangler\bin\wrangler.js preview --config wrangler.admin.jsonc --name maintained-review` creates an admin Preview with the configured preview bindings. The public Worker config currently has no isolated Preview binding; a public Preview must be given isolated resources before using `wrangler preview` for it. Do not point a Preview at the production D1 database by default.

For a later **production deployment request**, review the target account, existing Worker routes/domains, dashboard-managed variables and secrets, and the result of `d1 migrations list DB --remote --config wrangler.jsonc` from `client/`. Export a private D1 backup and verify a restore path before applying any pending migration. After the build and dry-run commands above, the existing commands from `client/` are `node ..\server\cloudflare\node_modules\wrangler\bin\wrangler.js deploy --config wrangler.jsonc --keep-vars --strict` for the public site and the same command with `wrangler.admin.jsonc` for administration. Confirm whether dashboard variables need `--keep-vars` before running them. Validate public pricing, inquiry delivery, admin sign-in, publication, media, and rollback on a safe hosted environment before routing production traffic. Do not treat a dry run as proof of live storage, email delivery, or authentication. Production deployment and remote migrations were not executed as part of this copy.

## SEO and GEO — 16 October 2026

The local implementation adds static HTML for the 42 bundled Arabic/English routes, production canonicals, language alternatives, page-specific sharing metadata and structured data, plus sitemap and robots output. An optional validated public snapshot supplies managed collections and pages; static output must be rebuilt and redeployed after CMS publishing. See [SEO and GEO](seo-and-geo.md).

Verification performed:

- Public and administration Vite builds passed through the existing client build regression test.
- Client tests: 44 passed, including 12 SEO regressions.
- Cloudflare document-validator tests: 7 passed; .NET document-validator tests: 17 passed.
- A separate published-fixture build passed with 18 documents, hidden project/article collections, literal replacement tokens and a valid index CMS page without homepage collisions.
- Lint completed with eight existing React warnings and no errors/new warnings.
- Local browser checks covered Arabic/English canonicals, project schema, Work ItemList after navigation, and locale restoration through browser history.

No production deployment, search-engine submission or production crawler validation was performed. Search ranking and AI citations were not measured. Snapshot rebuild requirements and hosting checks remain deployment responsibilities.

Final static-output audit verified all 42 HTML files: exactly one h1 and canonical per page, valid JSON-LD, no pending Suspense/loading markup and no missing local image/build assets. Arabic mobile validation at 390×844 found no horizontal overflow; the mobile menu retained Arabic paths. Desktop and mobile evidence was saved outside the repository under the task's temporary QA folder. The temporary viewport was reset after validation.

The local preview's API proxy could not reach an API on port 5000. Browser checks therefore exercised the bundled public fallback; managed-content behavior was verified with validated snapshot fixtures, rather than a live CMS response.

## Production inquiry configuration — 16 October 2026

The production public Worker was missing `BOOKING_HMAC_KEY` and `TURNSTILE_SECRET_KEY`, and the client build had no `VITE_TURNSTILE_SITE_KEY`. These caused the inquiry endpoint to return 503 before verification or persistence. The missing HMAC secret was generated securely, and the existing Turnstile widget for `ahmad-makatreh.vip` supplied its matching secret. Both values were added to encrypted Cloudflare Worker secrets without rotating existing credentials. The widget's public site key is configured in the ignored `client/.env.production`; future public builds must retain that file or provide `VITE_TURNSTILE_SITE_KEY` through the build environment. Server secrets must never use a `VITE_*` variable.

The public build used a fresh published `/api/site` snapshot and was deployed as version `edfc3dd7-cbf3-473a-8995-fa20c361d305`. The build, Wrangler dry run, and 16 focused booking/crypto/Turnstile tests passed. A live request with no verification token returned 400 (`Verification token is required.`), with no inquiry/reference created. The hosted Arabic form rendered a successful Turnstile widget and received a verification token automatically. No real production inquiry or email was submitted for testing. Brevo notification configuration remains incomplete until the owner supplies an API key and a verified sender address; the existing application distinguishes a saved inquiry from email-notification delivery.

The owner subsequently confirmed `info@ahmad-makatreh.vip` as the verified sender. `BREVO_SENDER_EMAIL` was added to `client/wrangler.jsonc` and deployed in public Worker version `7883c396-c029-4a84-956d-565e6e956eff`. The Wrangler build/dry run and three email fixture tests passed. A live settings read confirmed the sender and preserved booking secrets; the public page and published API returned 200. `BREVO_API_KEY` is still absent, so email notifications remain disabled until the owner adds that secret. No real email was sent and Brevo sender verification was not independently checked without the API key.

## Source audit remediation — 17 October 2026

Scope: the 18 numbered findings from the audit of commit `82e4f059559617ee42cd84534a77cefe8509e5de`. Existing UI, data contracts, routes, permissions and production resources were preserved. This section supersedes the earlier test totals for the current source. The complete changed-file list and responsibilities are recorded in [the source inventory](source-inventory.md).

### Finding-by-finding evidence

| # | Implemented correction | Local regression evidence |
| --- | --- | --- |
| 1 | Keep the mounted editor and inquiry reply state during recoverable 401; disable access until session recheck succeeds. A 403 still removes protected state. | Mounted admin tests retain unsaved page text, reply, notes and operation ID through reauthentication; writes are not replayed automatically. |
| 2 | Route history restore through the document owner's existing mutation lock. | A delayed restore disables fields, save, publish and refresh; one restore request completes before editing resumes. |
| 3 | Bind Turnstile creation/removal to the form container lifecycle. Remove a failed script even if its download fails after unmount. | Mounted success → new inquiry receives a new widget; pending script reuse, script failure before/after unmount, remount and cleanup are covered. |
| 4 | Keep the HTTP timeout through JSON body consumption and clear it in `finally`; propagate body abort/transport errors. | Actual `Response`/`ReadableStream` regressions cover delayed and unfinished bodies plus normal responses. |
| 5 | Share an Error Boundary at public/admin entry and public route boundaries, with explicit reload and route recovery. | Rejected lazy import renders localized recovery; navigation resets only failed state; healthy mounted input keeps its draft. |
| 6 | Raise only inquiry-import bodies to 10 MiB in both APIs and the importer; retain 100-record validation and all other request limits. | Real local D1 export/import roundtrips: maximal Arabic payload 2,988,332 bytes and escape-heavy payload 8,861,172 bytes. Exactly 10 MiB accepted; one byte over rejected before SQL. .NET large-import regression also passes. |
| 7 | Capture the native auth event's button before `await`. | Generated auth script with native EventTarget reenables resend/enroll after success and failure, including repeated use. |
| 8 | Forward the renewed session cookie from `/auth/backup`. | Encrypted expired-session fixture confirms the refreshed Set-Cookie is returned with the page. |
| 9 | Use the selected MFA factor unless a newly enrolled factor is active. | Generated-script tests challenge the second selected factor and a new enrollment correctly. |
| 10 | Apply existing locale-path rules to CMS page links. | Tests preserve query/hash, external and asset URLs; public absolute origins remain public in admin previews. |
| 11 | Read native `response.status` for non-JSON errors. | A non-JSON 503 produces the actual status in the message and error field. |
| 12 | Validate every configured proxy IP before replacing trusted proxy lists; reject invalid startup configuration. | Valid, mixed-validity and invalid proxy configuration tests pass. |
| 13 | Recheck expiry in PostgreSQL's outer cleanup DELETE after any row-lock wait. | Real PostgreSQL 16 row-lock race: old query deletes the renewed guard and fails; corrected query preserves it and passes. |
| 14 | Use explicit opt-in, loopback-only PostgreSQL fixtures with uniquely generated databases and real skip reporting. | All three live tests pass with migrations, health, booking persistence and cleanup. Configuration tests reject unsafe/shared targets. Generated databases and temporary containers are removed. |
| 15 | Share port-sensitive SMTP socket selection between notification and reply senders. | Five TLS selection cases pass, including implicit TLS on 465 and STARTTLS on other enabled ports. |
| 16 | Pin the affected PKCS dependency to 10.0.13 and remove blanket NU1902/NU1903 suppression. | All six .NET projects report no known vulnerable packages using the current NuGet advisory feed. |
| 17 | Build/publish the .NET API inside the Docker SDK stage, with private/runtime outputs excluded from the source context. | Fresh source build and final-ignore cached build passed. The disposable API container ran as UID 1654; live/ready health returned 200; actual media file creation/removal passed. |
| 18 | Update only existing transitive source-map-js 1.2.1 → 1.2.2. | Public/admin builds pass; current client and Cloudflare npm audits report zero known vulnerabilities. |

### Final local verification

| Check | Result |
| --- | --- |
| Client `node --test --test-concurrency=1 tests/*.test.js` | 64 passed; zero failed/skipped |
| Cloudflare `node --test --test-concurrency=2 tests/*.test.js` | 161 passed; zero failed/skipped |
| .NET Release solution tests | 99 unit + 45 integration passed; 3 PostgreSQL tests explicitly skipped in this run without opt-in |
| Separate isolated PostgreSQL 16 run | All 3 live tests passed; the cleanup race additionally has a failing old-query run and a passing corrected-query run |
| Unique tests across the above runs | 372 passed; no remaining unexecuted PostgreSQL tests |
| Public/admin Vite builds | Passed sequentially |
| API/public/admin Worker dry runs | Passed; no deployment |
| Docker source build and runtime smoke | Fresh publish of all four projects and final-context build passed. Non-root UID 1654, `/health/live` 200, `/health/ready` 200 with Json provider, and media write/remove passed; disposable container removed. Existing Compose configuration validated without starting its services. |
| Oxlint | Exit 0; zero errors, same eight pre-existing React warnings |
| Dependency audits | Zero known npm vulnerabilities in client/API and zero known vulnerable NuGet packages in all six projects |
| Independent code review | Frontend/.NET, root/Cloudflare, then final scope/hygiene reviews; actionable findings fixed and rechecked |
| Source metadata | Regenerated 2,843 aliases in 239 files; zero owned static JavaScript import cycles; framework-native contracts documented |
| Browser QA | Arabic work list and TAMMIVO at desktop width 1280; single-click slider and modal navigation, modal close/focus return, English/Arabic language switching, mobile 390×844 in both languages. No horizontal overflow, broken completed images or recorded console errors/warnings in these observations. |

`jsdom@30.1.3` is a development-only dependency required to mount the actual React lifecycle paths in regression tests; there is no new production dependency. The existing source-map-js entry is the only previously installed npm package updated. New tests use isolated local fixtures, not production data. See README for supported Node patches and explicit PostgreSQL test setup.

Browser QA uses the local public fallback because no API is listening on development port 5000. Desktop/mobile and Arabic/English observations validate rendering/navigation; mounted tests and local D1/.NET fixtures cover the corrected mutation/auth lifecycles. This does not verify live Supabase sign-in, external SMTP/Brevo delivery, WAF settings, production storage or load capacity. No production inquiry, CMS write, remote migration, deployment, commit or push was performed.

Evidence logs and screenshots are saved outside source under `C:/Users/ahmad/.codex/visualizations/2026/10/15/01a1411b-ece9-79a1-9b7a-7de4447a97cd/audit-fixes-20261017/`. The working tree remains reviewable against the audited commit.

### Official references used for the fixes

- [React state preservation](https://react.dev/learn/preserving-and-resetting-state) and [Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Fetch abort and response body reading](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#canceling_a_request)
- [Turnstile widget lifecycle](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/)
- [Native event currentTarget lifetime](https://developer.mozilla.org/en-US/docs/Web/API/Event/currentTarget)
- [ASP.NET trusted proxies](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer?view=aspnetcore-10.0)
- [PostgreSQL Read Committed behavior](https://www.postgresql.org/docs/16/transaction-iso.html)
- [MailKit SecureSocketOptions](https://mimekit.net/docs/html/T_MailKit_Security_SecureSocketOptions.htm)
- [Source Docker builds for .NET](https://docs.docker.com/guides/dotnet/containerize/)
- [PKCS security advisory](https://github.com/dotnet/runtime/security/advisories/GHSA-846f-f764-76mx) and [NuGet transitive auditing](https://learn.microsoft.com/en-us/dotnet/core/compatibility/sdk/10.0/nugetaudit-transitive-packages)
- [source-map-js security advisory](https://github.com/advisories/GHSA-68fv-2mgg-jv7q)

## React warning remediation — 17 October 2026

Scope: the eight remaining React diagnostics from the preceding audit repairs. This follow-up supersedes their lint result: **zero warnings and zero errors**, with all rules still enabled. Existing uncommitted audit fixes, application styling and API contracts are preserved. See [changed files](source-inventory.md#react-warning-remediation--17-october-2026) and the [implementation plan](superpowers/plans/2026-10-17-react-warning-remediation.md).

| Warnings | Root cause and correction | Evidence |
| --- | --- | --- |
| Four `only-export-components` | Navigation/language/motion JSX files exported both providers and consumer hooks. Move only contexts/hooks into the existing non-JSX hook modules; providers export components and all consumer import paths remain unchanged. | Six mounted navigation/locale/context regressions; all public/static routes build. |
| One motion `set-state-in-effect` | Mount Effect immediately copied browser query state into React. Read browser snapshots through `useSyncExternalStore` with stable subscriptions and a false SSR snapshot. Touch capability remains part of the existing coarse/touch detection formula on query changes. | Five regressions cover first render, live changes, pause, touch fallbacks, StrictMode listener cleanup and hydration without replacing server markup. |
| Two Journal `set-state-in-effect` | Effects synchronously reset loading after input changes. Derive loading by matching completed async results to current language, source and slug. Keep async APIs, error handling and stale-response guards. | Both client initializer loading states, first commit after each input change, empty list, missing article and metadata; old code fails the new transition assertions. |
| One Header `preserve-manual-memoization` | The close callback omitted the inferred state dispatcher dependency. Include the stable dispatcher, preserving callback identity and existing effects. | Mounted menu close/scroll/focus-request test and actual mobile browser open → Escape → focused opener. |

### Fresh verification

- `npm run lint`: exit 0, zero warnings/errors; no suppression or configuration changes.
- `node --test --test-concurrency=1 tests/*.test.js` in client: **78 passed**, zero failed/skipped, including 14 new regressions.
- `node --test --test-concurrency=2 tests/*.test.js` in Cloudflare: **161 passed**, zero failed/skipped.
- `npm run build`, then `npm run build:admin`: passed. The existing build regressions also validate static HTML/managed-content output and public/admin bundle separation.
- API/public/admin Wrangler dry runs: passed; no deployment.
- Regenerated alias catalog: **2,941 aliases in 245 files**, zero owned static JavaScript import cycles. Canonical React hooks and dispatcher locations in the guide are synchronized.
- Independent read-only review found no actionable production issue. The test-only client-branch plugin expands `import.meta.env.SSR` to false for the two Journal modules because Vite's SSR module runner otherwise exercises their server initializer. Actual component and API logic is retained; SSR remains covered by normal static builds.

Browser QA uses the existing in-app Chromium at `localhost:5173`: Arabic Journal list → article → English → Arabic, desktop 1280×720 and mobile 390×844, plus mobile menu open/Escape, focus return and scroll unlock. No blank screen, framework error overlay, horizontal overflow, broken completed images or app console errors/warnings were observed in those checks. Page language/direction and canonical path matched the displayed article. The temporary viewport was reset after QA. The development API on port 5000 is absent, so this browser run uses bundled fallback articles; managed data is exercised by the component/static-render fixtures.

The Node Header test verifies that the connected opener receives one native focus request; real final focus is verified in Chromium. JSDOM's final active-element assertion also failed with the original Header callback, so no production focus logic was changed to accommodate that fixture behavior. Async component actions are awaited through React `act` without new test warnings.

Evidence is stored outside source under `C:/Users/ahmad/.codex/visualizations/2026/10/15/01a1411b-ece9-79a1-9b7a-7de4447a97cd/lint-fixes-20261017/`. No .NET source, real environment file, production data, dependency or lockfile was changed in this follow-up. The earlier .NET/Docker verification remains recorded above; those unchanged backend checks were not repeated for these frontend repairs.

References used: [React state in Effects](https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect), [external stores and SSR](https://react.dev/reference/react/useSyncExternalStore), [memoization dependencies](https://react.dev/reference/eslint-plugin-react-hooks/lints/preserve-manual-memoization), [shared contexts](https://react.dev/reference/react/createContext#importing-and-exporting-context-from-a-file), and [Vite Fast Refresh exports](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react#consistent-components-exports).

## Portfolio alignment and copy — 17 October 2026

Scope: the attached UI/copy specification for Work, About, Barari and the three contribution pages, plus the Crisis Fund code-column overlap. The existing Crisis Fund design is the accepted reference; no replacement visual assets, theme or dependencies were introduced. See the [file inventory](source-inventory.md#portfolio-alignment-and-copy--17-october-2026) and [completed plan](superpowers/plans/2026-10-17-portfolio-polish.md).

### Fresh verification

- `node --test --test-concurrency=1 tests/*.test.js` from client: **95 passed**, zero failed/skipped. Includes 17 new bilingual SSR regressions using the actual route renderer.
- `npm run lint`: passed, zero warnings/errors; no rules disabled.
- `npm run build`, then `npm run build:admin`: passed from the final source. No configuration, dependency or lockfile change in this task.
- The new CMS tests confirm default contribution collections still round-trip through `collectionData`, `replaceCollection` and the strict Worker validator. Known-project tags also render for managed collections, and the valid custom slug `constructor` cannot resolve inherited tag-map properties.
- Published text remains authoritative. Tests cover About overrides, custom Barari copy and Work summaries, and report visibility after the underlying report text changes.
- Regenerated alias catalog: **2,962 aliases in 246 files**, zero owned static JavaScript import cycles. Named imports/static metadata/helpers use the existing native alias conventions.
- Independent read-only review found the CMS field and inherited-key issues during implementation; both were fixed and covered by regressions. Final review found no remaining actionable issue. `git diff --check` passed.

### Browser and reference verification

Used the available in-app Chromium browser through CUA; the separately named Browser plugin is not installed. No external Playwright process was used. Desktop viewport **1280 × 720**, mobile viewport **390 × 844**; the temporary override was reset. Full-page and viewport screenshots were captured outside source, and inspected with `view_image`, including the Crisis reference and Barari render together.

Evidence folder: `C:/Users/ahmad/.codex/visualizations/2026/10/15/01a1411b-ece9-79a1-9b7a-7de4447a97cd/portfolio-polish-20261017/`. The reference is `crisis-reference.jpg`; result evidence includes `barari-desktop-ar.jpg`, `barari-desktop-en.jpg`, `barari-mobile-ar.jpg`, `work-desktop-ar.jpg`, `work-desktop-en.jpg`, `work-mobile-ar.jpg`, `about-desktop-ar.jpg`, `about-mobile-ar.jpg`, `about-mobile-en.jpg`, contribution screenshots and `crisis-code-desktop-ar.jpg`. `browser-final-checks.json` records the final Work DOM checks.

| Comparison point | Reference / requested result | Inspected render and correction |
| --- | --- | --- |
| Structure | Crisis metadata, media, numbered sections and technical panels | Barari reuses the same container, panels and heading classes; concept media follows the two meta cards and precedes Section 01 |
| Section composition | 12-column challenge/requirements grid and three numbered development cards | Desktop grids render beside each other; mobile computes one column, with all three cards and all copy visible |
| Code explanation | Clean alignment beside a preserved LTR code window | Removed only sticky/top classes; browser reports `position: static`, no rectangle intersection with code, and `dir=ltr`; full-page and anchor viewport inspected |
| Work card text | One description and one contribution line; requested tags | Selected `confirmedRole` before overview, removed line clamping, and supplied presentation tags; five cards each contain complete text and no horizontal overflow |
| About alignment | Start-aligned paragraphs and project content, desktop action at the row end | Computed `text-align:start`; in Arabic desktop the button X position is left of its heading; mobile stacks rows; Latin technologies remain isolated |
| Typography and palette | Existing Arabic/English fonts, paper/green colors, radii, icons and media frames | No token or asset changes; the existing technical formatter handles C++, engine/media names and B+ without RTL sign reordering |
| Exact copy | Supplied Arabic, equivalent English, existing labels outside scope | Bilingual SSR assertions pass; browser text agrees. Above-the-fold copy contains only existing labels and the requested contribution updates; no new promotional labels |
| Interaction | Preserve navigation, language toggle, slider and gallery | Work → project and About → Crisis/Barari navigation pass; section anchor navigates; one TAMMIVO next click selects 02/02, image opens the selected gallery item, Escape closes it, and locale switching completes |

All target routes rendered meaningful content with no framework overlay. Inspected mobile pages had no horizontal overflow or broken completed images. The browser error/warning log was empty. No material mismatch remained in the requested changes after comparison against the existing design and supplied text.

The existing route is `/work/barari-game`; it was retained to preserve links rather than introducing the shorthand `/work/barari` from the brief. The scan grade is rendered in its canonical LTR spelling `B+`, with the existing scan date and limited-scope qualification retained. These are intentional compatibility/formatting choices.

### Limits

Browser checks used the existing local fallback data because the development API on port 5000 is unavailable. Managed-content precedence and collection validation were verified through local tests; no production CMS write was performed. No live security scan, backend change, .NET/Docker rerun, production load test, deployment, commit or push was part of this UI/copy task. Earlier backend verification remains recorded above.

Positioning behavior was checked against [MDN position](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position); the scoped correction follows the user's requested return to normal document flow.

## Logo scope and link icon correction — 17 October 2026

The user clarified that the refreshed mark was intended for the browser tab only. Original localized PNG logos are restored in Header, Footer, Preloader and AdminApp, with their original display widths and image proportions. Native import aliases, loading behavior, all earlier uncommitted fixes and CMS logo overrides are preserved. `client/public/favicon.svg` was not modified; its SHA-256 matches the pre-task file.

The TAMMIVO website button previously selected Google Play solely because of the project slug. The shared icon condition now uses the destination URL: website links show the existing external arrow, and Google Play destinations show the store mark. Both hero and final action buttons use the same corrected condition; no labels or URLs changed.

Verification:

- The new bilingual logo assertions and extended icon assertions reproduced both errors before the source fix. All **97 client tests** now pass with zero failures/skips.
- `npm run lint`, `npm run build` and `npm run build:admin`: passed. No dependency, lockfile, route or API change.
- In-app Chromium checked Arabic/English TAMMIVO at 1280 × 720 and Arabic at 390 × 844. Both localized original logos loaded; the header/footer use their expected files, website buttons have arrows and no store icon, and both app buttons retain Google Play icons. No horizontal overflow. The viewport override was reset after checks.
- Alias inventory refreshed: 2,962 aliases in 246 files, no owned static import cycles. Final diff checked for accidental changes.

Evidence is outside source under `C:/Users/ahmad/.codex/visualizations/2026/10/15/01a1411b-ece9-79a1-9b7a-7de4447a97cd/logo-correction-20261017/`: red/green test logs, public/admin build logs, unchanged favicon hash, and corrected Arabic/English/mobile screenshots. Verification covers local rendering and static builds, without a live admin login, production CMS write or deployment.

## TAMMIVO scan result update — 17 October 2026

Evidence source: the user's `codex-clipboard-d9973eca-2290-40a4-bd7a-7df2680988b0.png`, showing TAMMIVO with HTTP Observatory **A+**, **125/100**, and **12/12** tests. The report page could not be read through web search/open; this update is transcribed from the supplied screenshot, not presented as an independently repeated scan. No absolute scan date was supplied or invented. [MDN's FAQ](https://developer.mozilla.org/en-US/observatory/docs/faq) was reviewed for the report's scope; the existing qualification is retained.

The displayed improvement and Arabic/English engineering copy now say F → A+. Score/test figures are isolated LTR and cannot split within a fraction on narrow screens; the safe technical formatter recognizes A+ while retaining B+ support. No API schema, CMS override precedence, asset, link, dependency or actual security setting changed. ImmuniWeb's A and existing date remain untouched.

Verification: new expectations reproduce the former B+ mismatch before the edit; the full client suite now passes **97/97**, with no skipped tests. Lint and public/admin builds passed. Alias counts remain 2,962 across 246 files, with zero owned static import cycles. Browser verification covers the Arabic/English result text and mobile wrapping. Logs/screenshots are under `C:/Users/ahmad/.codex/visualizations/2026/10/15/01a1411b-ece9-79a1-9b7a-7de4447a97cd/tammivo-scan-20261017/`. No deployment, production write or new remote scan was performed.
