// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: WorksSection
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft as ArrowLeftRef, ArrowRight as ArrowRightRef } from 'lucide-react';
import { useLanguage as useLang } from '../../hooks/useLanguage';
import { useReducedMotion as useMotionPref } from '../../hooks/useReducedMotion';
import { ProjectCard as WorkCard } from '../../components/ui/ProjectCard';
import { projectCards as defaultCards } from '../../data/projectCards';
import { useSiteData as usePageData } from '../../hooks/useSiteData';
const ProjectCarouselRef = ProjectCarousel;


const AUTO_ADVANCE_MS = 3000;
const AUTO_ADVANCE_MSRef = AUTO_ADVANCE_MS;

function ProjectCarousel({ isAr }) {
  const handleKeyDownRef = handleKeyDown;

  const { t: tRef } = useLang();
  const projectCards = usePageData('projectCards', defaultCards);
  const projects = useMemo(() => [...projectCards.filter(project => project.featured), ...projectCards.filter(project => !project.featured)], [projectCards]);
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  const reducedMotion = useMotionPref();
  const PreviousArrow = isAr ? ArrowRightRef : ArrowLeftRef;
  const PreviousArrowRef = PreviousArrow;
  const NextArrow = isAr ? ArrowLeftRef : ArrowRightRef;
  const NextArrowRef = NextArrow;

  useEffect(() => {
    const track = trackRef.current;
    const observer = new IntersectionObserver((entries) => {
      const visibleSlide = entries.find((entry) => entry.intersectionRatio >= 0.6);
      if (visibleSlide) setActiveIndex(Number(visibleSlide.target.dataset.index));
    }, { root: track, threshold: 0.6 });
    Array.from(track.children).forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [projects]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(rootRef.current);
    const onVisibility = () => setPageVisible(!document.hidden);
    const onVisibilityRef = onVisibility;
    document.addEventListener('visibilitychange', onVisibilityRef);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityRef);
    };
  }, []);

  const showProject = useCallback((index) => {
    if (!projects.length) return;
    const targetIndex = ((index % projects.length) + projects.length) % projects.length;
    const track = trackRef.current;
    const slide = track.children[targetIndex];
    const distance = Math.abs(targetIndex - activeIndex);
    const circularDistance = Math.min(distance, projects.length - distance);
    track.scrollTo({
      left: track.scrollLeft + slide.getBoundingClientRect().left - track.getBoundingClientRect().left,
      behavior: reducedMotion || circularDistance > 1 ? 'auto' : 'smooth',
    });
  }, [activeIndex, reducedMotion, projects]);
  const showProjectRef = showProject;

  useEffect(() => {
    if (projects.length < 2 || hovered || focused || reducedMotion || !inView || !pageVisible) return;
    const timer = window.setTimeout(() => showProjectRef((activeIndex + 1) % projects.length), AUTO_ADVANCE_MSRef);
    return () => window.clearTimeout(timer);
  }, [activeIndex, hovered, focused, reducedMotion, inView, pageVisible, showProjectRef, projects]);

  function handleKeyDown(event) {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const forward = event.key === (isAr ? 'ArrowLeft' : 'ArrowRight');
      showProjectRef(activeIndex + (forward ? 1 : -1));
    }
  }

  return (
    <div ref={rootRef} className="portfolio-project-carousel" role="region" aria-roledescription={tRef('cmsWorksSectionCarousel')} aria-labelledby="selected-work-heading"
      onPointerEnter={(event) => { if (event.pointerType === 'mouse') setHovered(true); }} onPointerLeave={() => setHovered(false)}
      onPointerDownCapture={(event) => { if (event.pointerType === 'mouse') setFocused(false); }}
      onFocusCapture={(event) => setFocused(event.target.matches(':focus-visible'))} onKeyDownCapture={() => setFocused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className="portfolio-carousel-controls">
        <p className="portfolio-carousel-status" aria-live={inView && !hovered && !focused && !reducedMotion && pageVisible ? 'off' : 'polite'} aria-atomic="true">
          <span dir="ltr">{String(activeIndex + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span>
        </p>
        <div className="portfolio-carousel-picker" role="group" aria-label={tRef('cmsWorksSectionChooseAProject')}>
          {projects.map((project, index) => (
            <button type="button" key={project.slug} onClick={() => showProjectRef(index)} aria-pressed={index === activeIndex} aria-controls="project-carousel-track" aria-label={`${tRef('cmsWorksSectionShowProject')} ${project.name}`}><span dir="ltr">{project.name}</span></button>
          ))}
        </div>
      </div>
      <div className="portfolio-carousel-frame">
        <div id="project-carousel-track" className="portfolio-carousel-track" ref={trackRef} tabIndex={0} onKeyDown={handleKeyDownRef} aria-label={tRef('cmsWorksSectionProjectsUseTheArrowKeys')}>
          {projects.map((project, index) => (
            <div key={project.slug} className="portfolio-project-slide" data-index={index} role="group" aria-roledescription={tRef('cmsWorksSectionSlide')} aria-label={`${project.name} — ${index + 1} ${tRef('cmsWorksSectionOf')} ${projects.length}`} aria-hidden={index !== activeIndex} inert={index !== activeIndex}>
              <WorkCard project={project} index={index} />
            </div>
          ))}
        </div>
        <div className="portfolio-carousel-arrows">
          <button type="button" className="portfolio-carousel-arrow" onClick={() => showProjectRef(activeIndex - 1)} aria-label={tRef('cmsWorksSectionPreviousProject')} aria-controls="project-carousel-track"><PreviousArrowRef size={22} strokeWidth={1.5} aria-hidden="true" /></button>
          <button type="button" className="portfolio-carousel-arrow" onClick={() => showProjectRef(activeIndex + 1)} aria-label={tRef('cmsWorksSectionNextProject')} aria-controls="project-carousel-track"><NextArrowRef size={22} strokeWidth={1.5} aria-hidden="true" /></button>
        </div>
      </div>
    </div>
  );
}

export function WorksSection() {
  const { language, t: tRef2 } = useLang();
  const cards = usePageData('projectCards', defaultCards);
  const isAr = language === 'ar';
  if (!cards.length) return null;
  return (
    <section id="selected-projects" className="portfolio-work portfolio-container" aria-labelledby="selected-work-heading">
      <div className="portfolio-section-heading"><h2 id="selected-work-heading">{tRef2('cmsWorksSectionSelectedWork')}</h2><span aria-hidden="true" /></div>
      <ProjectCarouselRef key={language} isAr={isAr} />
      <p className="portfolio-image-note"><span />{tRef2('cmsWorksSectionProjectImagesAndSampleInterfaces')}<span /></p>
    </section>
  );
}
// codeguard:components:end
