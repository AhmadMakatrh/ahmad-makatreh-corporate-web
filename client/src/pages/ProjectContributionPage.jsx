// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: ProjectContributionPage, contributionPresentation, GooglePlayIcon
import { useEffect } from 'react';
import { Activity as ObservatoryIcon, ArrowLeft as ArrowLeftRef, ArrowUpRight as ArrowUpRightRef, BookOpen as ReadingIcon, Database as DatabaseIcon, Info as InfoIcon, Link as LinkIcon, PlayCircle as MediaIcon, Settings as BackendIcon, Shield as SecurityIcon, UserRound as RoleIcon } from 'lucide-react';
import { useLanguage as useLang } from '../hooks/useLanguage';
import { PortfolioLink as SiteLink } from '../components/ui/PortfolioLink';
import { updatePageMeta as setPageMeta } from '../utils/seo';
import { ProjectMedia as WorkMedia } from '../components/ui/ProjectMedia';
import { TechnicalText as TechnicalTextRef } from '../components/CaseStudy/TechnicalText';
import { projectContributions as defaultContributions } from '../data/projectContributions';

const contributionPresentation = {
  tammivo: { icons: [BackendIcon, MediaIcon, SecurityIcon], ar: ['الواجهة الخلفية', 'معالجة الوسائط', 'تحصين حماية HTTP'], en: ['Backend development', 'Media processing', 'HTTP security hardening'] },
  'elpha-tales': { icons: [ReadingIcon, DatabaseIcon, SecurityIcon], ar: ['تصميم الواجهة / تجربة القراءة', 'هيكلة قاعدة البيانات', 'الواجهة الخلفية والحماية'], en: ['Interface design / Reading experience', 'Database architecture', 'Backend and security'] },
  'elpha-reader': { icons: [ReadingIcon, DatabaseIcon, SecurityIcon], ar: ['تصميم الواجهة / تجربة القراءة', 'هيكلة قاعدة البيانات', 'الواجهة الخلفية والحماية'], en: ['Interface design / Reading experience', 'Database architecture', 'Backend and security'] },
};
const contributionPresentationRef = contributionPresentation;

function GooglePlayIcon({ size = 20 }) {
  return <i className="fa-brands fa-google-play" style={{ fontSize: size, lineHeight: 1 }} aria-hidden="true" />;
}
const GooglePlayIconRef = GooglePlayIcon;

export function ProjectContributionPage({ project }) {
  const { language, t: tRef } = useLang();
  const isAr = language === 'ar';
  const presentation = contributionPresentationRef[project.slug];
  const original = defaultContributions.find(item => item.slug === project.slug);
  const contributions = project.contributions[language];
  const hasMedia = project.media?.items?.length > 0;
  const isTammivo = project.slug === 'tammivo';
  const ProjectLinkIcon = project.url?.startsWith('https://play.google.com/store/apps/') ? GooglePlayIconRef : ArrowUpRightRef;
  const ProjectLinkIconRef = ProjectLinkIcon;
  // Report-specific cards remain visible only while the published text describes those reports.
  const showImmuniWeb = isTammivo && project.result?.[language] === original?.result?.[language];
  const showObservatory = isTammivo && contributions.includes(original?.contributions[language][2]);
  const projectDomain = project.url?.replace(/^https?:\/\//, '').split('/')[0];
  const appStoreLink = isTammivo ? (
    <a className="portfolio-button portfolio-button-outline" href="https://play.google.com/store/apps/details?id=com.tammivo.app" target="_blank" rel="noopener noreferrer">
      {isAr ? 'تطبيق تاميفو على Google Play' : 'TAMMIVO on Google Play'}<GooglePlayIconRef />
    </a>
  ) : null;
  useEffect(() => {
    setPageMeta({ title: `${project.title[language]} — ${tRef('cmsProjectContributionPageAhmadMakatreh')}`, description: project.summary[language], path: `/work/${project.slug}`, language, project });
  }, [project, language, isAr, tRef]);
  return (
    <article className="portfolio-contribution portfolio-container">
      <SiteLink tab="work" className="portfolio-text-link"><ArrowLeftRef size={18} aria-hidden="true" />{tRef('cmsProjectContributionPageAllWork')}</SiteLink>
      <header className={`portfolio-contribution-hero${hasMedia ? '' : ' without-media'}`}>
        <div className="portfolio-contribution-intro">
          <h1><bdi>{project.title[language]}</bdi></h1>
          <p className="portfolio-contribution-summary">{project.summary[language]}</p>
          {project.url && <div className="portfolio-contribution-links">
            <a className="portfolio-button portfolio-button-primary" href={project.url} target="_blank" rel="noopener noreferrer">{project.linkLabel?.[language] || project.title[language]}<ProjectLinkIconRef size={20} aria-hidden="true" /></a>
            {appStoreLink}
          </div>}
        </div>
        {hasMedia && <div className="portfolio-contribution-media"><WorkMedia key={project.slug} media={project.media} slug={project.slug} name={project.title[language]} variant="detail" /></div>}
      </header>
      <section className="portfolio-contribution-role"><span className="portfolio-contribution-icon"><RoleIcon size={26} aria-hidden="true" /></span><div><h2>{tRef('cmsProjectContributionPageMyRole')}</h2><p>{project.role[language]}</p></div></section>
      <section className="portfolio-contribution-work"><h2>{tRef('cmsProjectContributionPageWhatIDevelopedAndImproved')}</h2><ul className="portfolio-contribution-grid">{contributions.map((item, index) => {
        const originalIndex = original?.contributions[language].indexOf(item) ?? -1;
        const Icon = presentation?.icons[originalIndex] ?? RoleIcon;
        const IconRef = Icon;
        return <li key={`${index}-${item}`}><span className="portfolio-contribution-icon"><IconRef size={24} aria-hidden="true" /></span>{presentation?.[language][originalIndex] && <h3>{presentation[language][originalIndex]}</h3>}<p><TechnicalTextRef>{item}</TechnicalTextRef></p></li>;
      })}</ul></section>
      {project.result?.[language] && <section className="portfolio-contribution-results"><h2>{isTammivo ? (isAr ? 'نتائج الفحوص' : 'Scan results') : tRef('cmsProjectContributionPageSecurityScanResult')}</h2>
        {(showImmuniWeb || showObservatory) && <div className="portfolio-contribution-scan-grid">
          {showImmuniWeb && <article className="portfolio-contribution-scan"><h3 className="portfolio-scan-immuniweb"><SecurityIcon size={28} aria-hidden="true" /><span dir="ltr">ImmuniWeb</span></h3><p className="portfolio-scan-grade" dir="ltr">A</p><p>{isAr ? '28 سبتمبر 2026' : 'September 28, 2026'}</p></article>}
          {showObservatory && <article className="portfolio-contribution-scan"><h3><ObservatoryIcon size={26} aria-hidden="true" /><span dir="ltr">MDN HTTP Observatory</span></h3><p className="portfolio-scan-grade" dir="ltr"><span>F</span><ArrowLeftRef className="portfolio-scan-transition" size={30} aria-hidden="true" />A+</p><p>{isAr ? 'تحسّن في تقييم إعدادات حماية HTTP' : 'Improved HTTP security configuration grade'}</p><p>{isAr ? 'الدرجة: ' : 'Score: '}<bdi dir="ltr" className="whitespace-nowrap">125 / 100</bdi>{isAr ? ' · الاختبارات المجتازة: ' : ' · Tests passed: '}<bdi dir="ltr" className="whitespace-nowrap">12 / 12</bdi></p></article>}
        </div>}
        <div className="portfolio-contribution-result-note"><InfoIcon size={18} aria-hidden="true" /><p>{project.result[language]}</p></div>
      </section>}
      {project.url && <section className="portfolio-contribution-cta"><h2>{isTammivo ? (isAr ? 'جرّب تاميفو الآن' : 'Try TAMMIVO now') : project.title[language]}</h2><p>{project.summary[language]}</p><a className="portfolio-button portfolio-button-primary" href={project.url} target="_blank" rel="noopener noreferrer">{project.linkLabel?.[language] || project.title[language]}<ProjectLinkIconRef size={20} aria-hidden="true" /></a>{appStoreLink}<a className="portfolio-contribution-domain" href={project.url} target="_blank" rel="noopener noreferrer"><LinkIcon size={15} aria-hidden="true" /><span dir="ltr">{projectDomain}</span></a></section>}
    </article>
  );
}
// codeguard:components:end
