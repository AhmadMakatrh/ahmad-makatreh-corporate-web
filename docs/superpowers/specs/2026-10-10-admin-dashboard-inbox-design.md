# Admin Dashboard Phase 1: Secure Inquiry Inbox

**Status:** Approved in chat and implemented locally on 2026-10-11. See `docs/admin-dashboard.md` for configuration prerequisites, verification limits and request budgets. This document records the phase 1 design.

## Goal

Start the site administration system with a secure, working inquiry inbox. Keep the dashboard source in its own folder inside this repository and keep its production host at `admin.ahmad-makatreh.vip`.

The full administration scope remains:

- Edit current site copy, images, and project/article data in Arabic and English.
- Create pages from reusable site-themed templates and reorderable sections.
- Create, edit, order, and hide service packages and offers.
- Review and manage contact inquiries.

This phase delivers the secure admin foundation and inquiry management first. Pricing/offers and content/page editing are later, separately scoped phases.

## Existing architecture

- The public frontend is a React 19/Vite single-page application under `client/`, deployed as Cloudflare Worker static assets.
- The backend is an ASP.NET Core 10 API under `server/`, with PostgreSQL as the durable production store and a Development-only JSON inquiry repository.
- The public booking API persists an inquiry before attempting email notification. The response reports notification status, but that status is not currently stored with the inquiry.
- The project has no admin UI, admin API, or application authentication. The current CORS policy allows site subdomains, and the static Worker config has no custom entrypoint or API proxy.

## Phase 1 scope

### Admin frontend

- Add the admin UI under `client/src/admin/`, using the existing React/Vite stack and design tokens.
- Render a distinct admin shell on `admin.ahmad-makatreh.vip`; do not render the public header, footer, launch offer, or preloader in that shell.
- Keep the public site on its current host and preserve its current navigation and appearance.
- Use the current portfolio colors, typography, spacing, and components where suitable. The inquiry interface is Arabic and RTL in this phase; inquiry content is displayed exactly as submitted.
- Provide an inquiry list with bounded pagination and filters for search, date range, category, inquiry status, and notification status.
- Provide an inquiry detail view and allow changing the existing inquiry lifecycle status (`New`, `Contacted`, `InProgress`, `Closed`, `Archived`).
- Show notification delivery state separately from inquiry lifecycle state. `Accepted` means the provider accepted the message; it does not prove inbox delivery.
- Include loading, empty, error/retry, and permission-denied states. Prevent duplicate status writes while a save is in progress.

### Backend and persistence

- Add admin-only API endpoints to list/filter inquiries, read inquiry details, and update inquiry status.
- Every admin endpoint must reject unauthenticated requests and enforce the allowlisted administrator identity on the server. Hiding the admin UI or relying on an unguessable hostname is not authorization.
- Store notification attempt status and timestamp on the inquiry so the inbox can show the result after the initial booking response is gone. Add nullable columns through an additive PostgreSQL migration so existing inquiry rows remain valid.
- Update both PostgreSQL and Development-only JSON repository implementations when extending their shared interface.
- Use bounded page sizes and database-side filtering/order/pagination. Do not return an unbounded inquiry collection.
- Preserve the public booking request/response contract and existing persistence-before-notification behavior. If persisting notification outcome fails, the already-persisted inquiry remains successful and its notification outcome is reported as unknown; do not claim the email was sent.

### Authentication and request path

- Cloudflare Access gates the admin hostname with a deny-by-default policy limited to the owner. Configure MFA in Access where available.
- Treat the Access browser cookie as automatically attached browser credentials; do not rely on its `SameSite` setting alone to prevent cross-site request forgery. Every state-changing admin request must use a server-validated anti-forgery token and pass an exact `Origin` check for `https://admin.ahmad-makatreh.vip`. Read-only endpoints must not mutate state.
- The existing static Worker will gain a small entrypoint that selectively handles `/api/admin/*`, proxies only to the configured API origin, and serves all other requests through its existing static asset binding.
- The browser calls admin APIs on the same admin host. The Worker forwards the Cloudflare Access assertion to ASP.NET Core; it does not make authorization decisions itself.
- ASP.NET Core validates the assertion signature against the Cloudflare Access public keys and validates its expected issuer, audience, expiry, and administrator allowlist before authorizing any admin endpoint. Resolve the signing key by JWT `kid` from Cloudflare's published keys so key rotation is handled. Invalid, absent, expired, or wrong-audience assertions fail closed.
- Read the Access team domain, audience, administrator email allowlist, and API origin from deployment configuration. Do not put credentials, private keys, or tokens in source or Vite-exposed variables.
- Do not add an application password login, development authentication bypass, DNS change, Access policy, or production deployment in this phase.

## Data flow

1. Cloudflare Access authenticates the administrator before serving the admin host.
2. The admin UI requests `/api/admin/*` on the same host.
3. The Worker forwards that request and its Access assertion to the fixed API origin.
4. ASP.NET Core validates the JWT and identity before the endpoint can query or update PostgreSQL.
5. The API returns paginated inquiry data or saves the validated status change.

Direct requests to the API origin without a valid Access assertion remain unauthorized, including requests that bypass the Worker.

## Failure handling and privacy

- Missing Access configuration in a production environment prevents admin authorization from being enabled; it must not fall back to allow-all behavior.
- A Cloudflare key-fetch or validation failure fails closed and returns an authorization error without exposing token contents.
- CSRF validation rejects state-changing requests with a missing/invalid anti-forgery token or a non-matching `Origin`; same-origin admin writes continue to work. Do not treat CORS or `SameSite` alone as the CSRF control.
- Database failures return a safe API error and leave the UI able to retry. Status updates are validated against the existing enum.
- Keep existing privacy-preserving logging. Never log JWTs, project details, full emails, or other inquiry contents.
- No automated test sends real email or uses production data.

## Verification

- Frontend: Vite build and lint; verify the public host still selects the public application and the admin host selects the admin shell.
- Worker: verify `/api/admin/*` is forwarded only to the configured origin, the assertion is forwarded, and all other routes still use static assets.
- API integration tests: absent, malformed, expired, wrong-issuer/audience, key rotation, and valid signed Access assertions; unauthorized reads/writes; missing/invalid CSRF token and foreign `Origin` rejection; allowed same-origin status updates; filters, pagination, and detail lookup.
- Persistence tests: notification status/timestamp survive PostgreSQL and Development JSON repository round trips, and old inquiry rows with null notification state remain readable.
- Review migration compatibility, CORS behavior, rate limits on admin writes, error paths, and the final diff.

## Out of scope for this phase

- Package and offer management.
- Site copy, project/article, image, and page-template editing.
- Media upload/storage configuration (including deciding on R2).
- Configuring DNS, Cloudflare Access policies/MFA, API hosting, or production secrets.
- Deploying the site or changing the live Cloudflare Worker.

## Operational prerequisites for a later protected deployment

- Cloudflare Access team domain and application audience.
- Owner email address to place in the server-side allowlist.
- A configured `API_ORIGIN` for the Worker and matching backend deployment settings.
- Cloudflare Access application and deny-by-default owner policy, with MFA if available.

The implementation can prepare code and tests without applying these account-level settings or deploying anything.
