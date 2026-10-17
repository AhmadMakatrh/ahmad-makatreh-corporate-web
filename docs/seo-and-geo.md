# SEO and GEO

The public build renders the existing React components into complete static HTML. English keeps the existing clean URLs; Arabic has explicit `/page/ar/` URLs. The language control, internal links and browser history preserve the selected locale. Legacy URLs and hash navigation remain supported.

## Generated output

- Page-specific titles, descriptions, production canonical URLs, reciprocal language alternatives and PNG sharing images.
- Schema.org Person, WebSite, ProfilePage, CreativeWork, ItemList, BlogPosting and BreadcrumbList data where applicable. Project contributions do not claim sole authorship, ratings or unverified publication dates.
- `sitemap.xml` contains generated public pages only. `robots.txt` allows public crawling and excludes API/admin paths.
- Actual page content is visible without JavaScript; client rendering retains the existing interactions and real loading screen.
- Arabic routes use the already reserved `/page/` namespace (`/page/ar/`) so valid existing CMS slugs such as `ar` retain their routes. The CMS validators keep their existing contracts. Valid `index` pages use `/index/` and `/page/ar/index/` to keep their files separate from the homepages.

## Building published CMS content

`npm run build` without an input snapshot renders the bundled defaults (42 localized documents). To include published CMS changes, added pages/articles, hidden records, pricing and text overrides, provide the **public `/api/site` JSON response** as `SEO_SNAPSHOT_FILE`:

```powershell
$env:SEO_SNAPSHOT_FILE = 'C:\path\published-site.json'
npm run build
Remove-Item Env:SEO_SNAPSHOT_FILE
```

Use the published response rather than an admin backup or draft. The existing document validator checks the input; rendering and route selection reuse the same `selectSiteData` logic as the browser. Invalid snapshots fail the build. No credentials belong in this file or the build variables.

**Publication remains live in the JavaScript application. Static HTML, sharing previews and the sitemap require a fresh build using the latest published snapshot and a redeployment after CMS changes.** No automatic publishing hook, deployment or search submission was added. Production data and hosted crawl behavior were not modified by this task.

After deployment, submit `/sitemap.xml` in Google Search Console and Bing Webmaster Tools, inspect representative Arabic/English URLs, and validate their structured data. Confirm the hosting layer serves the generated HTML paths and does not block search crawlers. Search indexing and AI citations are determined by those services.

## Source ownership and clean code

- `client/src/utils/seo.js`: shared metadata model, localized paths, safe HTML serialization and client head updates.
- `client/src/entry-seo.jsx`: validated snapshot, public route inventory and rendering from existing React components.
- `client/scripts/seoPrerender.js`: build integration, emitted asset mapping and generated crawl files.
- Providers accept optional render inputs; their existing browser defaults remain intact. Route modules load eagerly only during static rendering and remain split in the browser build.
- Named imports use native aliases; reusable local helpers use `Ref` aliases. React hooks retain their required canonical names.

## References

- [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features): established SEO practices also apply to generative search; special AI text files or AI schema are not required.
- [Google: JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).
- [Google: localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions).

## Modified files in this SEO task

- Build and metadata: `client/index.html`, `client/vite.config.js`, `client/scripts/seoPrerender.js`, `client/src/entry-seo.jsx`, `client/src/utils/seo.js`.
- Application and providers: `client/src/App.jsx`, `client/src/providers/AppProviders.jsx`, `client/src/providers/LanguageProvider.jsx`, `client/src/providers/NavigationProvider.jsx`, `client/src/providers/PublishedSiteProvider.jsx`, `client/src/routes/AppRoutes.jsx`.
- Links and header: `client/src/components/Header/Header.jsx`, `client/src/components/ui/PortfolioLink.jsx`, `client/src/sections/Journal/JournalArticleLink.jsx`.
- Metadata consumers and rendering: `client/src/pages/CaseStudyPage.jsx`, `client/src/pages/ContentPage.jsx`, `client/src/pages/ProjectContributionPage.jsx`, `client/src/pages/WorkPage.jsx`, `client/src/pages/Services/ServicesPage.jsx`, `client/src/sections/Booking/BookingSection.jsx`, `client/src/sections/Journal/ArticleView.jsx`, `client/src/sections/Journal/JournalSection.jsx`, `client/src/sections/Works/WorksSection.jsx`.
- Regression tests: `client/tests/seo.test.js`, `client/tests/seoPrerender.test.js`.
- Documentation: this file, `docs/alias-index.md`, `docs/source-inventory.md`, `docs/verification-and-release.md`.
