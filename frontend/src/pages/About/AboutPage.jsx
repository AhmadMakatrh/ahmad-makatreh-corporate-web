// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: AboutPage
import React, { useEffect } from 'react';
import { useLanguage as useLang } from '../../hooks/useLanguage';
import { useNavigation as useNav } from '../../hooks/useNavigation';
import { updatePageMeta as setPageMeta } from '../../utils/seo';
import { SectionNav as PageSections } from '../../components/ui/SectionNav';
import { TechnicalText as TechnicalTextRef } from '../../components/CaseStudy/TechnicalText';

export function AboutPage() {
  const { t: tRef, language } = useLang();
  const { navigateTo: navigateToRef } = useNav();

  useEffect(() => {
    setPageMeta({
      title: tRef('aboutMetaTitle'),
      description: tRef('aboutMetaDesc'),
      path: '/about',
      language,
    });
  }, [language, tRef]);

  const principles = [
    {
      num: tRef('aboutPrinciple1Num'),
      title: tRef('aboutPrinciple1Title'),
      desc: tRef('aboutPrinciple1Desc'),
    },
    {
      num: tRef('aboutPrinciple2Num'),
      title: tRef('aboutPrinciple2Title'),
      desc: tRef('aboutPrinciple2Desc'),
    },
    {
      num: tRef('aboutPrinciple3Num'),
      title: tRef('aboutPrinciple3Title'),
      desc: tRef('aboutPrinciple3Desc'),
    },
    {
      num: tRef('aboutPrinciple4Num'),
      title: tRef('aboutPrinciple4Title'),
      desc: tRef('aboutPrinciple4Desc'),
    },
  ];

  const technicalDomains = [
    {
      title: tRef('aboutRange1Title'),
      desc: tRef('aboutRange1Desc'),
      code: '01 / 04',
    },
    {
      title: tRef('aboutRange2Title'),
      desc: tRef('aboutRange2Desc'),
      code: '02 / 04',
    },
    {
      title: tRef('aboutRange3Title'),
      desc: tRef('aboutRange3Desc'),
      code: '03 / 04',
    },
    {
      title: tRef('aboutRange4Title'),
      desc: tRef('aboutRange4Desc'),
      code: '04 / 04',
    },
  ];

  return (
    <div className="portfolio-about min-h-screen bg-[var(--portfolio-paper)] text-[var(--portfolio-ink)] pt-[clamp(5.5rem,10svh+1.5rem,8rem)] section-space-lg selection:bg-[var(--portfolio-sage)] selection:text-[var(--portfolio-ink)]">
      <div className="max-w-5xl mx-auto page-gutter">
        
        {/* Section A: Opening Identity */}
        <header className="mb-[var(--section-space-md)]">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-[var(--portfolio-sage)] border border-[var(--portfolio-line)] font-mono text-[10px] sm:text-xs text-[var(--portfolio-green)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--portfolio-green)] animate-pulse" />
              <span>{tRef('aboutTag')}</span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs text-[var(--portfolio-muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9db49f]" />
              <span>{tRef('aboutLocation')}</span>
            </div>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[var(--portfolio-ink)] tracking-tight leading-[1.15] mb-8 text-start-logical">
            {tRef('aboutHeading')}
          </h1>

          <div className="p-4 rounded-xl bg-[#fffefa] border border-[var(--portfolio-line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[var(--portfolio-muted)] font-mono text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[var(--portfolio-green)]" />
              <span className="text-[var(--portfolio-ink)] font-medium">{tRef('aboutStatus')}</span>
            </div>
            <span className="text-[var(--portfolio-muted)] text-[11px]">{tRef('cmsAboutPageSoftwareEngineering')}</span>
          </div>
        </header>

        <PageSections items={[
          { id: 'about-profile', label: tRef('aboutProfileTag') },
          { id: 'about-principles', label: tRef('aboutPrinciplesTag') },
          { id: 'about-projects', label: tRef('aboutEvidenceTag') },
          { id: 'about-range', label: tRef('aboutRangeTag') },
        ]} />

        {/* Section B: Engineering Profile Narrative */}
        <section id="about-profile" className="scroll-mt-24 mb-[var(--section-space-md)]">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-2 h-2 bg-[var(--portfolio-green)] rounded-sm" />
            <span className="font-mono text-xs text-[var(--portfolio-green)] uppercase tracking-widest">
              {tRef('aboutProfileTag')}
            </span>
          </div>

          <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-[var(--portfolio-ink)] tracking-tight mb-8 text-start-logical">
            {tRef('aboutProfileTitle')}
          </h2>

          <div className="portfolio-about-profile-copy space-y-6 text-[var(--portfolio-ink)] text-base sm:text-lg font-light leading-relaxed max-w-4xl text-start-logical">
            <p>{tRef('aboutProfileP1')}</p>
            <p>{tRef('aboutProfileP2')}</p>
            <p className="text-[var(--portfolio-muted)]"><TechnicalTextRef>{tRef('aboutProfileP3')}</TechnicalTextRef></p>
          </div>
        </section>

        {/* Section C: Controlled Complexity Highlight */}
        <section className="mb-[var(--section-space-md)]">
          <div className="relative rounded-2xl bg-[var(--portfolio-green)] border border-[#245849] card-pad-lg overflow-hidden shadow-[0_18px_48px_-30px_rgba(8,46,41,0.35)]">
            <div className="absolute top-0 end-0 w-80 h-80 bg-[var(--portfolio-sage)]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-[var(--portfolio-sage)] uppercase tracking-widest">
                  {tRef('aboutPhilosophyTag')}
                </span>
              </div>

              <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-[var(--portfolio-paper)] tracking-tight">
                {tRef('aboutPhilosophyTitle')}
              </h2>

              <p className="font-display font-bold text-lg sm:text-xl text-[var(--portfolio-sage)]">
                {tRef('aboutPhilosophySubtitle')}
              </p>

              <p className="text-[var(--portfolio-sage)] text-sm sm:text-base font-light leading-relaxed pt-2">
                {tRef('aboutPhilosophyDesc')}
              </p>
            </div>
          </div>
        </section>

        {/* Section D: Operational Principles */}
        <section id="about-principles" className="scroll-mt-24 mb-[var(--section-space-md)]">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-2 h-2 bg-[var(--portfolio-green)] rounded-sm" />
            <span className="font-mono text-xs text-[var(--portfolio-green)] uppercase tracking-widest">
              {tRef('aboutPrinciplesTag')}
            </span>
          </div>

          <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-[var(--portfolio-ink)] tracking-tight mb-8 text-start-logical">
            {tRef('aboutPrinciplesTitle')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {principles.map((item) => (
              <article
                key={item.num}
                className="group relative rounded-2xl bg-[#fffefa] border border-[var(--portfolio-line)] card-pad-md transition-all duration-300 hover:border-[#a7bda9] hover:bg-[#f1f4ec] flex flex-col justify-between"
              >
                <div>
                  <span className="font-mono text-2xl sm:text-3xl font-black text-[#9db49f] group-hover:text-[var(--portfolio-green)] transition-colors block mb-4">
                    {item.num}
                  </span>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--portfolio-ink)] mb-3 text-start-logical">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[var(--portfolio-muted)] font-light leading-relaxed text-start-logical">
                    {item.desc}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Section E: Project Evidence */}
        <section id="about-projects" className="scroll-mt-24 mb-[var(--section-space-md)]">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 bg-[var(--portfolio-green)] rounded-sm" />
            <span className="font-mono text-xs text-[var(--portfolio-green)] uppercase tracking-widest">
              {tRef('aboutEvidenceTag')}
            </span>
          </div>

          <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-[var(--portfolio-ink)] tracking-tight mb-3 text-start-logical">
            {tRef('aboutEvidenceTitle')}
          </h2>
          <p className="text-[var(--portfolio-muted)] text-sm sm:text-base font-light leading-relaxed max-w-2xl mb-8 text-start-logical">
            {tRef('aboutEvidenceSubtitle')}
          </p>

          <div className="space-y-6">
            {/* System 1: Crisis Fund */}
            <article className="portfolio-about-project-card group rounded-2xl bg-[#fffefa] border border-[var(--portfolio-line)] card-pad-md transition-all duration-300 hover:border-[#a7bda9]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 lg:w-2/3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs text-[var(--portfolio-green)] uppercase tracking-widest">
                      {tRef('aboutEvidenceCrisisRole')}
                    </span>
                    <span className="portfolio-development-status text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border">
                      {tRef('projectStatusInDev')}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-xl sm:text-2xl text-[var(--portfolio-ink)]">
                    {tRef('aboutEvidenceCrisisTitle')}
                  </h3>
                  <p className="text-xs font-mono text-[var(--portfolio-muted)]">
                    <bdi dir="ltr">{tRef('aboutEvidenceCrisisTech')}</bdi>
                  </p>
                  <p className="text-sm text-[var(--portfolio-ink)] font-light leading-relaxed pt-2">
                    {tRef('aboutEvidenceCrisisDesc')}
                  </p>
                </div>

                <div className="lg:w-1/3 flex lg:justify-end items-end">
                  <button
                    onClick={() => navigateToRef('work', 'crisis-fund')}
                    className="portfolio-action portfolio-button-outline inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--portfolio-paper)] border border-[var(--portfolio-line)] text-xs font-mono text-[var(--portfolio-ink)] hover:border-[var(--portfolio-green)] hover:text-[var(--portfolio-green)] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--portfolio-green)]"
                  >
                    <span>{tRef('aboutViewCaseStudy')}</span>
                    <span className="text-[var(--portfolio-green)] rtl:rotate-180">→</span>
                  </button>
                </div>
              </div>
            </article>

            {/* System 2: Barari */}
            <article className="portfolio-about-project-card group rounded-2xl bg-[#fffefa] border border-[var(--portfolio-line)] card-pad-md transition-all duration-300 hover:border-[#a7bda9]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 lg:w-2/3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs text-[var(--portfolio-green)] uppercase tracking-widest">
                      {tRef('aboutEvidenceBarariRole')}
                    </span>
                    <span className="portfolio-development-status text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border">
                      {tRef('projectStatusInDev')}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-xl sm:text-2xl text-[var(--portfolio-ink)]">
                    {tRef('aboutEvidenceBarariTitle')}
                  </h3>
                  <p className="text-xs font-mono text-[var(--portfolio-muted)]">
                    <bdi dir="ltr">{tRef('aboutEvidenceBarariTech')}</bdi>
                  </p>
                  <p className="text-sm text-[var(--portfolio-ink)] font-light leading-relaxed pt-2">
                    {tRef('aboutEvidenceBarariDesc')}
                  </p>
                </div>

                <div className="lg:w-1/3 flex lg:justify-end items-end">
                  <button
                    onClick={() => navigateToRef('work', 'barari-game')}
                    className="portfolio-action portfolio-button-outline inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--portfolio-paper)] border border-[var(--portfolio-line)] text-xs font-mono text-[var(--portfolio-ink)] hover:border-[var(--portfolio-green)] hover:text-[var(--portfolio-green)] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--portfolio-green)]"
                  >
                    <span>{tRef('aboutViewCaseStudy')}</span>
                    <span className="text-[var(--portfolio-green)] rtl:rotate-180">→</span>
                  </button>
                </div>
              </div>
            </article>

            {/* System 3: Digital Platform */}
            <article className="portfolio-about-project-card group rounded-2xl bg-[#fffefa] border border-[var(--portfolio-line)] card-pad-md transition-all duration-300 hover:border-[#a7bda9]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 lg:w-2/3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-[var(--portfolio-green)] uppercase tracking-widest">
                      {tRef('aboutEvidenceSiteRole')}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-xl sm:text-2xl text-[var(--portfolio-ink)]">
                    {tRef('aboutEvidenceSiteTitle')}
                  </h3>
                  <p className="text-xs font-mono text-[var(--portfolio-muted)]">
                    <bdi dir="ltr">{tRef('aboutEvidenceSiteTech')}</bdi>
                  </p>
                  <p className="text-sm text-[var(--portfolio-ink)] font-light leading-relaxed pt-2">
                    {tRef('aboutEvidenceSiteDesc')}
                  </p>
                </div>

                <div className="lg:w-1/3 flex lg:justify-end items-end">
                  <button
                    onClick={() => navigateToRef('work')}
                    className="portfolio-action portfolio-button-outline inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--portfolio-paper)] border border-[var(--portfolio-line)] text-xs font-mono text-[var(--portfolio-ink)] hover:border-[var(--portfolio-green)] hover:text-[var(--portfolio-green)] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--portfolio-green)]"
                  >
                    <span>{tRef('aboutViewWork')}</span>
                    <span className="text-[var(--portfolio-green)] rtl:rotate-180">→</span>
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* Section F: Technical Range (Grouped Disciplines) */}
        <section id="about-range" className="scroll-mt-24 mb-[var(--section-space-md)]">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 bg-[var(--portfolio-green)] rounded-sm" />
            <span className="font-mono text-xs text-[var(--portfolio-green)] uppercase tracking-widest">
              {tRef('aboutRangeTag')}
            </span>
          </div>

          <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-[var(--portfolio-ink)] tracking-tight mb-8 text-start-logical">
            {tRef('aboutRangeTitle')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {technicalDomains.map((domain) => (
              <div
                key={domain.code}
                className="p-5 rounded-2xl bg-[#fffefa] border border-[var(--portfolio-line)] hover:border-[var(--portfolio-green)] transition-colors"
              >
                <div className="flex items-center justify-between mb-2" dir="ltr">
                  <span className="font-mono text-[10px] text-[var(--portfolio-muted)] uppercase tracking-widest">
                    {domain.code}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9db49f]" />
                </div>
                <h3 className="font-display font-bold text-base sm:text-lg text-[var(--portfolio-ink)] mb-2 text-start-logical">
                  {domain.title}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--portfolio-muted)] font-light leading-relaxed text-start-logical">
                  {domain.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section G: Call to Action Transition */}
        <section className="pt-8 border-t border-[var(--portfolio-line)]">
          <div className="rounded-2xl bg-[var(--portfolio-sage)] border border-[var(--portfolio-line)] card-pad-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--portfolio-green)]" />
                <span className="font-mono text-xs text-[var(--portfolio-green)] uppercase tracking-widest">
                  {tRef('aboutCtaTag')}
                </span>
              </div>
              <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-[var(--portfolio-ink)] tracking-tight text-start-logical">
                {tRef('aboutCtaHeading')}
              </h2>
              <p className="text-[var(--portfolio-muted)] text-sm sm:text-base font-light leading-relaxed text-start-logical">
                {tRef('aboutCtaDesc')}
              </p>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              <button
                onClick={() => navigateToRef('booking')}
                className="portfolio-action portfolio-button-primary w-full sm:w-auto px-8 py-4 rounded-lg bg-[var(--portfolio-green)] text-[var(--portfolio-paper)] font-display font-black text-sm tracking-wider uppercase hover:bg-[#0b362b] transition-all cursor-pointer shadow-[0_8px_20px_rgba(8,46,41,0.14)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--portfolio-green)] text-center"
              >
                {tRef('aboutCtaAction')}
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
// codeguard:components:end
