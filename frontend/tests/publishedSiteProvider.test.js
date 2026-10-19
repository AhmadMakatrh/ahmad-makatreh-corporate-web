// codeguard:components:start
// codeguard:defines: mounted published-site refresh regression tests, installRefreshTimer, createProbe
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { act as actRef, createElement as element, StrictMode as StrictModeRef, useEffect } from 'react';
import { createComponentEnvironment as createEnvironment, changeInput as changeInputRef } from './helpers/componentEnvironment.js';

function installRefreshTimer(context, browser) {
  const timers = new Map();
  const originalSet = browser.setTimeout.bind(browser);
  const originalClear = browser.clearTimeout.bind(browser);
  let sequence = 0;
  context.mock.method(browser, 'setTimeout', (callback, delay, ...args) => {
    if (delay !== 30000) return originalSet(callback, delay, ...args);
    const id = --sequence;
    timers.set(id, callback);
    return id;
  });
  context.mock.method(browser, 'clearTimeout', id => {
    if (!timers.delete(id)) originalClear(id);
  });
  return {
    get size() { return timers.size; },
    async tick() {
      assert.equal(timers.size, 1, 'Only one refresh timer is scheduled');
      const [id, callback] = timers.entries().next().value;
      timers.delete(id);
      await actRef(async () => { callback(); });
    },
  };
}
const installRefreshTimerRef = installRefreshTimer;

function createProbe(useSite, observe) {
  function Probe() {
    const state = useSite();
    useEffect(() => { observe(state); }, [state]);
    return element('output', null, `${state.loaded}:${state.error?.message ?? ''}`);
  }
  return Probe;
}
const createProbeRef = createProbe;
// codeguard:components:end

testRef('published discounts update the existing badge, prices and form without a reload or loading reset', async context => {
  const environment = await createEnvironment({ url: 'https://site.localhost/page/ar/services' });
  const environmentRef = environment;
  try {
    const timer = installRefreshTimerRef(context, environmentRef.window);
    const { AppProviders: Providers } = await environmentRef.load('/src/providers/AppProviders.jsx');
    const { ServicesPage: Pricing } = await environmentRef.load('/src/pages/Services/ServicesPage.jsx');
    const { LaunchOffer: Offer } = await environmentRef.load('/src/components/LaunchOffer/LaunchOffer.jsx');
    const { BookingSection: Booking } = await environmentRef.load('/src/sections/Booking/BookingSection.jsx');
    const { usePublishedSite: useSite } = await environmentRef.load('/src/providers/publishedSiteContext.js');
    const { defaultPricing: pricing } = await environmentRef.load('/src/data/serviceCatalog.js');
    const calls = [];
    let published = { pricing: structuredClone(pricing) };
    let site;
    const Probe = createProbeRef(useSite, state => { site = state; });
    const ProbeRef = Probe;
    globalThis.fetch = async (url, options) => { calls.push({ url, options }); return Response.json(published); };
    const mounted = await environmentRef.mount(element(StrictModeRef, null,
      element(Providers, { initialLanguage: 'ar', initialPath: '/page/ar/services' },
        element(ProbeRef), element(Pricing), element(Offer, { ready: true }), element(Booking))));
    const badge = mounted.container.querySelector('.portfolio-offer-teaser');
    const price = mounted.container.querySelector('#pricing article strong.text-3xl');
    const name = mounted.container.querySelector('input[name="name"]');
    assert.equal(calls.length, 1, 'StrictMode shares the initial request');
    assert.equal(calls[0].url, '/api/site');
    assert.equal(calls[0].options.cache, 'no-cache');
    assert.equal(badge.querySelector('strong').textContent, '25');
    assert.equal(price.textContent, '60');
    await changeInputRef(name, 'Preserved inquiry');
    published = structuredClone(published);
    published.pricing.offers[0].items[0].discountPercent = 40;
    await timer.tick();
    assert.equal(calls.length, 2);
    assert.equal(mounted.container.querySelector('.portfolio-offer-teaser'), badge);
    assert.equal(badge.querySelector('strong').textContent, '40');
    assert.equal(price.textContent, '48');
    assert.equal(name.value, 'Preserved inquiry');
    assert.equal(site.loaded, true);
    assert.equal(site.error, null);
    const snapshot = site.snapshot;
    const clock = site.clock;
    await timer.tick();
    assert.equal(site.snapshot, snapshot, 'Unchanged data keeps its reference');
    assert.equal(site.clock, clock, 'Unchanged polling does not restart offer animations');
    await mounted.unmount();
    assert.equal(timer.size, 0);
  } finally { await environmentRef.close(); }
});
testRef('hidden and offline tabs pause polling and resume with one shared request', async context => {
  const environment = await createEnvironment();
  const environmentRef = environment;
  try {
    const timer = installRefreshTimerRef(context, environmentRef.window);
    const { PublishedSiteProvider: Provider } = await environmentRef.load('/src/providers/PublishedSiteProvider.jsx');
    const { usePublishedSite: useSite } = await environmentRef.load('/src/providers/publishedSiteContext.js');
    let hidden = false;
    let online = true;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online });
    let calls = 0;
    let complete;
    globalThis.fetch = async () => { calls++; return calls === 1 ? Response.json({}) : new Promise(resolve => { complete = resolve; }); };
    let site;
    const Probe = createProbeRef(useSite, state => { site = state; });
    const ProbeRef = Probe;
    const mounted = await environmentRef.mount(element(Provider, null, element(ProbeRef)));
    assert.equal(timer.size, 1);
    await actRef(() => { hidden = true; document.dispatchEvent(new window.Event('visibilitychange')); });
    assert.equal(timer.size, 0);
    await actRef(() => window.dispatchEvent(new window.Event('focus')));
    assert.equal(calls, 1);
    await actRef(() => {
      hidden = false;
      document.dispatchEvent(new window.Event('visibilitychange'));
      window.dispatchEvent(new window.Event('focus'));
      window.dispatchEvent(new window.Event('online'));
    });
    assert.equal(calls, 2, 'Focus, visibility and online events cannot overlap requests');
    assert.equal(site.loaded, true);
    await actRef(async () => { complete(Response.json({})); });
    assert.equal(timer.size, 1);
    await actRef(() => { online = false; window.dispatchEvent(new window.Event('offline')); });
    assert.equal(timer.size, 0);
    await actRef(() => window.dispatchEvent(new window.Event('focus')));
    assert.equal(calls, 2);
    await actRef(() => { online = true; window.dispatchEvent(new window.Event('online')); });
    assert.equal(calls, 3);
    await actRef(async () => { complete(Response.json({})); });
    await mounted.unmount();
    await actRef(() => {
      document.dispatchEvent(new window.Event('visibilitychange'));
      window.dispatchEvent(new window.Event('focus'));
      window.dispatchEvent(new window.Event('online'));
    });
    assert.equal(calls, 3, 'Unmount removes refresh listeners');
    assert.equal(timer.size, 0);
  } finally { await environmentRef.close(); }
});

testRef('background failures retain published pages and data, expose the error and recover on the next poll', async context => {
  const environment = await createEnvironment({ url: 'https://site.localhost/managed' });
  const environmentRef = environment;
  try {
    const timer = installRefreshTimerRef(context, environmentRef.window);
    const { AppProviders: Providers } = await environmentRef.load('/src/providers/AppProviders.jsx');
    const { ContentPage: Page } = await environmentRef.load('/src/pages/ContentPage.jsx');
    const { usePublishedSite: useSite } = await environmentRef.load('/src/providers/publishedSiteContext.js');
    const published = { pages: { pages: [{ slug: 'managed', visible: true, title: { ar: 'صفحة منشورة', en: 'Published page' }, description: { ar: '', en: '' }, sections: [] }] } };
    let fail = false;
    globalThis.fetch = async () => fail ? new Response('', { status: 503 }) : Response.json(published);
    let site;
    const Probe = createProbeRef(useSite, state => { site = state; });
    const ProbeRef = Probe;
    const mounted = await environmentRef.mount(element(Providers, { initialLanguage: 'en', initialPath: '/managed' }, element(ProbeRef), element(Page, { slug: 'managed' })));
    const page = mounted.container.querySelector('article');
    const snapshot = site.snapshot;
    fail = true;
    await timer.tick();
    assert.equal(site.error.status, 503);
    assert.equal(site.loaded, true);
    assert.equal(site.snapshot, snapshot);
    assert.equal(mounted.container.querySelector('article'), page);
    assert.equal(mounted.container.querySelector('[role="alert"]'), null);
    fail = false;
    await timer.tick();
    assert.equal(site.error, null);
    assert.equal(site.snapshot, snapshot);
    assert.equal(mounted.container.querySelector('article'), page);
  } finally { await environmentRef.close(); }
});

testRef('an initial failure can be retried without reusing a rejected request', async context => {
  const environment = await createEnvironment();
  const environmentRef = environment;
  try {
    const timer = installRefreshTimerRef(context, environmentRef.window);
    const { PublishedSiteProvider: Provider } = await environmentRef.load('/src/providers/PublishedSiteProvider.jsx');
    const { usePublishedSite: useSite } = await environmentRef.load('/src/providers/publishedSiteContext.js');
    let calls = 0;
    globalThis.fetch = async () => ++calls === 1 ? new Response('', { status: 503 }) : Response.json({ pricing: { offers: [] } });
    let site;
    const Probe = createProbeRef(useSite, state => { site = state; });
    const ProbeRef = Probe;
    await environmentRef.mount(element(Provider, null, element(ProbeRef)));
    assert.equal(site.loaded, true);
    assert.equal(site.error.status, 503);
    await actRef(async () => { site.refresh(); });
    assert.equal(calls, 2);
    assert.equal(site.error, null);
    assert.deepEqual(site.snapshot, { pricing: { offers: [] } });
    assert.equal(timer.size, 1);
  } finally { await environmentRef.close(); }
});

testRef('a delayed refresh cannot update an unmounted provider or schedule more requests', async context => {
  const environment = await createEnvironment();
  const environmentRef = environment;
  try {
    const timer = installRefreshTimerRef(context, environmentRef.window);
    const { PublishedSiteProvider: Provider } = await environmentRef.load('/src/providers/PublishedSiteProvider.jsx');
    const { usePublishedSite: useSite } = await environmentRef.load('/src/providers/publishedSiteContext.js');
    let calls = 0;
    let complete;
    const states = [];
    globalThis.fetch = async () => ++calls === 1 ? Response.json({}) : new Promise(resolve => { complete = resolve; });
    const Probe = createProbeRef(useSite, state => states.push(state));
    const ProbeRef = Probe;
    const mounted = await environmentRef.mount(element(Provider, null, element(ProbeRef)));
    await timer.tick();
    assert.equal(calls, 2);
    assert.equal(timer.size, 0, 'A slow response has no overlapping polling timer');
    await actRef(() => window.dispatchEvent(new window.Event('focus')));
    assert.equal(calls, 2);
    await mounted.unmount();
    const count = states.length;
    await actRef(async () => { complete(Response.json({ pricing: { offers: [] } })); });
    assert.equal(states.length, count);
    assert.equal(timer.size, 0);
  } finally { await environmentRef.close(); }
});
