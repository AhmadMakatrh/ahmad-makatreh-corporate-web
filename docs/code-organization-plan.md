# Code organization plan

This plan implements the 16 October 2026 source organization request in the existing checkout. No branch, project copy, deployment, or production data change is part of this work.

## Baseline

- React 19.2.8, Vite 8.2.2, Tailwind CSS 4.3.3, Node.js 22+, Cloudflare Workers with Wrangler 4.149.0, and ASP.NET Core 10 are the current stack.
- Public entry: `client/src/main.jsx` and `client/worker.js`. Admin entry: `client/src/admin/main.jsx` and `client/workers/admin-worker.js`. Both Workers import `server/cloudflare/src/index.js`; `server/src/` is a retained .NET alternative.
- Clean Git tree at start. `npm ci` succeeded in both JavaScript projects after temporarily stopping the Vite server, which had locked a native binding on Windows.
- Baseline checks: client tests 31/31, Cloudflare tests 159/159, .NET tests 129/129; client lint exit 0 with nine inherited warnings; public/admin Vite builds and Cloudflare dry run pass. Client `npm ci` reports one inherited high severity transitive advisory.

## Stages

1. Inventory every owned source and configuration file, recording its responsibility, disposition, change, and verification. Mark generated artifacts and data formats that cannot accept comments separately.
2. Locate equivalent implementations by comparing behavior and consumers. Consolidate only confirmed duplicates and keep public exports, API shapes, routes, and initialization order intact.
3. Add safe `codeguard:components:start/end` sections to all owned JavaScript, JSX, C#, and Python source files that support comment markers, excluding generated migrations. Introduce context-specific import aliases where their source and consumer can be traced; update all references to those bindings using symbol-aware edits. Keep React hook calls, exports, dynamically loaded names, C# members, and data/configuration formats in their required forms.
4. Update the architecture map, shared-component and alias guide, and inventory with actual changes and justified exceptions.
5. Run affected tests after each code group, then the full client, Cloudflare, and .NET checks, both Vite builds, Worker dry runs, and local browser smoke checks. Review the complete Git diff and leave build artifacts in the existing ignored output folders.

## Compatibility gates

Keep `/api/site`, `/api/booking`, `/api/admin/*`, all public and legacy routes, authentication and CSRF flows, D1 document shapes, Supabase integration, Arabic and English text, RTL styles, and existing Cloudflare configuration values unchanged. Preserve migration statements, generated migration source, and production data. Do not commit or publish.

## Completion of the alias instructions — 16 October 2026

The follow-up request removes the short-helper/test exemptions and includes valid comment sections in all owned comment-capable source formats. It preserves the existing handwritten SQL statements while adding comments; generated EF migration source and deployed data remain untouched. The detailed completion plan is `docs/superpowers/plans/2026-10-16-complete-source-aliases.md`.

The actual catalog now contains 2617 native/reference aliases in 226 files, including scoped JavaScript helpers and callbacks, local constants/models regardless of naming, native object-destructuring and React dispatcher bindings, C# type/constant aliases, and Python imports. There are 42 additional text-format files with exact non-comment-content equivalence. The guide replaces the prior discretionary exclusions with concrete runtime/language requirements and source locations. Independent review findings about conditional/factory callables, destructuring, and service adapters were fixed (158 bindings), and the final constant/service check covered 78 further bindings. The final audit has zero pending aliases. The maintained tree contains 391 owned source, configuration, documentation, and asset files in the inventory.
