// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: Footer
import { Pause as PauseRef, Play as PlayRef } from 'lucide-react';
import { useLanguage as useLang } from '../../hooks/useLanguage';
import { useMotion as useMotionRef } from '../../hooks/useReducedMotion';
import { PortfolioLink as SiteLink } from '../ui/PortfolioLink';
import { PortfolioArtwork as SiteArtwork } from '../Background/PortfolioArtwork';
import brandLogo from '../../assets/AhmadMakatrh Light logo.png';
import englishBrandLogo from '../../assets/AhmadMakatreh Latin Ivory logo.png';
import { usePublishedSite as useSite } from '../../providers/publishedSiteContext';
import { COOKIE_SETTINGS_EVENT as settingsEvent } from '../../utils/sitePreferences';

export function Footer() {
  const { language, t: tRef } = useLang();
  const { snapshot } = useSite();
  const assets = snapshot.content?.assets ?? {};
  const pages = (snapshot.pages?.pages ?? []).filter(page => page.visible && page.showInNav);
  const { motionPaused, toggleMotion, systemReducedMotion } = useMotionRef();
  const isAr = language === 'ar';
  const links = [['services', 'servicesNav'], ['work', 'workNav'], ['about', 'aboutNav'], ['journal', 'journal']];
  const linksRef = links;
  return (
    <footer className="portfolio-footer">
      <SiteArtwork />
      <div className="portfolio-footer-main">
        <div className="portfolio-footer-brand">
          <SiteLink className="portfolio-brand" aria-label={tRef('home')}>
            <img className="portfolio-brand-logo" src={isAr ? assets.brandLogoAr || brandLogo : assets.brandLogoEn || englishBrandLogo} alt={tRef('brandName')} width="1536" height="1024" />
          </SiteLink>
          <p>{tRef('cmsFooterDescription')}</p>
        </div>
        <nav className="portfolio-footer-nav" aria-label={tRef('cmsFooterExplore')}>
          <h2>{tRef('cmsFooterExplore')}</h2>
          {linksRef.map(([tab, key]) => <SiteLink key={tab} tab={tab}>{tRef(key)}</SiteLink>)}
          {pages.map(page => <SiteLink key={page.slug} tab="page" slug={page.slug}>{page.title[language]}</SiteLink>)}
        </nav>
        <div className="portfolio-footer-connect">
          <h2>{tRef('cmsFooterConnect')}</h2>
          <SiteLink tab="booking" className="portfolio-footer-contact">
            {tRef('cmsFooterContact')}
          </SiteLink>
          <div className="portfolio-footer-socials" dir="ltr">
            <a href={assets.linkedinUrl || 'https://linkedin.com/in/ahmadmakhatrh'} target="_blank" rel="noopener noreferrer">
              {/* LinkedIn mark path from Font Awesome, CC BY 4.0: https://fontawesome.com/icons/linkedin-in */}
              <svg width="14" height="14" viewBox="0 0 448 448" fill="currentColor" aria-hidden="true"><path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 84 0 54.3 0 24.6 24.09.5 53.79.5s53.8 24.1 53.8 53.8-24.09 53.8-53.8 53.8zM447.9 448h-92.7V302.4c0-34.7-.7-79.3-48.3-79.3-48.4 0-55.8 37.8-55.8 76.8V448h-92.8V148.9h89.1v40.8h1.3c12.4-23.5 42.7-48.3 87.9-48.3 94 0 111.4 61.9 111.4 142.3V448z" /></svg>
              LinkedIn
            </a>
            <a href={assets.instagramUrl || 'https://www.instagram.com/ahmad.albarishi/'} target="_blank" rel="noopener noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5" /><circle cx="12" cy="12" r="4.25" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
              Instagram
            </a>
            <a href={assets.whatsappUrl || 'https://wa.me/962776360251'} target="_blank" rel="noopener noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.4 11.8a8.8 8.8 0 0 1-13 7.7L3 20.5l1.1-4.6a8.8 8.8 0 1 1 16.3-4.1Z" /><path d="M8.4 8.1c.2-.4.4-.5.7-.5h.5c.2 0 .4.1.5.4l.8 1.8c.1.2.1.4-.1.6l-.6.7c-.2.2-.2.4 0 .6.5.9 1.2 1.6 2.1 2.1.2.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.8.8c.2.1.4.3.4.5 0 .3-.1.8-.4 1.1-.4.4-1 .7-1.5.7-.4 0-1.1-.1-2.2-.6-1.3-.6-2.4-1.6-3.3-2.7-.8-1-1.3-2.1-1.4-2.9-.1-.7.2-1.3.8-1.6Z" /></svg>
              WhatsApp
            </a>
          </div>
        </div>
      </div>
      <div className="portfolio-footer-bottom">
        <span>© {new Date().getFullYear()} · {tRef('cmsFooterWebsiteDevelopedBy')} {tRef('brandName')}</span>
        <button type="button" className="portfolio-cookie-settings" onClick={() => window.dispatchEvent(new Event(settingsEvent))}>{tRef('cookieNoticeManage')}</button>
        {systemReducedMotion ? (
          <span className="portfolio-motion-status"><PauseRef size={15} aria-hidden="true" />{tRef('cmsFooterReducedMotion')}</span>
        ) : (
          <button type="button" className="portfolio-motion-toggle" onClick={toggleMotion} aria-pressed={motionPaused}>
            {motionPaused ? <PlayRef size={15} aria-hidden="true" /> : <PauseRef size={15} aria-hidden="true" />}
            {motionPaused ? (tRef('cmsFooterResumeMotion')) : (tRef('cmsFooterPauseMotion'))}
          </button>
        )}
      </div>
    </footer>
  );
}
// codeguard:components:end
