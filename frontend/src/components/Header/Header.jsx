// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: Header
import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap as gsapRef } from 'gsap';
import { Menu as MenuRef } from 'lucide-react';
import { useLanguage as useLang } from '../../hooks/useLanguage';
import { useNavigation as useNav } from '../../hooks/useNavigation';
import { useReducedMotion as useMotionPref } from '../../hooks/useReducedMotion';
import { MobileNav as NavDrawer } from './MobileNav';
import { PortfolioLink as SiteLink } from '../ui/PortfolioLink';
import { PortfolioArtwork as SiteArtwork } from '../Background/PortfolioArtwork';
import brandLogo from '../../assets/AhmadMakatrh Light logo.png';
import englishBrandLogo from '../../assets/AhmadMakatreh Latin Ivory logo.png';
import { usePublishedSite as useSite } from '../../providers/publishedSiteContext';
import { localizedPath as languagePath } from '../../utils/seo';

export function Header() {
  const { t: tRef, language, toggleLanguage } = useLang();
  const { currentTab, currentSlug } = useNav();
  const { snapshot } = useSite();
  const pages = (snapshot.pages?.pages ?? []).filter(page => page.visible && page.showInNav);
  const assets = snapshot.content?.assets ?? {};
  const reducedMotion = useMotionPref();
  const headerRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMobileMenuOpen(false), [setMobileMenuOpen]);
  const closeMenuRef = closeMenu;
  const links = [['home', 'home'], ['services', 'servicesNav'], ['work', 'workNav'], ['about', 'aboutNav'], ['journal', 'journal']];
  const linksRef = links;

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    gsapRef.killTweensOf(header);
    if (reducedMotion) {
      gsapRef.set(header, { clearProps: 'transform' });
      return;
    }

    gsapRef.set(header, { yPercent: 0 });
    let previousY = Math.max(0, window.scrollY);
    let direction = 0;
    let distance = 0;
    let hidden = false;

    const reveal = (immediate = false) => {
      if (!hidden && !immediate) return;
      hidden = false;
      if (immediate) {
        gsapRef.killTweensOf(header);
        gsapRef.set(header, { yPercent: 0 });
      } else {
        gsapRef.to(header, { yPercent: 0, duration: 0.42, ease: 'power3.out', overwrite: true });
      }
    };
    const revealRef = reveal;

    const handleScroll = () => {
      const currentY = Math.max(0, window.scrollY);
      const delta = currentY - previousY;
      previousY = currentY;

      if (currentY < 120 || mobileMenuOpen || (header.contains(document.activeElement) && document.activeElement.matches(':focus-visible'))) {
        distance = 0;
        revealRef();
        return;
      }

      const nextDirection = Math.sign(delta);
      if (!nextDirection) return;
      distance = nextDirection === direction ? distance + Math.abs(delta) : Math.abs(delta);
      direction = nextDirection;
      if (distance < 12) return;
      distance = 0;

      if (nextDirection > 0 && !hidden) {
        hidden = true;
        gsapRef.to(header, { yPercent: -110, duration: 0.32, ease: 'power2.inOut', overwrite: true });
      } else if (nextDirection < 0) {
        revealRef();
      }
    };
    const handleScrollRef = handleScroll;

    const handleFocus = () => revealRef(true);
    const handleFocusRef = handleFocus;
    window.addEventListener('scroll', handleScrollRef, { passive: true });
    header.addEventListener('focusin', handleFocusRef);

    return () => {
      window.removeEventListener('scroll', handleScrollRef);
      header.removeEventListener('focusin', handleFocusRef);
      gsapRef.killTweensOf(header);
    };
  }, [currentTab, mobileMenuOpen, reducedMotion]);

  return (
    <>
      <header ref={headerRef} className="portfolio-header">
        <SiteArtwork />
        <div className="portfolio-header-inner">
          <SiteLink className="portfolio-brand" aria-label={tRef('home')}>
            <img className="portfolio-brand-logo" src={language === 'en' ? assets.brandLogoEn || englishBrandLogo : assets.brandLogoAr || brandLogo} alt={tRef('brandName')} width="1536" height="1024" />
          </SiteLink>
          <nav className={`portfolio-desktop-nav${pages.length ? ' has-cms-pages' : ''}`} aria-label={language === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'}>
            {linksRef.map(([tab, key]) => (
              <SiteLink key={tab} tab={tab} aria-current={currentTab === tab ? 'page' : undefined}>
                <span className="portfolio-nav-label">{tRef(key)}</span>
              </SiteLink>
            ))}
            {pages.map(page => <SiteLink key={page.slug} tab="page" slug={page.slug} aria-current={currentTab === 'page' && currentSlug === page.slug ? 'page' : undefined}><span className="portfolio-nav-label">{page.title[language]}</span></SiteLink>)}
          </nav>
          <div className="portfolio-header-actions">
            <a className="portfolio-language" href={languagePath(currentTab === 'home' ? '/' : currentTab === 'page' ? `/${currentSlug}` : `/${currentTab}${currentSlug ? `/${currentSlug}` : ''}`, language === 'ar' ? 'en' : 'ar')} hrefLang={language === 'ar' ? 'en' : 'ar'} onClick={(event) => {
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              toggleLanguage();
            }} aria-label={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}>{language === 'ar' ? 'EN' : 'ع'}</a>
            <button className="portfolio-menu-toggle" onClick={() => setMobileMenuOpen(true)} aria-label={tRef('menu')} aria-expanded={mobileMenuOpen} aria-haspopup="dialog">
              <MenuRef size={23} strokeWidth={1.6} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>
      <NavDrawer isOpen={mobileMenuOpen} onClose={closeMenuRef} />
    </>
  );
}
// codeguard:components:end
