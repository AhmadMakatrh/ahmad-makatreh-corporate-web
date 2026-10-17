# React warning remediation implementation plan

**Goal:** Fix the eight remaining Oxlint React warnings without changing page design, public APIs, or supported interactions.

**Architecture:** Retain existing providers, hooks and async article APIs. Move contexts and consumer hooks into their existing non-JSX hook modules so provider files export only components. Subscribe to browser media state with React's external-store hook. Derive article loading from the inputs associated with completed results; keep asynchronous loading and stale-response cleanup.

**Tech stack:** Existing React 19, Vite, Oxlint, Node test runner and jsdom harness. No new dependencies or lint configuration changes.

**Spec:** Owner request on 17 October 2026; the eight diagnostics reproduced in `npm run lint`.

## Constraints and review focus

- Follow AGENTS.md and the Clean Code System; preserve all earlier uncommitted audit repairs.
- Keep hook consumer paths, context defaults/errors, language history and navigation behavior.
- Preserve SSR content and initial hydration output, live motion preference updates, manual pause and listener cleanup.
- Preserve real async article APIs, loading/error/empty states, metadata and cancellation of stale results.
- Keep callback identity stable for mobile menu focus/scroll effects.
- No commits, deployment, dependencies, rule suppression or unrelated refactoring.

## Tasks

- [x] Separate `NavigationProvider.jsx` and `LanguageProvider.jsx` component exports from context/hooks in existing `hooks/useNavigation.js` and `hooks/useLanguage.js`; test navigation, locale/history and outside-provider errors.
- [x] Separate `MotionProvider.jsx` from context/hooks in `hooks/useReducedMotion.js`; use `useSyncExternalStore` for browser media snapshots with the original false SSR snapshot. Test initial settings, live changes, pause and cleanup/SSR.
- [x] In `JournalSection.jsx` and `ArticleView.jsx`, store resolved results with their language/source/slug and derive loading for current inputs. Keep async updates and stale-response guards; test input changes, empty/not-found and SSR content.
- [x] Correct `Header.jsx` callback dependencies without changing menu behavior; test open/close and cleanup.
- [x] Run client regressions, public/admin builds, all Worker dry runs and lint; review representative desktop/mobile Arabic/English pages.
- [x] Regenerate alias metadata and update the source inventory and verification record; review only this task's additional diff and preserve prior work.

## Official references

- [React state in Effects](https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect)
- [Deriving state when inputs change](https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
- [React external stores and server snapshots](https://react.dev/reference/react/useSyncExternalStore)
- [Memoization dependencies](https://react.dev/reference/eslint-plugin-react-hooks/lints/preserve-manual-memoization)
- [Vite consistent component exports](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react#consistent-components-exports)
