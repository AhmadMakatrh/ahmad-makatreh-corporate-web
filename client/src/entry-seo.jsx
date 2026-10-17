// The file was created by Ahmed Al-Makhatreh.
// codeguard:components:start
// codeguard:defines: seoPages, renderPage
import { createElement as createElementRef } from 'react';
import { renderToStaticMarkup as renderMarkup } from 'react-dom/server';
import App from './App.jsx';
import { ar as arabicCopy } from './i18n/ar.js';
import { en as englishCopy } from './i18n/en.js';
import { siteCopy as sharedCopy } from './data/siteCopy.js';
import { projectCards as cards } from './data/projectCards.js';
import { projectContributions as contributions } from './data/projectContributions.js';
import { caseStudies as studies } from './data/caseStudies/index.js';
import { fallbackArticles as articles } from './data/fallbackArticles.js';
import { localizedPath as languagePath, pageMetadata as makeMetadata, renderSeoHead as renderHead, siteOrigin as origin } from './utils/seo.js';
import { selectSiteData as readSiteData } from './providers/publishedSiteContext.js';
import { validateSiteDocument as validateDocument } from '../../server/cloudflare/src/siteDocumentValidator.js';

export function seoPages(snapshot = {}) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) throw new Error('SEO snapshot must be a public /api/site object.');
  for (const [key, document] of Object.entries(snapshot)) {
    const error = validateDocument(key, document);
    if (error) throw new Error(`Invalid SEO snapshot (${key}): ${error}`);
  }
  const projectCards = readSiteData('projectCards', cards, snapshot.content);
  const projectContributions = readSiteData('projectContributions', contributions, snapshot.content);
  const caseStudies = readSiteData('caseStudies', studies, snapshot.content);
  const siteArticles = readSiteData('articles', articles, snapshot.content);
  return ['en', 'ar'].flatMap(language => {
    const copy = { ...sharedCopy[language], ...(language === 'ar' ? arabicCopy : englishCopy), ...snapshot.content?.[language] };
    const name = copy.brandName;
    const pages = [
      { path: '/', title: `${name} — ${copy.brandTagline}`, description: copy.heroDescription },
      { path: '/about', title: copy.aboutMetaTitle, description: copy.aboutMetaDesc },
      { path: '/services', title: copy.servicesMetaTitle, description: copy.servicesMetaDesc },
      { path: '/capabilities', title: copy.capabilitiesMetaTitle, description: copy.capabilitiesMetaDesc },
      { path: '/work', title: copy.cmsWorkPageWorkAhmadMakatreh, description: copy.cmsWorkPageSoftwareProjectsAndContributionsTo, items: projectCards },
      { path: '/journal', title: `${copy.journalTitle} — ${name}`, description: copy.journalSubtitle },
      { path: '/booking', title: `${copy.bookSessionHeading} — ${name}`, description: copy.bookingIntro },
      { path: '/start-project', title: `${language === 'ar' ? 'تواصل معي' : 'Get in Touch'} — ${name}`, description: language === 'ar' ? 'أرسل نبذة عن فرصة العمل أو المشروع لنتحدث عن طريقة التعاون.' : 'Share a brief description of the role or project to discuss working together.' },
      ...projectContributions.map(project => ({ path: `/work/${project.slug}`, title: `${project.title[language]} — ${name}`, description: project.summary[language], project })),
      ...caseStudies.filter(project => !projectContributions.some(item => item.slug === project.slug)).map(project => ({ path: `/work/${project.slug}`, title: `${project.title[language]} — ${language === 'ar' ? 'قيد التطوير | أحمد المخاترة' : 'In Development | Ahmad Makatreh'}`, description: project.subtitle[language], project })),
      ...siteArticles.filter(article => article.language === language).map(article => ({ path: `/journal/${article.slug}`, title: `${article.title} — ${name}`, description: article.summary, article, image: article.imageUrl, alternateLanguages: [...new Set(siteArticles.filter(item => item.slug === article.slug).map(item => item.language))] })),
      ...(snapshot.pages?.pages ?? []).filter(page => page.visible).map(page => ({ path: `/${page.slug}`, title: page.title[language], description: page.description[language] })),
    ];
    return pages.map(page => ({ ...page, language, pathname: languagePath(page.path, language) }));
  });
}

export function renderPage(page, snapshot = {}) {
  const html = renderMarkup(createElementRef(App, { initialPath: page.pathname, initialLanguage: page.language, initialSnapshot: snapshot }));
  return { html, head: renderHead(makeMetadata(page)) };
}

export { origin };
// codeguard:components:end
