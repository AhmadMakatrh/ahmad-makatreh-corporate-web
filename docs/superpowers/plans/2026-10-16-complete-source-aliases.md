# Complete Source Aliases Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan in the current checkout. The user has explicitly requested continuous implementation and verification.

**Goal:** Apply the original component and alias instructions throughout owned source, including short helpers and tests, retaining only language, runtime, and generated-source constraints.

**Architecture:** Preserve the existing React, Worker, and .NET boundaries. Update symbol references with syntax-aware edits and keep public exports, object keys, initialization order, and method receivers intact. Use language-native comment sections in other owned text formats.

**Tech Stack:** React/Vite JavaScript and JSX, Cloudflare Workers, C#/.NET 10, Python, PowerShell, HTML/CSS/SQL/JSONC and existing project configuration formats.

**Spec:** Original attached source-organization request and the user's 16 October instruction to remove discretionary exceptions.

## Global Constraints

- Work only in the existing maintained checkout; preserve all pre-existing uncommitted changes in a recoverable local snapshot.
- Do not change dependencies or lockfiles, public contracts, deployment behavior, UI text, production data, branches, or commits.
- Keep generated and third-party source excluded as the original request requires.
- Retain natural references only when aliasing would break language/runtime semantics; record each actual category precisely.

## Review Focus

- Shorthand object properties must keep their original serialized names.
- Callbacks, JSX references, recursion, and closures must resolve to the same original object.
- Aliases must initialize after const/class targets and before their consumers; mutable state must remain live.
- React hooks, C# overloads, attributes, extension methods, and framework entry points must remain valid.
- Embedded authentication JavaScript and test helpers are owned source and must be included.

### Task 1: Baseline and source inventory

- [x] Snapshot the current owned files and Git state in ignored local scratch space.
- [x] Inventory named bindings and unsupported alias locations; read each affected file through the syntax analysis.
- [x] Run existing client/Worker/.NET checks and lint, recording failures before implementation.

### Task 2: JavaScript, JSX, and embedded scripts

- [x] Use a temporary parser tool without adding project dependencies.
- [x] Add aliases for previously unaliased imports, named helpers including short/local helpers, and shared module constants with real consumers.
- [x] Update bound references while preserving declarations, exports, property keys, receiver binding, and scope.
- [x] Organize the central sections and verify alias identity and semantic equivalence against the snapshot.
- [x] Run client and Worker tests, lint, and both frontend builds sequentially where outputs are shared.

### Task 3: Other owned source formats

- [x] Complete safe C# type aliases and Python/PowerShell helper references; retain required type/method declarations and runtime bindings.
- [x] Add valid central comment sections to owned HTML, CSS, SQL, JSONC, and other comment-capable source/configuration files.
- [x] Parse/compile the affected formats; run .NET tests and frontend/Worker build checks.

### Task 4: Documentation, verification, and review

- [x] Regenerate the alias index and source inventory from actual source and remove discretionary exceptions from the guide.
- [x] Record all remaining language/runtime constraints and current verification evidence.
- [x] Obtain the fresh final review required by executing-plans, address material findings, and inspect all changes relative to the task snapshot.
- [x] Report the maintained path, verified checks, and actual verification limits.

## Execution rulings

- The existing checkout and uncommitted changes are explicitly part of the user's authorized workspace; no worktree or commit is created.
- The user already authorized completing the work continuously. Planning is recorded here without introducing another approval step.
- Existing behavioral tests and a symbol/equivalence audit are the gates for this behavior-preserving refactor; no artificial feature or implementation-mirroring tests are introduced.
- The final reviewer found two important coverage gaps: conditional/member-factory callable and service bindings, and callable destructuring. Both were addressed in one combined pass; the expanded audit detected 158 pending bindings before the fix and zero afterward, with 170 AST comparisons and all 320 existing tests passing.
- Native positional React dispatcher bindings already provide local aliases for unnamed returned functions. They remain directly associated with the hook call, are included in the catalog, and do not get a second snapshot binding. Canonical built-in hook imports retain static analysis.
- The final executor audit also removed the name-based filter for static local constants and covered remaining database/client service references: 78 further bindings were detected and resolved; the final pending count is zero. Computed request data and empty accumulators retain their role as temporary values.
- Fresh browser validation was attempted but the browser runtime failed before tab acquisition with a missing kernel-assets path. The completion report distinguishes the passed source/build/test checks from this unverified browser path and hosted services.
