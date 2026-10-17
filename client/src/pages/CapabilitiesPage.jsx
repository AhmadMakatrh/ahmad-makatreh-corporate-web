// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: CapabilitiesPage
import { useLanguage as useLang } from '../hooks/useLanguage';
import { useNavigation as useNav } from '../hooks/useNavigation';
import { useInitialSectionAnchor as useSectionAnchor } from '../hooks/useInitialSectionAnchor';

export function CapabilitiesPage() {
  const { t: tRef, language } = useLang();
  const { navigateTo: navigateToRef } = useNav();
  useSectionAnchor();

  const services = [
    {
      num: tRef('srv1Num'),
      shortName: tRef('srv1Short'),
      name: tRef('srv1Name'),
      subtitle: tRef('srv1Subtitle'),
      fit: tRef('srv1Fit'),
      deliverables: [tRef('srv1Deliverable1'), tRef('srv1Deliverable2'), tRef('srv1Deliverable3')],
      startWith: tRef('srv1StartWith'),
      proofProject: tRef('srv1ProofProject'),
      proofNote: tRef('srv1ProofNote'),
      nextStep: tRef('srv1NextStep'),
      anchorId: 'backend-architecture',
    },
    {
      num: tRef('srv2Num'),
      shortName: tRef('srv2Short'),
      name: tRef('srv2Name'),
      subtitle: tRef('srv2Subtitle'),
      fit: tRef('srv2Fit'),
      deliverables: [tRef('srv2Deliverable1'), tRef('srv2Deliverable2'), tRef('srv2Deliverable3')],
      startWith: tRef('srv2StartWith'),
      proofProject: tRef('srv2ProofProject'),
      proofNote: tRef('srv2ProofNote'),
      nextStep: tRef('srv2NextStep'),
      anchorId: 'web-engineering',
    },
    {
      num: tRef('srv3Num'),
      shortName: tRef('srv3Short'),
      name: tRef('srv3Name'),
      subtitle: tRef('srv3Subtitle'),
      fit: tRef('srv3Fit'),
      deliverables: [tRef('srv3Deliverable1'), tRef('srv3Deliverable2'), tRef('srv3Deliverable3')],
      startWith: tRef('srv3StartWith'),
      proofProject: tRef('srv3ProofProject'),
      proofNote: tRef('srv3ProofNote'),
      nextStep: tRef('srv3NextStep'),
      anchorId: 'ai-integration',
    },
  ];

  return (
    <div className="portfolio-services-page pt-[clamp(5.5rem,10svh+1.5rem,8rem)] section-space-lg bg-[var(--portfolio-paper)] text-[var(--portfolio-ink)] min-h-screen">
      <div className="container mx-auto page-gutter">
        <header className="border-b border-[var(--portfolio-line)] pb-[var(--content-gap-lg)] mb-[var(--section-space-md)]">
          <span className="inline-block text-xs font-bold text-[var(--portfolio-green)] mb-3">{tRef('capabilitiesPageTag')}</span>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-[2.85rem] font-black text-start-logical leading-tight tracking-tight mb-5 text-[var(--portfolio-ink)]">
            {tRef('capabilitiesPageTitle')}
          </h1>
          <p className="text-[var(--portfolio-muted)] text-sm sm:text-base md:text-lg max-w-4xl text-start-logical font-light leading-relaxed">
            {tRef('capabilitiesPageSubtitle')}
          </p>
          <button type="button" onClick={() => navigateToRef('services')} className="portfolio-action portfolio-button-primary inline-flex items-center rounded-lg bg-[var(--portfolio-green)] px-5 py-3 mt-6 text-sm font-bold text-[var(--portfolio-paper)] transition-colors hover:bg-[#0b362b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--portfolio-green)]">
            {tRef('pricingView')}
          </button>
        </header>

        <nav aria-label={tRef('onThisPage')} className="portfolio-section-nav mb-[var(--section-space-md)] pt-6 border-t border-[var(--portfolio-line)]">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-display text-xs text-[var(--portfolio-muted)]">{tRef('onThisPage')}</span>
            <span className="h-px flex-1 bg-[var(--portfolio-line)]"></span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border border-[var(--portfolio-line)] bg-[#fffefa] rounded-xl overflow-hidden divide-y sm:divide-y-0">
            {services.map((service, index) => (
              <a key={service.anchorId} href={`#${service.anchorId}`} className={`px-5 py-4 text-start-logical transition-all duration-200 hover:bg-[var(--portfolio-sage)] group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--portfolio-green)] relative ${index === 1 ? 'sm:border-s sm:border-[var(--portfolio-line)]' : ''} ${index === 2 ? 'lg:border-s lg:border-[var(--portfolio-line)]' : ''}`}>
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-[var(--portfolio-green)] tracking-wider">[{service.num}]</span>
                  <i className={`fa-solid ${language === 'ar' ? 'fa-arrow-down-left' : 'fa-arrow-down-right'} text-[11px] text-[var(--portfolio-muted)] group-hover:text-[var(--portfolio-green)] group-hover:translate-y-0.5 transition-all`}></i>
                </div>
                <div className="font-display font-bold text-sm text-[var(--portfolio-ink)] group-hover:text-[var(--portfolio-green)] transition-colors leading-snug">{service.shortName}</div>
                <div className="text-xs leading-relaxed text-[var(--portfolio-muted)] mt-1 break-words">{service.fit}</div>
                <div className="absolute bottom-0 inset-x-0 h-[2px] bg-transparent group-hover:bg-[var(--portfolio-green)] transition-colors"></div>
              </a>
            ))}
          </div>
        </nav>

        <div className="space-y-14 md:space-y-20">
          {services.map((service) => (
            <section key={service.anchorId} id={service.anchorId} className="border border-[var(--portfolio-line)] bg-[#fffefa] rounded-2xl p-6 sm:p-8 md:p-10 scroll-mt-24 transition-all hover:border-[#9fb7a2]">
              <div className="pb-6 border-b border-[var(--portfolio-line)] mb-8">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-2xl sm:text-3xl md:text-4xl font-black text-[var(--portfolio-green)] select-none">{service.num}</span>
                    <span className="text-[var(--portfolio-muted)] font-mono text-xs">/ 03</span>
                  </div>
                  <span className="text-xs sm:text-sm text-[var(--portfolio-green)] bg-[var(--portfolio-sage)] border border-[var(--portfolio-line)] px-3.5 py-1.5 rounded-md inline-block">{service.fit}</span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-[1.85rem] font-black uppercase text-start-logical text-[var(--portfolio-ink)] leading-tight mb-2">{service.name}</h2>
                <p className="text-[var(--portfolio-muted)] text-xs sm:text-sm font-light text-start-logical leading-relaxed">{service.subtitle}</p>
              </div>

              <div className="portfolio-service-details grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
                <div className="lg:col-span-7 rounded-xl bg-[#f3f5ee] border border-[var(--portfolio-line)] p-5 sm:p-6">
                  <h3 className="font-display text-lg font-bold text-[var(--portfolio-green)] mb-4">{tRef('servicesDeliverablesLabel')}</h3>
                  <ul className="space-y-3">
                    {service.deliverables.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-[var(--portfolio-ink)]">
                        <span aria-hidden="true" className="text-[var(--portfolio-copper)]">◆</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-5 border-t border-[var(--portfolio-line)]">
                    <h4 className="text-sm font-bold text-[var(--portfolio-green)] mb-2">{tRef('servicesStartLabel')}</h4>
                    <p className="text-sm leading-relaxed text-[var(--portfolio-muted)]">{service.startWith}</p>
                  </div>
                </div>

                <div className="lg:col-span-5 rounded-xl border border-[var(--portfolio-line)] p-5 sm:p-6 flex flex-col text-start-logical">
                  <span className="text-xs font-bold text-[var(--portfolio-copper)] mb-3">{tRef('servicesProofLabel')}</span>
                  <h3 className="font-display font-black text-lg text-[var(--portfolio-ink)] leading-snug mb-2">{service.proofProject}</h3>
                  <p className="text-sm leading-relaxed text-[var(--portfolio-muted)] mb-6">{service.proofNote}</p>
                  <button type="button" onClick={() => navigateToRef('booking')} className="portfolio-action portfolio-button-primary mt-auto w-full bg-[var(--portfolio-green)] hover:bg-[#0b362b] text-[var(--portfolio-paper)] border border-[var(--portfolio-green)] hover:border-[#0b362b] font-display font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-lg transition-all duration-300 cursor-pointer text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--portfolio-green)]">
                    {service.nextStep}
                  </button>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
// codeguard:components:end
