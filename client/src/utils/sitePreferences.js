// codeguard:components:start
// codeguard:defines: COOKIE_SETTINGS_EVENT, getCookieChoice, saveCookieChoice, getSitePreferences, updateSitePreferences, wasOfferSeen, rememberOfferSeen, isOfferDismissed, dismissOffer
export const COOKIE_SETTINGS_EVENT = 'am:cookie-settings';
const CHOICE_COOKIE = 'am_cookie_choice';
const PREFERENCES_COOKIE = 'am_site_preferences';
const OFFER_SEEN_KEY = 'am_offer_seen';
const OFFER_DISMISSED_KEY = 'am_offer_dismissed';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const sessionValues = new Map();
const readCookieRef = readCookie;
const writeCookieRef = writeCookie;
const normalizePreferencesRef = normalizePreferences;
const getCookieChoiceRef = getCookieChoice;
const getSitePreferencesRef = getSitePreferences;
const readLocalRef = readLocal;
const writeLocalRef = writeLocal;
const readSessionRef = readSession;
const writeSessionRef = writeSession;

function readCookie(name) {
  if (typeof document === 'undefined') return null;
  try { return document.cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1) ?? null; }
  catch { return null; }
}

function writeCookie(name, value, maxAge = COOKIE_MAX_AGE) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function normalizePreferences(value) {
  return {
    language: value?.language === 'ar' ? 'ar' : 'en',
    motionPaused: value?.motionPaused === true,
  };
}

export function getCookieChoice() {
  const choice = readCookieRef(CHOICE_COOKIE);
  return choice === 'accepted' || choice === 'necessary' ? choice : null;
}

export function getSitePreferences() {
  if (getCookieChoiceRef() !== 'accepted') return null;
  try {
    const value = readCookieRef(PREFERENCES_COOKIE);
    return value ? normalizePreferencesRef(JSON.parse(decodeURIComponent(value))) : null;
  } catch {
    return null;
  }
}

export function saveCookieChoice(choice, preferences) {
  if (choice !== 'accepted' && choice !== 'necessary') return false;
  try {
    writeCookieRef(CHOICE_COOKIE, choice);
    if (choice === 'accepted') {
      writeCookieRef(PREFERENCES_COOKIE, JSON.stringify(normalizePreferencesRef(preferences)));
      if (getCookieChoiceRef() === choice && getSitePreferencesRef() !== null) return true;
      writeCookieRef(CHOICE_COOKIE, '', 0);
      writeCookieRef(PREFERENCES_COOKIE, '', 0);
      return false;
    }
    writeCookieRef(PREFERENCES_COOKIE, '', 0);
    return getCookieChoiceRef() === choice;
  } catch {
    try {
      writeCookieRef(CHOICE_COOKIE, '', 0);
      writeCookieRef(PREFERENCES_COOKIE, '', 0);
    } catch {
      return false;
    }
    return false;
  }
}

export function updateSitePreferences(changes) {
  if (getCookieChoiceRef() !== 'accepted') return;
  const current = getSitePreferencesRef() ?? { language: 'en', motionPaused: false };
  try { writeCookieRef(PREFERENCES_COOKIE, JSON.stringify(normalizePreferencesRef({ ...current, ...changes }))); }
  catch { /* The current visit keeps working when storage is blocked. */ }
}

function readLocal(key) {
  try { return localStorage.getItem(key) ?? sessionValues.get(key) ?? null; }
  catch { return sessionValues.get(key) ?? null; }
}

function writeLocal(key, value) {
  sessionValues.set(key, value);
  try { localStorage.setItem(key, value); }
  catch { /* The value remains available during this page visit. */ }
}

function readSession(key) {
  try { return sessionStorage.getItem(key) ?? sessionValues.get(key) ?? null; }
  catch { return sessionValues.get(key) ?? null; }
}

function writeSession(key, value) {
  sessionValues.set(key, value);
  try { sessionStorage.setItem(key, value); }
  catch { /* The value remains available during this page visit. */ }
}

export function wasOfferSeen() { return readLocalRef(OFFER_SEEN_KEY) === '1'; }
export function rememberOfferSeen() { writeLocalRef(OFFER_SEEN_KEY, '1'); }
export function isOfferDismissed(offerId) { return readSessionRef(OFFER_DISMISSED_KEY) === offerId; }
export function dismissOffer(offerId) { writeSessionRef(OFFER_DISMISSED_KEY, offerId); }
// codeguard:components:end
