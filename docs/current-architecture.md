# Current architecture and ownership map

This repository contains Ahmad Makatreh's bilingual corporate website and a separate administration interface. The current deployment uses Cloudflare Workers and D1, with Supabase for owner authentication and media storage. The ASP.NET Core implementation remains available as an alternative backend.

## Runtime boundaries

| Responsibility | Entry points and source | State or integration |
| --- | --- | --- |
| Public website | `frontend/src/main.jsx` → `App.jsx` → `routes/AppRoutes.jsx`; `deploy/cloudflare/public-worker.js` serves `frontend/dist` and public API | React/Vite, Arabic and English, public `/api/site` snapshot |
| Administration | `frontend/src/admin/main.jsx` → `AdminApp.jsx`; `deploy/cloudflare/admin-worker.js` serves `frontend/dist-admin` and protected `/api/admin/*` | Separate Cloudflare Worker, Supabase Auth session, CSRF checks |
| Shared edge API | `backend/cloudflare/src/index.js` composes booking, published-site, and admin handlers | Imported by both Worker entry points; public Worker rejects admin paths |
| Persistent content and inquiries | `backend/cloudflare/src/siteDocuments.js`, `documentBodies.js`, `inquiries.js` and `migrations/` | Cloudflare D1; drafts and published revisions are distinct |
| Media | `backend/cloudflare/src/media*.js`, `frontend/src/admin/MediaLibrary.jsx` | Supabase Storage in current Cloudflare configuration |
| Booking and notifications | `backend/cloudflare/src/booking.js`, `email.js`; `frontend/src/sections/Booking/BookingSection.jsx` | Turnstile verification, D1 inquiry, Brevo notification |
| Scheduled work | `backend/cloudflare/src/index.js`, `inquiries.js`, `supabaseHeartbeat.js` | Public Worker cron triggers clean up booking abuse records and send the configured Supabase heartbeat |
| Alternative backend | `backend/aspnet/src/` and `backend/aspnet/tests/` | ASP.NET Core 10 / PostgreSQL implementation; separate from the current Cloudflare deployment |

```text
Public browser  → public Worker → static site or /api/site and /api/booking → D1 / Brevo
Admin browser   → admin Worker  → protected UI or /api/admin/*         → D1 / Supabase
                                       │
                                       └─ shared backend/cloudflare/src API
```

Worker entry points, assets and resource bindings are configured in `deploy/cloudflare/wrangler.public.jsonc` and `deploy/cloudflare/wrangler.admin.jsonc`. The local API configuration is `deploy/cloudflare/wrangler.local.jsonc`; `deploy/cloudflare/wrangler.preview.jsonc` selects preview resources. The root Docker configuration runs the alternative ASP.NET Core backend.

## Build and routing

- `frontend/vite.config.js` builds the public application to `frontend/dist`. Its `seoPrerender` plugin lives in `frontend/scripts/seoPrerender.js` and renders localized static pages from the React application. See [SEO and GEO](seo-and-geo.md) for snapshot and metadata behavior.
- `frontend/vite.admin.config.js` uses `frontend/admin/index.html` as its entry and writes `frontend/dist-admin`. The admin Worker checks access before serving its assets or protected API.
- `frontend/public/_headers` is the canonical static-asset header configuration copied by the public build. The public HTML also has a CSP meta tag in `frontend/index.html`; both policies allow the Cloudflare Web Analytics script at `https://static.cloudflareinsights.com`, block inline JavaScript and eval, and set `object-src 'none'` and `base-uri 'none'`. Language/direction initialization runs from the parser-blocking `/init-lang.js`. Development permits only the hash of Vite React's exact refresh preamble; that allowance is not emitted in production. Inline styles remain allowed for the existing UI and animations. `frame-ancestors 'none'` is delivered as an HTTP header, since meta CSP cannot enforce it. The admin Worker preserves its login page's nonce policy, adds frame protection when a response has no CSP, and sends `X-Robots-Tag: noindex, nofollow, noarchive`. The Worker API code sets its own response headers.
- Public HTML passes through `deploy/cloudflare/public-worker.js`, which adds a fresh 128-bit CSP nonce to the header and matching meta policy so Cloudflare can nonce its injected JavaScript Detections script. It does not add nonce attributes to arbitrary page scripts. HTML is returned with `private, no-store` and without conditional validators to avoid reusing a body under a different nonce. The underlying static assets remain cached by the asset service, and the paths excluded in `assets.run_worker_first` are delivered directly. The policy source remains `frontend/public/_headers`.
- `frontend/src/providers/NavigationProvider.jsx` parses public routes; `frontend/src/routes/AppRoutes.jsx` renders them. English uses clean paths such as `/work/tammivo`; Arabic uses `/page/ar/` followed by the same route. Matching legacy hash routes remain supported.
- Public routes cover home, services, capabilities, work and project details, about, journal and article details, booking (also `/contact`), service-specific `/start-project/:service` requests, and one-segment published pages. The admin interface uses six tabs at `/`; `/login`, `/recover`, and `/auth/*` are handled by its Worker.
- Vite's local `/api` proxy targets `http://localhost:5000`. The local API must be started separately; building the frontend does not start or deploy it.

## Feature ownership and public contracts

- `frontend/src/data/serviceCatalog.js` owns bundled service and offer defaults. `frontend/src/providers/PublishedSiteProvider.jsx` loads the published `/api/site` snapshot and revalidates it every 30 seconds after each request while the tab is visible and online, as well as on focus or reconnection. Pricing and content consumers share that snapshot; background reads preserve existing data and loading state, and unchanged responses retain their references.
- `frontend/src/admin/` owns the inquiries, pricing/offers, content, pages, media, backup and history interfaces. `adminApi.js` owns the protected client transport and cache. Saving a draft and publishing it remain distinct actions.
- `frontend/src/admin/AdminApp.jsx` keeps each section's key, label, icon, and editor together, so the navigation and rendered editor use the same definition.
- `backend/cloudflare/src/admin*.js` owns protected administration routes; `booking*.js` owns inquiry validation and submission; `siteDocument*.js` owns published and draft document contracts.
- Public paths, `/api/site`, `/api/booking`, `/api/admin/*`, the JSON document shape, and environment variable names are compatibility boundaries. A source move must preserve their behavior and be covered by existing tests.
- `frontend/src/i18n/` and RTL styles support Arabic and English. Route metadata and media paths are part of the visible website contract.

Shared helpers stay in their owning modules: `contentCollections.js` supplies admin collection operations, `serviceCatalog.js` supplies offer calculations, and the providers expose published data and navigation state. Import naming and language-specific exceptions are documented in [the code organization guide](codeguard-alias-guide.md).

## Alternative backend

`backend/aspnet/src/` contains the `Domain`, `Application`, `Infrastructure`, and `Api` projects. This implementation uses Entity Framework Core with PostgreSQL, a Turnstile adapter, SMTP notifications, and local or R2 media storage. Its configuration and migrations are independent of the Worker API and D1 migrations. Maintaining a shared frontend contract does not make their storage or deployment settings interchangeable.

The following decisions explain the retained alternative implementation. Their original designation as the production architecture has been superseded by the Worker deployment described above:

- [ASP.NET Core backend](adrs/ADR-001-aspnetcore-backend.md)
- [PostgreSQL persistence](adrs/ADR-002-postgresql-persistence.md)
- [Reverse proxy boundary](adrs/ADR-003-cloud-agnostic-edge.md)
- [Bot verification](adrs/ADR-004-bot-verification-abstraction.md)
- [Durable state and health probes](adrs/ADR-005-stateless-scaling.md)

## Operational documentation

- [Setup and repository commands](../README.md)
- [Administration guide](admin-dashboard.md)
- [Verification and release](verification-and-release.md)
- [Worker API configuration and contracts](../backend/cloudflare/README.md)
