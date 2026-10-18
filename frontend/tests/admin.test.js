// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { createAdminClient as createAdminClientRef } from '../src/admin/adminApi.js';
import { isAdminHost as isAdminHostRef } from '../src/admin/adminHost.js';
import { handleRequest as handleRequestRef } from '../../deploy/cloudflare/public-worker.js';
import { activeOffers as activeOffersRef, effectivePackages as effectivePackagesRef, launchPromotion as launchPromotionRef, offerPriceForPackage as offerPriceForPackageRef } from '../src/data/serviceCatalog.js';
import { applyDataOverrides as applyDataOverridesRef, selectSiteData as selectSiteDataRef } from '../src/providers/publishedSiteContext.js';
import { collectionData as collectionDataRef, emptyLocalizedText as emptyLocalizedTextRef, moveRecord as moveRecordRef, replaceCollection as replaceCollectionRef } from '../src/admin/contentCollections.js';
import { csvCell as csvCellRef } from '../src/admin/inquiryExport.js';
// codeguard:components:end

testRef('exported spreadsheet cells cannot execute formulas and retain multiline text', () => {
  assert.equal(csvCellRef('=HYPERLINK("bad")'), '"\'=HYPERLINK(""bad"")"');
  assert.equal(csvCellRef('  +1'), '"\'  +1"');
  assert.equal(csvCellRef('ملاحظة\nثانية'), '"ملاحظة\nثانية"');
});

testRef('structured collections preserve old edits and do not apply positional overrides after reorder', () => {
  const fallback = [{ slug: 'one', name: 'One' }, { slug: 'two', name: 'Two' }];
  const fallbackRef = fallback;
  const content = { overrides: { 'projectCards.0.name': 'Edited', 'caseStudies.0.title.en': 'Case' } };
  const contentRef = content;
  const seed = collectionDataRef(contentRef, 'projectCards', fallbackRef);
  const next = replaceCollectionRef(contentRef, 'projectCards', moveRecordRef(seed, 0, 1));
  assert.deepEqual(selectSiteDataRef('projectCards', fallbackRef, next).map(item => item.name), ['Two', 'Edited']);
  assert.equal(next.overrides['caseStudies.0.title.en'], 'Case');
  assert.equal(fallbackRef[0].name, 'One');
  assert.equal(selectSiteDataRef('projectCards', fallbackRef, { datasets: { projectCards: [] } }).length, 0);
});

testRef('shared item reordering preserves the original list and rejects boundary moves', () => {
  const items = [{ key: 'first' }, { key: 'second' }, { key: 'third' }];
  const itemsRef = items;
  const reordered = moveRecordRef(itemsRef, 0, 1);
  assert.deepEqual(reordered.map(item => item.key), ['second', 'first', 'third']);
  assert.deepEqual(itemsRef.map(item => item.key), ['first', 'second', 'third']);
  assert.equal(moveRecordRef(itemsRef, 0, -1), itemsRef);
  assert.equal(moveRecordRef(itemsRef, 2, 1), itemsRef);
});

testRef('shared localized text creates independent empty values for admin editors', () => {
  const first = emptyLocalizedTextRef();
  const second = emptyLocalizedTextRef();
  assert.deepEqual(first, { ar: '', en: '' });
  first.ar = 'عنوان';
  assert.deepEqual(second, { ar: '', en: '' });
});

testRef('hidden and deleted projects remove corresponding public detail routes', () => {
  const details = [{ slug: 'one' }, { slug: 'two' }, { slug: 'deleted' }];
  const detailsRef = details;
  const content = { datasets: { projectCards: [{ slug: 'one', hidden: true }, { slug: 'two' }] } };
  const contentRef2 = content;
  assert.deepEqual(selectSiteDataRef('caseStudies', detailsRef, contentRef2), [{ slug: 'two' }]);
  assert.deepEqual(selectSiteDataRef('projectContributions', detailsRef, contentRef2), [{ slug: 'two' }]);
});

testRef('article metadata edits retain trusted original formatting and edited content stays plain text', () => {
  const original = { slug: 'original', language: 'en', content: '<h2>Trusted heading</h2>' };
  const originalRef = original;
  const managed = { ...originalRef, content: '<img onerror="bad()">', contentIsPlainText: true, useOriginalContent: true };
  const select = records => selectSiteDataRef('articles', [originalRef], { datasets: { articles: records } });
  const selectRef = select;
  assert.equal(selectRef([managed])[0].content, originalRef.content);
  assert.equal(selectRef([managed])[0].contentIsPlainText, false);
  assert.equal(selectRef([{ ...managed, useOriginalContent: false }])[0].contentIsPlainText, true);
  assert.equal(selectRef([{ ...managed, slug: 'unknown' }])[0].contentIsPlainText, true);
});

testRef('GET requests are deduplicated and writes invalidate cached data', async () => {
  const calls = [];
  const api = createAdminClientRef(async (url, options) => { calls.push({ url, options }); return Response.json({ csrfToken: 'test-csrf', items: [] }); });
  const apiRef2 = api;
  await Promise.all([apiRef2.session(), apiRef2.session()]);
  await Promise.all([apiRef2.get('/inquiries'), apiRef2.get('/inquiries')]);
  await apiRef2.get('/inquiries');
  assert.equal(calls.length, 2);
  await apiRef2.write('/inquiries/id/status', 'PATCH', { status: 'Closed' });
  assert.equal(calls[2].options.headers['X-Admin-CSRF'], 'test-csrf');
  await apiRef2.get('/inquiries');
  assert.equal(calls.length, 4);
});

testRef('failed GETs attempt one session refresh; unauthorized data is cleared', async () => {
  const calls = [];
  const api = createAdminClientRef(async url => { calls.push(url); return new Response('', { status: 401 }); });
  const apiRef3 = api;
  await assert.rejects(apiRef3.session(), error => error.status === 401);
  assert.deepEqual(calls, ['/api/admin/session', '/auth/refresh']);
});

testRef('concurrent expired reads share one refresh and retry once; writes are never replayed', async () => {
  const calls = [];
  let active = false;
  const api = createAdminClientRef(async (url, options) => {
    calls.push([url, options.method ?? 'GET']);
    if (url === '/auth/refresh') { active = true; return Response.json({ stage: 'ready' }); }
    if (!active) return new Response('', { status: 401 });
    return Response.json({ csrfToken: 'csrf', items: [] });
  });
  const apiRef4 = api;
  await Promise.all([apiRef4.get('/inquiries'), apiRef4.get('/documents/content')]);
  assert.equal(calls.filter(([url]) => url === '/auth/refresh').length, 1);
  assert.equal(calls.filter(([url]) => url === '/api/admin/inquiries').length, 2);
  assert.equal(calls.filter(([url]) => url === '/api/admin/documents/content').length, 2);
  active = false;
  await assert.rejects(apiRef4.write('/inquiries/id/notes', 'PATCH', {}), error => error.status === 401);
  assert.equal(calls.filter(([url]) => url === '/api/admin/inquiries/id/notes').length, 1);
});

testRef('referenced media reports the actual conflict without retrying', async () => {
  let calls = 0;
  const api = createAdminClientRef(async () => { calls++; return Response.json({ code: 'media_referenced' }, { status: 409 }); });
  const apiRef5 = api;
  await assert.rejects(apiRef5.write('/media/id/archive', 'POST', {}), error => error.status === 409 && error.message.includes('مستخدم في مسودة'));
  assert.equal(calls, 1);
});

testRef('an in-flight read cannot repopulate stale cache after a successful write', async () => {
  let finishRead; let reads = 0;
  const api = createAdminClientRef(async (_url, options) => {
    if (options.method) return Response.json({ revision: 2 });
    reads++;
    if (reads === 1) return new Promise(resolve => { finishRead = () => resolve(Response.json({ revision: 1 })); });
    return Response.json({ revision: 2 });
  });
  const apiRef6 = api;
  const oldRead = apiRef6.get('/documents/pages');
  await apiRef6.write('/documents/pages', 'PUT', {});
  finishRead(); await oldRead;
  assert.equal((await apiRef6.get('/documents/pages')).revision, 2);
  assert.equal(reads, 2);
});

testRef('saving one document preserves unrelated editors in cache', async () => {
  const calls = [];
  const api = createAdminClientRef(async (url) => { calls.push(url); return Response.json({ revision: 1 }); });
  const apiRef7 = api;
  await apiRef7.get('/documents/content'); await apiRef7.get('/documents/pricing');
  await apiRef7.write('/documents/pricing', 'PUT', {});
  await apiRef7.get('/documents/content');
  assert.equal(calls.length, 3);
  await apiRef7.get('/documents/pricing');
  assert.equal(calls.length, 4);
});

testRef('media changes, reply writes and read-only exports preserve cached inquiry lists', async () => {
  const calls = [];
  const api = createAdminClientRef(async (url) => { calls.push(url); return Response.json({ items: [] }); });
  const apiRef8 = api;
  await apiRef8.get('/inquiries?pageSize=25'); await apiRef8.get('/media');
  await apiRef8.write('/media/id/archive', 'POST', {});
  await apiRef8.get('/inquiries?pageSize=25');
  await apiRef8.write('/inquiries/id/replies', 'POST', {});
  await apiRef8.get('/inquiries?pageSize=25');
  await apiRef8.write('/inquiries/export', 'POST', { ids: ['id'] });
  await apiRef8.get('/inquiries?pageSize=25');
  assert.equal(calls.filter(url => url === '/api/admin/inquiries?pageSize=25').length, 1);
  await apiRef8.get('/media');
  assert.equal(calls.filter(url => url === '/api/admin/media').length, 2);
});

testRef('scheduled offers, hidden packages and best prices are derived locally', () => {
  const localized = { ar: 'عنوان', en: 'Title' };
  const localizedRef = localized;
  const item = { key: 'package', title: localizedRef, description: localizedRef, features: { ar: [], en: [] }, price: 100, hidden: false };
  const catalog = { packages: [item, { ...item, key: 'hidden', hidden: true }], offers: [
    { id: 'active', enabled: true, popup: true, startsAtUtc: '2026-10-10T00:00:00Z', endsAtUtc: '2026-10-12T00:00:00Z', items: [{ packageKey: 'package', discountPercent: 20, offerPrice: 79 }, { packageKey: 'hidden', discountPercent: 90 }] },
    { id: 'future', enabled: true, popup: true, startsAtUtc: '2026-10-13T00:00:00Z', items: [{ packageKey: 'package', discountPercent: 50 }] }
  ] };
  const now = Date.parse('2026-10-11T00:00:00Z');
  assert.equal(activeOffersRef(catalog, now).length, 1);
  assert.equal(effectivePackagesRef(catalog, 'en', now)[0].offerPrice, 79);
  assert.equal(effectivePackagesRef(catalog, 'en', now).length, 1);
  assert.equal(launchPromotionRef(catalog, now).discount, 20);
  assert.equal(activeOffersRef(catalog, Date.parse('2026-10-12T00:00:00Z')).length, 0);
});

testRef('package offer preview matches the published price calculation', () => {
  const base = { key: 'resume', price: 80, title: { ar: 'سيرة ذاتية', en: 'Resume' }, description: { ar: '', en: '' }, features: { ar: [], en: [] } };
  const offerItem = { packageKey: 'resume', discountPercent: 25, offerPrice: null };
  const offerItemRef = offerItem;
  const catalog = { packages: [base], offers: [{ id: 'sale', enabled: true, items: [offerItemRef] }] };
  assert.equal(offerPriceForPackageRef(base.price, offerItemRef), 60);
  assert.equal(effectivePackagesRef(catalog, 'ar')[0].offerPrice, 60);
  assert.equal(offerPriceForPackageRef(350, { discountPercent: 25, offerPrice: null }), 262.5);
  assert.equal(offerPriceForPackageRef(350, { discountPercent: 20, offerPrice: 279 }), 279);
  const customPrice = effectivePackagesRef({ ...catalog, offers: [{ ...catalog.offers[0], items: [{ ...offerItemRef, discountPercent: 30, offerPrice: 55 }] }] }, 'ar')[0];
  assert.equal(customPrice.discount, 30);
  assert.equal(customPrice.offerPrice, 55);
  assert.equal(offerPriceForPackageRef(null, offerItemRef), null);
});

testRef('content overrides preserve the original data and ignore unsafe or incompatible paths', () => {
  const source = [{ title: 'Original', count: 1 }];
  const sourceRef = source;
  const result = applyDataOverridesRef('projects', sourceRef, { 'projects.0.title': 'Edited', 'projects.0.count': 'wrong type', 'projects.0.__proto__.polluted': true, 'projects.9.title': 'absent', 'projects.length': 0, 'projects.0': null });
  assert.deepEqual(result, [{ title: 'Edited', count: 1 }]);
  assert.equal(sourceRef[0].title, 'Original'); assert.equal({}.polluted, undefined);
  assert.deepEqual(applyDataOverridesRef('projects', [{ title: { ar: 'عنوان' } }], { 'projects.0.title': null }), [{ title: { ar: 'عنوان' } }]);
});

testRef('admin app is selected on exact host only', () => {
  assert.equal(isAdminHostRef('admin.ahmad-makatreh.vip'), true);
  assert.equal(isAdminHostRef('ahmad-makatreh.vip'), false);
  assert.equal(isAdminHostRef('evil-admin.ahmad-makatreh.vip'), false);
  assert.equal(isAdminHostRef('admin.localhost', true), true);
  assert.equal(isAdminHostRef('admin.localhost', false), false);
});

testRef('public Worker never forwards admin API requests', async () => {
  const env = { ASSETS: { fetch: () => new Response('assets') } };
  const api = { fetch: () => { throw new Error('Admin API reached the public Worker'); } };
  const apiRef = api;
  for (const host of ['ahmad-makatreh.vip', 'admin.ahmad-makatreh.vip']) {
    const request = new Request(`https://${host}/api/admin/session`);
    assert.equal((await handleRequestRef(request, env, null, apiRef)).status, 404);
  }
  assert.equal(await (await handleRequestRef(new Request('https://ahmad-makatreh.vip/'), env)).text(), 'assets');
});
