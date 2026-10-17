# Maintenance plan

This copy is a separate repository. The original checkout and production deployment remain untouched. Each phase ends with a working build and one or more commits that contain a real, related change; commits are not split to inflate a count.

1. **Baseline and boundaries** — import the current source without generated files or secrets; record the runtime ownership map, feature inventory, commands, and pre-existing warnings.
2. **Frontend shared behavior** — inspect actual consumers of pricing, offers, content, routes, and media. Consolidate only proven duplicate behavior; preserve Arabic/English output, RTL layout, URL paths, and user interactions. Test focused logic and both Vite builds.
3. **Administration boundaries** — keep each editor's state and requests with its feature; reuse the existing `adminApi` rather than creating transport copies. Verify drafts, publication, history, media, and inquiry interactions with existing tests.
4. **Edge API boundaries** — organize only handlers with a demonstrated ownership problem, preserving D1 migrations, auth, session, CSRF, booking, rate limits, and response contracts. Run Cloudflare tests and dry-run build after each change.
5. **Alternative .NET backend** — retain the ASP.NET Core implementation and tests. Change it only if a concrete maintenance problem is found; do not substitute it for the deployed Worker path.
6. **Release review** — install from lockfiles, run lint/tests/builds, inspect the full diff and generated assets, update the component map, and provide deployment steps. A production deployment or production database migration requires a separate request.

Before each code change: trace its callers and dependencies, identify the smallest useful extraction or move, then verify the affected path. No speculative directory hierarchy, new dependency, or API migration is part of this plan. The current-to-new location map begins as identity: `client/`, `server/cloudflare/`, `server/src/`, and `docs/` retain their paths. Record any future move in `current-architecture.md` with its consumers and verification.

A phase is complete only when its behavior is tested. The initial import is a snapshot, not evidence that the full reorganization is finished.

## Commit practice

A commit contains one reviewable purpose and its relevant tests/docs. The initial import is necessarily broad; later commits should be small and focused. See [GitHub's guidance on small, focused commits](https://docs.github.com/en/contributing/collaborating-on-github-docs/using-git-on-github-docs).
