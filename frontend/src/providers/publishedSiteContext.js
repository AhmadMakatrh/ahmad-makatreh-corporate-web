// codeguard:components:start
// codeguard:defines: PublishedSiteContext, usePublishedSite, selectSiteData, applyDataOverrides
import { createContext as createContextRef, useContext } from 'react';
const applyDataOverridesRef = applyDataOverrides;


export const PublishedSiteContext = createContextRef({ snapshot: {}, loaded: false, clock: 0, error: null });
const PublishedSiteContextRef = PublishedSiteContext;
export const usePublishedSite = () => useContext(PublishedSiteContextRef);

export function selectSiteData(name, fallback, content = {}) {
  const managed = content.datasets?.[name];
  let data = Array.isArray(managed) ? managed : applyDataOverridesRef(name, fallback, content.overrides);
  if (name === 'articles' && !managed && content.overrides) {
    data = data.map((article, index) => Object.hasOwn(content.overrides, `articles.${index}.content`) ? { ...article, contentIsPlainText: true } : article);
  }
  if (name === 'articles' && managed) {
    const originals = new Map(fallback.map(article => [`${article.slug}:${article.language}`, article]));
    data = data.map(article => {
      const original = originals.get(`${article.slug}:${article.language}`);
      return article.useOriginalContent && original ? { ...article, content: original.content, contentIsPlainText: false } : article;
    });
  }
  if (name === 'projectContributions' || name === 'caseStudies') {
    const cards = content.datasets?.projectCards;
    if (Array.isArray(cards)) {
      const visible = new Set(cards.filter(card => !card.hidden).map(card => card.slug));
      data = data.filter(record => visible.has(record.slug));
    }
  }
  return data.filter(record => !record.hidden);
}

export function applyDataOverrides(name, fallback, overrides = {}) {
  const entries = Object.entries(overrides).filter(([path]) => path.startsWith(`${name}.`));
  if (!entries.length) return fallback;
  const copy = structuredClone(fallback);
  for (const [path, value] of entries) {
    const parts = path.split('.').slice(1);
    if (parts.some(part => ['__proto__', 'constructor', 'prototype', 'length', 'id', 'slug', 'key', 'mode', 'type', 'descriptionKey'].includes(part))) continue;
    let target = copy;
    for (const part of parts.slice(0, -1)) target = target && Object.hasOwn(target, part) ? target[part] : null;
    const key = parts[parts.length - 1];
    if (target && Object.hasOwn(target, key) && ['string', 'number', 'boolean'].includes(typeof value)
      && (typeof target[key] === typeof value || (target[key] == null && typeof value === 'string'))) target[key] = value;
  }
  return copy;
}
// codeguard:components:end
