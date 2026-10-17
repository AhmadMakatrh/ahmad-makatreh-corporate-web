// The file was created by Ahmed Al-Makhatreh.
// codeguard:components:start
// codeguard:defines: static SEO regression tests
import { test as testRef, before as beforeRef, after as afterRef } from 'node:test';
import assert from 'node:assert/strict';
import { createServer as createViteServer } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath as filePath } from 'node:url';

let server;
let entry;
const fixture = {
  content: { ar: {}, en: {}, assets: {}, overrides: {}, datasets: { projectCards: [], articles: [] } },
  pages: { pages: [{ slug: 'custom', title: { ar: 'صفحة مخصصة', en: 'Custom page' }, description: { ar: 'المحتوى المنشور', en: 'Published content' }, visible: true, showInNav: true, sections: [{ id: 'intro', type: 'text', title: { ar: 'مقدمة', en: 'Introduction' }, body: { ar: 'نص منشور آمن', en: 'Safe published text' } }] }] },
};
const fixtureRef = fixture;
// codeguard:components:end

beforeRef(async () => {
  server = await createViteServer({ root: filePath(new URL('..', import.meta.url)), configFile: false, cacheDir: 'node_modules/.vite-seo-tests', plugins: [react()], ssr: { optimizeDeps: { include: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom', 'react-dom/server', 'react-dom/client'] } }, server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' });
  entry = await server.ssrLoadModule('/src/entry-seo.jsx');
});
afterRef(async () => { await server?.close(); });

testRef('all bundled routes have visible content and no pending Suspense or preloader', async () => {
  const pages = entry.seoPages();
  assert.equal(pages.length, 42);
  for (const page of pages) {
    const rendered = await entry.renderPage(page);
    assert.match(rendered.html, /<h1\b/, page.pathname);
    assert.doesNotMatch(rendered.html, /<!--\$\?-->|<div hidden id="S:|data-site-loading|portfolio-preloader/, page.pathname);
    assert.match(rendered.head, /application\/ld\+json/, page.pathname);
  }
});

testRef('published collections and CMS pages drive routes, content and internal links', async () => {
  const pages = entry.seoPages(fixtureRef);
  assert.equal(pages.some(page => page.path.startsWith('/work/')), false);
  assert.equal(pages.some(page => page.path.startsWith('/journal/')), false);
  const custom = pages.find(page => page.pathname === '/page/ar/custom');
  assert.ok(custom);
  const rendered = await entry.renderPage(custom, fixtureRef);
  assert.match(rendered.html, /نص منشور آمن/);
  assert.doesNotMatch(rendered.html, /data-site-loading/);
  assert.match(rendered.html, /href="\/page\/ar\/custom"/);
  assert.match(rendered.head, /المحتوى المنشور/);
});

testRef('malformed snapshots and reserved CMS slugs fail the build explicitly', () => {
  assert.throws(() => entry.seoPages({ pages: { pages: [{ ...fixtureRef.pages.pages[0], slug: 'page' }] } }), /Invalid SEO snapshot/);
  assert.throws(() => entry.seoPages({ content: { datasets: { articles: [{ slug: '../unsafe' }] } } }), /Invalid SEO snapshot/);
});

testRef('valid index CMS pages retain distinct routes without replacing either homepage', () => {
  const snapshot = structuredClone(fixtureRef);
  snapshot.pages.pages[0].slug = 'index';
  const pages = entry.seoPages(snapshot);
  assert.ok(pages.some(page => page.pathname === '/'));
  assert.ok(pages.some(page => page.pathname === '/page/ar/'));
  assert.ok(pages.some(page => page.pathname === '/index/'));
  assert.ok(pages.some(page => page.pathname === '/page/ar/index/'));
});

testRef('locale URLs preserve existing valid ar CMS pages', () => {
  const snapshot = structuredClone(fixtureRef);
  snapshot.pages.pages[0].slug = 'ar';
  const pages = entry.seoPages(snapshot);
  assert.ok(pages.some(page => page.pathname === '/ar'));
  assert.ok(pages.some(page => page.pathname === '/page/ar/ar'));
  assert.ok(pages.some(page => page.pathname === '/page/ar/'));
});
