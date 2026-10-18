// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: AppRoutes
import React, { Suspense as SuspenseRef, lazy as lazyRef, useEffect, useRef } from 'react';
import { useNavigation as useNav } from '../hooks/useNavigation';
import { useLanguage as useLang } from '../hooks/useLanguage';
import { updatePageMeta as setPageMeta } from '../utils/seo';
import { HeroSection as Hero } from '../sections/Hero/HeroSection';
import { WorksSection as Works } from '../sections/Works/WorksSection';
import { CtaSection as CallToAction } from '../sections/Cta/CtaSection';
import { BookingSection as Booking } from '../sections/Booking/BookingSection';
import { JournalSection as Journal } from '../sections/Journal/JournalSection';
import { projectContributions as defaultContributions } from '../data/projectContributions';
import { useSiteData as usePageData } from '../hooks/useSiteData';
import { usePortfolioMotion as usePageMotion } from '../hooks/usePortfolioMotion';

// Static HTML needs resolved route modules; browser navigation keeps its existing code splitting.
const ProjectContributionPage = import.meta.env.SSR ? (await import('../pages/ProjectContributionPage')).ProjectContributionPage : lazyRef(() =>
  import('../pages/ProjectContributionPage').then((m) => ({ default: m.ProjectContributionPage }))
);
const ProjectContributionPageRef = ProjectContributionPage;

// Code-split / lazy-load internal commercial pages to keep homepage bundle minimal
const ServicesPage = import.meta.env.SSR ? (await import('../pages/Services/ServicesPage')).ServicesPage : lazyRef(() =>
  import('../pages/Services/ServicesPage').then((m) => ({ default: m.ServicesPage }))
);
const ServicesPageRef = ServicesPage;

const CapabilitiesPage = import.meta.env.SSR ? (await import('../pages/CapabilitiesPage')).CapabilitiesPage : lazyRef(() =>
  import('../pages/CapabilitiesPage').then((m) => ({ default: m.CapabilitiesPage }))
);
const CapabilitiesPageRef = CapabilitiesPage;

const WorkPage = import.meta.env.SSR ? (await import('../pages/WorkPage')).WorkPage : lazyRef(() =>
  import('../pages/WorkPage').then((m) => ({ default: m.WorkPage }))
);
const WorkPageRef = WorkPage;

const CaseStudyPage = import.meta.env.SSR ? (await import('../pages/CaseStudyPage')).CaseStudyPage : lazyRef(() =>
  import('../pages/CaseStudyPage').then((m) => ({ default: m.CaseStudyPage }))
);
const CaseStudyPageRef = CaseStudyPage;

const AboutPage = import.meta.env.SSR ? (await import('../pages/About/AboutPage')).AboutPage : lazyRef(() =>
  import('../pages/About/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const AboutPageRef = AboutPage;
const ContentPage = import.meta.env.SSR ? (await import('../pages/ContentPage')).ContentPage : lazyRef(() => import('../pages/ContentPage').then(module => ({ default: module.ContentPage })));
const ContentPageRef = ContentPage;

/**
 * AppRoutes renders:
 * - Homepage: Strategic end-to-end editorial narrative
 * - Services: Deep capability storytelling & architectural proof
 * - Work & Case Studies: Real-world verified engineering case studies
 * - About: Personal engineering profile, architecture principles & verified evidence
 * - Booking: Technical briefing & consultation intake
 * - Journal: Full technical publication reader with deep-linking
 */
export function AppRoutes() {
  const projectContributions = usePageData('projectContributions', defaultContributions);
  const { currentTab, currentSlug } = useNav();
  const { t: tRef, language } = useLang();
  const homeRef = useRef(null);
  usePageMotion(homeRef, currentTab === 'home', language);
  const contribution = projectContributions.find((project) => project.slug === currentSlug);

  // Dynamic client-side per-route metadata
  useEffect(() => {
    if (currentTab === 'home') {
      setPageMeta({
        title: `${tRef('brandName')} — ${tRef('brandTagline')}`,
        description: tRef('heroDescription'),
        path: '/',
        language,
      });
    } else if (currentTab === 'services' || currentTab === 'marketing') {
      setPageMeta({
        title: tRef('servicesMetaTitle'),
        description: tRef('servicesMetaDesc'),
        path: '/services',
        language,
      });
    } else if (currentTab === 'capabilities') {
      setPageMeta({
        title: tRef('capabilitiesMetaTitle'),
        description: tRef('capabilitiesMetaDesc'),
        path: '/capabilities',
        language,
      });
    } else if (currentTab === 'about') {
      setPageMeta({
        title: tRef('aboutMetaTitle'),
        description: tRef('aboutMetaDesc'),
        path: '/about',
        language,
      });
    } else if (currentTab === 'journal' && !currentSlug) {
      setPageMeta({
        title: `${tRef('journalTitle')} — ${tRef('brandName')}`,
        description: tRef('journalSubtitle'),
        path: '/journal',
        language,
      });
    } else if (currentTab === 'start-project') {
      setPageMeta({
        title: language === 'ar' 
          ? `تواصل معي — ${tRef('brandName')}`
          : `Get in Touch — ${tRef('brandName')}`,
        description: language === 'ar'
          ? 'أرسل نبذة عن فرصة العمل أو المشروع لنتحدث عن طريقة التعاون.'
          : 'Share a brief description of the role or project to discuss working together.',
        path: '/start-project',
        language,
      });
    } else if (currentTab === 'booking') {
      setPageMeta({
        title: `${tRef('bookSessionHeading')} — ${tRef('brandName')}`,
        description: tRef('bookingIntro'),
        path: '/booking',
        language,
      });
    }
  }, [currentTab, currentSlug, language, tRef]);

  switch (currentTab) {
    case 'page':
      return <SuspenseRef fallback={<div data-site-loading className="min-h-screen bg-[var(--portfolio-paper)]" />}><ContentPageRef slug={currentSlug} /></SuspenseRef>;
    case 'about':
      return (
        <SuspenseRef fallback={<div data-site-loading className="min-h-screen bg-[var(--portfolio-paper)]" />}>
          <AboutPageRef />
        </SuspenseRef>
      );
    case 'services':
      return (
        <SuspenseRef fallback={<div data-site-loading className="min-h-screen bg-[var(--portfolio-paper)]" />}>
          <ServicesPageRef />
        </SuspenseRef>
      );
    case 'work':
      return (
        <SuspenseRef fallback={<div data-site-loading className="min-h-screen bg-[var(--portfolio-paper)]" />}>
          {contribution ? <ProjectContributionPageRef project={contribution} /> : currentSlug ? <CaseStudyPageRef slug={currentSlug} /> : <WorkPageRef />}
        </SuspenseRef>
      );
    case 'start-project':
      return <Booking key={currentSlug ?? 'project'} isProjectInquiry={true} serviceKey={currentSlug} />;
    case 'booking':
      return <Booking />;
    case 'journal':
      return <Journal />;
    case 'capabilities':
      return (
        <SuspenseRef fallback={<div data-site-loading className="min-h-screen bg-[var(--portfolio-paper)]" />}>
          <CapabilitiesPageRef />
        </SuspenseRef>
      );
    case 'marketing':
      return (
        <SuspenseRef fallback={<div data-site-loading className="min-h-screen bg-[var(--portfolio-paper)]" />}>
          <ServicesPageRef />
        </SuspenseRef>
      );
    case 'home':
    default:
      return (
        <div className="portfolio-home" ref={homeRef}>
          <div className="portfolio-scroll-progress" aria-hidden="true" />
          <Hero />
          <Works />
          <CallToAction />
        </div>
      );
  }
}
// codeguard:components:end
