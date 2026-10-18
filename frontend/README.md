# Public site and administration frontend

This Vite/React package builds two interfaces from the same source tree:

- `npm run build` generates the public site in `dist/` from `src/main.jsx`.
- `npm run build:admin` generates the administration interface in `dist-admin/` from `src/admin/main.jsx`.
- `vite.config.js` imports `scripts/seoPrerender.js` for public-page prerendering; Vite copies `public/_headers` into `dist/`.
- `npm run dev` serves both on local hostnames; the development `/api` proxy points to `http://localhost:5000` unless an explicit `VITE_API_BASE_URL` is used.
- `npm run lint` and `node --test tests/*.test.js` check the client source.

Install with `npm ci`. Cloudflare Worker entry points and deployment bindings live in [`../deploy/cloudflare/`](../deploy/cloudflare/): `public-worker.js`, `admin-worker.js`, `wrangler.public.jsonc`, and `wrangler.admin.jsonc`. The authentication page is `admin-auth-page.js` in that directory. Never put server secrets in `VITE_*` variables.

See the [repository README](../README.md) and [current architecture map](../docs/current-architecture.md) for the full system.
