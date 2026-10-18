// codeguard:components:start
// codeguard:defines: mounted lazy failure, navigation and reload regression tests
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as element, lazy as lazyRef, Suspense as SuspenseRef, act as actRef, useState } from 'react';
import { createComponentEnvironment as createEnvironment, changeInput as changeInputRef, waitFor as waitForRef } from './helpers/componentEnvironment.js';
// codeguard:components:end

testRef('rejected lazy page shows an Arabic recovery state and navigation resets only that page', async context => {
  const environment = await createEnvironment();
  const environmentRef = environment;
  context.mock.method(console, 'error', () => {});
  try {
    const { ErrorBoundary: Boundary } = await environmentRef.load('/src/components/ErrorBoundary/ErrorBoundary.jsx');
    const FailedPage = lazyRef(() => Promise.reject(new Error('Missing route chunk')));
    const FailedPageRef = FailedPage;
    function Host() {
      const [page, setPage] = useState('broken');
      return element('div', null,
        element('header', null, 'Persistent navigation', element('button', { onClick: () => setPage('working') }, 'Open working page')),
        element(Boundary, { resetKey: page, language: 'ar' }, page === 'broken'
          ? element(SuspenseRef, { fallback: element('p', null, 'Loading chunk') }, element(FailedPageRef))
          : element('p', null, 'Working page')));
    }
    const HostRef = Host;
    const mounted = await environmentRef.mount(element(HostRef));
    await waitForRef(() => mounted.container.querySelector('[role="alert"]'));
    assert.match(mounted.container.querySelector('[role="alert"]').textContent, /تعذر تحميل الصفحة/);
    assert.equal(mounted.container.querySelector('[role="alert"]').dir, 'rtl');
    assert.match(mounted.container.querySelector('header').textContent, /Persistent navigation/);
    await actRef(() => mounted.container.querySelector('header button').click());
    assert.equal(mounted.container.querySelector('[role="alert"]'), null);
    assert.match(mounted.container.textContent, /Working page/);
  } finally { await environmentRef.close(); }
});

testRef('healthy route changes retain the mounted child and its unsent draft', async () => {
  const environment = await createEnvironment();
  const environmentRef = environment;
  try {
    const { ErrorBoundary: Boundary } = await environmentRef.load('/src/components/ErrorBoundary/ErrorBoundary.jsx');
    function Editor() {
      const [draft, setDraft] = useState('');
      return element('input', { value: draft, onChange: event => setDraft(event.target.value) });
    }
    const EditorRef = Editor;
    function Host() {
      const [page, setPage] = useState('/start-project/resume');
      return element('div', null,
        element('button', { onClick: () => setPage('/booking') }, 'Contact'),
        element(Boundary, { resetKey: page }, element(EditorRef)));
    }
    const HostRef = Host;
    const mounted = await environmentRef.mount(element(HostRef));
    const originalInput = mounted.container.querySelector('input');
    await changeInputRef(originalInput, 'مسودة الطلب');
    await actRef(() => mounted.container.querySelector('button').click());
    assert.equal(mounted.container.querySelector('input'), originalInput);
    assert.equal(originalInput.value, 'مسودة الطلب');
  } finally { await environmentRef.close(); }
});

testRef('English recovery control performs a document reload without exposing the thrown error', async context => {
  const environment = await createEnvironment();
  const environmentRef = environment;
  context.mock.method(console, 'error', () => {});
  try {
    const { ErrorBoundary: Boundary } = await environmentRef.load('/src/components/ErrorBoundary/ErrorBoundary.jsx');
    const BrokenPage = () => { throw new Error('Internal failure details'); };
    const BrokenPageRef = BrokenPage;
    const mounted = await environmentRef.mount(element(Boundary, { language: 'en' }, element(BrokenPageRef)));
    assert.match(mounted.container.textContent, /Unable to load this page/);
    assert.doesNotMatch(mounted.container.textContent, /Internal failure details/);
    const reload = context.mock.fn();
    const reloadRef = reload;
    const originalWindow = globalThis.window;
    globalThis.window = new Proxy(originalWindow, {
      get(target, key) { return key === 'location' ? { reload: reloadRef } : Reflect.get(target, key, target); },
    });
    try { await actRef(() => mounted.container.querySelector('button').click()); }
    finally { globalThis.window = originalWindow; }
    assert.equal(reloadRef.mock.callCount(), 1);
  } finally { await environmentRef.close(); }
});
