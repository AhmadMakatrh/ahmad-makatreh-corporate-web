# Verification and release

This guide describes repeatable checks for the current source tree. It is not a record of previous test results. Component ownership is documented in the [architecture map](current-architecture.md); the [admin guide](admin-dashboard.md) describes publishing and recovery behavior.

## Prerequisites

- Use a Node.js version supported by the client test dependencies: Node 24.15+ on the 24 release line, or Node 22.22.2+ on the 22 release line.
- Install dependencies from the committed lockfiles in both `client/` and `server/cloudflare/`.
- The Cloudflare suite uses local workerd/D1/Storage fixtures. Its media backup test helper also requires Python 3.13+ for the local SQLite export path.
- .NET 10 is required only when checking the retained ASP.NET Core backend.
- Keep credentials, database exports and media backups outside Git. The `server/cloudflare/.dev.vars.example` and `server/.env.example` files contain configuration names, not production secrets.

## Local checks

Run these commands from the repository root in PowerShell. Stop and inspect a failing command before proceeding. Run the client tests and the two Vite builds sequentially: the build tests also invoke Vite and write generated output.

```powershell
Push-Location server/cloudflare
npm ci
npm test
npm run build
Pop-Location

Push-Location client
npm ci
npm run lint
node --test --test-concurrency=1 tests/*.test.js
npm run build
npm run build:admin
node ../server/cloudflare/node_modules/wrangler/bin/wrangler.js deploy --config wrangler.jsonc --dry-run --outdir .wrangler/site-review
node ../server/cloudflare/node_modules/wrangler/bin/wrangler.js deploy --config wrangler.admin.jsonc --dry-run --outdir .wrangler/admin-review
Pop-Location

git diff --check
git status --short
```

| Check | What it covers |
| --- | --- |
| Client lint | Configured Oxlint rules, including React hook usage |
| Client tests | API/client behavior, mounted React regressions, routes and metadata, prerendering, public/admin bundle boundaries |
| Cloudflare tests | Handler validation, authentication/session behavior, D1 operations, local Worker runtime, media and email fixtures |
| Public build | `client/dist/`, including localized static HTML, sitemap, robots and public assets |
| Admin build | `client/dist-admin/`, built separately from the public application |
| Wrangler dry runs | Worker bundling and configuration/asset resolution; no deployment or remote migration |

Tests that simulate external services do not establish hosted Supabase, Turnstile or Brevo behavior. Record which checks ran, their actual results and any skipped coverage for each release. Do not reuse old pass counts as evidence for a new revision.

For changes to the alternative backend, also run from the repository root:

```powershell
dotnet test server/AhmadMakatrehSite.slnx -c Release
```

PostgreSQL integration tests require `AHMAD_TEST_POSTGRES_CONNECTION` pointing to a dedicated loopback test server, with `Database=postgres` and a test role allowed to create databases. The fixture creates, migrates and drops only a generated `ahmad_makatreh_test_<guid>` database. Missing configuration skips those tests; invalid configuration or a connection failure fails them. Do not use a shared application or production database. Docker build instructions for this alternative backend are in the [root README](../README.md).

## Local development and preview boundaries

| Configuration | Intended environment |
| --- | --- |
| `server/cloudflare/wrangler.jsonc` | Local API development with local D1/R2 bindings |
| `server/cloudflare/wrangler.preview.jsonc` | Separate API preview resources; routes, workers.dev URLs and cron are disabled in this configuration |
| `client/wrangler.admin.jsonc` → `previews` | Admin previews with a separate D1 database and media bucket |
| `client/wrangler.jsonc` | Production public Worker; it has no isolated preview binding override |
| `client/wrangler.admin.jsonc` → top level | Production admin Worker |

The Vite development server proxies `/api` to `http://localhost:5000`. Running `npm run dev` from `server/cloudflare/` does not change that proxy. Follow the [Cloudflare API setup](../server/cloudflare/README.md) when selecting a local API endpoint and applying migrations with `--local`.

Before a hosted preview, check that every binding and secret belongs to the intended preview resources. In particular, do not use the public production configuration for a write-enabled preview without isolated bindings. Confirm that `ADMIN_ORIGIN` matches the actual admin preview origin. Remote migrations and uploads are separate operations from local checks.

In the preview environment, exercise the affected flows with test accounts and data:

- Arabic and English navigation, direct page loads, responsive layouts and local image links.
- Booking validation, duplicate submission handling, a saved inquiry and its independent email status.
- Admin login, refresh, logout and recovery where relevant; verify the public origin rejects admin routes.
- Draft save, publish, conflict handling and restoration without overwriting unrelated content.
- Media upload, selection, archive/reference checks and delivery from the configured bucket.

Only run write or email checks on an environment authorized for those actions. Record provider acceptance separately from actual inbox delivery.

## Production release

1. Confirm the target Cloudflare account, custom domains, Worker names, D1 binding, media bucket and required variables/secrets. The source configurations identify the intended resources; they do not prove the deployed dashboard state.
2. Review pending D1 migrations using the selected production configuration. Back up D1 and Supabase media before schema changes, and establish a restore path in an isolated environment. UI document exports do not include the complete database/history/media backup.
3. For public CMS changes, obtain the public `/api/site` JSON response from the intended environment and supply it as `SEO_SNAPSHOT_FILE` during the public build. Without it, prerendering uses bundled defaults. See [SEO and GEO](seo-and-geo.md).
4. Complete the local checks and relevant hosted preview checks. Build public and admin assets separately. Retain the release revision and the previous deployable artifacts/version for rollback.
5. Deploy only the intended Worker after deployment is authorized. Use the installed Wrangler from `server/cloudflare/`; review whether dashboard-managed variables must be preserved with `--keep-vars`.

The existing deployment commands, run from `client/`, are:

```powershell
node ../server/cloudflare/node_modules/wrangler/bin/wrangler.js deploy --config wrangler.jsonc --keep-vars --strict
node ../server/cloudflare/node_modules/wrangler/bin/wrangler.js deploy --config wrangler.admin.jsonc --keep-vars --strict
```

These commands publish to the configured production Workers. They are not part of the local verification block and do not apply pending D1 migrations automatically. Public-only changes do not require deploying the admin Worker unless shared API behavior also changed.

After release, check representative public routes, static metadata/assets, `/api/site`, the protected admin entry and the affected workflow. Do not infer successful inquiry persistence, authentication or delivery from an HTTP 200 on the homepage. Restoring a Worker version restores code/assets; it does not undo database or media changes. Publishing CMS content does not automatically rebuild static HTML or redeploy the site.
