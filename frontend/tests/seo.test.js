// The file was created by Ahmed Al-Makhatreh.
// codeguard:components:start
// codeguard:defines: SEO metadata tests
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { readFile as readFileRef } from 'node:fs/promises';
import { Script as ScriptRef } from 'node:vm';
import { localizedPath as languagePath, pageMetadata as metadataFor, renderSeoHead as renderHead } from '../src/utils/seo.js';
import { renderSeoDocument as renderDocument } from '../scripts/seoPrerender.js';
// codeguard:components:end

testRef('external language bootstrap preserves route and saved preferences before application loading', async () => {
  const template = await readFileRef(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(template, /<script src="\/init-lang\.js"><\/script>/);
  const source = await readFileRef(new URL('../public/init-lang.js', import.meta.url), 'utf8');
  for (const [pathname, seoLanguage, saved, expected] of [
    ['/page/ar/work/tammivo', 'en', 'en', 'ar'],
    ['/work/tammivo', 'en', 'ar', 'en'],
    ['/', undefined, 'ar', 'ar'],
    ['/', undefined, 'invalid', 'en'],
    ['/page/ar/', undefined, new Error('Storage unavailable'), 'ar'],
  ]) {
    const attributes = {};
    new ScriptRef(source).runInNewContext({
      location: { pathname },
      localStorage: { getItem() { if (saved instanceof Error) throw saved; return saved; } },
      document: { documentElement: { dataset: { seoLanguage }, setAttribute(name, value) { attributes[name] = value; } } },
    });
    assert.deepEqual(attributes, { lang: expected, dir: expected === 'ar' ? 'rtl' : 'ltr' });
  }
});

testRef('public CSP blocks inline execution, eval, objects and base URL changes', async () => {
  const template = await readFileRef(new URL('../index.html', import.meta.url), 'utf8');
  const headers = await readFileRef(new URL('../public/_headers', import.meta.url), 'utf8');
  for (const source of [template.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1], headers]) {
    const scripts = source.match(/script-src\s+([^;]+)/)[1];
    assert.doesNotMatch(scripts, /'unsafe-inline'|'unsafe-eval'/);
    assert.match(scripts, /https:\/\/static\.cloudflareinsights\.com/);
    assert.match(source, /object-src 'none'/);
    assert.match(source, /base-uri 'none'/);
  }
  assert.match(headers, /frame-ancestors 'none'/);
});

testRef('localized canonical paths preserve clean routes and remove tracking fragments', () => {
  assert.equal(languagePath('/work/tammivo/?utm_source=test#gallery', 'ar'), '/page/ar/work/tammivo');
  assert.equal(languagePath('/page/ar/work/tammivo', 'en'), '/work/tammivo');
  assert.equal(languagePath('/page/ar/', 'ar'), '/page/ar/');
  assert.equal(languagePath('', 'en'), '/');
  assert.equal(languagePath('/articles', 'en'), '/articles');
  assert.equal(languagePath('/index', 'en'), '/index/');
  assert.equal(languagePath('/index', 'ar'), '/page/ar/index/');
});

testRef('metadata uses the production origin and reciprocal language alternates', () => {
  const meta = metadataFor({ path: '/work/tammivo', language: 'ar', title: 'تاميفو', description: 'مساهمة برمجية' });
  assert.equal(meta.canonical, 'https://ahmad-makatreh.vip/page/ar/work/tammivo');
  assert.deepEqual(meta.links.map(item => item.hreflang).filter(Boolean), ['en', 'ar', 'x-default']);
  assert.equal(meta.meta.find(item => item[1] === 'og:locale')[2], 'ar_JO');
  assert.equal(meta.meta.find(item => item[1] === 'twitter:title')[2], 'تاميفو');
  assert.ok(meta.meta.find(item => item[1] === 'og:image')[2].endsWith('.png'));
});

testRef('project entities describe the contribution without claiming authorship or ratings', () => {
  const project = { slug: 'sample', title: { en: 'Sample' }, summary: { en: 'An app.' }, role: { en: 'Improved its backend.' }, url: 'https://example.com', media: { items: [{ src: '/sample.png', srcEn: '/sample-en.png' }] } };
  const meta = metadataFor({ path: '/work/sample', title: 'Sample', language: 'en', project });
  const entity = meta.structuredData['@graph'].find(item => item['@type'] === 'CreativeWork');
  assert.equal(entity.description, 'An app. Improved its backend.');
  assert.equal(entity.contributor['@id'], 'https://ahmad-makatreh.vip/#person');
  assert.equal(entity.author, undefined);
  assert.equal(entity.aggregateRating, undefined);
  assert.equal(entity.image, 'https://ahmad-makatreh.vip/sample-en.png');
});

testRef('About and work listings expose their appropriate entities and breadcrumbs', () => {
  const about = metadataFor({ path: '/about', title: 'About' }).structuredData['@graph'];
  assert.ok(about.find(item => item['@type'] === 'ProfilePage').mainEntity['@id'].endsWith('#person'));
  const work = metadataFor({ path: '/work', title: 'Work', items: [{ slug: 'sample', name: 'Sample' }] }).structuredData['@graph'];
  assert.equal(work.find(item => item['@type'] === 'ItemList').itemListElement[0].url, 'https://ahmad-makatreh.vip/work/sample');
  assert.equal(work.find(item => item['@type'] === 'BreadcrumbList').itemListElement.length, 2);
});

testRef('untranslated articles do not advertise missing translations or invent dates', () => {
  const meta = metadataFor({ path: '/journal/example', language: 'ar', title: 'مقال', article: { title: 'مقال', summary: 'ملخص', language: 'ar' }, alternateLanguages: ['ar'] });
  assert.deepEqual(meta.links.map(item => item.hreflang).filter(Boolean), ['ar', 'x-default']);
  assert.equal(meta.links.at(-1).href, meta.canonical);
  const article = meta.structuredData['@graph'].find(item => item['@type'] === 'BlogPosting');
  assert.equal(article.inLanguage, 'ar');
  assert.equal(article.datePublished, undefined);
});

testRef('HTML and JSON-LD serialize untrusted text without creating executable markup', () => {
  const title = '</script><script>alert("test")</script> & عنوان';
  const head = renderHead(metadataFor({ title, description: '" quoted > content', noindex: true }));
  assert.ok(head.includes('&lt;/script&gt;'));
  assert.ok(head.includes('noindex, follow'));
  assert.equal((head.match(/<script/g) ?? []).length, 1);
  const json = JSON.parse(head.match(/type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(json['@graph'].find(item => item['@type'] === 'WebPage').name, title);
});

testRef('static documents preserve literal JavaScript replacement tokens in CMS text', () => {
  const literal = '$& $` $\' $$';
  const template = '<html><head><!-- seo:start --><title>Old</title><!-- seo:end --></head><body><div id="root"></div></body></html>';
  const html = renderDocument(template, { language: 'en' }, `<title>${literal}</title>`, `<h1>${literal}</h1>`);
  assert.equal((html.match(/id="root"/g) ?? []).length, 1);
  assert.ok(html.includes(`<title>${literal}</title>`));
  assert.ok(html.includes(`<h1>${literal}</h1>`));
});
