// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: WorkPage
import React, { useEffect } from 'react';
import { useLanguage as useLang } from '../hooks/useLanguage';
import { useNavigation as useNav } from '../hooks/useNavigation';
import { caseStudies as defaultCaseStudies } from '../data/caseStudies';
import { updatePageMeta as setPageMeta } from '../utils/seo';
import { projectContributions as defaultContributions } from '../data/projectContributions';
import { ProjectCard as WorkCard } from '../components/ui/ProjectCard';
import { projectCards as defaultCards } from '../data/projectCards';
import { useSiteData as usePageData } from '../hooks/useSiteData';

export function WorkPage() {
  const projectCards = usePageData('projectCards', defaultCards);
  const projectContributions = usePageData('projectContributions', defaultContributions);
  const caseStudies = usePageData('caseStudies', defaultCaseStudies);
  const { language, t: tRef } = useLang();
  const { navigateTo: navigateToRef } = useNav();
  const isAr = language === 'ar';

  useEffect(() => {
    setPageMeta({
      title: tRef('cmsWorkPageWorkAhmadMakatreh'),
      description: tRef('cmsWorkPageSoftwareProjectsAndContributionsTo'),
      path: '/work',
      language,
      items: projectCards,
    });
  }, [isAr, language, tRef, projectCards]);

  return (
    <div className="portfolio-work-page min-h-screen">
      <div className="portfolio-work-container">
        {/* Header / Intro */}
        <header className="portfolio-work-intro">
          <h1 className="font-display font-black tracking-tight">
            {tRef('cmsWorkPageWorkContributions')}
          </h1>

          <p>
            {tRef('cmsWorkPageProductsIHaveHelpedDevelop')}
          </p>
        </header>

        {/* Project Records / List */}
        <div className="portfolio-project-list">
          {projectCards.map((project, index) => (
            <WorkCard
              key={project.slug}
              project={project}
              index={index}
              variant="list"
              details={projectContributions.find((entry) => entry.slug === project.slug) ?? caseStudies.find((entry) => entry.slug === project.slug)}
            />
          ))}
        </div>
        {/* Commercial Next Steps */}
        <section className="portfolio-work-cta">
          <h2>
            {tRef('cmsWorkPageWantToDiscussARole')}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigateToRef('booking')}
              className="portfolio-button portfolio-button-primary"
            >
              {tRef('cmsWorkPageGetInTouch')}
            </button>
            <button
              onClick={() => navigateToRef('services')}
              className="portfolio-button portfolio-button-outline"
            >
              {tRef('cmsWorkPageExploreMyAreasOfWork')}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
// codeguard:components:end
