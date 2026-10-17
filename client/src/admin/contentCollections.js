// codeguard:components:start
// codeguard:defines: emptyLocalizedText, collectionData, replaceCollection, moveRecord, plainArticle
import { applyDataOverrides as mergeDataOverrides } from '../providers/publishedSiteContext.js';

export function emptyLocalizedText() { return { ar: '', en: '' }; }

export function collectionData(content, name, fallback) {
  if (content.datasets?.[name]) return content.datasets[name];
  const data = mergeDataOverrides(name, fallback, content.overrides);
  return name === 'articles' ? data.map((article, index) => Object.hasOwn(content.overrides ?? {}, `articles.${index}.content`) ? { ...article, contentIsPlainText: true } : article) : data;
}

export function replaceCollection(content, name, records) {
  const overrides = Object.fromEntries(Object.entries(content.overrides ?? {}).filter(([path]) => !path.startsWith(`${name}.`)));
  return { ...content, overrides, datasets: { ...content.datasets, [name]: records } };
}

export function moveRecord(records, index, delta) {
  const next = index + delta;
  if (next < 0 || next >= records.length) return records;
  const copy = [...records];
  [copy[index], copy[next]] = [copy[next], copy[index]];
  return copy;
}

export function plainArticle(value) {
  const html = String(value).replace(/<\/(p|h[1-6]|li)>/gi, '</$1>\n\n');
  return new DOMParser().parseFromString(html, 'text/html').body.textContent.trim();
}
// codeguard:components:end
