# Audit remediation implementation plan

**Goal:** Resolve the 18 findings from the 17 October source audit, preserve the website design and existing contracts, and verify each affected behavior.

**Architecture:** Keep the public React app, separate admin Worker, shared Cloudflare API, and retained ASP.NET/PostgreSQL backend. Fix lifecycle and concurrency at the existing owner of each operation. Use existing components and native platform capabilities.

**Scope:** Findings 1–18 in the audit of commit `82e4f059559617ee42cd84534a77cefe8509e5de`, explicitly authorized by the owner on 17 October 2026.

## Constraints

- Follow `AGENTS.md` and the Clean Code System in `docs/codeguard-alias-guide.md`.
- Preserve design, Arabic/English behavior, public API shapes, permissions, idempotency, and existing data.
- No production writes, deployment, automatic commits, broad refactoring, or unrelated dependency updates.
- Add a DOM test dependency only because current tests cannot mount the React lifecycle paths under review.
- Update the alias index and source inventory for changed/new owned source.

## Work and verification

- [x] 1. Preserve local admin drafts during a recoverable 401; mount state survives reauthentication and writes are never replayed.
- [x] 2. Use the document mutation owner's lock for history restore; delayed restore blocks typing and competing actions.
- [x] 3. Match Turnstile creation/removal to the form lifecycle; success then new inquiry receives a fresh widget.
- [x] 4. Keep HTTP timeout active through response parsing; streamed slow/never-ending JSON aborts.
- [x] 5. Add shared React Error Boundary around public root/routes and admin entry; rejected lazy import offers explicit recovery.
- [x] 6. Align inquiry import size with the bounded 100-record export contract; maximal Unicode/escaped export restores and oversized input fails before database work.
- [x] 7. Capture native event button before await; resend/enroll reenable after success and failure.
- [x] 8. Forward renewed cookie on the backup authenticator page; expired session remains usable for enrollment.
- [x] 9. Challenge the selected authenticator, including a non-first factor and newly enrolled factor.
- [x] 10. Localize CMS internal links, preserving query/fragment and external destinations.
- [x] 11. Use native response.status in non-JSON HTTP errors.
- [x] 12. Reject invalid trusted-proxy configuration before startup; valid explicit IPs retain current behavior.
- [x] 13. Recheck expiry at PostgreSQL deletion; renewed guard survives cleanup.
- [x] 14. Require opt-in isolated PostgreSQL test database, explicit skip, valid test peer, and cleanup.
- [x] 15. Apply the existing port-sensitive SMTP TLS selection to booking notifications.
- [x] 16. Update only vulnerable PKCS package to a patched compatible version and remove blanket advisory suppression.
- [x] 17. Make Docker build its own publish output from a clean source checkout and validate where Docker is available.
- [x] 18. Update source-map-js within the existing dependency range and confirm the advisory disappears.

## Final checks

- [x] Run focused regressions, client and Cloudflare suites, .NET solution tests with truthful PostgreSQL status.
- [x] Build public/admin sequentially, run lint and Worker dry runs, audit npm/NuGet dependencies.
- [x] Browser check desktop/mobile, Arabic/English and slider/gallery; mounted regressions cover loading/error recovery.
- [x] Independent review of all changes; resolve actionable regressions and review final diff for secrets/debug code.
- [x] Record per-finding implementation/test evidence and remaining environment limits.

## Official implementation references

- [React state preservation](https://react.dev/learn/preserving-and-resetting-state)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Fetch cancellation and response bodies](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#canceling_a_request)
- [Turnstile widget lifecycle](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/)
- [Native currentTarget lifetime](https://developer.mozilla.org/en-US/docs/Web/API/Event/currentTarget)
- [ASP.NET forwarded headers](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer?view=aspnetcore-10.0)
- [PostgreSQL Read Committed behavior](https://www.postgresql.org/docs/16/transaction-iso.html)
- [Microsoft container build](https://learn.microsoft.com/en-us/dotnet/core/docker/build-container)
- [source-map-js advisory](https://github.com/advisories/GHSA-68fv-2mgg-jv7q)
- [PKCS advisory](https://github.com/advisories/GHSA-846f-f764-76mx)
