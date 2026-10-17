# Current architecture and ownership map

This repository is the **digital services website** for Ahmad Makatreh. It publishes services and prices, selected work and case studies, and accepts project inquiries. The owner manages content and offers through a separate administration interface. This map describes the code copied on 15 October 2026; historical design notes under `docs/` describe earlier deployment stages.

## Runtime boundaries

| Responsibility | Entry points and source | State or integration |
| --- | --- | --- |
| Public website | `client/src/main.jsx` → `App.jsx` → `routes/AppRoutes.jsx`; `client/worker.js` serves `client/dist` and public API | React/Vite, Arabic and English, public `/api/site` snapshot |
| Administration | `client/src/admin/main.jsx` → `AdminApp.jsx`; `client/workers/admin-worker.js` serves `client/dist-admin` and protected `/api/admin/*` | Separate Cloudflare Worker, Supabase Auth session, CSRF checks |
| Shared edge API | `server/cloudflare/src/index.js` composes booking, published-site, and admin handlers | Imported by both Worker entry points; public Worker rejects admin paths |
| Persistent content and inquiries | `server/cloudflare/src/siteDocuments.js`, `documentBodies.js`, `inquiries.js` and `migrations/` | Cloudflare D1; drafts and published revisions are distinct |
| Media | `server/cloudflare/src/media*.js`, `client/src/admin/MediaLibrary.jsx` | Supabase Storage in current Cloudflare configuration |
| Booking and notifications | `server/cloudflare/src/booking.js`, `email.js`; `client/src/sections/Booking/BookingSection.jsx` | Turnstile verification, D1 inquiry, Brevo notification |
| Alternative backend | `server/src/` and `server/tests/` | ASP.NET Core 10 / PostgreSQL implementation is retained and tested, but is not the current Cloudflare Worker deployment path |

```text
Public browser  → public Worker → static site or /api/site and /api/booking → D1 / Brevo
Admin browser   → admin Worker  → protected UI or /api/admin/*         → D1 / Supabase
                                       │
                                       └─ shared server/cloudflare/src API
```

The domain and resource bindings remain in `client/wrangler.jsonc` and `client/wrangler.admin.jsonc`. The local API development configuration is `server/cloudflare/wrangler.jsonc`. Do not infer that the root Docker configuration is the active Cloudflare production path.

## Feature ownership and public contracts

- `client/src/data/serviceCatalog.js` owns bundled service and offer defaults. `client/src/providers/PublishedSiteProvider.jsx` loads the published `/api/site` snapshot; pricing and content consumers use that snapshot or defaults.
- `client/src/admin/` owns the inquiries, pricing/offers, content, pages, media, backup and history interfaces. `adminApi.js` owns the protected client transport and cache. Saving a draft and publishing it remain distinct actions.
- `client/src/admin/AdminApp.jsx` keeps each section's key, label, icon, and editor together, so the navigation and rendered editor use the same definition.
- `server/cloudflare/src/admin*.js` owns protected administration routes; `booking*.js` owns inquiry validation and submission; `siteDocument*.js` owns published and draft document contracts.
- Public paths, `/api/site`, `/api/booking`, `/api/admin/*`, the JSON document shape, and environment variable names are compatibility boundaries. A source move must preserve their behavior and be covered by existing tests.
- `client/src/i18n/` and RTL styles support Arabic and English. Route metadata and media paths are part of the visible website contract.

The public route parser is `client/src/providers/NavigationProvider.jsx`; `client/src/routes/AppRoutes.jsx` renders the selected page. Its current clean paths are `/`, `/services`, `/capabilities`, `/work`, `/work/:slug`, `/about`, `/journal`, `/journal/:slug`, `/booking` (also `/contact`), `/start-project`, `/start-project/:service`, and one-segment published content paths such as `/:slug`. Matching legacy hash paths remain supported. The admin interface keeps its six sections as tabs at `/`; `/login`, `/recover`, and `/auth/*` are handled by the admin Worker rather than React page routes.

## Shared exports and import aliases

| Existing name | Inputs → output | Dependencies and consumers | Constraint |
| --- | --- | --- | --- |
| `createApi` in `server/cloudflare/src/index.js` | Optional `fetcher` and clock → Worker-compatible API handler | Composes booking, site, and admin handlers; imported by both Worker entry points and API tests | Preserve request routing and public/admin access boundaries |
| `submitBooking` in `client/src/api/bookingApi.js` | Booking fields → `/api/booking` acknowledgment | Uses the shared HTTP client; called by the booking interface | Preserve request fields and error propagation |
| `createAdminClient` / `adminApi` in `client/src/admin/adminApi.js` | Optional fetcher → session, read, write, and upload methods | Used by admin editors and tests | Keep CSRF, session refresh, cache invalidation, and error mapping together |
| `offerPriceForPackage` in `client/src/data/serviceCatalog.js` | Base price and offer item → effective offer price or `null` | Used by public pricing and the admin price suggestion | Preserve explicit offer price overrides and the discount fallback |
| `PublishedSiteProvider` in `client/src/providers/PublishedSiteProvider.jsx` | React children → context containing snapshot, load state, and refresh | Used by the public React tree; reads `/api/site` | Keep published data and defaults available to consumers |
| `moveRecord` in `client/src/admin/contentCollections.js` | Record array, selected index, direction → reordered copy or original array at a boundary | Used by collection, pricing, and page-section editors | Preserve bounds and source-array immutability |
| `plainArticle` in `client/src/admin/contentCollections.js` | Article HTML → plain text with paragraph breaks | Used by the article collection editor; requires browser `DOMParser` | Keep edited article text inert; do not parse it as executable markup |

`moveRecord` is imported as `reorderPricingItems` in `PricingEditor.jsx` and `reorderSections` in `PagesEditor.jsx`; both call the same implementation. `emptyLocalizedText` now supplies a fresh Arabic/English value to `CollectionEditor.jsx`, `PricingEditor.jsx`, and `PagesEditor.jsx` through `emptyText` or `text` import aliases. The duplicate `plainArticle` helper and an unreachable article-field condition were removed from `ContentEditor.jsx` in the earlier maintenance stage; articles are edited through `CollectionEditor.jsx`, which imports the shared helper. The alias rules and exceptions are in [the component guide](codeguard-alias-guide.md); [the alias index](alias-index.md) maps each explicit consumer binding to its source. Source-file dispositions are in [the inventory](source-inventory.md).

## Verification baseline

On the original working tree before import: public and admin Vite builds passed; Cloudflare tests passed 159/159; .NET unit and integration tests passed 129/129. Client lint exited successfully with existing React warnings. The 383-file copy was SHA-256 compared with the original. This is a local baseline; it does not verify production storage, email delivery, or hosted authentication.

## Architecture references

- [React component and state boundaries](https://react.dev/learn/thinking-in-react)
- [Cloudflare Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [GitHub README guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)

## Completed alias coverage — 16 October 2026

The follow-up completion removes the short-helper and test exceptions. The regenerated [alias index](alias-index.md) is the current count and source map, including closed C# types and locally consumed C# constants. Comment-capable styles, markup, SQL, XML/SVG, and configuration contain native sections. The guide records actual React analysis, C# visibility/generic/member, JSON grammar, and live-binding constraints with their source locations. File responsibilities and deployment boundaries above remain in place.
