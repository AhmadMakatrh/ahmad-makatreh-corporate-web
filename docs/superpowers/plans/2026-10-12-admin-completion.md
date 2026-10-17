# Admin Completion Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to execute stages inline and update the persistent ledger after each verified stage. Do not commit, push, change branches, deploy, or delete the ledger automatically.

**Goal:** Complete the missing administration capabilities while retaining existing site behavior and bounded database traffic.
**Architecture:** Extend existing admin document/inquiry APIs and repositories. Use additive schemas and optional structured content, protected by the existing Access/CSRF policy.
**Tech Stack:** React 19/Vite, .NET 10/EF Core/PostgreSQL, Development JSON, Cloudflare Access and R2, existing MailKit SMTP.
**Spec:** `docs/superpowers/specs/2026-10-12-admin-completion-design.md`

## Global Constraints

Follow AGENTS.md; preserve pre-existing changes; no secrets; no production tests/migrations/deploy without a concrete approved environment. Keep Arabic/English and current design. No polling/autosave. Persistent execution record: `docs/admin-completion-progress.md`.

## Review Focus

- A failed upload must not leave an apparently usable asset record.
- Deleted/reordered project/article records must not corrupt historical positional overrides.
- A stale editor or backup must not overwrite newer data silently.
- Repeated mail clicks/retries must not send multiple replies.
- Logout/cancelled navigation must preserve unsaved work and current authentication until navigation succeeds.

## Stage 1: Session/logout

Files: `client/src/admin/AdminApp.jsx`, `adminHost.js`, `admin.css`, `client/tests/admin.test.js`.
- [x] Add/test exact application logout URL and functional button; preserve dirty navigation guard.
- [x] Verify client tests, build/lint, no backend request for logout. Actual Cloudflare session revocation awaits external setup.

## Stage 2: Structured project/article management

Files: `ContentEditor.jsx`, focused project/article editor modules, `useSiteData.js`, `publishedSiteContext.js`, `SiteDocumentValidator.cs`, model/test files, public consumers where required.
- [x] Define optional structured datasets using existing project/article shapes; seed edits from existing data with existing overrides applied.
- [x] Test backwards compatibility, removal/reorder, unsafe links, duplicate slugs, bilingual fields, empty datasets and limits.
- [x] Implement explicit draft CRUD, preview, visibility, ordering, public route binding; no requests while editing.
- [x] Verify published data renders and removed entries disappear without corrupting original fallback data.

## Stage 3: Version history/audit/backup

Files: document entities/interfaces, JSON/PostgreSQL repositories, additive migration, admin endpoints, `DocumentEditor.jsx`, new history/backup UI/tests.
- [x] Implement atomic revision/audit snapshots; paginated history and optimistic restore-to-draft. PostgreSQL SQL prepared; execution against a real database remains in Stage 6.
- [x] Add versioned content/inquiry export/import with bounded validated input, conflict checks, explicit restore confirmation and no secret fields.
- [x] Test local concurrent writes, cancelled restore, malformed backup, safe CSV cells, atomicity, and pagination.
- [x] Document full PostgreSQL/R2 backup procedures.
- [ ] Test full PostgreSQL/R2 backup and restore in isolated infrastructure once available.

## Stage 4: Media library

Files: storage interfaces/adapters/options, media entity/repositories/migration/endpoints, library/upload/picker UI, integration tests.
- [x] Reuse an established S3 SDK after dependency check; prepare R2 secret configuration outside source and actual local Development storage. Account credentials remain unset.
- [x] Validate size/signature/type; random storage keys; explicit upload; bounded list; safe archival/reference protection.
- [x] Integrate picker in content, project/article and page image/file fields.
- [x] Verify actual local storage round trip and failed storage leaves no accepted metadata; no polling or extra picker calls.

## Stage 5: Inquiry operations

Files: inquiry/admin models/repositories/migrations/endpoints, existing notification service, `InquiryInbox.jsx`, tests.
- [x] Add private notes, bounded export and reply history.
- [x] Implement idempotent explicit SMTP reply with status/time and failure recovery; preserve existing notification semantics.
- [x] Verify no email on status/note changes, no duplicate replies for the same operation ID, safe export and permission/CSRF checks. Actual local SMTP acceptance and uncertain disconnect tested; owner inbox delivery remains untested.

## Stage 6: End-to-end verification and deployment preparation

- [x] Run API integration/security tests, public/admin isolated browser workflows, client/Worker checks, build/lint/diff and SQL translation checks. Broader server suites have 7 pre-existing failures; see ledger.
- [ ] Run PostgreSQL migrations/repository/concurrent-write tests in a dedicated non-production database. No database is available; Docker launch was rejected by command review.
- [x] Record HTTP operations and source-derived database command budgets per important action in documentation. Real database measurements remain unavailable.
- [x] Prepare additive idempotent SQL and configuration checklist; no production migration or deployment performed.
- [ ] Verify actual Access/API/R2/SMTP and full backup restore once owner supplies environment. Owner confirmed no services have been configured.
- [x] Record the concrete local result and distinguish it from unavailable live verification in the persistent ledger and setup documentation.

## Resume Point

Source stages 1–5 and local Stage 6 checks are complete. Resume only the unchecked infrastructure checks after an isolated PostgreSQL service and the hosting/account settings exist. Do not rebuild completed features or treat the local fixtures as evidence of production operation.
