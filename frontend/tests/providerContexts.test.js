// codeguard:components:start
// codeguard:defines: mounted navigation and language provider regression tests
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as element, act as actRef, useEffect } from 'react';
import { createComponentEnvironment as createEnvironment } from './helpers/componentEnvironment.js';
// codeguard:components:end

testRef('navigation keeps localized routes, history state, same-path behavior and scroll actions', async context => {
  const environment = await createEnvironment({ url: 'https://site.localhost/page/ar/work/tammivo?view=all#details' });
  const environmentRef = environment;
  try {
    const { NavigationProvider: NavProvider } = await environmentRef.load('/src/providers/NavigationProvider.jsx');
    const { useNavigation: useNav } = await environmentRef.load('/src/hooks/useNavigation.js');
    const scroll = context.mock.method(window, 'scrollTo', () => {});
    const scrollRef = scroll;
    document.documentElement.lang = 'ar';
    let navigation;
    function Consumer() {
      const value = useNav();
      useEffect(() => { navigation = value; }, [value]);
      return element('span', null, `${value.currentTab}:${value.currentSlug}`);
    }
    const ConsumerRef = Consumer;
    const mounted = await environmentRef.mount(element(NavProvider, null, element(ConsumerRef)));
    assert.equal(mounted.container.textContent, 'work:tammivo');
    const initialLength = window.history.length;
    await actRef(() => navigation.navigateTo('journal', 'post-slug'));
    assert.equal(window.location.pathname, '/page/ar/journal/post-slug');
    assert.equal(mounted.container.textContent, 'journal:post-slug');
    assert.deepEqual(window.history.state, { tab: 'journal', slug: 'post-slug' });
    assert.equal(window.history.length, initialLength + 1);
    await actRef(() => navigation.navigateTo('journal', 'post-slug'));
    assert.equal(window.history.length, initialLength + 1);
    await actRef(() => navigation.navigateTo('page', 'privacy'));
    assert.equal(window.location.pathname, '/page/ar/privacy');
    assert.equal(mounted.container.textContent, 'page:privacy');
    await actRef(() => navigation.navigateTo('invalid-tab'));
    assert.equal(window.location.pathname, '/page/ar/');
    assert.equal(mounted.container.textContent, 'home:null');
    assert.equal(scrollRef.mock.callCount(), 4);
    assert.deepEqual(scrollRef.mock.calls[0].arguments, [{ top: 0, behavior: 'smooth' }]);
  } finally { await environmentRef.close(); }
});

testRef('navigation keeps initial-path precedence and responds to popstate and legacy hashes', async () => {
  const environment = await createEnvironment({ url: 'https://site.localhost/work/tammivo' });
  const environmentRef = environment;
  try {
    const { NavigationProvider: NavProvider } = await environmentRef.load('/src/providers/NavigationProvider.jsx');
    const { useNavigation: useNav } = await environmentRef.load('/src/hooks/useNavigation.js');
    function Consumer() {
      const { currentTab: tab, currentSlug: slug } = useNav();
      return element('span', null, `${tab}:${slug}`);
    }
    const ConsumerRef = Consumer;
    const mounted = await environmentRef.mount(element(NavProvider, { initialPath: '/page/ar/journal/initial-post' }, element(ConsumerRef)));
    assert.equal(mounted.container.textContent, 'journal:initial-post');
    await actRef(() => {
      window.history.replaceState(null, '', '/page/ar/contact');
      window.dispatchEvent(new window.PopStateEvent('popstate'));
    });
    assert.equal(mounted.container.textContent, 'booking:null');
    await actRef(() => {
      window.history.replaceState(null, '', '/#work/legacy-project');
      window.dispatchEvent(new window.HashChangeEvent('hashchange'));
    });
    assert.equal(mounted.container.textContent, 'work:legacy-project');
    await actRef(() => {
      window.history.replaceState(null, '', '/custom-page');
      window.dispatchEvent(new window.PopStateEvent('popstate'));
    });
    assert.equal(mounted.container.textContent, 'page:custom-page');
  } finally { await environmentRef.close(); }
});

testRef('language keeps explicit, localized URL, SEO and saved-preference initialization precedence', async () => {
  const environment = await createEnvironment();
  const environmentRef = environment;
  try {
    const { LanguageProvider: LangProvider } = await environmentRef.load('/src/providers/LanguageProvider.jsx');
    const { useLanguage: useLang } = await environmentRef.load('/src/hooks/useLanguage.js');
    function Consumer() { return element('span', null, useLang().language); }
    const ConsumerRef = Consumer;
    for (const scenario of [
      { path: '/page/ar/work', initial: 'en', seo: 'en', saved: 'ar', expected: 'en' },
      { path: '/page/ar/work', seo: 'en', saved: 'en', expected: 'ar' },
      { path: '/work', seo: 'en', saved: 'ar', expected: 'en' },
      { path: '/work', saved: 'ar', expected: 'ar' },
      { path: '/work', saved: 'en', expected: 'en' },
      { path: '/work', saved: 'invalid', expected: 'en' },
    ]) {
      window.history.replaceState(null, '', scenario.path);
      delete document.documentElement.dataset.seoLanguage;
      if (scenario.seo) document.documentElement.dataset.seoLanguage = scenario.seo;
      localStorage.setItem('siteLanguage', scenario.saved);
      const mounted = await environmentRef.mount(element(LangProvider, { initialLanguage: scenario.initial }, element(ConsumerRef)));
      assert.equal(mounted.container.textContent, scenario.expected, JSON.stringify(scenario));
      assert.equal(document.documentElement.lang, scenario.expected);
      assert.equal(document.documentElement.dir, scenario.expected === 'ar' ? 'rtl' : 'ltr');
      assert.equal(localStorage.getItem('siteLanguage'), scenario.expected);
      await mounted.unmount();
    }
  } finally { await environmentRef.close(); }
});

testRef('language switching keeps history, pending-load guard, translations and document direction', async () => {
  const environment = await createEnvironment({ url: 'https://site.localhost/page/ar/work/tammivo?view=all#details' });
  const environmentRef = environment;
  try {
    const { LanguageProvider: LangProvider } = await environmentRef.load('/src/providers/LanguageProvider.jsx');
    const { useLanguage: useLang } = await environmentRef.load('/src/hooks/useLanguage.js');
    const { PublishedSiteContext: SiteContext } = await environmentRef.load('/src/providers/publishedSiteContext.js');
    let language;
    function Consumer() {
      const value = useLang();
      useEffect(() => { language = value; }, [value]);
      return element('span', null, `${value.language}:${value.pendingLanguage}`);
    }
    const ConsumerRef = Consumer;
    const mounted = await environmentRef.mount(element(SiteContext.Provider, { value: { snapshot: { content: { ar: { home: 'الرئيسية المخصصة' }, en: { home: 'Managed home' } } } } },
      element(LangProvider, null, element(ConsumerRef))));
    const initialLength = window.history.length;
    window.history.replaceState({ retained: 'draft' }, '', window.location.href);
    assert.equal(language.t('home'), 'الرئيسية المخصصة');
    assert.equal(language.t('cmsHeroTitle'), 'أبرمج الفكرة.');
    assert.equal(language.t('unknown-translation-key'), 'unknown-translation-key');
    await actRef(() => language.toggleLanguage());
    assert.equal(mounted.container.textContent, 'en:en');
    assert.equal(document.documentElement.dir, 'ltr');
    assert.equal(localStorage.getItem('siteLanguage'), 'en');
    assert.equal(language.t('home'), 'Managed home');
    assert.equal(language.t('cmsHeroTitle'), 'I code the idea.');
    assert.equal(language.t('menu'), 'Menu');
    assert.equal(window.location.pathname + window.location.search + window.location.hash, '/work/tammivo?view=all#details');
    assert.deepEqual(window.history.state, { retained: 'draft' });
    assert.equal(window.history.length, initialLength);
    await actRef(() => language.toggleLanguage());
    assert.equal(mounted.container.textContent, 'en:en');
    await actRef(() => language.finishLanguageChange());
    assert.equal(mounted.container.textContent, 'en:null');
    await actRef(() => language.toggleLanguage());
    assert.equal(mounted.container.textContent, 'ar:ar');
    assert.equal(document.documentElement.dir, 'rtl');
    assert.equal(window.location.pathname + window.location.search + window.location.hash, '/page/ar/work/tammivo?view=all#details');
    await actRef(() => language.finishLanguageChange());
    await actRef(() => {
      window.history.replaceState(window.history.state, '', '/about');
      window.dispatchEvent(new window.PopStateEvent('popstate'));
    });
    assert.equal(mounted.container.textContent, 'en:en');
    assert.equal(document.documentElement.lang, 'en');
  } finally { await environmentRef.close(); }
});

for (const provider of [
  { path: '/src/hooks/useNavigation.js', hook: 'useNavigation', error: 'useNavigation must be used within a NavigationProvider' },
  { path: '/src/hooks/useLanguage.js', hook: 'useLanguage', error: 'useLanguage must be used within a LanguageProvider' },
]) {
  testRef(`${provider.hook} keeps its missing-provider error`, async context => {
    const environment = await createEnvironment();
    const environmentRef = environment;
    context.mock.method(console, 'error', () => {});
    try {
      const module = await environmentRef.load(provider.path);
      const useProvider = module[provider.hook];
      const useProviderRef = useProvider;
      function Consumer() { useProviderRef(); return null; }
      const ConsumerRef = Consumer;
      await assert.rejects(environmentRef.mount(element(ConsumerRef)), { message: provider.error });
    } finally { await environmentRef.close(); }
  });
}
