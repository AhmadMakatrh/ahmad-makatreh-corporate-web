// codeguard:components:start
// codeguard:defines: site preference cookie and offer persistence tests
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import {
  getCookieChoice as readChoice,
  getSitePreferences as readPreferences,
  saveCookieChoice as saveChoice,
  updateSitePreferences as updatePreferences,
  wasOfferSeen as hasSeenOffer,
  rememberOfferSeen as markOfferSeen,
  isOfferDismissed as wasOfferDismissed,
  dismissOffer as hideOffer,
} from '../src/utils/sitePreferences.js';

testRef('cookie choice and local preferences persist without writing optional cookies after refusal', () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  const originalStorage = globalThis.localStorage;
  const cookies = new Map();
  const storage = new Map();
  const writes = [];
  globalThis.window = { location: { protocol: 'https:' } };
  globalThis.document = {
    get cookie() { return [...cookies].map(([name, value]) => `${name}=${value}`).join('; '); },
    set cookie(source) {
      writes.push(source);
      const [pair, ...attributes] = source.split('; ');
      const separator = pair.indexOf('=');
      const name = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      if (attributes.includes('Max-Age=0')) cookies.delete(name);
      else cookies.set(name, value);
    },
  };
  globalThis.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
  try {
    assert.equal(readChoice(), null);
    assert.equal(saveChoice('accepted', { language: 'ar', motionPaused: true }), true);
    assert.equal(readChoice(), 'accepted');
    assert.deepEqual(readPreferences(), { language: 'ar', motionPaused: true });
    assert.ok(writes.every(write => write.includes('Path=/; Max-Age=31536000; SameSite=Lax; Secure')));
    updatePreferences({ motionPaused: false });
    assert.deepEqual(readPreferences(), { language: 'ar', motionPaused: false });

    assert.equal(saveChoice('necessary', { language: 'en', motionPaused: false }), true);
    assert.equal(readChoice(), 'necessary');
    assert.equal(readPreferences(), null);
    assert.equal(cookies.has('am_site_preferences'), false);
    updatePreferences({ language: 'en' });
    assert.equal(cookies.has('am_site_preferences'), false);

    assert.equal(hasSeenOffer(), false);
    markOfferSeen();
    assert.equal(hasSeenOffer(), true);
    hideOffer('year-end');
    assert.equal(wasOfferDismissed('year-end'), true);
    assert.equal(wasOfferDismissed('another-offer'), false);
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
    if (originalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = originalStorage;
  }
});

testRef('a blocked preference cookie never leaves an accepted choice behind', () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  const cookies = new Map();
  globalThis.window = { location: { protocol: 'https:' } };
  globalThis.document = {
    get cookie() { return [...cookies].map(([name, value]) => `${name}=${value}`).join('; '); },
    set cookie(source) {
      const [pair, ...attributes] = source.split('; ');
      const separator = pair.indexOf('=');
      const name = pair.slice(0, separator);
      if (name === 'am_site_preferences' && !attributes.includes('Max-Age=0')) throw new Error('Cookies blocked');
      if (attributes.includes('Max-Age=0')) cookies.delete(name);
      else cookies.set(name, pair.slice(separator + 1));
    },
  };
  try {
    assert.equal(saveChoice('accepted', { language: 'ar', motionPaused: true }), false);
    assert.equal(readChoice(), null);
    assert.equal(readPreferences(), null);
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});
// codeguard:components:end
