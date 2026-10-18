# نظام الكود النظيف — Clean Code System

This guide records the repository's existing conventions for organization, reuse, imports, and aliases. Apply them within the scope of a change while preserving behavior and public contracts. The [architecture map](current-architecture.md) identifies the owners of shared code.

## Organization and reuse

- Read the implementation and its consumers before editing shared code.
- Reuse an existing function or component before adding another implementation. Keep helpers with their owning feature unless multiple consumers need them.
- Keep API handlers, persistence, validation, UI state, and presentation in their existing modules. Do not move unrelated code as part of a small fix.
- Preserve exported names, serialized property keys, routes, and database identifiers unless the task requires a contract change.
- Keep generated files, dependencies, and build output under their generators' ownership. Edit source inputs instead.

## JavaScript imports and references

Use native language aliases rather than wrapper functions that merely forward calls:

```js
import { applyDataOverrides as mergeDataOverrides } from '../providers/publishedSiteContext.js';
```

- Named imports use meaningful local aliases. Existing meaningful aliases remain valid; a local reusable helper or immutable reference generally uses its original name plus `Ref`.
- Default and namespace imports already bind a local name and do not need another alias.
- Use the alias at call sites, when passing a reusable function as a value, and when rendering an aliased component in JSX.
- Preserve original object keys when expanding shorthand or aliasing destructured properties.
- Keep initialization order intact. Do not access a `const` alias before it is initialized or move a scoped helper outside its owning closure.
- Short helpers, helpers used once, test helpers, named service adapters, and factory-returned callables follow the same convention as other reusable components. There is no exemption based on size or number of consumers.
- Parameters, loop variables, mutable state, and individual request/calculation results do not need extra snapshot bindings. Do not extract an object method if doing so changes its receiver.

## React constraints

React's built-in hooks retain their canonical import and call names so hook analysis and React Compiler can recognize them. Custom hook aliases must retain a `use` prefix.

```js
import { useState } from 'react';

const [value, setValue] = useState('');
```

The dispatcher returned by a hook already has a local binding such as `setValue`. Use that binding directly; do not add a second snapshot alias. Keep hooks at the top level of their component or custom hook and preserve effect dependencies.

React class lifecycle names such as `render`, `getDerivedStateFromError`, and `componentDidUpdate` remain unchanged because React calls those contracts.

## Source sections

Owned source files use their language's comment syntax for the existing sections:

```js
// codeguard:components:start
// codeguard:defines: exportedFunction, SharedComponent
// Imports and definitions remain in their required initialization order.
// codeguard:components:end
```

Maintain the markers when editing a file. Executable embedded JavaScript has its own section. Runtime entry statements stay after the definitions they use; scoped helpers remain within their valid scope. These comments do not replace meaningful module boundaries or validation.

## Other language constraints

| Construct | Convention |
| --- | --- |
| C# types and namespaces | Use native `using` aliases where valid. A file-level alias cannot capture a local generic parameter or access a private nested type. |
| C# methods, fields, and properties | Keep native member references, overload resolution, and receiver binding. Do not invent delegates or property wrappers to simulate aliases. |
| C# constants | Explicit immutable constants consumed locally use native `const` aliases in their owning type or block. Preserve `nameof` values and serialized identities. |
| Python imports | Use native `import ... as ...` bindings. |
| CSS, HTML/SVG, SQL, and declarative configuration | Keep native identifiers and reference syntax. Use valid comment sections where the language permits them; do not create substitute selectors or schema names. |
| Strict JSON | Preserve the schema without comments or markers; JSONC permits comments. |
| Generated or third-party files and binary assets | Preserve generator/dependency ownership. Do not inject source markers. |

## Shared implementations

These are common reuse points; consult their current exports rather than maintaining a separate per-symbol inventory.

| Responsibility | Source |
| --- | --- |
| Localized values and immutable collection reordering | `frontend/src/admin/contentCollections.js` |
| Package offer calculation | `frontend/src/data/serviceCatalog.js` |
| Admin requests, sessions, CSRF, and response caching | `frontend/src/admin/adminApi.js` |
| Project slider and enlarged gallery | `frontend/src/components/ui/ProjectMedia.jsx`, `frontend/src/components/ui/ProjectGallery.jsx` |
| Image selection, directional transitions, and swipes | `frontend/src/hooks/useImageNavigation.js` |
| Direction-safe technical text | `frontend/src/components/CaseStudy/TechnicalText.jsx` |
| Shared Worker API | `backend/cloudflare/src/index.js` |

## Reviewing a change

Check all affected consumers, preserve Arabic text and RTL behavior, and review the diff for accidental formatting, broken imports, changed property names, and secrets. Use the checks appropriate to the affected package in the [verification guide](verification-and-release.md). Record actual results for the change; old test counts or alias inventories are not evidence for new code.
