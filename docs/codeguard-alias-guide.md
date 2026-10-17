# نظام الكود النظيف — Clean Code System

This is the project's name for its existing code organization, reuse, import, and native-alias rules. The `codeguard:components:start/end` markers retain their existing syntax.

## Scope and structure

The completion pass covers owned production source and tests in the public React app, administration, Cloudflare API, retained .NET backend, Python helper, embedded authentication JavaScript, styles, markup, handwritten SQL, and comment-capable project/operation configuration. Generated dependency/build output, generated EF migrations, and binary assets retain their original ownership.

The [alias index](alias-index.md) is extracted from current source: **2962 aliases in 246 files**. It includes 969 JavaScript native import bindings, 814 local immutable references, 130 native object-destructuring aliases, 124 native React dispatcher bindings, 905 C# type aliases, 17 C# constant aliases, and 3 Python module aliases. There are no owned static JavaScript import cycles in the inspected graph.

Every owned JavaScript/JSX program has one `codeguard:components:start/end` section. The embedded authentication script is a separate program with its own section. Imports, module definitions, and aliases keep their initialization order. Runtime entry statements follow the section. Scoped helpers remain in their owning closure; their aliases are initialized at the first point compatible with target initialization and React analysis. C# using aliases occupy the file section; type members stay inside their declaring type. Constant aliases use native `const` declarations in their owning type/block.

Short helpers such as `id`, `text`, `object`, `string`, and helpers used once receive the same reference treatment as other named helpers. Test imports/helpers, callbacks returned by factories or conditional expressions, named service adapters, and callable object destructuring are included. New local aliases generally use the original name plus `Ref`; existing meaningful aliases remain intact. An alias calls the original implementation and is also used when passing that component as a value or rendering it in JSX. Object shorthand expansions and destructuring preserve the original property key.

React dispatcher slots such as `const [value, setValue] = useState(...)` already supply a native local alias for the unnamed returned dispatcher. Those bindings are included in the index as `useState()[1]` (or the corresponding reducer/transition hook), used directly, and keep the compiler's direct hook-result relationship. They do not receive a second snapshot binding. This is native alias coverage, not a short-helper exemption.

Parameters, loop variables, mutable state, and temporary results of individual requests/calculations are distinguished from named reusable components. No extra bindings are made solely for those temporary values. Default and namespace imports already provide native local aliases; they do not receive another wrapper or snapshot.

## Shared implementation and consumers

| Original component | Owner | Consumers |
| --- | --- | --- |
| `emptyLocalizedText` | `client/src/admin/contentCollections.js` | Collection, pricing, and page editors; fresh localized object per call |
| `moveRecord` | `client/src/admin/contentCollections.js` | Collection, pricing, and page editors; one immutable reorder implementation |
| `offerPriceForPackage` | `client/src/data/serviceCatalog.js` | Public pricing and admin price suggestion |
| `createApi` | `server/cloudflare/src/index.js` | Public/admin Worker entry points and tests |
| `createAdminClient` | `client/src/admin/adminApi.js` | Admin editors, session refresh, CSRF, reads, writes, and uploads |
| `ProjectMedia` → `WorkMedia` | `client/src/components/ui/ProjectMedia.jsx` | Contribution and case-study pages share the slider, captions, and gallery opener; cards retain their project navigation |
| `ProjectGallery` → `ImageGallery` | `client/src/components/ui/ProjectGallery.jsx` | `ProjectMedia` supplies localized image items, active index, selection dispatcher, name, and close callback; gallery owns native dialog, glass styling, keyboard/focus, zoom, fullscreen, and image failure feedback |
| `useImageNavigation` → `useSlides` | `client/src/hooks/useImageNavigation.js` | `ProjectMedia` and `ProjectGallery` share directional transitions and mouse/touch swipes. Inputs are current index, count, source key, selection callback, language, and enabled flag. Outputs are the image ref, select/move helpers, and pointer handlers. Existing motion preferences disable animations; zoom panning remains native. |
| `TechnicalText` → `TechnicalTextRef` | `client/src/components/CaseStudy/TechnicalText.jsx` | Case studies, contribution copy, Work roles and About intro use one safe text formatter for isolated LTR technical badges within either locale. |

The existing architecture and deployment boundaries remain in [current architecture](current-architecture.md). No files were moved and no dependencies or lockfiles were changed in this completion pass.

## Actual language and framework constraints

| Construct | Required treatment and reason |
| --- | --- |
| React built-in Hooks | Their canonical import/call names are retained so React Compiler and hook dependency analysis recognize state, effects, memoization, and stable refs. Renaming hid dependency checks or introduced analysis warnings. Local component callbacks still have aliases; the admin effect creates its helper alias inside the effect to preserve dependency analysis. |
| React class lifecycle methods | `ErrorBoundary` retains native `render`, `getDerivedStateFromError`, and `componentDidUpdate` names because React invokes those contracts. Its imported base class, consumers, and reload helper use native import/reference aliases. |
| C# methods and live type members | C# `using` aliases name types/namespaces, not methods or live member slots. Method overload resolution, receiver binding, fields, and properties remain native; no delegate/property wrappers are invented. Explicit immutable `const` values have native constant aliases where consumed locally. |
| C# private/protected nested types | They cannot be referenced from an alias outside their declaring type. The original scoped type reference remains. |
| C# local generic parameters | A file-level alias cannot capture a type parameter declared in a method/type scope. Concrete closed generic types have aliases; parameterized families remain native. |
| `nameof`, public exports, entry points, and serialized keys | Original contract names and generated string values are preserved. Consumer references use aliases where supported; definitions and property keys keep the original identity. |
| Mutable bindings and host/object members | Copying a mutable binding can freeze an old value. Extracting a method can change its receiver. These remain live native references within their owner. |
| CSS, HTML/SVG, SQL, and declarative configuration | Native comment sections are included. Selectors, DOM/schema identifiers, custom properties, and configuration keys retain their native reference syntax; these languages do not provide general callable/type alias declarations for those constructs. Existing CSS `var(...)` references are preserved. Embedded executable JavaScript is handled as JavaScript. |
| Strict JSON | JSON grammar rejects comments. These files retain their native schema and exact data, without injected markers. JSONC files do contain valid comment sections; the preview-config test now uses the installed Wrangler JSONC reader and retains all configuration assertions. |
| Generated and third-party files | The original request excludes rewriting them. Their generators/build/dependency inputs remain the source of truth. Binary images/PDFs do not accept source-code sections. Text SVG files are included through XML comments. |

There is no exception based on a helper being short, a component being used once, a file being a test, or HTML/CSS/SQL/JSONC accepting comments.

## Canonical React Hook locations

| Source | Framework imports retained |
| --- | --- |
| `client/src/App.jsx` | `useCallback`, `useState` |
| `client/src/admin/AdminApp.jsx` | `useCallback`, `useEffect`, `useRef`, `useState` |
| `client/src/admin/BackupEditor.jsx` | `useRef`, `useState` |
| `client/src/admin/CollectionEditor.jsx` | `useState` |
| `client/src/admin/ContentEditor.jsx` | `useMemo`, `useState` |
| `client/src/admin/DocumentEditor.jsx` | `useEffect`, `useRef`, `useState` |
| `client/src/admin/DocumentHistory.jsx` | `useRef`, `useState` |
| `client/src/admin/InquiryActions.jsx` | `useEffect`, `useRef`, `useState` |
| `client/src/admin/InquiryBackupImporter.jsx` | `useRef`, `useState` |
| `client/src/admin/InquiryInbox.jsx` | `useCallback`, `useEffect`, `useRef`, `useState` |
| `client/src/admin/MediaLibrary.jsx` | `useEffect`, `useId`, `useRef`, `useState` |
| `client/src/admin/PagesEditor.jsx` | `useState` |
| `client/src/admin/PricingEditor.jsx` | `useEffect`, `useRef`, `useState` |
| `client/src/components/Background/AmbientBackground.jsx` | `useEffect`, `useRef` |
| `client/src/components/ContextMenu/ContextMenu.jsx` | `useEffect`, `useLayoutEffect`, `useRef`, `useState` |
| `client/src/components/CustomCursor/CustomCursor.jsx` | `useEffect`, `useRef`, `useState` |
| `client/src/components/Header/Header.jsx` | `useCallback`, `useEffect`, `useRef`, `useState` |
| `client/src/components/Header/MobileNav.jsx` | `useEffect`, `useRef` |
| `client/src/components/LaunchOffer/LaunchOffer.jsx` | `useLayoutEffect`, `useMemo`, `useRef` |
| `client/src/components/Preloader/Preloader.jsx` | `useEffect`, `useRef`, `useState` |
| `client/src/components/ui/MagneticButton.jsx` | `useRef` |
| `client/src/components/ui/MobileEyeCta.jsx` | `useEffect`, `useRef`, `useState` |
| `client/src/components/ui/ProjectMedia.jsx` | `useState` |
| `client/src/components/ui/ProjectGallery.jsx` | `useId`, `useLayoutEffect`, `useRef`, `useState` |
| `client/src/hooks/useInitialSectionAnchor.js` | `useEffect` |
| `client/src/hooks/useImageNavigation.js` | `useLayoutEffect`, `useRef` |
| `client/src/hooks/useLanguage.js` | `useContext` |
| `client/src/hooks/useNavigation.js` | `useContext` |
| `client/src/hooks/usePortfolioMotion.js` | `useLayoutEffect` |
| `client/src/hooks/useReducedMotion.js` | `useContext` |
| `client/src/hooks/useSiteData.js` | `useMemo` |
| `client/src/pages/About/AboutPage.jsx` | `useEffect` |
| `client/src/pages/CaseStudyPage.jsx` | `useEffect` |
| `client/src/pages/ContentPage.jsx` | `useEffect` |
| `client/src/pages/ProjectContributionPage.jsx` | `useEffect` |
| `client/src/pages/Services/ServicesPage.jsx` | `useEffect` |
| `client/src/pages/WorkPage.jsx` | `useEffect` |
| `client/src/providers/LanguageProvider.jsx` | `useCallback`, `useEffect`, `useState` |
| `client/src/providers/MotionProvider.jsx` | `useCallback`, `useState`, `useSyncExternalStore` |
| `client/src/providers/NavigationProvider.jsx` | `useCallback`, `useEffect`, `useState` |
| `client/src/providers/PublishedSiteProvider.jsx` | `useCallback`, `useEffect`, `useMemo`, `useState` |
| `client/src/providers/publishedSiteContext.js` | `useContext` |
| `client/src/routes/AppRoutes.jsx` | `useEffect`, `useRef` |
| `client/src/sections/Booking/BookingSection.jsx` | `useEffect`, `useRef`, `useState` |
| `client/src/sections/Journal/ArticleView.jsx` | `useEffect`, `useState` |
| `client/src/sections/Journal/JournalSection.jsx` | `useEffect`, `useState` |
| `client/src/sections/Works/WorksSection.jsx` | `useCallback`, `useEffect`, `useMemo`, `useRef`, `useState` |
| `client/tests/errorBoundary.test.js` | `useState` |
| `client/tests/providerContexts.test.js` | `useEffect` |
| `client/tests/reactWarnings.test.js` | `useLayoutEffect`, `useState` |

## Native React dispatcher aliases

These existing positional bindings are used directly and are also mapped in the alias index.

| Source | Native local names |
| --- | --- |
| `client/src/App.jsx` | `setSiteReady` |
| `client/src/admin/AdminApp.jsx` | `setChecking`, `setDirty`, `setError`, `setLoggingOut`, `setLogoutError`, `setRetry`, `setSession`, `setTab` |
| `client/src/admin/BackupEditor.jsx` | `setBackup`, `setBusy`, `setCurrent`, `setError`, `setKey`, `setNotice`, `setSource` |
| `client/src/admin/CollectionEditor.jsx` | `setError`, `setSelected`, `setSlug` |
| `client/src/admin/ContentEditor.jsx` | `setGroup`, `setLimit`, `setSearch` |
| `client/src/admin/DocumentEditor.jsx` | `setBusy`, `setDocument`, `setDraft`, `setError`, `setNotice`, `setReload`, `setSavedJson` |
| `client/src/admin/DocumentHistory.jsx` | `setBusy`, `setError`, `setPage` |
| `client/src/admin/InquiryActions.jsx` | `setAttempted`, `setBody`, `setBusy`, `setError`, `setNotes`, `setNotice`, `setOperationId`, `setReplies`, `setResult`, `setSubject` |
| `client/src/admin/InquiryBackupImporter.jsx` | `setBackup`, `setBusy`, `setError`, `setNotice` |
| `client/src/admin/InquiryInbox.jsx` | `setActionsSaving`, `setCursors`, `setDetail`, `setDetailError`, `setDetailRefresh`, `setDraft`, `setError`, `setExporting`, `setFilters`, `setFiltersOpen`, `setLoading`, `setNewStatus`, `setNotice`, `setPage`, `setRefresh`, `setSaving`, `setSelected` |
| `client/src/admin/MediaLibrary.jsx` | `setBusy`, `setCursor`, `setError`, `setFile`, `setNotice`, `setOpen`, `setPage`, `setPrevious`, `setReload`, `setUploadId` |
| `client/src/admin/PagesEditor.jsx` | `setLanguage`, `setPreview`, `setSectionType`, `setSelected`, `setTemplate` |
| `client/src/admin/PricingEditor.jsx` | `setDraft`, `setSelected`, `setTab` |
| `client/src/components/ContextMenu/ContextMenu.jsx` | `setBusy`, `setError`, `setMenu` |
| `client/src/components/CustomCursor/CustomCursor.jsx` | `setIsHovered`, `setIsVisible` |
| `client/src/components/Header/Header.jsx` | `setMobileMenuOpen` |
| `client/src/components/Preloader/Preloader.jsx` | `setInitialLoading` |
| `client/src/components/ui/MobileEyeCta.jsx` | `setIsBlinking`, `setIsPressed` |
| `client/src/components/ui/ProjectMedia.jsx` | `setActiveIndex`, `setPortraitSources`, `setGalleryOpen` |
| `client/src/components/ui/ProjectGallery.jsx` | `setZoomed`, `setFullscreen`, `setFullscreenError`, `setFailedSource` |
| `client/src/providers/LanguageProvider.jsx` | `setLanguage`, `setPendingLanguage` |
| `client/src/providers/MotionProvider.jsx` | `setMotionPaused` |
| `client/src/providers/NavigationProvider.jsx` | `setCurrentRoute` |
| `client/src/providers/PublishedSiteProvider.jsx` | `setAttempt`, `setClock`, `setError`, `setLoaded`, `setSnapshot` |
| `client/src/sections/Booking/BookingSection.jsx` | `setFormData`, `setIsSubmitting`, `setSubmissionStatus`, `setTurnstileToken` |
| `client/src/sections/Journal/ArticleView.jsx` | `setResult` |
| `client/src/sections/Journal/JournalSection.jsx` | `setResult` |
| `client/src/sections/Works/WorksSection.jsx` | `setActiveIndex`, `setFocused`, `setHovered`, `setInView`, `setPageVisible` |
| `client/tests/errorBoundary.test.js` | `setDraft`, `setPage` |
| `client/tests/reactWarnings.test.js` | `setArticles`, `setLanguage`, `setSlug` |

## Remaining scoped C# cases

These are the concrete locations identified by semantic analysis; duplicate syntax nodes on the same line are combined.

| Source | Line | Constraint |
| --- | --- | --- |
| `server/src/AhmadMakatreh.Api/Security/AdminAccess.cs` | 76 | private/protected nested types cannot be named by a file-level using alias |
| `server/src/AhmadMakatreh.Domain/Entities/Inquiry.cs` | 51 | nameof preserves the original identifier string |
| `server/src/AhmadMakatreh.Domain/Entities/Inquiry.cs` | 53 | nameof preserves the original identifier string |
| `server/src/AhmadMakatreh.Domain/Entities/Inquiry.cs` | 55 | nameof preserves the original identifier string |
| `server/src/AhmadMakatreh.Domain/Entities/Inquiry.cs` | 57 | nameof preserves the original identifier string |
| `server/src/AhmadMakatreh.Infrastructure/BotVerification/CloudflareTurnstileVerificationService.cs` | 105 | private/protected nested types cannot be named by a file-level using alias |
| `server/src/AhmadMakatreh.Infrastructure/Persistence/BookingAbuseHasher.cs` | 31 | nameof preserves the original identifier string |
| `server/src/AhmadMakatreh.Infrastructure/Persistence/DevJson/DevJsonInquiryRepository.cs` | 50 | private/protected nested types cannot be named by a file-level using alias |
| `server/src/AhmadMakatreh.Infrastructure/Persistence/DevJson/DevJsonInquiryRepository.cs` | 70 | nameof preserves the original identifier string |
| `server/src/AhmadMakatreh.Infrastructure/Persistence/DevJson/DevJsonInquiryRepository.cs` | 117 | private/protected nested types cannot be named by a file-level using alias |
| `server/src/AhmadMakatreh.Infrastructure/Persistence/PostgreSql/PostgreSqlInquiryRepository.cs` | 61 | nameof preserves the original identifier string |
| `server/tests/AhmadMakatreh.IntegrationTests/AdminInquiryIntegrationTests.cs` | 157 | private/protected nested types cannot be named by a file-level using alias |
| `server/tests/AhmadMakatreh.IntegrationTests/AdminInquiryIntegrationTests.cs` | 197 | private/protected nested types cannot be named by a file-level using alias |
| `server/tests/AhmadMakatreh.IntegrationTests/AdminInquiryIntegrationTests.cs` | 230 | private/protected nested types cannot be named by a file-level using alias |
| `server/tests/AhmadMakatreh.IntegrationTests/AdminInquiryIntegrationTests.cs` | 244 | private/protected nested types cannot be named by a file-level using alias |
| `server/tests/AhmadMakatreh.IntegrationTests/AdminInquiryIntegrationTests.cs` | 293 | private/protected nested types cannot be named by a file-level using alias |
| `server/tests/AhmadMakatreh.IntegrationTests/AdminInquiryIntegrationTests.cs` | 341 | private/protected nested types cannot be named by a file-level using alias |

## Verification

The coverage audit resolves named bindings and real references, rather than using text replacement. Independent review found missing conditional/member-factory callables, named service objects, and callable destructuring. The expanded audit detected 158 pending bindings before their fix. A final executor check removed the name-based local-constant filter and covered 78 further static constant/model or database/client service references. Both groups are resolved; the final audit has zero pending aliases. Coverage checks actual call/JSX/tagged/constructor/callback uses, native destructuring, static constant initializers regardless of name, declarations, factories, and service adapters. Per-request computed data and empty accumulator containers remain temporary values rather than named components. The C# semantic audit also has zero eligible pending aliases. JavaScript AST equivalence checks cover all 170 files, normalizing aliases and preserving public property keys; the two embedded-helper source assertions follow the new helper name. The preview-config test reader is a deliberate JSONC adapter, with its unchanged assertions compared separately. Python import-alias equivalence passes. All 42 additional text-format files have exact non-comment-content equivalence to the task snapshot. These checks support behavior preservation; they are not a formal whole-program proof. Current command results and hosted verification limits are in [verification and release](verification-and-release.md).
