// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { validateSiteDocument as validateSiteDocumentRef, safeDocumentUrl as safeDocumentUrlRef } from '../src/siteDocumentValidator.js';
import { defaultPricing as defaultPricingRef } from '../../../frontend/src/data/serviceCatalog.js';
import { ar as arRef } from '../../../frontend/src/i18n/ar.js';
import { en as enRef } from '../../../frontend/src/i18n/en.js';
import { siteCopy as siteCopyRef } from '../../../frontend/src/data/siteCopy.js';
import { projectCards as projectCardsRef } from '../../../frontend/src/data/projectCards.js';

const text = (ar = 'عنوان', en = 'Title') => ({ ar, en });
const textRef = text;
const packageItem = () => ({ key: 'web', title: textRef(), description: textRef('', ''), features: { ar: [], en: [] }, price: 100 });
const packageItemRef = packageItem;
const pricing = () => ({ packages: [packageItemRef()], offers: [] });
const pricingRef = pricing;
const page = () => ({ slug: 'custom', title: textRef(), description: textRef('', ''), sections: [] });
const pageRef = page;
const check = (key, data, valid) => assert.equal(validateSiteDocumentRef(key, data) === null, valid, JSON.stringify(data).slice(0, 150));
const checkRef = check;
// codeguard:components:end

testRef('currentClientDefaults', () => {
  const copy = value => Object.fromEntries(Object.entries(value).filter(([, item]) => typeof item === 'string'));
  const copyRef = copy;
  checkRef('content', { ar: copyRef({ ...arRef, ...siteCopyRef.ar }), en: copyRef({ ...enRef, ...siteCopyRef.en }), assets: {
    heroImageUrl: '/images/castle-hill-pencil-sketch.png', brandLogoAr: '', brandLogoEn: '', cvUrl: '',
    linkedinUrl: 'https://linkedin.com/in/ahmadmakhatrh', instagramUrl: 'https://www.instagram.com/ahmad.albarishi/', whatsappUrl: 'https://wa.me/962776360251',
  }, overrides: {}, datasets: { projectCards: projectCardsRef } }, true);
  checkRef('pages', { pages: [] }, true);
});

testRef('pricingLimitsAndSchedule', () => {
  checkRef('pricing', defaultPricingRef, true);
  for (const [price, valid] of [[null, true], [0, true], [0.29, true], [1000000, true], [1000000.01, false], [-1, false], [0.001, false], ['100', false]]) {
    const data = pricingRef(); data.packages[0].price = price; checkRef('pricing', data, valid);
  }
  for (const [count, valid] of [[50, true], [51, false]]) checkRef('pricing', { packages: Array.from({ length: count }, (_, i) => ({ ...packageItemRef(), key: `p-${i}` })), offers: [] }, valid);
  for (const [discountPercent, offerPrice, valid] of [[100, 0, true], [0, null, false], [101, null, false], [10, 100, false], [10, 0.001, false]]) {
    const data = pricingRef(); data.offers = [{ id: 'offer', title: textRef(), description: textRef('', ''), items: [{ packageKey: 'web', discountPercent, offerPrice }] }]; checkRef('pricing', data, valid);
  }
  const data = pricingRef(); data.offers = [{ id: 'offer', title: textRef(), description: textRef('', ''), items: [], startsAtUtc: '2026-10-12T10:00:00+03:00', endsAtUtc: '2026-10-12T07:00:00.0000001Z' }];
  checkRef('pricing', data, true); data.offers[0].endsAtUtc = '2026-10-12T07:00:00Z'; checkRef('pricing', data, false);
  data.offers[0].startsAtUtc = '2026-10-12T10:00:00'; checkRef('pricing', data, false);
  data.offers[0].startsAtUtc = '2026-02-30T10:00:00Z'; checkRef('pricing', data, false);
  const invalid = pricingRef(); invalid.packages[0].features.ar = Array(21).fill('x'); checkRef('pricing', invalid, false);
  invalid.packages[0].features.ar = ['x'.repeat(501)]; checkRef('pricing', invalid, false);
  invalid.packages[0].features.ar = []; invalid.packages[0].hidden = null; checkRef('pricing', invalid, false);
});

testRef('pagesLimitsAndReservedSlugs', () => {
  for (const slug of ['admin','api','home','about','services','capabilities','work','journal','booking','start-project','startproject','page','contact','assets','images']) checkRef('pages', { pages: [{ ...pageRef(), slug }] }, false);
  for (const [count, valid] of [[100, true], [101, false]]) checkRef('pages', { pages: Array.from({ length: count }, (_, i) => ({ ...pageRef(), slug: `p-${i}` })) }, valid);
  const data = { pages: [pageRef()] };
   const section = { id: 's', type: 'text', title: textRef('', ''), body: textRef('', '') };
  for (const type of ['hero','text','image','cards','cta']) { data.pages[0].sections = [{ ...section, type }]; checkRef('pages', data, true); }
  data.pages[0].sections = Array.from({ length: 41 }, (_, i) => ({ ...section, id: `s-${i}` })); checkRef('pages', data, false);
  data.pages[0].sections = [section, section]; checkRef('pages', data, false);
  data.pages[0].sections = [{ ...section, body: textRef('x'.repeat(20001), '') }]; checkRef('pages', data, false);
});

testRef('bilingualCopyAndLegacyOverrides', () => {
  checkRef('content', { ar: { cmsHeroTitle: 'عنوان' }, en: { cmsHeroTitle: 'Title' }, assets: { heroImageUrl: '/images/castle.png' }, overrides: { 'projectCards.0.title.en': 'Edited', 'caseStudies.0.summary.ar': 'نص', 'projects.0.featured': false } }, true);
  for (const path of ['projectCards.length','projectCards.0.slug','projectCards.__proto__.x','projects..name','unknown.0.name']) checkRef('content', { overrides: { [path]: 'bad' } }, false);
  checkRef('content', { unknown: {} }, false); checkRef('content', { en: { title: null } }, false);
  checkRef('content', { en: { title: 'x'.repeat(20001) } }, false);
  checkRef('content', { en: Object.fromEntries(Array.from({ length: 2001 }, (_, i) => [`k${i}`, ''])) }, false);
});

testRef('datasetsAndNestedUnknownFields', () => {
  const project = { slug: 'project', name: 'Project', description: textRef('', ''), media: { mode: 'single', items: [] } };
  checkRef('content', { datasets: { projectCards: [project], projectContributions: [], articles: [] } }, true);
  checkRef('content', { datasets: { caseStudies: [] } }, false);
  checkRef('content', { datasets: { projectCards: [project, project] } }, false);
  checkRef('content', { datasets: { projectCards: [{ ...project, unexpected: true }] } }, false);
  checkRef('content', { datasets: { projectCards: [{ ...project, media: { ...project.media, unexpected: true } }] } }, false);
  const article = { slug: 'article', language: 'en', title: 'Title', summary: '', content: '<script>literal text</script>', date: '', contentIsPlainText: true };
  const articleRef = article;
  checkRef('content', { datasets: { articles: [articleRef, { ...articleRef, language: 'ar' }] } }, true);
  checkRef('content', { datasets: { articles: [{ ...articleRef, contentIsPlainText: false }] } }, false);
  checkRef('content', { datasets: { articles: [articleRef, articleRef] } }, false);
  checkRef('content', { datasets: { projectCards: [null] } }, false);
});

testRef('unicodeAndDepthLimits', () => {
  const data = { ar: Object.fromEntries(Array.from({ length: 74 }, (_, i) => [`k${i}`, 'أ'.repeat(20000)])) };
  checkRef('content', data, true); data.ar.extra = 'أ'.repeat(20000); checkRef('content', data, false);
  checkRef('content', { en: { emoji: '😀'.repeat(10000) } }, true);
  checkRef('content', { en: { emoji: '😀'.repeat(10001) } }, false);
  let nested = {}; for (let i = 0; i < 25; i++) nested = { nested };
  checkRef('pricing', { ...pricingRef(), ignored: nested }, false);
});

testRef('urlAndPrototypeBoundaries', () => {
  for (const [url, valid] of [['',true],[null,true],['/images/a.png',true],['https://example.test/a',true],['//other/a',false],['javascript:alert(1)',false],['https://u:p@example.test',false],['/a\\b',false],['/a\u0000',false],['https://',false],['https://example.test/'+'x'.repeat(2048),false]]) assert.equal(safeDocumentUrlRef(url), valid, String(url));
  checkRef('content', JSON.parse('{"en":{"__proto__":"bad"}}'), false);
  checkRef('content', { overrides: { 'projectCards.0.media.items.0.src': '//foreign/a' } }, false);
});
