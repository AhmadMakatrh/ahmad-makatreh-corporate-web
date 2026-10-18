// The file was created by Ahmed Al-Makhatreh.
// codeguard:components:start
// codeguard:defines: portfolio layout and localized copy regression tests, renderDocument, textContent
import { test as testRef, before as beforeRef, after as afterRef } from 'node:test';
import assert from 'node:assert/strict';
import { createServer as createViteServer } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath as filePath } from 'node:url';
import { JSDOM as JSDOMRef } from 'jsdom';
import { collectionData as collectionDataRef, replaceCollection as replaceCollectionRef } from '../src/admin/contentCollections.js';
import { validateSiteDocument as validateSiteDocumentRef } from '../../backend/cloudflare/src/siteDocumentValidator.js';

let server;
let entry;
let contributions;
let studies;

const expectedTags = {
  tammivo: ['Back-End', 'FFmpeg', 'HTTP Security'],
  'elpha-tales': ['Mobile App', 'UI/UX Redesign', 'Database'],
  'elpha-reader': ['Mobile App', 'PDF Engine', 'Back-End'],
};
const expectedTagsRef = expectedTags;
const readingContributions = {
  ar: [
    ['تصميم الواجهة / تجربة القراءة', 'إعادة تصميم واجهات التطبيق بالكامل مع دعم المظهرين الفاتح والداكن لتقديم تجربة قراءة وتصفح سلسة.'],
    ['هيكلة قاعدة البيانات', 'إعادة بناء هيكلية وعلاقات قاعدة البيانات لمعالجة الاختناقات السابقة وتحسين كفاءة استرجاع البيانات.'],
    ['الواجهة الخلفية والحماية', 'تطوير منطق الخدمات الخلفية (API) وتعزيز آليات الحماية لضمان استقرار التطبيق وأمان حسابات المستخدمين.'],
  ],
  en: [
    ['Interface design / Reading experience', 'Redesigning the full app interface with light and dark modes for a smooth reading and browsing experience.'],
    ['Database architecture', 'Rebuilding the database structure and relationships to address existing bottlenecks and improve data retrieval efficiency.'],
    ['Backend and security', 'Developing backend API logic and strengthening protection mechanisms to maintain application stability and user account security.'],
  ],
};
const readingContributionsRef = readingContributions;
const tammivoContributions = {
  ar: [
    ['الواجهة الخلفية', 'تطوير وتحديث منطق الخادم لدعم أدوات معالجة الملفات وتحسين سرعة استجابتها.'],
    ['معالجة الوسائط', 'دمج محرك FFmpeg لإضافة وظائف معالجة وتحويل ملفات الوسائط مباشرة عبر المتصفح.'],
    ['تحصين حماية HTTP', 'ضبط ترويسات وسياسات الأمان، مما رفع تقييم MDN HTTP Observatory من F إلى A+ وتحقيق درجة A في ImmuniWeb.'],
  ],
  en: [
    ['Backend development', 'Developing and updating server logic to support file-processing tools and improve response times.'],
    ['Media processing', 'Integrating FFmpeg to add media-processing and conversion tools accessible directly through the browser.'],
    ['HTTP security hardening', 'Configuring security headers and policies, raising the MDN HTTP Observatory grade from F to A+ and achieving an A in ImmuniWeb.'],
  ],
};
const tammivoContributionsRef = tammivoContributions;
const aboutArabic = [
  'أنا أحمد المخاترة، مهندس برمجيات من الأردن. أعمل على بناء تطبيقات الويب والهاتف والأنظمة الخلفية، وأهتم بسلامة قواعد البيانات وأمان الواجهات البرمجية بقدر اهتمامي بسلاسة تجربة المستخدم.',
  'عندما أعمل على مشروع قائم، أبدأ بتشخيص بنية النظام وتحديد مواطن الخلل والاختناق البرمجي، ثم أعيد تنظيم الكود وهيكلة البيانات وأختبر أثر كل تعديل على استقرار النظام ككل.',
  'تشمل أعمالي تطوير منصات ويب خدمية، وإعادة تصميم وبناء تطبيقات القراءة والكتب، وتطوير أنظمة مالية مثل "صندوق الأزمات العائلي"، إلى جانب تجارب تطوير الألعاب باستخدام Unreal Engine 5 و C++.',
];
const aboutArabicRef = aboutArabic;

function renderDocument(path, language, snapshot = {}) {
  const page = entry.seoPages(snapshot).find(item => item.path === path && item.language === language);
  assert.ok(page, `${language}: ${path} remains available`);
  return JSDOMRef.fragment(entry.renderPage(page, snapshot).html);
}
const renderDocumentRef = renderDocument;

function textContent(node) {
  assert.ok(node, 'Expected rendered element');
  return node.textContent.trim();
}
const textContentRef = textContent;
// codeguard:components:end

beforeRef(async () => {
  server = await createViteServer({ root: filePath(new URL('..', import.meta.url)), configFile: false, cacheDir: 'node_modules/.vite-portfolio-tests', plugins: [react()], server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' });
  entry = await server.ssrLoadModule('/src/entry-seo.jsx');
  contributions = (await server.ssrLoadModule('/src/data/projectContributions.js')).projectContributions;
  studies = (await server.ssrLoadModule('/src/data/caseStudies/index.js')).caseStudies;
});
afterRef(async () => { await server?.close(); });

testRef('Contribution defaults round-trip through the existing CMS collection contract', () => {
  const saved = replaceCollectionRef({}, 'projectContributions', collectionDataRef({}, 'projectContributions', contributions));
  assert.equal(validateSiteDocumentRef('content', saved), null);
});

for (const language of ['ar', 'en']) {
  testRef(`Site logos use the original localized assets and preserve CMS overrides (${language})`, () => {
    const document = renderDocumentRef('/work', language);
    const filename = language === 'ar' ? 'AhmadMakatrh Light logo.png' : 'AhmadMakatreh Latin Ivory logo.png';
    for (const selector of ['.portfolio-header .portfolio-brand-logo', '.portfolio-footer .portfolio-brand-logo']) {
      const logo = document.querySelector(selector);
      assert.ok(decodeURIComponent(logo.getAttribute('src')).endsWith(`/${filename}`));
      assert.equal(logo.getAttribute('width'), '1536');
      assert.equal(logo.getAttribute('height'), '1024');
      const overridden = renderDocumentRef('/work', language, { content: { assets: { brandLogoAr: '/images/custom-ar.png', brandLogoEn: '/images/custom-en.png' } } });
      assert.equal(overridden.querySelector(selector).getAttribute('src'), `/images/custom-${language}.png`);
    }
  });

  testRef(`Work cards show one description, one role and consistent tags (${language})`, () => {
    const document = renderDocumentRef('/work', language);
    const cards = [...document.querySelectorAll('.portfolio-project-list > article')];
    assert.equal(cards.length, 5);
    for (const card of cards) {
      const project = [...contributions, ...studies].find(item => item.slug === card.dataset.project);
      assert.ok(project);
      assert.equal(card.querySelectorAll('.portfolio-project-description').length, 1);
      assert.equal(card.querySelectorAll('.portfolio-project-role').length, 1);
      assert.equal(textContentRef(card.querySelector('.portfolio-project-description')), (project.summary ?? project.subtitle)[language]);
      assert.equal(textContentRef(card.querySelector('.portfolio-project-role')), (project.role ?? project.confirmedRole)[language]);
      assert.equal(card.querySelectorAll('.portfolio-project-copy > p:not(.portfolio-project-status)').length, 2);
      const tags = [...card.querySelectorAll('.portfolio-project-stack > li')].map(textContentRef);
      assert.deepEqual(tags, expectedTagsRef[project.slug] ?? project.verifiedStack.slice(0, 3));
    }
  });

  testRef(`Managed contribution collections retain Work technology tags (${language})`, () => {
    const snapshot = { content: { datasets: { projectContributions: structuredClone(contributions) } } };
    const document = renderDocumentRef('/work', language, snapshot);
    assert.equal(document.querySelectorAll('.portfolio-project-list > article').length, 5);
    for (const [slug, tags] of Object.entries(expectedTagsRef)) {
      assert.deepEqual([...document.querySelectorAll(`[data-project="${slug}"] .portfolio-project-stack > li`)].map(textContentRef), tags);
    }
  });

  testRef(`Managed project slugs cannot inherit technology tags from object properties (${language})`, () => {
    const project = { slug: 'constructor', name: 'Custom CMS project', description: { ar: 'وصف مشروع منشور مخصص.', en: 'A custom published project description.' }, media: structuredClone(contributions[0].media) };
    const snapshot = { content: { datasets: { projectCards: [project] } } };
    assert.equal(validateSiteDocumentRef('content', snapshot.content), null);
    const document = renderDocumentRef('/work', language, snapshot);
    const card = document.querySelector('[data-project="constructor"]');
    assert.equal(document.querySelectorAll('.portfolio-project-list > article').length, 1);
    assert.equal(textContentRef(card.querySelector('h2')), project.name);
    assert.equal(textContentRef(card.querySelector('.portfolio-project-description')), project.description[language]);
    assert.equal(card.querySelectorAll('.portfolio-project-stack, .portfolio-project-role').length, 0);
  });

  testRef(`Barari uses the engineering case study layout and ordered feature cards (${language})`, () => {
    const document = renderDocumentRef('/work/barari-game', language);
    const page = document.querySelector('.portfolio-case-study');
    const project = studies.find(item => item.slug === 'barari-game');
    assert.ok(page.classList.contains('portfolio-case-engineering'));
    assert.equal(page.querySelectorAll('.portfolio-development-status').length, 1);
    assert.equal(page.querySelectorAll('div.portfolio-development-status').length, 0);
    const metadata = page.querySelector('header .portfolio-case-metadata');
    const media = page.querySelector('#case-media');
    assert.equal(metadata.nextElementSibling, media);
    assert.ok(media.querySelector('img[src="/images/projects/barari-battle-royale.png"]'));
    assert.ok(media.compareDocumentPosition(page.querySelector('#case-context')) & 4);
    assert.equal(textContentRef(page.querySelector('#case-context > div > p')), project.overview[language]);
    assert.equal(textContentRef(metadata.querySelector('.portfolio-case-meta-card > p')), project.confirmedRole[language]);
    const grid = page.querySelector('.portfolio-case-about-grid');
    assert.ok(grid.classList.contains('lg:grid-cols-12'));
    assert.equal(grid.children.length, 2);
    assert.ok(grid.children[0].classList.contains('lg:col-span-5'));
    assert.ok(grid.children[1].classList.contains('lg:col-span-7'));
    assert.equal(textContentRef(grid.children[0].querySelector('p')), project.problem[language]);
    assert.equal(textContentRef(grid.children[1].querySelector(':scope > span')), project.constraintsTitle[language]);
    assert.deepEqual([...grid.querySelectorAll('li > span')].map(textContentRef), project.constraints[language]);
    assert.match(textContentRef(page.querySelector('#case-architecture h2')), /^02 \/\//);
    assert.equal(textContentRef(page.querySelector('#case-architecture > p')), project.architecture.narrative[language]);
    assert.equal(textContentRef(page.querySelector('#case-takeaways h2')), `03 // ${project.technicalTakeaways.title[language]}`);
    const decisions = page.querySelector('.portfolio-case-decisions');
    assert.ok(decisions.classList.contains('lg:grid-cols-3'));
    assert.equal(decisions.children.length, 3);
    for (const [index, card] of [...decisions.children].entries()) {
      const point = project.technicalTakeaways.points[language][index];
      const separator = point.indexOf(':');
      assert.equal(textContentRef(card.querySelector('.portfolio-case-decision-index')), String(index + 1).padStart(2, '0'));
      assert.equal(textContentRef(card.querySelector('h3')), point.slice(0, separator));
      assert.equal(textContentRef(card.querySelector('p')), point.slice(separator + 1).trim());
    }
  });

  testRef(`Crisis Fund explanation remains in normal flow beside accessible LTR code (${language})`, () => {
    const document = renderDocumentRef('/work/crisis-fund', language);
    const section = document.querySelector('#case-code');
    assert.ok(section.classList.contains('lg:grid-cols-12'));
    const explanation = section.querySelector('.portfolio-case-code-explanation');
    assert.ok(explanation.classList.contains('lg:col-span-4'));
    assert.doesNotMatch(explanation.className, /(?:^|\s)(?:\w+:)?sticky(?:\s|$)/);
    assert.doesNotMatch(section.className, /(?:^|\s)(?:\w+:)?sticky(?:\s|$)/);
    const code = section.querySelector('.portfolio-case-code-window pre');
    assert.equal(code.getAttribute('dir'), 'ltr');
    assert.equal(code.getAttribute('tabindex'), '0');
    assert.match(textContentRef(code.querySelector('code')), /hash_equals/);
    assert.equal(section.querySelectorAll('.portfolio-case-code-highlights > li').length, 2);
  });

  testRef(`About retains three aligned profile paragraphs and three horizontal project cards (${language})`, () => {
    const document = renderDocumentRef('/about', language);
    const profile = document.querySelector('#about-profile .portfolio-about-profile-copy');
    assert.ok(profile.classList.contains('text-start-logical'));
    assert.equal(profile.querySelectorAll(':scope > p').length, 3);
    if (language === 'ar') assert.deepEqual([...profile.children].map(textContentRef), aboutArabicRef);
    const cards = [...document.querySelectorAll('#about-projects .portfolio-about-project-card')];
    assert.equal(cards.length, 3);
    for (const card of cards) {
      assert.ok(card.firstElementChild.classList.contains('lg:flex-row'));
      assert.ok(card.querySelector('h3'));
      assert.ok(card.querySelector('bdi[dir="ltr"]'));
      assert.ok(card.querySelector('button.portfolio-action'));
      assert.equal(card.querySelectorAll('.text-center').length, 0);
    }
  });

  testRef(`Contribution cards preserve engineering copy, scan evidence and store links (${language})`, () => {
    for (const project of contributions) {
      const document = renderDocumentRef(`/work/${project.slug}`, language);
      const expected = (project.slug === 'tammivo' ? tammivoContributionsRef : readingContributionsRef)[language];
      const cards = [...document.querySelectorAll('.portfolio-contribution-grid > li')];
      assert.equal(cards.length, 3);
      assert.deepEqual(cards.map(card => [textContentRef(card.querySelector('h3')), textContentRef(card.querySelector('p'))]), expected);
      assert.equal(textContentRef(document.querySelector('.portfolio-contribution-role p')), project.role[language]);
      assert.ok(document.querySelector(`a[href="${project.url}"]`));
      for (const link of document.querySelectorAll('.portfolio-contribution a.portfolio-button-primary')) {
        const storeLink = project.url.startsWith('https://play.google.com/store/apps/');
        assert.equal(Boolean(link.querySelector('.fa-google-play')), storeLink);
        if (!storeLink) assert.ok(link.querySelector('svg.lucide-arrow-up-right'));
      }
      for (const token of document.querySelectorAll('.portfolio-contribution-grid code')) assert.equal(token.getAttribute('dir'), 'ltr');
      if (project.slug === 'tammivo') {
        assert.equal(document.querySelectorAll('.portfolio-contribution-scan').length, 2);
        assert.deepEqual([...document.querySelectorAll('.portfolio-scan-grade')].map(textContentRef), ['A', 'FA+']);
        const observatory = [...document.querySelectorAll('.portfolio-contribution-scan')].find(card => textContentRef(card.querySelector('h3')) === 'MDN HTTP Observatory');
        assert.match(textContentRef(observatory), /125 \/ 100/);
        assert.match(textContentRef(observatory), /12 \/ 12/);
        for (const metric of observatory.querySelectorAll('bdi')) {
          assert.equal(metric.dir, 'ltr');
          assert.ok(metric.classList.contains('whitespace-nowrap'));
        }
        assert.ok([...document.querySelectorAll('.portfolio-contribution-grid code[dir="ltr"]')].some(token => token.textContent === 'A+'));
        assert.equal(textContentRef(document.querySelector('.portfolio-contribution-result-note p')), project.result[language]);
        assert.doesNotMatch(textContentRef(document.querySelector('.portfolio-contribution-result-note')), language === 'ar' ? /لا تمثل تقييمًا شاملًا/ : /not the site’s overall security/);
        assert.ok(document.querySelector('a[href="https://play.google.com/store/apps/details?id=com.tammivo.app"]'));
        for (const link of document.querySelectorAll('a[href="https://play.google.com/store/apps/details?id=com.tammivo.app"]')) assert.ok(link.querySelector('.fa-google-play'));
      }
    }
  });

  testRef(`Published CMS copy remains authoritative after portfolio polish (${language})`, () => {
    const custom = language === 'ar' ? 'نص هندسي منشور مخصص.' : 'Custom published engineering copy.';
    const index = studies.findIndex(project => project.slug === 'barari-game');
    const snapshot = { content: { [language]: { aboutProfileP1: custom }, overrides: {
      [`projectContributions.0.contributions.${language}.0`]: custom,
      [`projectContributions.0.contributions.${language}.2`]: custom,
      [`projectContributions.0.summary.${language}`]: custom,
      [`caseStudies.${index}.overview.${language}`]: custom,
      [`caseStudies.${index}.technicalTakeaways.points.${language}.0`]: custom,
    } } };
    assert.equal(textContentRef(renderDocumentRef('/about', language, snapshot).querySelector('.portfolio-about-profile-copy > p')), custom);
    const contribution = renderDocumentRef('/work/tammivo', language, snapshot);
    assert.equal(textContentRef(contribution.querySelector('.portfolio-contribution-grid > li p')), custom);
    assert.equal(contribution.querySelectorAll('.portfolio-contribution-scan').length, 1);
    assert.equal(textContentRef(contribution.querySelector('.portfolio-scan-grade')), 'A');
    assert.equal(textContentRef(renderDocumentRef('/work', language, snapshot).querySelector('[data-project="tammivo"] .portfolio-project-description')), custom);
    const barari = renderDocumentRef('/work/barari-game', language, snapshot);
    assert.equal(textContentRef(barari.querySelector('#case-context > div > p')), custom);
    assert.equal(textContentRef(barari.querySelector('.portfolio-case-decisions > article p')), custom);
  });
}
