// The file was created by Ahmed Al-Makhatreh.
// codeguard:components:start
// codeguard:defines: siteOrigin, localizedPath, pageMetadata, renderSeoHead, updatePageMeta
export const siteOrigin = 'https://ahmad-makatreh.vip';
const siteOriginRef = siteOrigin;
const localizedPathRef = localizedPath;
const pageMetadataRef = pageMetadata;
const escapeHtmlRef = escapeHtml;
const normalizePathRef = normalizePath;

function normalizePath(path = '/') {
  const pathname = String(path).split(/[?#]/)[0].replace(/^\/page\/ar(?=\/|$)/, '').replace(/\/+$/, '');
  return pathname.startsWith('/') ? pathname || '/' : `/${pathname}`;
}

export function localizedPath(path, language = 'en') {
  const normalized = normalizePathRef(path);
  const clean = normalized.endsWith('/index') ? `${normalized}/` : normalized;
  return language === 'ar' ? `/page/ar${clean === '/' ? '/' : clean}` : clean;
}

export function pageMetadata({ title, description, path = '/', language = 'en', image, project, items, article, alternateLanguages = ['en', 'ar'], noindex = false }) {
  const lang = language === 'ar' ? 'ar' : 'en';
  const clean = normalizePathRef(path);
  const canonical = siteOriginRef + localizedPathRef(clean, lang);
  const personId = `${siteOriginRef}/#person`;
  const websiteId = `${siteOriginRef}/#website`;
  const name = lang === 'ar' ? 'أحمد المخاترة' : 'Ahmad Makatreh';
  const media = project?.media?.items?.[0] ?? project?.screenshots?.[0];
  const imagePath = image || (lang === 'en' && media?.srcEn) || media?.src || '/images/castle-hill-pencil-sketch.png';
  const imageUrl = new URL(imagePath, siteOriginRef).href;
  const page = {
    '@type': clean === '/about' ? 'ProfilePage' : items ? 'CollectionPage' : 'WebPage',
    '@id': `${canonical}#webpage`, url: canonical, name: title, description,
    inLanguage: lang, isPartOf: { '@id': websiteId }, about: { '@id': personId },
    primaryImageOfPage: { '@type': 'ImageObject', url: imageUrl },
  };
  const graph = [
    { '@type': 'Person', '@id': personId, name, alternateName: lang === 'ar' ? 'Ahmad Makatreh' : 'أحمد المخاترة', jobTitle: 'Software Engineer', url: `${siteOriginRef}/about`, address: { '@type': 'PostalAddress', addressLocality: 'Al Karak', addressCountry: 'JO' }, sameAs: ['https://github.com/AhmadMakatrh', 'https://linkedin.com/in/ahmadmakhatrh'] },
    { '@type': 'WebSite', '@id': websiteId, url: `${siteOriginRef}/`, name: 'Ahmad Makatreh — أحمد المخاترة', inLanguage: ['en', 'ar'], publisher: { '@id': personId } },
    page,
  ];
  if (clean === '/about') page.mainEntity = { '@id': personId };
  if (project) {
    const entity = { '@type': 'CreativeWork', '@id': `${canonical}#project`, name: project.title?.[lang], description: [project.summary?.[lang] || project.subtitle?.[lang], project.role?.[lang] || project.confirmedRole?.[lang]].filter(Boolean).join(' '), image: imageUrl, contributor: { '@id': personId }, mainEntityOfPage: { '@id': page['@id'] } };
    if (project.url) entity.sameAs = project.url;
    if (project.status?.[lang]) entity.creativeWorkStatus = project.status[lang];
    graph.push(entity);
    page.mainEntity = { '@id': entity['@id'] };
  }
  if (items) {
    const list = { '@type': 'ItemList', '@id': `${canonical}#projects`, itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.title?.[lang] || item.name, url: siteOriginRef + localizedPathRef(`/work/${item.slug}`, lang) })) };
    graph.push(list);
    page.mainEntity = { '@id': list['@id'] };
  }
  if (article) {
    const posting = { '@type': 'BlogPosting', '@id': `${canonical}#article`, headline: article.title, description: article.summary, inLanguage: article.language || lang, author: { '@id': personId }, mainEntityOfPage: { '@id': page['@id'] } };
    graph.push(posting);
    page.mainEntity = { '@id': posting['@id'] };
  }
  const crumbs = [{ '@type': 'ListItem', position: 1, name: lang === 'ar' ? 'الرئيسية' : 'Home', item: siteOriginRef + localizedPathRef('/', lang) }];
  if (clean.startsWith('/work/')) crumbs.push({ '@type': 'ListItem', position: 2, name: lang === 'ar' ? 'الأعمال' : 'Work', item: siteOriginRef + localizedPathRef('/work', lang) });
  if (clean.startsWith('/journal/')) crumbs.push({ '@type': 'ListItem', position: 2, name: lang === 'ar' ? 'المدونة' : 'Journal', item: siteOriginRef + localizedPathRef('/journal', lang) });
  if (clean !== '/') {
    crumbs.push({ '@type': 'ListItem', position: crumbs.length + 1, name: project?.title?.[lang] || article?.title || title, item: canonical });
    graph.push({ '@type': 'BreadcrumbList', '@id': `${canonical}#breadcrumbs`, itemListElement: crumbs });
    page.breadcrumb = { '@id': `${canonical}#breadcrumbs` };
  }
  return {
    title, description, canonical, language: lang,
    links: [{ rel: 'canonical', href: canonical }, ...[...alternateLanguages, 'x-default'].map(hreflang => ({ rel: 'alternate', hreflang, href: siteOriginRef + localizedPathRef(clean, hreflang === 'x-default' ? alternateLanguages.includes('en') ? 'en' : 'ar' : hreflang) }))],
    meta: [
      ['name', 'description', description], ['name', 'robots', noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'],
      ['property', 'og:type', article ? 'article' : 'website'], ['property', 'og:site_name', 'Ahmad Makatreh'],
      ['property', 'og:title', title], ['property', 'og:description', description], ['property', 'og:url', canonical],
      ['property', 'og:locale', lang === 'ar' ? 'ar_JO' : 'en_US'], ['property', 'og:image', imageUrl], ['property', 'og:image:alt', project?.title?.[lang] || title],
      ['name', 'twitter:card', 'summary_large_image'], ['name', 'twitter:title', title], ['name', 'twitter:description', description], ['name', 'twitter:image', imageUrl], ['name', 'twitter:image:alt', project?.title?.[lang] || title],
    ],
    structuredData: { '@context': 'https://schema.org', '@graph': graph },
  };
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

export function renderSeoHead(metadata) {
  return [`<title>${escapeHtmlRef(metadata.title)}</title>`,
    ...metadata.meta.map(([attribute, key, value]) => `<meta ${attribute}="${key}" content="${escapeHtmlRef(value)}" />`),
    ...metadata.links.map(link => `<link ${Object.entries(link).map(([key, value]) => `${key}="${escapeHtmlRef(value)}"`).join(' ')} />`),
    `<script id="page-structured-data" type="application/ld+json">${JSON.stringify(metadata.structuredData).replace(/</g, '\\u003c')}</script>`,
  ].join('\n');
}

export function updatePageMeta(options) {
  if (typeof document === 'undefined') return;
  const metadata = pageMetadataRef(options);
  document.title = metadata.title;
  for (const [attribute, key, value] of metadata.meta) {
    let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, key);
      document.head.appendChild(element);
    }
    element.setAttribute('content', value ?? '');
  }
  document.head.querySelectorAll('link[rel="canonical"], link[rel="alternate"][hreflang]').forEach(element => element.remove());
  for (const attributes of metadata.links) {
    const element = document.createElement('link');
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    document.head.appendChild(element);
  }
  let structuredData = document.getElementById('page-structured-data');
  if (!structuredData) {
    structuredData = document.createElement('script');
    structuredData.id = 'page-structured-data';
    structuredData.type = 'application/ld+json';
    document.head.appendChild(structuredData);
  }
  structuredData.textContent = JSON.stringify(metadata.structuredData).replace(/</g, '\\u003c');
}
// codeguard:components:end
