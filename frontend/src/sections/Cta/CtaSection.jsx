// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: CtaSection
import { useLanguage as useLang } from '../../hooks/useLanguage';
import { PortfolioLink as SiteLink } from '../../components/ui/PortfolioLink';
import { PortfolioArtwork as SiteArtwork } from '../../components/Background/PortfolioArtwork';

export function CtaSection() {
  const { t: tRef } = useLang();
  return (
    <section className="portfolio-contact" aria-labelledby="contact-heading">
      <SiteArtwork />
      <h2 id="contact-heading">{tRef('cmsCtaSectionLetsDiscussARoleOr')}</h2>
      <span className="portfolio-contact-accent" aria-hidden="true" />
      <SiteLink tab="booking" className="portfolio-button portfolio-button-primary">
        {tRef('cmsCtaSectionGetInTouch')}
      </SiteLink>
    </section>
  );
}
// codeguard:components:end
