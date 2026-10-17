// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: CaseStudyPage, CaseStudyMedia
import React, { useEffect } from 'react';
import { Check as CheckRef } from 'lucide-react';
import { useLanguage as useLang } from '../hooks/useLanguage';
import { useNavigation as useNav } from '../hooks/useNavigation';
import { caseStudies as defaultCaseStudies } from '../data/caseStudies';
import { useSiteData as usePageData } from '../hooks/useSiteData';
import { ArchitectureDiagram as ArchitectureDiagramRef } from '../components/CaseStudy/ArchitectureDiagram';
import { MediaPlaceholder as MediaPlaceholderRef } from '../components/CaseStudy/MediaPlaceholder';
import { updatePageMeta as setPageMeta } from '../utils/seo';
import { SectionNav as PageSections } from '../components/ui/SectionNav';
import { ProjectMedia as WorkMedia } from '../components/ui/ProjectMedia';
import { TechnicalText as TechnicalTextRef } from '../components/CaseStudy/TechnicalText';
const CaseStudyMediaRef = CaseStudyMedia;

export function CaseStudyPage({ slug }) {
  const caseStudies = usePageData('caseStudies', defaultCaseStudies);
  const { language, t: tRef } = useLang();
  const { navigateTo: navigateToRef } = useNav();
  const isAr = language === 'ar';

  const data = caseStudies.find(item => item.slug === slug);
  const isCrisisFund = data?.slug === 'crisis-fund';
  const isBarari = data?.slug === 'barari-game';
  const hasEngineeringLayout = isCrisisFund || isBarari;

  // Update SEO metadata dynamically
  useEffect(() => {
    if (!data) {
      setPageMeta({ title: tRef('cmsCaseStudyPageProjectNotFound'), description: '', path: `/work/${slug}`, language, noindex: true });
      return;
    }
    const projectName = isAr ? data.title.ar : data.title.en;
    const descText = isAr ? data.subtitle.ar : data.subtitle.en;

    setPageMeta({
      title: isAr
        ? `${projectName} — قيد التطوير | أحمد المخاترة`
        : `${projectName} — In Development | Ahmad Makatreh`,
      description: descText,
      path: `/work/${data.slug}`,
      language,
      project: data,
    });
  }, [data, isAr, language, slug, tRef]);

  if (!data) {
    return (
      <div className="portfolio-case-study min-h-screen bg-[var(--portfolio-paper)] text-[var(--portfolio-ink)] flex flex-col justify-center items-center px-6">
        <h1 className="text-2xl font-mono mb-4">{tRef('cmsCaseStudyPageProjectNotFound')}</h1>
        <button
          onClick={() => navigateToRef('work')}
          className="portfolio-control-link text-[var(--portfolio-green)] font-mono text-sm underline cursor-pointer"
        >
          {tRef('cmsCaseStudyPageBackToProjects')}
        </button>
      </div>
    );
  }

  // Determine next project for bottom CTA
  const currentIndex = caseStudies.findIndex((cs) => cs.slug === data.slug);
  const nextProject = caseStudies[(currentIndex + 1) % caseStudies.length];
  const defaultTakeaways = defaultCaseStudies.find(project => project.slug === data.slug)?.technicalTakeaways.points[language] ?? [];

  return (
    <div className={`portfolio-case-study${hasEngineeringLayout ? ' portfolio-case-engineering' : ''} min-h-screen bg-[var(--portfolio-paper)] text-[var(--portfolio-ink)] pt-[clamp(5.5rem,10svh+1.5rem,8rem)] section-space-lg selection:bg-[var(--portfolio-sage)] selection:text-[var(--portfolio-ink)]`}>
      <div className={hasEngineeringLayout ? 'portfolio-case-container' : 'max-w-5xl mx-auto page-gutter'}>
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-[var(--portfolio-line)] pb-6 mb-8">
          <button
            onClick={() => navigateToRef('work')}
            className="portfolio-control-link flex items-center gap-2 text-[var(--portfolio-muted)] hover:text-[var(--portfolio-green)] font-mono text-xs uppercase tracking-widest transition-colors cursor-pointer"
          >
            <span>←</span>
            <span>{tRef('cmsCaseStudyPageBackToProjects')}</span>
          </button>

          <span className="font-mono text-xs text-[var(--portfolio-muted)] tracking-wider">
            {tRef('cmsCaseStudyPageProjectDetails')}
          </span>
        </div>

        {/* Development Status Top Banner */}
        {!hasEngineeringLayout && <div className="portfolio-development-status mb-10 p-4 sm:p-5 rounded-2xl border flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--portfolio-development-accent)] animate-pulse shrink-0" />
            <span className="font-mono text-xs sm:text-sm font-bold text-current tracking-wider uppercase">
            {tRef('cmsCaseStudyPageWorkInProgressCurrentStage')}
            </span>
          </div>
          <span className="font-mono text-[11px] text-[var(--portfolio-muted)] uppercase tracking-widest hidden sm:inline-block">
            {tRef('cmsCaseStudyPageCurrentVersion')}
          </span>
        </div>}

        {/* Hero Section */}
        <header className="mb-[var(--section-space-md)]">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-[var(--portfolio-sage)] text-[var(--portfolio-green)] border border-[#b5c8b1] rounded-full font-mono text-xs font-bold uppercase tracking-wider">
              {isAr ? data.category.ar : data.category.en}
            </span>
            <span className="portfolio-development-status px-2.5 py-1 border rounded-full font-mono text-xs font-bold">
              {tRef('cmsCaseStudyPageInDevelopment')}
            </span>
            <span className="text-[var(--portfolio-muted)] font-mono text-xs">
              {data.timeline}
            </span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] text-[var(--portfolio-ink)] tracking-tight leading-[1.25] mb-6">
            {isAr ? data.title.ar : data.title.en}
          </h1>

          <p className="text-[var(--portfolio-ink)] text-lg sm:text-xl font-light leading-relaxed max-w-3xl mb-8">
            {isAr ? data.subtitle.ar : data.subtitle.en}
          </p>

          {/* Metadata Grid */}
          <div className={hasEngineeringLayout ? 'portfolio-case-metadata grid grid-cols-1 lg:grid-cols-2 gap-6' : 'grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-2xl bg-[#fffefa] border border-[var(--portfolio-line)]'}>
            <div className="portfolio-case-meta-card">
              <span className="font-mono text-[11px] text-[var(--portfolio-muted)] uppercase tracking-widest block mb-2">
                {tRef('cmsCaseStudyPageMyContribution')}
              </span>
              <p className="text-[var(--portfolio-ink)] text-xs sm:text-sm font-medium">
                <TechnicalTextRef>{isAr ? data.confirmedRole.ar : data.confirmedRole.en}</TechnicalTextRef>
              </p>
            </div>

            <div className="portfolio-case-meta-card">
              <span className="font-mono text-[11px] text-[var(--portfolio-muted)] uppercase tracking-widest block mb-2">
                {tRef('cmsCaseStudyPageTechnologiesUsed')}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {data.verifiedStack.map((tech) => (
                  <span
                    key={tech}
                    className="text-[10px] font-mono text-[var(--portfolio-ink)] bg-[#f3f5ee] border border-[var(--portfolio-line)] px-2 py-0.5 rounded"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

          </div>
          {hasEngineeringLayout && <div id="case-media" className="portfolio-case-showcase scroll-mt-24">
            <CaseStudyMediaRef data={data} language={language} t={tRef} />
          </div>}
        </header>

        <PageSections items={[
          { id: 'case-context', label: `${hasEngineeringLayout ? '01 // ' : ''}${tRef('cmsCaseStudyPageAboutTheProject')}` },
          { id: 'case-architecture', label: `${hasEngineeringLayout ? '02 // ' : ''}${data.architecture.title[language]}` },
          ...(data.codeWalkthrough ? [{ id: 'case-code', label: `${isCrisisFund ? '03 // ' : ''}${tRef('cmsCaseStudyPageCodeExample')}` }] : []),
          ...(!hasEngineeringLayout ? [{ id: 'case-media', label: tRef('cmsCaseStudyPageProjectImages') }] : []),
          { id: 'case-takeaways', label: hasEngineeringLayout ? `${data.codeWalkthrough ? '04' : '03'} // ${isCrisisFund ? tRef('cmsCaseStudyPageTechnicalDecisions') : data.technicalTakeaways.title[language]}` : data.technicalTakeaways.title[language] },
        ]} />

        {/* Section 1: Overview & The Problem */}
        <section id="case-context" className="scroll-mt-24 space-y-[var(--content-gap-lg)] mb-[var(--section-space-md)]">
          <div className="space-y-4">
            {hasEngineeringLayout ? <h2 className="portfolio-case-section-heading font-mono text-xs text-[var(--portfolio-green)] uppercase tracking-widest block">
              01 // {tRef('cmsCaseStudyPageAboutTheProject')}
            </h2> : <span className="font-mono text-xs text-[var(--portfolio-green)] uppercase tracking-widest block">
              01 // {tRef('cmsCaseStudyPageAboutTheProject')}
            </span>}
            <p className="text-[var(--portfolio-ink)] text-base sm:text-lg leading-relaxed font-light">
              {isBarari ? <TechnicalTextRef>{data.overview[language]}</TechnicalTextRef> : data.overview[language]}
            </p>
          </div>

          <div className={hasEngineeringLayout ? 'portfolio-case-about-grid grid grid-cols-1 lg:grid-cols-12 gap-6' : 'bg-[#fffefa] border border-[var(--portfolio-line)] rounded-2xl card-pad-md space-y-6'}>
            <div className={hasEngineeringLayout ? 'portfolio-case-panel lg:col-span-5' : undefined}>
              <span className="font-mono text-xs text-[#996442] uppercase tracking-widest block mb-2">
                {tRef('cmsCaseStudyPageTheChallenge')}
              </span>
              <p className="text-[var(--portfolio-ink)] text-sm sm:text-base leading-relaxed font-light">
                {isBarari ? <TechnicalTextRef>{data.problem[language]}</TechnicalTextRef> : data.problem[language]}
              </p>
            </div>

            {/* Constraints */}
            <div className={hasEngineeringLayout ? 'portfolio-case-panel lg:col-span-7' : 'pt-4 border-t border-[var(--portfolio-line)]'}>
              <span className="font-mono text-xs text-[var(--portfolio-muted)] uppercase tracking-widest block mb-3">
                {data.constraintsTitle?.[language] ?? tRef('cmsCaseStudyPageImplementationRequirements')}
              </span>
              <ul className="space-y-2 text-xs sm:text-sm text-[var(--portfolio-ink)]">
                {(isAr ? data.constraints.ar : data.constraints.en).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    {hasEngineeringLayout ? <CheckRef className="portfolio-case-check" size={16} aria-hidden="true" /> : <span className="text-[var(--portfolio-green)] font-mono mt-0.5">•</span>}
                    <span>{hasEngineeringLayout ? <TechnicalTextRef>{item}</TechnicalTextRef> : item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: Architecture & Visual Diagrams */}
        <section id="case-architecture" className="scroll-mt-24 space-y-6 mb-[var(--section-space-md)]">
          {hasEngineeringLayout ? <h2 className="portfolio-case-section-heading font-mono text-xs text-[var(--portfolio-green)] uppercase tracking-widest block">
            02 // {isAr ? data.architecture.title.ar : data.architecture.title.en}
          </h2> : <span className="font-mono text-xs text-[var(--portfolio-green)] uppercase tracking-widest block">
            02 // {data.architecture.title[language]}
          </span>}
          <p className="text-[var(--portfolio-ink)] text-base leading-relaxed font-light">
            {hasEngineeringLayout ? <TechnicalTextRef>{data.architecture.narrative[language]}</TechnicalTextRef> : data.architecture.narrative[language]}
          </p>

          {/* SVG Diagram component */}
          {data.slug === 'crisis-fund' && <ArchitectureDiagramRef slug={data.slug} language={language} />}

          {/* Deep Dive Narrative (Security or Combat AI depending on project) */}
          {!isCrisisFund && data.securityDeepDive && (
            <div className="bg-[#fffefa] border border-[var(--portfolio-line)] rounded-2xl p-6 sm:p-8 mt-6">
              <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--portfolio-ink)] mb-3">
                {isAr ? data.securityDeepDive.title.ar : data.securityDeepDive.title.en}
              </h3>
              <p className="text-[var(--portfolio-ink)] text-sm sm:text-base leading-relaxed font-light">
                {isAr ? data.securityDeepDive.narrative.ar : data.securityDeepDive.narrative.en}
              </p>
            </div>
          )}

          {data.combatDeepDive && (
            <div className="bg-[#fffefa] border border-[var(--portfolio-line)] rounded-2xl p-6 sm:p-8 mt-6">
              <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--portfolio-ink)] mb-3">
                {isAr ? data.combatDeepDive.title.ar : data.combatDeepDive.title.en}
              </h3>
              <p className="text-[var(--portfolio-ink)] text-sm sm:text-base leading-relaxed font-light">
                {isAr ? data.combatDeepDive.narrative.ar : data.combatDeepDive.narrative.en}
              </p>
            </div>
          )}

          {!isCrisisFund && data.financialFlow && (
            <div className="bg-[#fffefa] border border-[var(--portfolio-line)] rounded-2xl p-6 sm:p-8 mt-6">
              <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--portfolio-ink)] mb-3">
                {isAr ? data.financialFlow.title.ar : data.financialFlow.title.en}
              </h3>
              <p className="text-[var(--portfolio-ink)] text-sm sm:text-base leading-relaxed font-light">
                {isAr ? data.financialFlow.narrative.ar : data.financialFlow.narrative.en}
              </p>
            </div>
          )}

          {data.aiDeepDive && (
            <div className="bg-[#fffefa] border border-[var(--portfolio-line)] rounded-2xl p-6 sm:p-8 mt-6">
              <h3 className="font-display font-bold text-lg sm:text-xl text-[var(--portfolio-ink)] mb-3">
                {isAr ? data.aiDeepDive.title.ar : data.aiDeepDive.title.en}
              </h3>
              <p className="text-[var(--portfolio-ink)] text-sm sm:text-base leading-relaxed font-light">
                {isAr ? data.aiDeepDive.narrative.ar : data.aiDeepDive.narrative.en}
              </p>
            </div>
          )}
        </section>

        {/* Section 3: Real Code Walkthrough */}
        {data.codeWalkthrough && <section id="case-code" className={`scroll-mt-24 mb-[var(--section-space-md)] ${isCrisisFund ? 'portfolio-case-code-layout grid grid-cols-1 lg:grid-cols-12 gap-8 items-start' : 'space-y-6'}`}>
          <div className={isCrisisFund ? 'portfolio-case-code-explanation lg:col-span-4 space-y-5 min-w-0' : 'space-y-6'}>
          <h2 className="portfolio-case-section-heading font-mono text-xs text-[var(--portfolio-green)] uppercase tracking-widest block">
            03 // {tRef(isCrisisFund ? 'cmsCaseStudyPageCodeExample' : 'cmsCaseStudyPageImplementationExample')}
          </h2>
          <h3 className="font-display font-bold text-xl sm:text-2xl text-[var(--portfolio-ink)]">
            {isAr ? data.codeWalkthrough.title.ar : data.codeWalkthrough.title.en}
          </h3>
          <p className="text-[var(--portfolio-muted)] text-sm leading-relaxed font-light">
            {isCrisisFund ? <TechnicalTextRef>{data.codeWalkthrough.description[language]}</TechnicalTextRef> : data.codeWalkthrough.description[language]}
          </p>
          {isCrisisFund && <ul className="portfolio-case-code-highlights space-y-4">
            {['cmsCaseStudyPageConstantTimeComparison', 'cmsCaseStudyPageUnfilteredQueryGuard'].map(key => <li key={key} className="flex items-start gap-3">
              <CheckRef className="portfolio-case-check" size={16} aria-hidden="true" />
              <span><TechnicalTextRef>{tRef(key)}</TechnicalTextRef></span>
            </li>)}
          </ul>}
          </div>

          <div className={`${isCrisisFund ? 'portfolio-case-code-window lg:col-span-8 min-w-0 ' : ''}rounded-2xl overflow-hidden border border-[var(--portfolio-line)] bg-[#143b31] font-mono text-xs`}>
            <div className="px-4 py-2 bg-[#0d3029] border-b border-[#426459] flex items-center justify-between text-[#d7e7d6] text-[11px]">
              <span>{tRef('cmsCaseStudyPageCodeExcerpt')} · {data.codeWalkthrough.language.toUpperCase()}</span>
              <span className="text-[#d2e7c8]">{tRef('cmsCaseStudyPageFromTheProject')}</span>
            </div>
            <pre dir="ltr" tabIndex={0} aria-label={data.codeWalkthrough.title[language]} className="p-4 sm:p-6 overflow-x-auto text-[#e8f0e7] leading-relaxed font-mono text-xs sm:text-[13px] text-left">
              <code>{data.codeWalkthrough.code}</code>
            </pre>
          </div>
        </section>}

        {/* Section 4: Project screenshots and pending media */}
        {!hasEngineeringLayout && <section id="case-media" className="scroll-mt-24 space-y-6 mb-[var(--section-space-md)]">
          <span className="font-mono text-xs text-[var(--portfolio-green)] uppercase tracking-widest block">
            {data.codeWalkthrough ? '04' : '03'} // {tRef('cmsCaseStudyPageProjectImages')}
          </span>
          <CaseStudyMediaRef data={data} language={language} t={tRef} />
        </section>}

        {/* Section 5: Technical Takeaways */}
        <section id="case-takeaways" className="scroll-mt-24 space-y-6 mb-[var(--section-space-md)]">
          {hasEngineeringLayout ? <h2 className="portfolio-case-section-heading font-mono text-xs text-[var(--portfolio-green)] uppercase tracking-widest block">
            {data.codeWalkthrough ? '04' : '03'} // {data.technicalTakeaways.title[language]}
          </h2> : <span className="font-mono text-xs text-[var(--portfolio-green)] uppercase tracking-widest block">
            {data.codeWalkthrough ? '05' : '04'} // {data.technicalTakeaways.title[language]}
          </span>}
          {hasEngineeringLayout ? <div className="portfolio-case-decisions grid grid-cols-1 lg:grid-cols-3 gap-6">
            {data.technicalTakeaways.points[language].map((point, index) => {
              const separator = point.indexOf(':');
              const title = separator < 0 ? defaultTakeaways[index]?.split(':', 1)[0] ?? tRef('cmsCaseStudyPageTechnicalDecisions') : point.slice(0, separator);
              const description = separator < 0 ? point : point.slice(separator + 1).trim();
              return <article key={index} className="portfolio-case-panel">
                <span className="portfolio-case-decision-index" dir="ltr">{String(index + 1).padStart(2, '0')}</span>
                {title && <h3><TechnicalTextRef>{title}</TechnicalTextRef></h3>}
                <p><TechnicalTextRef>{description}</TechnicalTextRef></p>
              </article>;
            })}
          </div> : <div className="bg-[#fffefa] border border-[var(--portfolio-line)] rounded-2xl card-pad-md">
            <ul className="space-y-4 text-xs sm:text-sm text-[var(--portfolio-ink)] leading-relaxed">
              {(isAr ? data.technicalTakeaways.points.ar : data.technicalTakeaways.points.en).map((pt, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--portfolio-green)] mt-2 shrink-0" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>}
        </section>

        {/* Next Project CTA Navigation */}
        <footer className="pt-[var(--section-space-sm)] border-t border-[var(--portfolio-line)]">
          <span className="font-mono text-xs text-[var(--portfolio-muted)] uppercase tracking-widest block mb-4">
            {tRef('cmsCaseStudyPageNextProject')}
          </span>

          <div
            onClick={() => navigateToRef('work', nextProject.slug)}
            className="group block p-8 rounded-2xl bg-[#fffefa] border border-[var(--portfolio-line)] hover:border-[#95ae96] transition-all duration-300 cursor-pointer"
          >
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div>
                <span className="font-mono text-xs text-[var(--portfolio-green)] uppercase tracking-wider block mb-1">
                  {isAr ? nextProject.category.ar : nextProject.category.en}
                </span>
                <h4 className="font-display font-black text-2xl sm:text-3xl text-[var(--portfolio-ink)] group-hover:text-[var(--portfolio-green)] transition-colors">
                  {isAr ? nextProject.title.ar : nextProject.title.en}
                </h4>
                <p className="text-[var(--portfolio-muted)] text-xs sm:text-sm mt-2 max-w-xl font-light">
                  {isAr ? nextProject.subtitle.ar : nextProject.subtitle.en}
                </p>
              </div>

              <span className="text-[var(--portfolio-green)] font-mono text-xl group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                →
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function CaseStudyMedia({ data, language, t: tRef }) {
  return data.screenshots?.length ? (
    <div className={data.slug === 'crisis-fund' || data.slug === 'barari-game' ? 'portfolio-case-media-content' : 'space-y-8'}>
      <p className="text-[var(--portfolio-muted)] text-sm leading-relaxed">
        {data.mediaDescription?.[language] ?? tRef('cmsCaseStudyPageImagesOfTheBetaInterface')}
      </p>
      <WorkMedia key={data.slug} media={{ mode: 'slideshow', items: data.screenshots }} slug={data.slug} name={data.title[language]} variant="detail" />
    </div>
  ) : <>
    <p className="text-[var(--portfolio-muted)] text-sm leading-relaxed font-light">
      {tRef('cmsCaseStudyPageImagesForThisPartOf')}
    </p>
    <MediaPlaceholderRef items={data.missingMediaPlaceholders ?? []} language={language} />
  </>;
}
// codeguard:components:end
