// codeguard:components:start
// codeguard:defines: mounted frontend recovery regression tests
import { test as testRef, before as beforeRef, after as afterRef } from 'node:test';
import assert from 'node:assert/strict';
import { act as actRef, createElement as element, StrictMode as StrictModeRef } from 'react';
import { createComponentEnvironment as createEnvironment, changeInput as changeInputRef, waitFor as waitForRef } from './helpers/componentEnvironment.js';

let environment;
let adminApi;
let DocumentEditor;
let AdminApp;
let BookingSection;
let AppProviders;
let ContentPageView;
let InquiryInbox;
const button = (container, text) => [...container.querySelectorAll('button')].find(item => item.textContent.trim() === text);
const buttonRef = button;
const response = data => Response.json(data);
const responseRef = response;
// codeguard:components:end

beforeRef(async () => {
  environment = await createEnvironment({ define: { 'import.meta.env.VITE_TURNSTILE_SITE_KEY': JSON.stringify('test-site-key') } });
  ({ adminApi } = await environment.load('/src/admin/adminApi.js'));
  ({ DocumentEditor } = await environment.load('/src/admin/DocumentEditor.jsx'));
  ({ default: AdminApp } = await environment.load('/src/admin/AdminApp.jsx'));
  ({ BookingSection } = await environment.load('/src/sections/Booking/BookingSection.jsx'));
  ({ AppProviders } = await environment.load('/src/providers/AppProviders.jsx'));
  ({ ContentPageView } = await environment.load('/src/pages/ContentPage.jsx'));
  ({ InquiryInbox } = await environment.load('/src/admin/InquiryInbox.jsx'));
});
afterRef(async () => { await environment?.close(); });

testRef('publishing a saved pricing draft explains automatic updates and sends only one mutation', async context => {
  adminApi.clear();
  const { defaultPricing: pricing } = await environment.load('/src/data/serviceCatalog.js');
  const writes = [];
  globalThis.fetch = async (url, options = {}) => {
    if (options.method === 'POST') {
      writes.push({ url, body: JSON.parse(options.body) });
      return responseRef({ revision: 2, publishedAtUtc: '2026-10-19T10:00:00Z' });
    }
    if (url.endsWith('/session')) return responseRef({ csrfToken: 'test-csrf' });
    return responseRef({ revision: 1, draft: pricing, isPublished: false, hasPrevious: false });
  };
  await adminApi.session();
  const mounted = await environment.mount(element(DocumentEditor, {
    documentKey: 'pricing', title: 'الأسعار والعروض', initialValue: pricing,
    onPermissionError: () => {}, onDirtyChange: () => {},
  }, () => element('p', null, 'Saved pricing draft')));
  context.after(mounted.unmount);
  await waitForRef(() => buttonRef(mounted.container, 'نشر'));
  await actRef(() => buttonRef(mounted.container, 'نشر').click());
  await waitForRef(() => mounted.container.querySelector('.admin-success'));
  assert.match(mounted.container.querySelector('.admin-success').textContent, /ستظهر تلقائيًا في الصفحات المفتوحة/);
  assert.equal(buttonRef(mounted.container, 'نشر').disabled, true);
  assert.deepEqual(writes, [{ url: '/api/admin/documents/pricing/publish', body: { expectedRevision: 1, restorePrevious: false } }]);
});

testRef('notification retry shows a warning, locks duplicate clicks and updates the detail and inbox together', async context => {
  adminApi.clear();
  const inquiry = { id: '11111111-1111-4111-8111-111111111111', referenceId: 'TEST-NOTIFICATION', name: 'Test', email: 'visitor@example.test',
    status: 'New', inquiryCategory: 'other', projectDetails: 'Test details', adminNotes: '', createdAtUtc: '2026-10-12T08:00:00Z',
    updatedAtUtc: '2026-10-12T08:00:00Z', notificationStatus: 'disabled', notificationAttemptedAtUtc: '2026-10-12T08:00:00Z',
    notificationEnabled: true, notificationRetryable: true, replyEnabled: false };
  const writes = []; let complete;
  globalThis.fetch = async (url, options = {}) => {
    if (options.method) { writes.push({ url, body: JSON.parse(options.body) }); return new Promise(resolve => { complete = resolve; }); }
    if (url.endsWith('/session')) return responseRef({ csrfToken: 'test-csrf' });
    return responseRef(url.includes('?') ? { items: [inquiry], nextCursor: null } : inquiry);
  };
  await adminApi.session();
  const mounted = await environment.mount(element(InquiryInbox, { onPermissionError: () => {}, onDirtyChange: () => {} }));
  context.after(mounted.unmount);
  await waitForRef(() => buttonRef(mounted.container, inquiry.referenceId));
  assert.equal(mounted.container.querySelector('.admin-badge-warning').textContent, 'الإشعار معطل');
  await actRef(() => buttonRef(mounted.container, inquiry.referenceId).click());
  await waitForRef(() => buttonRef(mounted.container, 'إعادة إرسال إشعار الطلب'));
  const retry = buttonRef(mounted.container, 'إعادة إرسال إشعار الطلب');
  await actRef(() => { retry.click(); retry.click(); });
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0], { url: `/api/admin/inquiries/${inquiry.id}/notification`, body: { expectedNotificationAttemptedAtUtc: inquiry.notificationAttemptedAtUtc } });
  assert.equal(mounted.container.querySelector('[aria-label="إغلاق التفاصيل"]').disabled, true);
  await actRef(async () => complete(responseRef({ id: inquiry.id, notificationStatus: 'accepted', notificationAttemptedAtUtc: '2026-10-18T10:00:00Z', notificationRetryable: false })));
  await waitForRef(() => !buttonRef(mounted.container, 'إعادة إرسال إشعار الطلب'));
  assert.equal(mounted.container.querySelector('.admin-badge-warning'), null);
  assert.match(mounted.container.textContent, /قُبل إشعار الطلب من خدمة البريد/);
  assert.equal(writes.length, 1);
});

testRef('disabled email configuration and uncertain notification outcomes cannot trigger a resend', async () => {
  for (const notificationStatus of ['disabled', 'failed', 'unknown', 'timedOut', null]) {
    adminApi.clear();
    const inquiry = { id: '11111111-1111-4111-8111-111111111111', referenceId: 'TEST-NOTIFICATION', name: 'Test', email: 'visitor@example.test',
      status: 'New', projectDetails: 'Test details', createdAtUtc: '2026-10-12T08:00:00Z', updatedAtUtc: '2026-10-12T08:00:00Z',
      notificationStatus, notificationEnabled: notificationStatus !== 'disabled', notificationRetryable: notificationStatus === 'disabled', replyEnabled: false };
    let writes = 0;
    globalThis.fetch = async (url, options = {}) => {
      if (options.method) { writes++; throw new Error('Unexpected email attempt'); }
      return responseRef(url.includes('?') ? { items: [inquiry], nextCursor: null } : inquiry);
    };
    const mounted = await environment.mount(element(InquiryInbox, { onPermissionError: () => {}, onDirtyChange: () => {} }));
    try {
      await waitForRef(() => buttonRef(mounted.container, inquiry.referenceId));
      await actRef(() => buttonRef(mounted.container, inquiry.referenceId).click());
      await waitForRef(() => mounted.container.querySelector('.admin-definition'));
      assert.ok(mounted.container.querySelector('.admin-badge-warning'));
      const retry = buttonRef(mounted.container, 'إعادة إرسال إشعار الطلب');
      if (notificationStatus === 'disabled') assert.equal(retry.disabled, true);
      else assert.equal(retry, undefined);
      assert.equal(writes, 0);
    } finally { await mounted.unmount(); }
  }
});

testRef('history restore locks all document edits and competing mutations until it settles', async context => {
  adminApi.clear();
  let resolveRestore;
  const writes = [];
  globalThis.fetch = async (url, options = {}) => {
    if (options.method) {
      writes.push(url);
      return new Promise(resolve => { resolveRestore = resolve; });
    }
    return responseRef(url.endsWith('/history') ? { items: [{ revision: 1, action: 'save', createdAtUtc: '2026-10-01T00:00:00Z', actor: 'admin' }] }
      : { revision: 3, draft: { text: 'Saved' }, isPublished: false, hasPrevious: false });
  };
  const initialValue = { text: '' };
  const initialValueRef = initialValue;
  const mounted = await environment.mount(element(DocumentEditor, { documentKey: 'content', title: 'Content', initialValue: initialValueRef, onPermissionError() {}, onDirtyChange() {}, children: (draft, change) => element('input', { value: draft.text, onChange: event => change({ text: event.target.value }) }) }));
  context.after(mounted.unmount);
  await actRef(() => buttonRef(mounted.container, 'عرض / تحديث السجل').click());
  await actRef(() => buttonRef(mounted.container, 'استعادة إلى المسودة').click());
  assert.equal(mounted.container.querySelector('input').matches(':disabled'), true);
  assert.equal(buttonRef(mounted.container, 'نشر').disabled, true);
  assert.equal(buttonRef(mounted.container, 'تحديث').disabled, true);
  await actRef(() => buttonRef(mounted.container, 'نشر').click());
  assert.deepEqual(writes, ['/api/admin/documents/content/restore']);
  await actRef(() => resolveRestore(responseRef({ revision: 4, draft: { text: 'Restored' } })));
  assert.equal(mounted.container.querySelector('input').value, 'Restored');
  assert.equal(mounted.container.querySelector('input').matches(':disabled'), false);
});

testRef('an expired session preserves the draft through reauthentication without replaying a save', async context => {
  adminApi.clear();
  let writeStatus = 401;
  let documentReads = 0;
  const writes = [];
  globalThis.fetch = async (url, options = {}) => {
    if (url.endsWith('/session')) return responseRef({ email: 'admin@example.test', csrfToken: 'test-csrf' });
    if (options.method) {
      writes.push(JSON.parse(options.body));
      return writeStatus === 200 ? responseRef({ revision: 2 }) : new Response('{}', { status: writeStatus });
    }
    if (url.includes('/inquiries')) return responseRef({ items: [] });
    documentReads++;
    return responseRef({ revision: 1, draft: { ar: {}, en: {}, assets: {}, overrides: {} }, isPublished: false, hasPrevious: false });
  };
  const mounted = await environment.mount(element(AdminApp));
  context.after(mounted.unmount);
  await actRef(() => mounted.container.querySelector('button[aria-label="المحتوى والصور"]').click());
  await waitForRef(() => mounted.container.querySelector('textarea'));
  const input = mounted.container.querySelector('textarea');
  await changeInputRef(input, 'Unsaved draft retained');
  await actRef(() => buttonRef(mounted.container, 'حفظ المسودة').click());
  assert.equal(input.isConnected, true);
  assert.equal(input.value, 'Unsaved draft retained');
  assert.ok(input.closest('[hidden]'));
  assert.equal(input.matches(':disabled'), true);
  assert.equal(mounted.container.querySelector('a[href="/login"]').target, '_blank');
  await actRef(() => mounted.container.querySelector('button[aria-label="الطلبات"]').click());
  assert.equal(input.isConnected, true);
  await actRef(() => buttonRef(mounted.container, 'إعادة التحقق').click());
  assert.equal(mounted.container.querySelector('textarea'), input);
  assert.equal(input.closest('[hidden]'), null);
  assert.equal(input.value, 'Unsaved draft retained');
  assert.equal(documentReads, 1);
  assert.equal(writes.length, 1);
  writeStatus = 200;
  await actRef(() => buttonRef(mounted.container, 'حفظ المسودة').click());
  assert.equal(writes.length, 2);
  assert.ok(Object.values(writes[1].data.ar).includes('Unsaved draft retained'));
  await changeInputRef(input, 'Access revoked');
  writeStatus = 403;
  await actRef(() => buttonRef(mounted.container, 'حفظ المسودة').click());
  assert.equal(input.isConnected, false);
});

testRef('a reply survives expiry and a pending recheck with its operation ID and notes intact', async context => {
  adminApi.clear();
  const detail = { id: 'inquiry-1', referenceId: 'TEST-REPLY', status: 'New', name: 'Visitor', email: 'visitor@example.test', adminNotes: '', projectDetails: 'Question', replyEnabled: true };
  const detailRef = detail;
  const writes = [];
  let sessions = 0;
  let detailReads = 0;
  let resolveSession;
  globalThis.fetch = async (url, options = {}) => {
    if (url.endsWith('/session')) {
      if (++sessions === 1) return responseRef({ email: 'admin@example.test', csrfToken: 'first' });
      return new Promise(resolve => { resolveSession = resolve; });
    }
    if (options.method) {
      writes.push(JSON.parse(options.body));
      return writes.length === 1 ? new Response('{}', { status: 401 }) : responseRef({ id: 'reply-1', status: 'accepted' });
    }
    if (url.endsWith('/inquiry-1')) { detailReads++; return responseRef(detailRef); }
    return responseRef({ items: [detailRef] });
  };
  const mounted = await environment.mount(element(AdminApp));
  context.after(mounted.unmount);
  await actRef(() => buttonRef(mounted.container, 'TEST-REPLY').click());
  const [notes, reply] = mounted.container.querySelectorAll('textarea');
  await changeInputRef(notes, 'Private draft notes');
  await changeInputRef(reply, 'Unsent reply body');
  await actRef(() => buttonRef(mounted.container, 'إرسال الرد').click());
  assert.equal(reply.isConnected, true);
  assert.ok(reply.closest('[hidden]'));
  assert.equal(document.body.style.overflow, '');
  assert.equal(document.activeElement.className, 'admin-panel admin-access-state');
  await actRef(() => document.body.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  await actRef(() => buttonRef(mounted.container, 'إعادة التحقق').click());
  await actRef(() => document.body.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  await actRef(() => resolveSession(responseRef({ email: 'admin@example.test', csrfToken: 'renewed' })));
  assert.equal(mounted.container.querySelectorAll('textarea')[1], reply);
  assert.equal(reply.value, 'Unsent reply body');
  assert.equal(notes.value, 'Private draft notes');
  assert.equal(detailReads, 1);
  assert.equal(writes.length, 1);
  assert.equal(document.body.style.overflow, 'hidden');
  assert.ok(document.activeElement.closest('[role="dialog"]'));
  await actRef(() => buttonRef(mounted.container, 'التحقق من حالة هذا الرد').click());
  assert.equal(writes.length, 2);
  assert.deepEqual(writes[1], writes[0]);
  assert.equal(reply.value, '');
  assert.equal(notes.value, 'Private draft notes');
});

testRef('a rejected history restore retains the draft and releases the document mutation lock', async context => {
  adminApi.clear();
  globalThis.fetch = async (url, options = {}) => options.method ? new Response('{}', { status: 409 }) : responseRef(url.endsWith('/history')
    ? { items: [{ revision: 1, action: 'save', createdAtUtc: '2026-10-01T00:00:00Z', actor: 'admin' }] }
    : { revision: 3, draft: { text: 'Saved' }, isPublished: false, hasPrevious: false });
  const initialValue = { text: '' };
  const initialValueRef = initialValue;
  const mounted = await environment.mount(element(DocumentEditor, { documentKey: 'content', title: 'Content', initialValue: initialValueRef, onPermissionError() {}, onDirtyChange() {}, children: (draft, change) => element('input', { value: draft.text, onChange: event => change({ text: event.target.value }) }) }));
  context.after(mounted.unmount);
  await actRef(() => buttonRef(mounted.container, 'عرض / تحديث السجل').click());
  await actRef(() => buttonRef(mounted.container, 'استعادة إلى المسودة').click());
  assert.equal(mounted.container.querySelector('input').value, 'Saved');
  assert.equal(mounted.container.querySelector('input').matches(':disabled'), false);
  assert.equal(buttonRef(mounted.container, 'نشر').disabled, false);
  assert.equal(buttonRef(mounted.container, 'استعادة إلى المسودة').disabled, false);
  assert.match(mounted.container.querySelector('[role="alert"]').textContent, /تم تعديل البيانات من جلسة أخرى/);
});

testRef('public inquiry confirmations hide notification details and reference IDs in both languages and inquiry flows', async context => {
  environment.window.turnstile = { render() { return 'confirmation-widget'; }, remove() {}, reset() {} };
  context.after(() => { delete environment.window.turnstile; });
  for (const language of ['ar', 'en']) {
    for (const isProjectInquiry of [false, true]) {
      for (const notificationStatus of ['accepted', 'failed', 'disabled', 'timedOut', 'unknown', undefined]) {
        let submissions = 0;
        globalThis.fetch = async (url, options = {}) => {
          if (url.endsWith('/api/site')) return responseRef({});
          submissions++;
          assert.equal(options.method, 'POST');
          return responseRef({ success: true, referenceId: 'TEST-INTERNAL-REFERENCE', notificationStatus });
        };
        const mounted = await environment.mount(element(AppProviders, { initialLanguage: language, initialPath: '/booking', initialSnapshot: {} },
          element(BookingSection, { isProjectInquiry, serviceKey: isProjectInquiry ? 'resume' : null })));
        try {
          await changeInputRef(mounted.container.querySelector('#booking-name'), 'Test name');
          await changeInputRef(mounted.container.querySelector('#booking-email'), 'visitor@example.test');
          await changeInputRef(mounted.container.querySelector('#booking-details'), 'Confirmation display test');
          if (!isProjectInquiry) await actRef(() => mounted.container.querySelector('[data-category-option]').click());
          await actRef(() => mounted.container.querySelector('form').dispatchEvent(new environment.window.Event('submit', { bubbles: true, cancelable: true })));
          const confirmation = mounted.container.querySelector('h3')?.parentElement;
          assert.ok(confirmation);
          assert.equal(confirmation.querySelectorAll('p').length, 1);
          assert.doesNotMatch(confirmation.textContent, /TEST-INTERNAL-REFERENCE|Ref ID|حالة إشعار البريد|Email notification status/);
          assert.equal(confirmation.querySelector('[role="status"]').textContent.trim(), language === 'ar'
            ? 'شكرًا لتواصلك. سنراجع المعلومات التي قدمتها ونتواصل معك في أسرع وقت ممكن.'
            : 'Thank you for reaching out. We will review the information you provided and contact you as soon as possible.');
          assert.equal(submissions, 1);
          await actRef(() => confirmation.querySelector('button').click());
          assert.ok(mounted.container.querySelector('form'));
        } finally { await mounted.unmount(); }
      }
    }
  }
});

testRef('a second inquiry gets a new connected Turnstile widget and fresh token', async context => {
  const widgets = new Map();
  const submissions = [];
  let rendered = 0;
  const removed = [];
  environment.window.turnstile = {
    render(container, options) { const id = `widget-${++rendered}`; widgets.set(id, { container, options }); return id; },
    remove(id) { removed.push(id); widgets.delete(id); },
    reset() {},
  };
  globalThis.fetch = async (url, options = {}) => {
    if (url.endsWith('/api/site')) return responseRef({});
    submissions.push(JSON.parse(options.body));
    return responseRef({ success: true, referenceId: 'TEST', notificationStatus: 'disabled' });
  };
  const mounted = await environment.mount(element(AppProviders, { initialLanguage: 'en', initialPath: '/booking', initialSnapshot: {} }, element(BookingSection)));
  context.after(async () => { await mounted.unmount(); delete environment.window.turnstile; });
  for (const token of ['first-token', 'second-token']) {
    const active = [...widgets.values()];
    assert.equal(active.length, 1);
    assert.equal(active[0].container.isConnected, true);
    await actRef(() => active[0].options.callback(token));
    await changeInputRef(mounted.container.querySelector('#booking-name'), 'Test name');
    await changeInputRef(mounted.container.querySelector('#booking-email'), 'visitor@example.test');
    await changeInputRef(mounted.container.querySelector('#booking-details'), `Details for ${token}`);
    await actRef(() => mounted.container.querySelector('[data-category-option]').click());
    await actRef(() => mounted.container.querySelector('form').dispatchEvent(new environment.window.Event('submit', { bubbles: true, cancelable: true })));
    assert.equal(mounted.container.querySelector('form'), null);
    assert.equal(widgets.size, 0);
    if (token === 'first-token') await actRef(() => mounted.container.querySelector('button').click());
  }
  assert.deepEqual(submissions.map(item => item.turnstileToken), ['first-token', 'second-token']);
  assert.equal(rendered, 2);
  assert.deepEqual(removed, ['widget-1', 'widget-2']);
});

testRef('Turnstile shares a pending script in StrictMode and ignores a load after unmount', async context => {
  delete environment.window.turnstile;
  const mounted = await environment.mount(element(StrictModeRef, null, element(AppProviders, { initialLanguage: 'en', initialPath: '/booking', initialSnapshot: {} }, element(BookingSection))));
  const scripts = document.querySelectorAll('script[src^="https://challenges.cloudflare.com/turnstile/"]');
  assert.equal(scripts.length, 1);
  await mounted.unmount();
  let renders = 0;
  environment.window.turnstile = { render() { renders++; } };
  context.after(() => { scripts[0].remove(); delete environment.window.turnstile; });
  await actRef(() => scripts[0].dispatchEvent(new window.Event('load')));
  assert.equal(renders, 0);
});

testRef('a failed Turnstile script can load again after navigation, including failure after unmount', async context => {
  context.after(() => {
    document.querySelectorAll('script[src^="https://challenges.cloudflare.com/turnstile/"]').forEach(script => script.remove());
    delete environment.window.turnstile;
  });
  for (const failureAfterUnmount of [false, true]) {
    delete environment.window.turnstile;
    const mounted = await environment.mount(element(StrictModeRef, null, element(AppProviders, { initialLanguage: 'en', initialPath: '/booking', initialSnapshot: {} }, element(BookingSection))));
    const failedScript = document.querySelector('script[src^="https://challenges.cloudflare.com/turnstile/"]');
    assert.ok(failedScript);
    if (failureAfterUnmount) await mounted.unmount();
    await actRef(() => failedScript.dispatchEvent(new window.Event('error')));
    assert.equal(failedScript.isConnected, false);
    if (!failureAfterUnmount) await mounted.unmount();
    const reopened = await environment.mount(element(StrictModeRef, null, element(AppProviders, { initialLanguage: 'en', initialPath: '/booking', initialSnapshot: {} }, element(BookingSection))));
    const scripts = document.querySelectorAll('script[src^="https://challenges.cloudflare.com/turnstile/"]');
    assert.equal(scripts.length, 1);
    assert.notEqual(scripts[0], failedScript);
    const widgets = new Map();
    environment.window.turnstile = {
      render(container) { widgets.set('recovered-widget', container); return 'recovered-widget'; },
      remove(id) { widgets.delete(id); },
    };
    await actRef(() => scripts[0].dispatchEvent(new window.Event('load')));
    assert.equal(widgets.size, 1);
    assert.equal(widgets.get('recovered-widget').isConnected, true);
    await reopened.unmount();
    assert.equal(widgets.size, 0);
    scripts[0].remove();
  }
});

testRef('CMS links preserve the page language and URL suffixes without rewriting external or file links', async context => {
  const page = { slug: 'custom', title: { ar: 'صفحة', en: 'Page' }, description: {}, sections: [
    { id: 'cta', type: 'cta', title: {}, body: {}, linkUrl: '/start-project?source=cms#brief', linkLabel: { ar: 'تواصل', en: 'Contact' } },
    { id: 'cards', type: 'cards', title: {}, body: {}, items: [
      { title: { ar: 'عمل' }, body: {}, linkUrl: 'https://ahmad-makatreh.vip/work/tammivo?view=all#images' },
      { title: { ar: 'خارجي' }, body: {}, linkUrl: 'https://example.test/other?x=1#top' },
      { title: { ar: 'ملف' }, body: {}, linkUrl: '/files/cv.pdf?download=1' },
    ] },
  ] };
  const pageRef = page;
  const mounted = await environment.mount(element(ContentPageView, { page: pageRef, language: 'ar' }));
  context.after(mounted.unmount);
  assert.deepEqual([...mounted.container.querySelectorAll('a')].map(link => link.getAttribute('href')), [
    '/page/ar/start-project?source=cms#brief', 'https://ahmad-makatreh.vip/page/ar/work/tammivo?view=all#images', 'https://example.test/other?x=1#top', '/files/cv.pdf?download=1',
  ]);
});

testRef('CMS previews support both locales, existing locale paths and custom pages while preserving service links', async context => {
  const links = ['/page/ar/custom?x=1#section', '/', '/start-project/app', '/api/site', '/auth/backup', '/images/photo.png', '#local', 'not a URL'];
  const linksRef = links;
  const page = { title: {}, description: {}, sections: linksRef.map((linkUrl, index) => ({ id: String(index), type: 'cta', title: { en: 'Link' }, body: {}, linkUrl })) };
  const mounted = await environment.mount(element(ContentPageView, { page, language: 'en', preview: true }));
  context.after(mounted.unmount);
  const anchors = [...mounted.container.querySelectorAll('a')];
  assert.deepEqual(anchors.map(link => link.getAttribute('href')), ['/custom?x=1#section', '/', '/start-project/app', ...linksRef.slice(3)]);
  assert.equal(anchors.every(link => link.target === '_blank' && link.rel === 'noopener noreferrer'), true);
});

testRef('absolute CMS links retain the public origin in an Arabic admin preview', async context => {
  const links = ['https://ahmad-makatreh.vip/start-project?source=preview#brief', '//ahmad-makatreh.vip/custom', '/custom'];
  const linksRef = links;
  const page = { title: {}, description: {}, sections: linksRef.map((linkUrl, index) => ({ id: String(index), type: 'cta', title: { ar: 'رابط' }, body: {}, linkUrl })) };
  const mounted = await environment.mount(element(ContentPageView, { page, language: 'ar', preview: true }));
  context.after(mounted.unmount);
  assert.deepEqual([...mounted.container.querySelectorAll('a')].map(link => link.getAttribute('href')), [
    'https://ahmad-makatreh.vip/page/ar/start-project?source=preview#brief', 'https://ahmad-makatreh.vip/page/ar/custom', '/page/ar/custom',
  ]);
});
