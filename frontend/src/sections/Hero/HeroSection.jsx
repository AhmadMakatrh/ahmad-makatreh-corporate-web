// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: HeroSection
import { useLanguage as useLang } from '../../hooks/useLanguage';
import { PortfolioLink as SiteLink } from '../../components/ui/PortfolioLink';
import { PortfolioArtwork as SiteArtwork } from '../../components/Background/PortfolioArtwork';
import { usePublishedSite as useSite } from '../../providers/publishedSiteContext';

export function HeroSection() {
  const { t: tRef } = useLang();
  const { snapshot } = useSite();
  return (
    <section className="portfolio-hero portfolio-container" aria-labelledby="portfolio-title">
      <div className="portfolio-hero-backdrop" aria-hidden="true">
        <SiteArtwork />
      </div>
      <img
        className="portfolio-hero-art"
        src={snapshot.content?.assets?.heroImageUrl || '/images/castle-hill-pencil-sketch.png'}
        alt={tRef('cmsHeroImageAlt')}
        fetchPriority="high"
      />
      <p className="portfolio-eyebrow">{tRef('cmsHeroEyebrow')}</p>
      <h1 id="portfolio-title">
        <span className="portfolio-title-line">{tRef('cmsHeroTitle')}</span>
        <span className="portfolio-title-line"><mark>{tRef('cmsHeroDesign')}</mark> {tRef('cmsHeroExperience')}</span>
      </h1>
      <p className="portfolio-intro">{tRef('cmsHeroIntro')}</p>
      <div className="portfolio-actions">
        <SiteLink tab="work" className="portfolio-button portfolio-button-primary">
          <span>{tRef('cmsHeroAction')}</span>
        </SiteLink>
      </div>
    </section>
  );
}
// codeguard:components:end
