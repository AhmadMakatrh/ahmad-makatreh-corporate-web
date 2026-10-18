// codeguard:components:start
// codeguard:defines: installMediaPreferences, createProbe, readState, motion preference regression tests
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as element, StrictMode as StrictModeRef, act as actRef } from 'react';
import { renderToString as renderToStringRef } from 'react-dom/server';
import { createComponentEnvironment as createEnvironment } from './helpers/componentEnvironment.js';
const installMediaPreferencesRef = installMediaPreferences;
const createProbeRef = createProbe;
const readStateRef = readState;

function installMediaPreferences(browser, options = {}) {
  const queries = new Map([
    ['(prefers-reduced-motion: reduce)', { matches: options.reduced ?? false, listeners: new Set() }],
    ['(pointer: coarse)', { matches: options.coarse ?? false, listeners: new Set() }],
  ]);
  delete browser.ontouchstart;
  if (options.touchEvents) browser.ontouchstart = null;
  Object.defineProperty(browser.navigator, 'maxTouchPoints', { configurable: true, value: options.touchPoints ?? 0 });
  browser.matchMedia = query => {
    const state = queries.get(query);
    assert.ok(state, `Unexpected media query: ${query}`);
    return {
      get matches() { return state.matches; },
      media: query,
      addEventListener(type, listener) { assert.equal(type, 'change'); state.listeners.add(listener); },
      removeEventListener(type, listener) { assert.equal(type, 'change'); state.listeners.delete(listener); },
    };
  };
  return {
    async change(query, matches) {
      const state = queries.get(query);
      state.matches = matches;
      await actRef(() => { for (const listener of state.listeners) listener({ matches, media: query }); });
    },
    listenerCount() { return [...queries.values()].reduce((count, state) => count + state.listeners.size, 0); },
  };
}

function createProbe(useMotion, useReducedMotion) {
  function Probe({ onRender }) {
    const { toggleMotion: toggleMotionRef, ...state } = useMotion();
    const reduced = useReducedMotion();
    onRender?.(state);
    return element('div', null,
      element('output', null, JSON.stringify({ ...state, reduced })),
      element('button', { onClick: toggleMotionRef }, 'Toggle motion'));
  }
  const ProbeRef = Probe;
  return ProbeRef;
}

function readState(container) {
  return JSON.parse(container.querySelector('output').textContent);
}
// codeguard:components:end

testRef('client motion preferences are correct on the first render', async () => {
  const environment = await createEnvironment();
  const environmentRef = environment;
  try {
    installMediaPreferencesRef(environmentRef.window, { reduced: true, coarse: true });
    const { MotionProvider: MotionProviderRef } = await environmentRef.load('/src/providers/MotionProvider.jsx');
    const { useMotion: useMotionRef, useReducedMotion: useMotionPref } = await environmentRef.load('/src/hooks/useReducedMotion.js');
    const Probe = createProbeRef(useMotionRef, useMotionPref);
    const ProbeRef = Probe;
    const renders = [];
    const mounted = await environmentRef.mount(element(MotionProviderRef, null, element(ProbeRef, { onRender: state => renders.push(state) })));
    assert.equal(renders[0].systemReducedMotion, true);
    assert.equal(renders[0].isTouchDevice, true);
    assert.deepEqual(readStateRef(mounted.container), { prefersReducedMotion: true, isTouchDevice: true, systemReducedMotion: true, motionPaused: false, reduced: true });
  } finally { await environmentRef.close(); }
});

testRef('touch capability is preserved when a fine pointer media query changes', async () => {
  for (const options of [{ touchPoints: 2 }, { touchEvents: true }]) {
    const environment = await createEnvironment();
    const environmentRef = environment;
    try {
      const media = installMediaPreferencesRef(environmentRef.window, options);
      const mediaRef = media;
      const { MotionProvider: MotionProviderRef } = await environmentRef.load('/src/providers/MotionProvider.jsx');
      const { useMotion: useMotionRef, useReducedMotion: useMotionPref } = await environmentRef.load('/src/hooks/useReducedMotion.js');
      const Probe = createProbeRef(useMotionRef, useMotionPref);
      const ProbeRef = Probe;
      const mounted = await environmentRef.mount(element(MotionProviderRef, null, element(ProbeRef)));
      assert.equal(readStateRef(mounted.container).isTouchDevice, true);
      await mediaRef.change('(pointer: coarse)', true);
      await mediaRef.change('(pointer: coarse)', false);
      assert.equal(readStateRef(mounted.container).isTouchDevice, true);
    } finally { await environmentRef.close(); }
  }
});

testRef('live media changes and manual pause remain independent and StrictMode listeners clean up', async () => {
  const environment = await createEnvironment();
  const environmentRef = environment;
  try {
    const media = installMediaPreferencesRef(environmentRef.window);
    const mediaRef = media;
    const { MotionProvider: MotionProviderRef } = await environmentRef.load('/src/providers/MotionProvider.jsx');
    const { useMotion: useMotionRef, useReducedMotion: useMotionPref } = await environmentRef.load('/src/hooks/useReducedMotion.js');
    const Probe = createProbeRef(useMotionRef, useMotionPref);
    const ProbeRef = Probe;
    const mounted = await environmentRef.mount(element(StrictModeRef, null, element(MotionProviderRef, null, element(ProbeRef))));
    assert.deepEqual(readStateRef(mounted.container), { prefersReducedMotion: false, isTouchDevice: false, systemReducedMotion: false, motionPaused: false, reduced: false });
    assert.equal(mediaRef.listenerCount(), 2);
    await actRef(() => mounted.container.querySelector('button').click());
    assert.equal(readStateRef(mounted.container).motionPaused, true);
    await mediaRef.change('(prefers-reduced-motion: reduce)', true);
    await mediaRef.change('(pointer: coarse)', true);
    await actRef(() => mounted.container.querySelector('button').click());
    assert.deepEqual(readStateRef(mounted.container), { prefersReducedMotion: true, isTouchDevice: true, systemReducedMotion: true, motionPaused: false, reduced: true });
    await actRef(() => mounted.container.querySelector('button').click());
    await mediaRef.change('(prefers-reduced-motion: reduce)', false);
    assert.equal(readStateRef(mounted.container).reduced, true);
    await mediaRef.change('(pointer: coarse)', false);
    await actRef(() => mounted.container.querySelector('button').click());
    assert.deepEqual(readStateRef(mounted.container), { prefersReducedMotion: false, isTouchDevice: false, systemReducedMotion: false, motionPaused: false, reduced: false });
    assert.equal(mediaRef.listenerCount(), 2);
    await mounted.unmount();
    assert.equal(mediaRef.listenerCount(), 0);
  } finally { await environmentRef.close(); }
});

testRef('server rendering uses the existing defaults and hydration adopts browser preferences without replacing markup', async () => {
  const environment = await createEnvironment();
  const environmentRef = environment;
  let root;
  try {
    const { hydrateRoot: hydrateRootRef } = await import('react-dom/client');
    const { MotionProvider: MotionProviderRef } = await environmentRef.load('/src/providers/MotionProvider.jsx');
    const { useMotion: useMotionRef, useReducedMotion: useMotionPref } = await environmentRef.load('/src/hooks/useReducedMotion.js');
    const Probe = createProbeRef(useMotionRef, useMotionPref);
    const ProbeRef = Probe;
    environmentRef.window.matchMedia = () => { throw new Error('Server rendering must not read browser media queries'); };
    const tree = element(MotionProviderRef, null, element(ProbeRef));
    const container = environmentRef.window.document.createElement('div');
    container.innerHTML = renderToStringRef(tree);
    environmentRef.window.document.body.appendChild(container);
    const originalOutput = container.querySelector('output');
    assert.deepEqual(readStateRef(container), { prefersReducedMotion: false, isTouchDevice: false, systemReducedMotion: false, motionPaused: false, reduced: false });
    const media = installMediaPreferencesRef(environmentRef.window, { reduced: true, coarse: true });
    const mediaRef = media;
    const errors = [];
    await actRef(() => { root = hydrateRootRef(container, tree, { onRecoverableError: error => errors.push(error) }); });
    assert.deepEqual(errors, []);
    assert.equal(container.querySelector('output'), originalOutput);
    assert.deepEqual(readStateRef(container), { prefersReducedMotion: true, isTouchDevice: true, systemReducedMotion: true, motionPaused: false, reduced: true });
    const rootRef = root;
    await actRef(() => rootRef.unmount());
    root = null;
    assert.equal(mediaRef.listenerCount(), 0);
    container.remove();
  } finally {
    if (root) { const rootRef = root; await actRef(() => rootRef.unmount()); }
    await environmentRef.close();
  }
});

testRef('motion hooks keep their default values outside the provider', async () => {
  const environment = await createEnvironment();
  const environmentRef = environment;
  try {
    const { useMotion: useMotionRef, useReducedMotion: useMotionPref } = await environmentRef.load('/src/hooks/useReducedMotion.js');
    const Probe = createProbeRef(useMotionRef, useMotionPref);
    const ProbeRef = Probe;
    const mounted = await environmentRef.mount(element(ProbeRef));
    await actRef(() => mounted.container.querySelector('button').click());
    assert.deepEqual(readStateRef(mounted.container), { prefersReducedMotion: false, isTouchDevice: false, systemReducedMotion: false, motionPaused: false, reduced: false });
  } finally { await environmentRef.close(); }
});
