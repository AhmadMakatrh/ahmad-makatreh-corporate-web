// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: ServicesPage
import React, { useEffect } from 'react';
import { useLanguage as useLang } from '../../hooks/useLanguage';
import { useNavigation as useNav } from '../../hooks/useNavigation';
import { updatePageMeta as setPageMeta } from '../../utils/seo';
import { useInitialSectionAnchor as useSectionAnchor } from '../../hooks/useInitialSectionAnchor';
import { defaultPricing as defaultPricingRef, effectivePackages as activePackages } from '../../data/serviceCatalog';
import { usePublishedSite as useSite } from '../../providers/publishedSiteContext';
import { localizedPath as languagePath } from '../../utils/seo';

const LEGACY_SERVICE_ANCHORS = [
  'backend-architecture',
  'web-engineering',
  'ai-integration',
];
const LEGACY_SERVICE_ANCHORSRef = LEGACY_SERVICE_ANCHORS;

export function ServicesPage() {
  const { t: tRef, language } = useLang();
  const { navigateTo: navigateToRef } = useNav();
  const { snapshot } = useSite();
  useSectionAnchor();

  useEffect(() => {
    const redirectLegacyAnchor = () => {
      const anchor = window.location.hash.slice(1);
      if (anchor === 'game-simulation') {
        navigateToRef('work', 'barari-game');
        return;
      }
      if (!LEGACY_SERVICE_ANCHORSRef.includes(anchor)) return;

      window.history.replaceState(window.history.state, '', `${languagePath('/capabilities', language)}#${anchor}`);
      navigateToRef('capabilities');
    };
    const redirectLegacyAnchorRef = redirectLegacyAnchor;

    redirectLegacyAnchorRef();
    window.addEventListener('hashchange', redirectLegacyAnchorRef);
    return () => window.removeEventListener('hashchange', redirectLegacyAnchorRef);
  }, [navigateToRef, language]);

  useEffect(() => {
    setPageMeta({
      title: tRef('servicesMetaTitle'),
      description: tRef('servicesMetaDesc'),
      path: '/services',
      language,
    });
  }, [language, tRef]);

  const packages = activePackages(snapshot.pricing ?? defaultPricingRef, language);

  return (
    <div className="portfolio-services-page pt-[clamp(5.5rem,10svh+1.5rem,8rem)] section-space-lg bg-[var(--portfolio-paper)] text-[var(--portfolio-ink)] min-h-screen">
      <div className="container mx-auto page-gutter">
        {/* Architectural Dossier Header */}
        <header className="border-b border-[var(--portfolio-line)] pb-[var(--content-gap-lg)] mb-[var(--section-space-md)]">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--portfolio-green)] animate-pulse"></span>
              <span className="font-mono text-xs text-[var(--portfolio-green)] tracking-widest uppercase font-semibold">
                {tRef('servicesPageTag')}
              </span>
            </div>
            <span className="font-mono text-xs text-[var(--portfolio-muted)] tracking-widest border border-[var(--portfolio-line)] px-3 py-1 rounded-full bg-[var(--portfolio-sage)]">
              {tRef('servicesPageTelemetry')}
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-[2.85rem] font-black uppercase text-start-logical leading-tight tracking-tight mb-5 text-[var(--portfolio-ink)]">
            {tRef('servicesPageTitle')}
          </h1>

          <div className="w-16 h-1 bg-[var(--portfolio-green)] mb-5"></div>

          <p className="text-[var(--portfolio-muted)] text-sm sm:text-base md:text-lg max-w-4xl text-start-logical font-light leading-relaxed">
            {tRef('servicesPageSubtitle')}
          </p>
        </header>

        <section id="pricing" aria-labelledby="pricing-title" className="mb-[var(--section-space-md)] scroll-mt-24">
          <div className="max-w-3xl mb-8 text-start-logical">
            <span className="inline-block text-xs font-bold text-[var(--portfolio-green)] mb-3">{tRef('pricingTag')}</span>
            <h2 id="pricing-title" className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-[var(--portfolio-ink)] leading-tight mb-3">
              {tRef('pricingTitle')}
            </h2>
            <p className="text-[var(--portfolio-muted)] text-sm sm:text-base leading-relaxed">{tRef('pricingIntro')}</p>
          </div>
          <p className="mb-5 rounded-xl border border-[var(--portfolio-line)] bg-[var(--portfolio-sage)] px-5 py-4 text-sm font-semibold leading-relaxed text-[var(--portfolio-green)] text-start-logical">{tRef('pricingIncluded')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {packages.map(({ key, price, discount, offerPrice, title, description, features }) => (
              <article key={key} className="flex flex-col rounded-2xl border border-[var(--portfolio-line)] bg-[#fffefa] p-6 text-start-logical transition-colors hover:border-[var(--portfolio-green)]">
                <h3 className="font-display text-xl font-black text-[var(--portfolio-ink)] mb-2">{title}</h3>
                <p className="text-sm text-[var(--portfolio-muted)] leading-relaxed min-h-12 mb-5">{description}</p>
                <div className="mb-5 border-t border-[var(--portfolio-line)] pt-4 min-h-[116px] flex items-center justify-center gap-3">
                  {price == null ? (
                    <div className="mx-auto">
                      <span className="block text-xs font-bold text-[var(--portfolio-copper)] mb-2">{tRef('pricingCustomTag')}</span>
                      <strong className="font-display text-2xl text-[var(--portfolio-green)]">{tRef('pricingCustomPrice')}</strong>
                    </div>
                  ) : (
                    <>
                      <div>
                        {discount != null && <><span className="block text-xs font-bold text-red-700 mb-1">{tRef('launchOfferDescription')}</span>
                        <span className="portfolio-discount-ribbon" role="img" aria-label={tRef('pricingDiscount').replace('{percent}', discount)}>
                          <strong aria-hidden="true" dir="ltr">{discount}%</strong>
                          <small aria-hidden="true">{language === 'ar' ? 'خصم' : 'OFF'}</small>
                        </span></>}
                        <span className="block text-xs text-[var(--portfolio-muted)]">{tRef('pricingStartsAt')}</span>
                        <div className="flex flex-wrap items-baseline gap-2" dir="ltr">
                          {discount != null && <del className="text-sm text-red-700">{price}</del>}
                          <strong className="font-display text-3xl text-[var(--portfolio-green)]">{offerPrice ?? price}</strong>
                          <span className="text-sm font-semibold text-[var(--portfolio-ink)]">{tRef('pricingCurrency')}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <ul className="space-y-2 text-sm leading-relaxed text-[var(--portfolio-ink)] mb-6">
                  {features.map((feature, index) => <li key={index} className="flex gap-2"><span aria-hidden="true" className="text-[var(--portfolio-copper)]">◆</span>{feature}</li>)}
                </ul>
                <button type="button" onClick={() => navigateToRef('start-project', key)} className="portfolio-action portfolio-button-primary mt-auto w-full rounded-lg bg-[var(--portfolio-green)] px-4 py-3 text-sm font-bold text-[var(--portfolio-paper)] transition-colors hover:bg-[#0b362b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--portfolio-green)]">
                  {tRef('pricingAction')}
                </button>
              </article>
            ))}
          </div>
          <p className="mt-5 max-w-4xl text-sm leading-relaxed text-[var(--portfolio-muted)] text-start-logical">{tRef('pricingNote')}</p>
          <div className="mt-6 flex justify-start">
            <button type="button" onClick={() => navigateToRef('capabilities')} className="portfolio-action portfolio-button-outline inline-flex items-center rounded-lg border border-[var(--portfolio-line)] px-5 py-3 text-sm font-bold text-[var(--portfolio-green)] transition-colors hover:bg-[var(--portfolio-sage)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--portfolio-green)]">
              {tRef('servicesAreasView')}
            </button>
          </div>
        </section>

        {/* Global Commercial Consultation Banner */}
        <section className="mt-[var(--section-space-md)] card-pad-lg rounded-2xl bg-[var(--portfolio-sage)] border border-[var(--portfolio-line)] text-center max-w-5xl mx-auto">
          <span className="font-mono text-xs text-[var(--portfolio-green)] uppercase tracking-widest block mb-3">
            {tRef('ctaTag')}
          </span>
          <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-black uppercase text-[var(--portfolio-ink)] mb-4 leading-tight">
            {tRef('pricingFooterTitle')}
          </h2>
          <p className="text-[var(--portfolio-muted)] text-xs sm:text-sm md:text-base font-light max-w-2xl mx-auto leading-relaxed mb-6">
            {tRef('pricingFooterDescription')}
          </p>
          <button
            onClick={() => navigateToRef('start-project')}
            className="portfolio-action portfolio-button-primary inline-flex items-center gap-3 bg-[var(--portfolio-green)] text-[var(--portfolio-paper)] font-display font-black text-xs sm:text-sm uppercase tracking-wider px-7 py-3.5 rounded-lg hover:bg-[#0b362b] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--portfolio-green)]"
          >
            <span>{tRef('pricingAction')}</span>
            <i className={`fa-solid ${language === 'ar' ? 'fa-arrow-left' : 'fa-arrow-right'} text-xs`}></i>
          </button>
        </section>
      </div>
    </div>
  );
}
// codeguard:components:end
