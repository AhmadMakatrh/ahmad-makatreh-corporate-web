// codeguard:components:start
// codeguard:defines: safeDocumentUrl, validateSiteDocument
import { normalizeUtc as utcStamp } from './inquiryTime.js';
const safeDocumentUrlRef = safeDocumentUrl;
const decimalRef = decimal;
const instantRef = instant;
const pricingRef = pricing;
const pagesRef = pages;
const datasetRef = dataset;
const contentRef = content;


const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const objectRef = object;
const string = (value, max) => typeof value === 'string' && value.length <= max;
const stringRef = string;
const nonblank = value => typeof value === 'string' && /[^\p{White_Space}]/u.test(value);
const nonblankRef = nonblank;
const identifier = value => typeof value === 'string' && /^[a-z][a-z0-9-]{0,29}$/.test(value);
const identifierRef = identifier;
const optionalBoolean = (value, field) => !Object.hasOwn(value, field) || typeof value[field] === 'boolean';
const optionalBooleanRef = optionalBoolean;
const optional = (value, valid) => value == null || valid(value);
const optionalRef = optional;
const fields = (value, allowed) => objectRef(value) && Object.keys(value).every(key => allowed.includes(key));
const fieldsRef = fields;
const text = (value, max = 1000, strict = false) => objectRef(value) && stringRef(value.ar, max) && stringRef(value.en, max) && (!strict || fieldsRef(value, ['ar', 'en']));
const textRef = text;
const title = (value, strict = false) => textRef(value, 200, strict) && nonblankRef(value.ar) && nonblankRef(value.en);
const titleRef = title;
const strings = (value, count, max) => Array.isArray(value) && value.length <= count && value.every(item => stringRef(item, max));
const stringsRef = strings;
const lines = (value, count, max) => objectRef(value) && Object.values(value).every(items => Array.isArray(items) && items.every(item => typeof item === 'string')) && stringsRef(value.ar, count, max) && stringsRef(value.en, count, max);
const linesRef = lines;
const unique = (set, value) => !set.has(value) && !!set.add(value);
const uniqueRef = unique;
const dataNames = ['projectCards','projectContributions','caseStudies','projects','articles'];
const dataNamesRef = dataNames;
const forbidden = ['__proto__','constructor','prototype'];
const forbiddenRef = forbidden;
const reserved = ['admin','api','home','about','services','capabilities','work','journal','booking','start-project','startproject','page','contact','assets','images'];
const reservedRef = reserved;

export function safeDocumentUrl(value) {
  if (value == null || value === '') return true;
  if (!stringRef(value, 2048) || /[\\\p{Cc}]/u.test(value)) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  if (!/^https:\/\//i.test(value)) return false;
  try { const url = new URL(value);
   return url.protocol === 'https:' && !url.username && !url.password; }
  catch { return false; }
}

function decimal(value, places = 2) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return false;
  const [coefficient, exponent = '0'] = String(value).split('e');
  return (coefficient.split('.')[1]?.length ?? 0) - Number(exponent) <= places;
}

function instant(value) {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,7}))?(Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!match || !utcStamp(`${match[1]}Z`)) return null;
  const hours = Number(match[5] ?? 0), minutes = Number(match[6] ?? 0);
  if (hours > 14 || minutes > 59 || hours === 14 && minutes !== 0) return null;
  const offset = (hours * 60 + minutes) * (match[4] === '-' ? -1 : 1);
  const ticks = BigInt(Date.parse(`${match[1]}Z`)) * 10000n + BigInt((match[2] ?? '').padEnd(7, '0')) - BigInt(offset) * 600000000n;
  return ticks >= -621355968000000000n && ticks <= 2534023007999999999n ? ticks : null;
}

function pricing(data) {
  if (!Array.isArray(data.packages) || !Array.isArray(data.offers) || data.packages.length > 50 || data.offers.length > 50) return 'At most 50 packages and offers are supported.';
  const keys = new Map();
  for (const item of data.packages) {
    if (!objectRef(item) || !identifierRef(item.key) || keys.has(item.key) || !titleRef(item.title) || !textRef(item.description, 2000)
      || item.price != null && (!decimalRef(item.price) || item.price < 0 || item.price > 1000000)
      || !linesRef(item.features, 20, 500) || !optionalBooleanRef(item, 'hidden')) return 'Invalid package key, text, price or features.';
    keys.set(item.key, item);
  }
  const ids = new Set();
  for (const offer of data.offers) {
    if (!objectRef(offer) || !identifierRef(offer.id) || !uniqueRef(ids, offer.id) || !titleRef(offer.title) || !textRef(offer.description, 2000)
      || !Array.isArray(offer.items) || offer.items.length > 50 || !optionalBooleanRef(offer, 'enabled') || !optionalBooleanRef(offer, 'popup')) return 'Invalid offer or schedule.';
    const start = offer.startsAtUtc == null ? null : instantRef(offer.startsAtUtc), end = offer.endsAtUtc == null ? null : instantRef(offer.endsAtUtc);
    if (offer.startsAtUtc != null && start === null || offer.endsAtUtc != null && end === null || start !== null && end !== null && start >= end) return 'Invalid offer or schedule.';
    const offered = new Set();
    for (const item of offer.items) {
      const base = objectRef(item) ? keys.get(item.packageKey) : null;
      if (base?.price == null || !uniqueRef(offered, item.packageKey) || typeof item.discountPercent !== 'number' || !Number.isFinite(item.discountPercent) || item.discountPercent <= 0 || item.discountPercent > 100
        || item.offerPrice != null && (!decimalRef(item.offerPrice) || item.offerPrice < 0 || item.offerPrice >= base.price)) return 'Invalid offer price or package.';
    }
  }
  return null;
}

function pages(data) {
  if (!Array.isArray(data.pages) || data.pages.length > 100) return 'At most 100 pages are supported.';
  const slugs = new Set();
  for (const page of data.pages) {
    if (!objectRef(page) || !identifierRef(page.slug) || reservedRef.includes(page.slug) || !uniqueRef(slugs, page.slug) || !titleRef(page.title) || !textRef(page.description, 2000)
      || !Array.isArray(page.sections) || page.sections.length > 40 || !optionalBooleanRef(page, 'visible') || !optionalBooleanRef(page, 'showInNav')) return 'Invalid or reserved page slug, text or sections.';
    const ids = new Set();
    for (const section of page.sections) {
      if (!objectRef(section) || !identifierRef(section.id) || !uniqueRef(ids, section.id) || !['hero','text','image','cards','cta'].includes(section.type)
        || !textRef(section.title, 300) || !textRef(section.body, 20000) || !safeDocumentUrlRef(section.imageUrl) || !safeDocumentUrlRef(section.linkUrl)
        || !optionalRef(section.imageAlt, value => textRef(value, 300)) || !optionalRef(section.linkLabel, value => textRef(value, 300))
        || !optionalRef(section.items, items => Array.isArray(items) && items.length <= 30 && items.every(item => objectRef(item) && textRef(item.title, 300) && textRef(item.body, 4000) && safeDocumentUrlRef(item.imageUrl) && safeDocumentUrlRef(item.linkUrl)))) return 'Invalid page section, URL or content.';
    }
  }
  return null;
}

const image = item => fieldsRef(item, ['src','caption','srcEn']) && safeDocumentUrlRef(item.src) && safeDocumentUrlRef(item.srcEn) && textRef(item.caption, 300, true);
const imageRef = image;
const media = value => fieldsRef(value, ['mode','items','brand']) && ['single','slideshow','stack'].includes(value.mode) && Array.isArray(value.items) && value.items.length <= 30 && value.items.every(imageRef) && optionalRef(value.brand, imageRef);
const mediaRef = media;

function dataset(name, data) {
  const ids = new Set();
  if (name === 'projectCards') {
    if (data.length > 100 || data.some(item => !fieldsRef(item, ['slug','name','description','media','featured','inDevelopment','hidden']) || !identifierRef(item.slug) || !uniqueRef(ids, item.slug) || !nonblankRef(item.name) || !stringRef(item.name, 200) || !textRef(item.description, 4000, true) || !mediaRef(item.media) || ['featured','inDevelopment','hidden'].some(key => !optionalBooleanRef(item, key)))) return 'Invalid projects or duplicate project paths.';
  } else if (name === 'projectContributions') {
    if (data.length > 100 || data.some(item => !fieldsRef(item, ['slug','title','summary','role','contributions','result','url','linkLabel','media']) || !identifierRef(item.slug) || !uniqueRef(ids, item.slug) || !titleRef(item.title, true) || !textRef(item.summary, 4000, true) || !textRef(item.role, 4000, true) || !linesRef(item.contributions, 50, 2000) || !optionalRef(item.result, value => textRef(value, 4000, true)) || !safeDocumentUrlRef(item.url) || !optionalRef(item.linkLabel, value => textRef(value, 300, true)) || !optionalRef(item.media, mediaRef))) return 'Invalid project details.';
  } else if (name === 'articles') {
    if (data.length > 200 || data.some(item => !fieldsRef(item, ['slug','language','title','summary','content','date','contentIsPlainText','hidden','labels','imageUrl','useOriginalContent']) || !identifierRef(item.slug) || !['ar','en'].includes(item.language) || !uniqueRef(ids, `${item.slug}:${item.language}`) || !stringRef(item.title, 200) || !item.hidden && !nonblankRef(item.title) || !stringRef(item.summary, 4000) || !stringRef(item.content, 40000) || !stringRef(item.date, 100) || item.contentIsPlainText !== true || !optionalBooleanRef(item, 'hidden') || !optionalBooleanRef(item, 'useOriginalContent') || !optionalRef(item.labels, value => stringsRef(value, 20, 100)) || !safeDocumentUrlRef(item.imageUrl))) return 'Invalid article content or duplicate article path/language.';
  } else return 'Unknown dataset.';
  return null;
}

function content(data) {
  for (const [name, value] of Object.entries(data)) {
    if (name === 'ar' || name === 'en') {
      if (!objectRef(value) || Object.keys(value).length > 2000 || Object.entries(value).some(([key, item]) => key.length > 120 || forbiddenRef.includes(key) || !stringRef(item, 20000))) return 'Invalid bilingual copy.';
    } else if (name === 'assets') {
      if (!objectRef(value) || Object.keys(value).length > 30 || Object.entries(value).some(([key, item]) => !['heroImageUrl','brandLogoAr','brandLogoEn','cvUrl','linkedinUrl','instagramUrl','whatsappUrl'].includes(key) || typeof item !== 'string' || !safeDocumentUrlRef(item))) return 'Invalid image or asset URL.';
    } else if (name === 'overrides') {
      if (!objectRef(value) || Object.keys(value).length > 10000) return 'Invalid content overrides.';
      for (const [key, item] of Object.entries(value)) {
        const parts = key.split('.');
        if (parts.length < 2 || parts.length > 16 || !dataNamesRef.includes(parts[0]) || parts.some(part => !part.length || part.length > 120 || [...forbiddenRef,'length','id','slug','key','mode','type','descriptionKey'].includes(part)) || !['string','number','boolean'].includes(typeof item) || typeof item === 'number' && !Number.isFinite(item) || typeof item === 'string' && item.length > 40000) return 'Invalid content override.';
        if (typeof item === 'string' && (/url/i.test(parts.at(-1)) || ['src','srcEn'].includes(parts.at(-1))) && !safeDocumentUrlRef(item)) return 'Invalid content URL.';
      }
    } else if (name === 'datasets') {
      if (!objectRef(value)) return 'Invalid datasets.';
      for (const [key, items] of Object.entries(value)) {
        if (!Array.isArray(items)) return 'Dataset must be an array.';
        const error = datasetRef(key, items); if (error) return error;
      }
    } else return 'Unknown content field.';
  }
  return null;
}

export function validateSiteDocument(key, data, serializedJson = JSON.stringify(data)) {
  if (!objectRef(data) || typeof serializedJson !== 'string' || serializedJson.length > 1500000) return 'Document must be an object of at most 1.5 MB.';
  const pending = [[data, 1]];
  while (pending.length) {
    const [value, depth] = pending.pop(); if (depth > 24) return 'Invalid document structure.';
    for (const child of Object.values(value)) if (child !== null && typeof child === 'object') pending.push([child, depth + 1]);
  }
  return key === 'pricing' ? pricingRef(data) : key === 'pages' ? pagesRef(data) : key === 'content' ? contentRef(data) : 'Unknown document.';
}
// codeguard:components:end
