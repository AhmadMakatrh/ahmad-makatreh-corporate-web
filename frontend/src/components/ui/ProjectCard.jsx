// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: ProjectCard, contributionTags
import { useLanguage as useLang } from '../../hooks/useLanguage';
import { ArrowLeft as ArrowLeftRef, ArrowRight as ArrowRightRef } from 'lucide-react';
import { PortfolioLink as SiteLink } from './PortfolioLink';
import { ProjectMedia as WorkMedia } from './ProjectMedia';
import { TechnicalText as TechnicalTextRef } from '../CaseStudy/TechnicalText';

const contributionTags = {
  tammivo: ['Back-End', 'FFmpeg', 'HTTP Security'],
  'elpha-tales': ['Mobile App', 'UI/UX Redesign', 'Database'],
  'elpha-reader': ['Mobile App', 'PDF Engine', 'Back-End'],
};
const contributionTagsRef = contributionTags;

export function ProjectCard({ project, index, variant = 'featured', details }) {
  const { language, t: tRef } = useLang();
  const detailed = variant === 'list';
  const compact = variant === 'compact';
  const Heading = detailed ? 'h2' : compact ? 'h4' : 'h3';
  const HeadingRef = Heading;
  const role = details?.role ?? details?.confirmedRole ?? details?.overview;
  const description = detailed ? (details?.summary ?? details?.subtitle ?? project.description) : project.description;
  const technologies = details?.verifiedStack ?? (Object.hasOwn(contributionTagsRef, project.slug) ? contributionTagsRef[project.slug] : undefined);

  return (
    <article className={`portfolio-project ${detailed ? 'portfolio-project-detailed' : 'portfolio-project-featured'}${compact ? ' portfolio-project-compact' : ''}${detailed && details?.contributions ? ' portfolio-contribution-card' : ''}`} data-project={project.slug}>
      {!compact && <WorkMedia key={project.slug} media={project.media} slug={project.slug} name={project.name} variant={detailed ? 'list' : 'card'} />}
      <div className="portfolio-project-copy">
        <div className="portfolio-project-title"><HeadingRef dir={detailed ? 'auto' : 'ltr'}>{detailed ? details?.title[language] ?? project.name : project.name}</HeadingRef><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span></div>
        {project.inDevelopment && <p className="portfolio-project-status"><span aria-hidden="true" />{tRef('cmsProjectCardInDevelopment')}</p>}
        <p className="portfolio-project-description">{description[language]}</p>
        {detailed && role && <p className="portfolio-project-role"><TechnicalTextRef>{role[language]}</TechnicalTextRef></p>}
        {detailed && technologies && <ul className="portfolio-project-stack" aria-label={tRef('cmsProjectCardTechnologiesUsed')}>{technologies.slice(0, 3).map((tech) => <li key={tech}>{tech}</li>)}</ul>}
        <div className="portfolio-project-links">
          <SiteLink tab="work" slug={project.slug} className="portfolio-text-link">{tRef('cmsProjectCardExploreProject')}{detailed && (language === 'ar' ? <ArrowLeftRef size={18} aria-hidden="true" /> : <ArrowRightRef size={18} aria-hidden="true" />)}</SiteLink>
        </div>
      </div>
    </article>
  );
}
// codeguard:components:end
