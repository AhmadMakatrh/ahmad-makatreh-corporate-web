// codeguard:components:start
// codeguard:defines: ContentPageView, ContentPage
import { useEffect } from 'react';
import { usePublishedSite as useSite } from '../providers/publishedSiteContext';
import { useLanguage as useLang } from '../hooks/useLanguage';
import { updatePageMeta as setPageMeta, localizedPath as languagePath, siteOrigin as publicOrigin } from '../utils/seo';
import { PortfolioLink as SiteLink } from '../components/ui/PortfolioLink';
const paragraphsRef = paragraphs;
const ContentPageViewRef = ContentPageView;
const contentLinkRef = contentLink;


const text = (value, language) => value?.[language] ?? '';
const textRef = text;
function paragraphs(value) { return String(value ?? '').split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>); }

function contentLink(value, language) {
  let url;
  try { url = new URL(value, publicOrigin); }
  catch { return value; }
  if (url.origin !== publicOrigin || !/^(?:\/|https:\/\/)/i.test(value)) return value;
  const path = languagePath(url.pathname, 'en');
  // Only site page routes have locale variants; downloads and service URLs retain their paths.
  if (/^\/(?:admin|api|assets|images)(?:\/|$)/.test(path)
    || !/^\/(?:[a-z][a-z0-9-]*\/?|(?:work|journal|start-project|startproject)\/[a-z][a-z0-9-]*\/?)?$/.test(path)) return value;
  const origin = value.startsWith('/') && !value.startsWith('//') ? '' : url.origin;
  return `${origin}${languagePath(path, language)}${url.search}${url.hash}`;
}

export function ContentPageView({ page, language = 'ar', preview = false }) {
  return <article className={`portfolio-cms-page portfolio-container ${preview ? 'cms-preview' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'} lang={language}>
    <header className="portfolio-cms-heading"><h1 className="font-display">{textRef(page.title, language)}</h1><p>{textRef(page.description, language)}</p></header>
    {page.sections.map(section => <section key={section.id} className={`portfolio-cms-section portfolio-cms-${section.type}`}>
      {section.type === 'hero' ? <><h2 className="font-display">{textRef(section.title, language)}</h2><div>{paragraphsRef(textRef(section.body, language))}</div>{section.imageUrl && <img src={section.imageUrl} alt={textRef(section.imageAlt, language)} />}</>
        : section.type === 'image' ? <><h2 className="font-display">{textRef(section.title, language)}</h2>{section.imageUrl && <img src={section.imageUrl} alt={textRef(section.imageAlt, language)} loading="lazy" />}<div>{paragraphsRef(textRef(section.body, language))}</div></>
        : section.type === 'cards' ? <><h2 className="font-display">{textRef(section.title, language)}</h2><div>{paragraphsRef(textRef(section.body, language))}</div><div className="portfolio-cms-cards">{(section.items ?? []).map((item, index) => <article key={index}>{item.imageUrl && <img src={item.imageUrl} alt={textRef(item.title, language)} loading="lazy" />}<h3 className="font-display">{textRef(item.title, language)}</h3><div>{paragraphsRef(textRef(item.body, language))}</div>{item.linkUrl && <a href={contentLinkRef(item.linkUrl, language)} target={preview ? '_blank' : undefined} rel={preview ? 'noopener noreferrer' : undefined}>{textRef(item.title, language)}</a>}</article>)}</div></>
        : <><h2 className="font-display">{textRef(section.title, language)}</h2><div>{paragraphsRef(textRef(section.body, language))}</div></>}
      {section.linkUrl && <a className="portfolio-button portfolio-button-primary" href={contentLinkRef(section.linkUrl, language)} target={preview ? '_blank' : undefined} rel={preview ? 'noopener noreferrer' : undefined}>{textRef(section.linkLabel, language) || textRef(section.title, language)}</a>}
    </section>)}
  </article>;
}

export function ContentPage({ slug }) {
  const { snapshot, loaded, error, refresh } = useSite();
  const { language } = useLang();
  const page = snapshot.pages?.pages?.find(item => item.slug === slug && item.visible);
  useEffect(() => {
    if (page) setPageMeta({ title: textRef(page.title, language), description: textRef(page.description, language), path: `/${page.slug}`, language });
    else if (loaded && !error) setPageMeta({ title: language === 'ar' ? 'الصفحة غير موجودة' : 'Page not found', description: '', path: `/${slug}`, language, noindex: true });
  }, [page, language, loaded, error, slug]);
  if (!loaded) return <p className="portfolio-cms-empty" role="status">{language === 'ar' ? 'جارٍ تحميل الصفحة…' : 'Loading page…'}</p>;
  if (error && !page) return <div className="portfolio-cms-empty" role="alert"><h1>{language === 'ar' ? 'تعذر تحميل الصفحة' : 'Unable to load this page'}</h1><p>{language === 'ar' ? 'تحقق من الاتصال وأعد المحاولة.' : 'Check your connection and try again.'}</p><button className="portfolio-button portfolio-button-primary" onClick={refresh}>{language === 'ar' ? 'إعادة المحاولة' : 'Try again'}</button></div>;
  if (!page) return <div className="portfolio-cms-empty"><h1>{language === 'ar' ? 'الصفحة غير موجودة' : 'Page not found'}</h1><SiteLink className="portfolio-button portfolio-button-primary">{language === 'ar' ? 'الرئيسية' : 'Home'}</SiteLink></div>;
  return <ContentPageViewRef page={page} language={language} />;
}
// codeguard:components:end
