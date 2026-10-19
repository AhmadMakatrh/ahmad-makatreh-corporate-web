// codeguard:components:start
// codeguard:defines: live offer-dialog publication regression tests
import { test as testRef, before as beforeRef, after as afterRef } from 'node:test';
import assert from 'node:assert/strict';
import { act as actRef, createElement as element } from 'react';
import { createComponentEnvironment as createEnvironment, waitFor as waitForRef } from './helpers/componentEnvironment.js';

let environment;
let Providers;
let Offer;
let pricing;

beforeRef(async () => {
  // Keep the real GSAP animation lifecycle in the same browser environment.
  environment = await createEnvironment({ url: 'https://site.localhost/' });
  environment.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  environment.window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  ({ AppProviders: Providers } = await environment.load('/src/providers/AppProviders.jsx'));
  ({ LaunchOffer: Offer } = await environment.load('/src/components/LaunchOffer/LaunchOffer.jsx'));
  ({ defaultPricing: pricing } = await environment.load('/src/data/serviceCatalog.js'));
});
afterRef(async () => { await environment?.close(); });
// codeguard:components:end

testRef('live publications retain the homepage offer, update its discount and preserve closing navigation', async context => {
  localStorage.clear();
  localStorage.setItem('am_offer_seen', '0');
  context.mock.method(window, 'scrollTo', () => {});
  let published = { pricing: structuredClone(pricing) };
  globalThis.fetch = async () => Response.json(published);
  const mounted = await environment.mount(element(Providers, { initialLanguage: 'ar', initialPath: '/' }, element(Offer, { ready: true })));
  context.after(mounted.unmount);
  const dialog = mounted.container.querySelector('dialog');
  assert.equal(dialog.open, true);
  published = { ...published, content: { ar: { home: 'الرئيسية الجديدة' } } };
  await actRef(async () => window.dispatchEvent(new window.Event('focus')));
  assert.equal(dialog.open, true, 'Unrelated publications cannot dismiss the offer');
  published = structuredClone(published);
  published.pricing.offers[0].items[0].discountPercent = 40;
  await actRef(async () => window.dispatchEvent(new window.Event('focus')));
  assert.equal(mounted.container.querySelector('dialog'), dialog);
  assert.equal(dialog.open, true);
  assert.equal(dialog.querySelector('#launch-offer-title strong').textContent, '40%');
  await actRef(() => mounted.container.querySelector('dialog .portfolio-button').click());
  published = structuredClone(published);
  published.pricing.offers[0].items[0].discountPercent = 45;
  await actRef(async () => window.dispatchEvent(new window.Event('focus')));
  await waitForRef(() => window.location.pathname === '/page/ar/services', 'Publishing must not cancel the pricing navigation');
  assert.equal(mounted.container.querySelector('dialog').open, false);
});

testRef('offer replacement preserves pending pricing navigation while leaving home cancels it', async context => {
  context.mock.method(window, 'scrollTo', () => {});
  for (const action of ['disable', 'replace', 'leave-home']) {
    localStorage.clear();
    // Override the visit-level in-memory value retained after the previous scenario.
    localStorage.setItem('am_offer_seen', '0');
    window.history.replaceState(null, '', '/');
    let published = { pricing: structuredClone(pricing) };
    globalThis.fetch = async () => Response.json(published);
    const mounted = await environment.mount(element(Providers, { initialLanguage: 'ar', initialPath: '/' }, element(Offer, { ready: true })));
    try {
      assert.equal(mounted.container.querySelector('dialog').open, true);
      await actRef(() => mounted.container.querySelector('dialog .portfolio-button').click());
      if (action === 'leave-home') await actRef(() => {
        window.history.pushState(null, '', '/page/ar/booking');
        window.dispatchEvent(new window.PopStateEvent('popstate'));
      });
      published = structuredClone(published);
      if (action === 'replace') published.pricing.offers[0].id = 'replacement-offer';
      else published.pricing.offers[0].enabled = false;
      await actRef(async () => window.dispatchEvent(new window.Event('focus')));
      const expectedPath = action === 'leave-home' ? '/page/ar/booking' : '/page/ar/services';
      await waitForRef(() => window.location.pathname === expectedPath, `${action}: navigation must be preserved`);
      assert.equal(mounted.container.querySelector('dialog')?.open ?? false, false);
    } finally { await mounted.unmount(); }
  }
});
