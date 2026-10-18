// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: LaunchOffer
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap as gsapRef } from 'gsap';
import { X as XRef } from 'lucide-react';
import { useLanguage as useLang } from '../../hooks/useLanguage';
import { useNavigation as useNav } from '../../hooks/useNavigation';
import { useReducedMotion as useMotionPref } from '../../hooks/useReducedMotion';
import { PortfolioLink as SiteLink } from '../ui/PortfolioLink';
import { PortfolioArtwork as SiteArtwork } from '../Background/PortfolioArtwork';
import { defaultPricing as defaultPricingRef, launchPromotion as launchPromotionRef } from '../../data/serviceCatalog';
import { usePublishedSite as useSite } from '../../providers/publishedSiteContext';
import { wasOfferSeen as hasSeenOffer, rememberOfferSeen as markOfferSeen, isOfferDismissed as wasOfferDismissed, dismissOffer as hideOffer } from '../../utils/sitePreferences';

export function LaunchOffer({ ready }) {
  const { t: tRef, language } = useLang();
  const { navigateTo: navigateToRef, currentTab } = useNav();
  const { snapshot, loaded, clock } = useSite();
  const offer = useMemo(() => launchPromotionRef(snapshot.pricing ?? defaultPricingRef, clock), [snapshot.pricing, clock]);
  const reducedMotion = useMotionPref();
  const dialogRef = useRef(null);
  const discountRef = useRef(null);
  const animationRef = useRef(null);
  const closingRef = useRef(false);
  const reducedMotionRef = useRef(reducedMotion);
  const [offerSeen, setOfferSeen] = useState(hasSeenOffer);
  const [dismissedOfferId, setDismissedOfferId] = useState(null);
  const sideDismissed = dismissedOfferId === offer?.id || (offer && wasOfferDismissed(offer.id));

  useLayoutEffect(() => {
    reducedMotionRef.current = reducedMotion;
    if (reducedMotion && !closingRef.current) animationRef.current?.progress(1);
  }, [reducedMotion]);

  useLayoutEffect(() => {
    if (currentTab !== 'home' || !ready || !loaded || !offer || hasSeenOffer()) return;
    const dialog = dialogRef.current;
    const discount = discountRef.current;
    const closeButton = dialog.querySelector('.portfolio-launch-offer-close');
    closingRef.current = false;
    discount.textContent = reducedMotionRef.current ? `${offer.discount}%` : `${Math.min(5, offer.discount)}%`;
    dialog.showModal();
    queueMicrotask(() => { if (dialog.open) markOfferSeen(); });
    const closeButtonRadius = closeButton.offsetWidth / 2;
    const corner = (parseFloat(getComputedStyle(closeButton).top) + closeButtonRadius) * 3;
    const startOffset = corner / 6 + (closeButtonRadius + 2) / Math.SQRT2;
    const context = gsapRef.context(() => {
      if (reducedMotionRef.current) {
        gsapRef.set(closeButton, { x: 0, y: 0 });
        return;
      }
      const counter = { value: Math.min(5, offer.discount) };
      animationRef.current = gsapRef.timeline()
        .fromTo('.portfolio-launch-offer-backdrop', { opacity: 0 }, { opacity: 1, duration: .55, ease: 'power2.out' }, 0)
        .fromTo('.portfolio-launch-offer-panel', { opacity: 0, y: 28, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .75, ease: 'power3.out', clearProps: 'transform' }, 0)
        .fromTo(closeButton, { x: startOffset, y: startOffset }, { x: 0, y: 0, duration: .75, ease: 'power3.out' }, 0)
        .fromTo('[data-offer-reveal]', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .45, stagger: .075, ease: 'power2.out', clearProps: 'transform,opacity' }, .16)
        .to(counter, { value: offer.discount, duration: 1.65, ease: 'power2.out', onUpdate: () => { discount.textContent = `${Math.round(counter.value)}%`; }, onComplete: () => { discount.textContent = `${offer.discount}%`; } }, .32);
    }, dialog);
    return () => {
      animationRef.current?.kill();
      context.revert();
      dialog.close();
    };
  }, [currentTab, ready, loaded, offer]);

  const close = (afterClose) => {
    const dialog = dialogRef.current;
    if (!dialog.open || closingRef.current) return;
    closingRef.current = true;
    animationRef.current?.kill();
    const finish = () => {
      dialog.close();
      closingRef.current = false;
      markOfferSeen();
      setOfferSeen(true);
      afterClose?.();
    };
    const finishRef = finish;
    if (reducedMotionRef.current) {
      finishRef();
      return;
    }
    animationRef.current = gsapRef.timeline({ onComplete: finishRef })
      .to(dialog.querySelector('.portfolio-launch-offer-panel'), { opacity: 0, y: 16, scale: .985, duration: .28, ease: 'power2.in' }, 0)
      .to(dialog.querySelector('.portfolio-launch-offer-backdrop'), { opacity: 0, duration: .3, ease: 'power2.inOut' }, 0);
  };
  const closeRef = close;

  const viewPricing = (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      closeRef();
      return;
    }
    event.preventDefault();
    closeRef(() => navigateToRef('services'));
  };
  const viewPricingRef = viewPricing;

  const dismissSide = () => {
    hideOffer(offer.id);
    setDismissedOfferId(offer.id);
  };
  const dismissSideRef = dismissSide;

  if (!offer) return null;
  return (
    <>
    <dialog ref={dialogRef} className="portfolio-launch-offer" aria-labelledby="launch-offer-title" aria-describedby="launch-offer-description" dir={language === 'ar' ? 'rtl' : 'ltr'} onCancel={(event) => { event.preventDefault(); closeRef(); }}>
      <div className="portfolio-launch-offer-backdrop" aria-hidden="true" />
      <div className="portfolio-launch-offer-panel">
        <button type="button" className="portfolio-launch-offer-close" onClick={() => closeRef()} aria-label={tRef('close')}>
          <XRef size={20} strokeWidth={1.6} aria-hidden="true" />
        </button>
        <div className="portfolio-launch-offer-surface">
          <div className="portfolio-launch-offer-inner">
            <SiteArtwork />
            <p className="portfolio-launch-offer-tag" data-offer-reveal>{offer.title[language]}</p>
            <span className="portfolio-launch-offer-accent" aria-hidden="true" data-offer-reveal />
            <h2 id="launch-offer-title" data-offer-reveal>{tRef('launchOfferTitle')}<strong dir="ltr" aria-label={`${offer.discount}%`}><span ref={discountRef} aria-hidden="true">{Math.min(5, offer.discount)}%</span></strong></h2>
            <p id="launch-offer-description" data-offer-reveal>{offer.description[language]}</p>
            <SiteLink tab="services" className="portfolio-button portfolio-button-primary" onClick={viewPricingRef} data-offer-reveal>
              {tRef('launchOfferAction')}
            </SiteLink>
          </div>
        </div>
      </div>
    </dialog>
    {ready && loaded && !sideDismissed && (offerSeen || hasSeenOffer() || currentTab !== 'home') && (
      <aside className="portfolio-offer-teaser" dir={language === 'ar' ? 'rtl' : 'ltr'} aria-label={offer.title[language]}>
        <button type="button" className="portfolio-offer-teaser-close" onClick={dismissSideRef} aria-label={tRef('close')}><XRef size={16} aria-hidden="true" /></button>
        <p className="portfolio-offer-teaser-tag">{offer.title[language]}</p>
        <p className="portfolio-offer-teaser-discount">{tRef('launchOfferTitle')}<strong dir="ltr">{offer.discount}%</strong></p>
        <SiteLink tab="services" className="portfolio-offer-teaser-link">{tRef('launchOfferAction')}</SiteLink>
      </aside>
    )}
    </>
  );
}
// codeguard:components:end
