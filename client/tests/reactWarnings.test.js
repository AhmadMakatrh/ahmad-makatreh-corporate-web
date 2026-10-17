// codeguard:components:start
// codeguard:defines: article loading and header callback regression tests
import { test as testRef, before as beforeRef, after as afterRef } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as element, act as actRef, useLayoutEffect, useState } from 'react';
import { createComponentEnvironment as createEnvironment, waitFor as waitForRef } from './helpers/componentEnvironment.js';
const mountJournalProbeRef = mountJournalProbe;
const translate = key => key;
const translateRef = translate;
// ssrLoadModule supplies SSR=true; these mounted tests need the same branch as the client build.
const clientJournalPlugin = {
  name: 'test-client-journal-branch',
  enforce: 'pre',
  transform(source, id) {
    if (/\/sections\/Journal\/(?:ArticleView|JournalSection)\.jsx$/.test(id.replaceAll('\\', '/'))) {
      return source.replaceAll('import.meta.env.SSR', 'false');
    }
  },
};
const clientJournalPluginRef = clientJournalPlugin;
const records = [
  { slug: 'first', language: 'en', title: 'English first', summary: 'English summary', content: 'English body', date: '2026-10-17' },
  { slug: 'first', language: 'ar', title: 'المقال الأول', summary: 'ملخص أول', content: 'محتوى أول', date: '2026-10-17' },
  { slug: 'second', language: 'ar', title: 'المقال الثاني', summary: 'ملخص ثان', content: 'محتوى ثان', date: '2026-10-17' },
];
const recordsRef = records;
let environment;

async function mountJournalProbe(environment, singleArticle) {
  const { JournalSection: Journal } = await environment.load('/src/sections/Journal/JournalSection.jsx');
  const { ArticleView: Article } = await environment.load('/src/sections/Journal/ArticleView.jsx');
  const { LanguageContext: Language } = await environment.load('/src/hooks/useLanguage.js');
  const { NavigationContext: Navigation } = await environment.load('/src/hooks/useNavigation.js');
  const { PublishedSiteContext: Site } = await environment.load('/src/providers/publishedSiteContext.js');
  const commits = [];
  function Host() {
    const [language, setLanguage] = useState('en');
    const [slug, setSlug] = useState('first');
    const [articles, setArticles] = useState(recordsRef);
    useLayoutEffect(() => {
      const view = document.querySelector('[data-journal-probe]');
      commits.push({ language, slug, loading: Boolean(view.querySelector('[data-site-loading]')), text: view.textContent });
    }, [language, slug, articles]);
    return element('div', null,
      element('button', { onClick: () => setLanguage('ar'), 'data-action': 'language' }, 'Arabic'),
      element('button', { onClick: () => setSlug('second'), 'data-action': 'slug' }, 'Second'),
      element('button', { onClick: () => setArticles(recordsRef.map(article => ({ ...article, title: `${article.title} updated` }))), 'data-action': 'source' }, 'Refresh'),
      element('button', { onClick: () => setArticles([]), 'data-action': 'empty' }, 'Empty'),
      element('div', { 'data-journal-probe': true }, element(Site.Provider, { value: { snapshot: { content: { datasets: { articles } } } } },
        element(Language.Provider, { value: { language, t: translateRef } }, element(Navigation.Provider, { value: { currentSlug: null, navigateTo() {} } },
          singleArticle ? element(Article, { slug }) : element(Journal))))));
  }
  const HostRef = Host;
  return { ...await environment.mount(element(HostRef)), commits };
}
// codeguard:components:end

beforeRef(async () => { environment = await createEnvironment({ plugins: [clientJournalPluginRef] }); });
afterRef(async () => { await environment?.close(); });

testRef('journal derives loading immediately for a new language or published article source', async () => {
  const environmentRef = environment;
  let mounted;
  try {
    mounted = await mountJournalProbeRef(environmentRef, false);
    assert.equal(mounted.commits[0].loading, true);
    assert.match(mounted.container.textContent, /English first/);
    await actRef(async () => { mounted.container.querySelector('[data-action="language"]').click(); });
    assert.equal(mounted.commits.at(-1).loading, true);
    assert.doesNotMatch(mounted.commits.at(-1).text, /English first/);
    assert.match(mounted.container.textContent, /المقال الأول/);
    await actRef(async () => { mounted.container.querySelector('[data-action="source"]').click(); });
    assert.equal(mounted.commits.at(-1).loading, true);
    assert.match(mounted.container.textContent, /المقال الأول updated/);
    await actRef(async () => { mounted.container.querySelector('[data-action="empty"]').click(); });
    assert.match(mounted.container.textContent, /noPosts/);
    assert.equal(mounted.container.querySelector('[data-site-loading]'), null);
  } finally { await mounted?.unmount(); }
});

testRef('article derives loading for language, slug and source changes and keeps metadata/not-found behavior', async () => {
  const environmentRef = environment;
  let mounted;
  try {
    mounted = await mountJournalProbeRef(environmentRef, true);
    assert.equal(mounted.commits[0].loading, true);
    assert.equal(mounted.container.querySelector('h1').textContent, 'English first');
    await actRef(async () => { mounted.container.querySelector('[data-action="language"]').click(); });
    assert.equal(mounted.commits.at(-1).loading, true);
    assert.doesNotMatch(mounted.commits.at(-1).text, /English first/);
    assert.equal(mounted.container.querySelector('h1').textContent, 'المقال الأول');
    await actRef(async () => { mounted.container.querySelector('[data-action="slug"]').click(); });
    assert.equal(mounted.commits.at(-1).loading, true);
    assert.doesNotMatch(mounted.commits.at(-1).text, /المقال الأول/);
    assert.equal(mounted.container.querySelector('h1').textContent, 'المقال الثاني');
    assert.equal(document.querySelector('link[rel="canonical"]').href, 'https://ahmad-makatreh.vip/page/ar/journal/second');
    await actRef(async () => { mounted.container.querySelector('[data-action="source"]').click(); });
    assert.equal(mounted.commits.at(-1).loading, true);
    assert.equal(mounted.container.querySelector('h1').textContent, 'المقال الثاني updated');
    await actRef(async () => { mounted.container.querySelector('[data-action="empty"]').click(); });
    assert.match(mounted.container.textContent, /404 — articleNotFound/);
    assert.equal(document.querySelector('meta[name="robots"]').content, 'noindex, follow');
  } finally { await mounted?.unmount(); }
});

testRef('header keeps menu close, requests opener focus and unlocks scroll after parent updates', async context => {
  const environmentRef = environment;
  let mounted;
  try {
    context.mock.method(window, 'matchMedia', query => ({ matches: true, media: query, addEventListener() {}, removeEventListener() {} }));
    const { Header: HeaderView } = await environmentRef.load('/src/components/Header/Header.jsx');
    const { LanguageContext: Language } = await environmentRef.load('/src/hooks/useLanguage.js');
    const { NavigationContext: Navigation } = await environmentRef.load('/src/hooks/useNavigation.js');
    const { PublishedSiteContext: Site } = await environmentRef.load('/src/providers/publishedSiteContext.js');
    const { MotionContext: Motion } = await environmentRef.load('/src/hooks/useReducedMotion.js');
    function Host() {
      const [language, setLanguage] = useState('en');
      return element('div', null,
        element('button', { 'data-parent-update': true, onClick: () => setLanguage('ar') }, 'Update parent'),
        element(Site.Provider, { value: { snapshot: {} } }, element(Language.Provider, { value: { language, t: translateRef, toggleLanguage() {} } },
          element(Navigation.Provider, { value: { currentTab: 'work', navigateTo() {} } }, element(Motion.Provider, { value: { prefersReducedMotion: true } }, element(HeaderView))))));
    }
    const HostRef = Host;
    mounted = await environmentRef.mount(element(HostRef));
    const opener = mounted.container.querySelector('.portfolio-menu-toggle');
    opener.focus();
    assert.ok(document.activeElement === opener, 'The opener must receive focus before opening');
    const restoreFocus = context.mock.method(opener, 'focus');
    const restoreFocusRef = restoreFocus;
    await actRef(async () => { opener.click(); });
    assert.equal(opener.getAttribute('aria-expanded'), 'true');
    assert.equal(document.body.style.overflow, 'hidden');
    await waitForRef(() => document.activeElement?.getAttribute('aria-label') === 'close');
    const focusedClose = document.activeElement;
    await actRef(async () => { mounted.container.querySelector('[data-parent-update]').click(); });
    assert.ok(document.activeElement === focusedClose, 'Parent updates must keep the focused menu button');
    await actRef(async () => { window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' })); });
    assert.equal(mounted.container.querySelector('[role="dialog"]'), null);
    assert.equal(document.body.style.overflow, '');
    assert.equal(document.documentElement.style.overflow, '');
    assert.equal(restoreFocusRef.mock.callCount(), 1);
    assert.equal(opener.isConnected, true);
  } finally { await mounted?.unmount(); }
});
