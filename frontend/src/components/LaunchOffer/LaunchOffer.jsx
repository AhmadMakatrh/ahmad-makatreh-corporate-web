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
  const offerId = offer?.id;
  const offerRef = useRef(offer);
  const reducedMotion = useMotionPref();
  const dialogRef = useRef(null);
  const discountRef = useRef(null);
  const discountCounterRef = useRef(null);
  const animationRef = useRef(null);
  const closingRef = useRef(false);
  const pendingCloseRef = useRef(null);
  const reducedMotionRef = useRef(reducedMotion);
  const [offerSeen, setOfferSeen] = useState(hasSeenOffer);
  const [dismissedOfferId, setDismissedOfferId] = useState(null);
  const sideDismissed = dismissedOfferId === offer?.id || (offer && wasOfferDismissed(offer.id));

  useLayoutEffect(() => {
    const previous = offerRef.current;
    offerRef.current = offer;
    if (previous?.id !== offer?.id && closingRef.current && currentTab === 'home') pendingCloseRef.current?.();
    if (!offer || previous?.id !== offer.id || previous.discount === offer.discount || !dialogRef.current?.open || closingRef.current) return;
    if (discountCounterRef.current) gsapRef.killTweensOf(discountCounterRef.current);
    discountRef.current.textContent = `${offer.discount}%`;
  }, [offer, currentTab]);

  useLayoutEffect(() => {
    reducedMotionRef.current = reducedMotion;
    if (reducedMotion && !closingRef.current) animationRef.current?.progress(1);
  }, [reducedMotion]);

  useLayoutEffect(() => {
    const currentOffer = offerRef.current;
    if (currentTab !== 'home') { pendingCloseRef.current = null; closingRef.current = false; return; }
    if (!ready || !loaded || !currentOffer || hasSeenOffer()) return;
    const dialog = dialogRef.current;
    const discount = discountRef.current;
    const closeButton = dialog.querySelector('.portfolio-launch-offer-close');
    closingRef.current = false;
    discount.textContent = reducedMotionRef.current ? `${currentOffer.discount}%` : `${Math.min(5, currentOffer.discount)}%`;
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
      const counter = { value: Math.min(5, currentOffer.discount) };
      discountCounterRef.current = counter;
      animationRef.current = gsapRef.timeline()
        .fromTo('.portfolio-launch-offer-backdrop', { opacity: 0 }, { opacity: 1, duration: .55, ease: 'power2.out' }, 0)
        .fromTo('.portfolio-launch-offer-panel', { opacity: 0, y: 28, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .75, ease: 'power3.out', clearProps: 'transform' }, 0)
        .fromTo(closeButton, { x: startOffset, y: startOffset }, { x: 0, y: 0, duration: .75, ease: 'power3.out' }, 0)
        .fromTo('[data-offer-reveal]', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .45, stagger: .075, ease: 'power2.out', clearProps: 'transform,opacity' }, .16)
        .to(counter, { value: currentOffer.discount, duration: 1.65, ease: 'power2.out', onUpdate: () => { discount.textContent = `${Math.round(counter.value)}%`; }, onComplete: () => { discount.textContent = `${currentOffer.discount}%`; } }, .32);
    }, dialog);
    return () => {
      animationRef.current?.kill();
      discountCounterRef.current = null;
      context.revert();
      dialog.close();
    };
  }, [currentTab, ready, loaded, offerId]);

  const close = (afterClose) => {
    const dialog = dialogRef.current;
    if (!dialog.open || closingRef.current) return;
    closingRef.current = true;
    animationRef.current?.kill();
    const finish = () => {
      dialog.close();
      closingRef.current = false;
      pendingCloseRef.current = null;
      markOfferSeen();
      setOfferSeen(true);
      afterClose?.();
    };
    const finishRef = finish;
    pendingCloseRef.current = finishRef;
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
      <div className="portfolio-offer-teaser" role="complementary" dir={language === 'ar' ? 'rtl' : 'ltr'} aria-label={offer.title[language]}>
        <button type="button" className="portfolio-offer-teaser-close" onClick={dismissSideRef} aria-label={tRef('close')}><XRef size={16} aria-hidden="true" /></button>
        <SiteLink tab="services" className="portfolio-offer-teaser-link" aria-label={`${tRef('launchOfferAction')} — ${offer.discount}%`} title={`${offer.title[language]} — ${tRef('launchOfferTitle')} ${offer.discount}%`}>
          <span className="portfolio-offer-teaser-value" dir="ltr" aria-hidden="true"><span>%</span><strong>{offer.discount}</strong></span>
          <span className="portfolio-offer-teaser-action" aria-hidden="true">{tRef('launchOfferBadgeAction')}<span>↗</span></span>
        </SiteLink>
      </div>
    )}
    </>
  );
}
// codeguard:components:end
