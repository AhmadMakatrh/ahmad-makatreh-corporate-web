// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: ProjectMedia
import { useState } from 'react';
import { ArrowLeft as ArrowLeftRef, ArrowRight as ArrowRightRef, ArrowUpRight as ArrowUpRightRef, ZoomIn as ZoomIcon } from 'lucide-react';
import { useLanguage as useLang } from '../../hooks/useLanguage';
import { PortfolioLink as SiteLink } from './PortfolioLink';
import { ProjectGallery as ImageGallery } from './ProjectGallery';
import { useImageNavigation as useSlides } from '../../hooks/useImageNavigation';

export function ProjectMedia({ media, slug, name, variant = 'card' }) {
  const { language } = useLang();
  const [activeIndex, setActiveIndex] = useState(0);
  const [portraitSources, setPortraitSources] = useState(() => new Set());
  const [galleryOpen, setGalleryOpen] = useState(false);
  const items = (media?.items ?? []).map((item) => ({ ...item, src: language === 'en' ? item.srcEn ?? item.src : item.src }));
  const isAr = language === 'ar';
  const isGallery = media?.mode === 'slideshow' && items.length > 1 && variant === 'detail';
  const active = items[activeIndex % items.length];
  const { frameRef, moveImage: moveSlide, pointerHandlers: slideGestures } = useSlides({ index: activeIndex, count: items.length, itemKey: active?.src, onSelect: setActiveIndex, language, enabled: isGallery });

  if (!active) return null;
  const isStack = media.mode === 'stack';
  const frame = (
    <div className="portfolio-project-surface">
      {media.brand && <img className="portfolio-media-brand" src={media.brand.src} alt={media.brand.caption[language]} decoding="async" />}
      {isStack ? items.map((capture) => (
        <div className="portfolio-capture-window" key={capture.src}>
          <div className="portfolio-window-bar" aria-hidden="true"><i /><i /><i /></div>
          <img src={capture.src} alt={capture.caption[language]} decoding="async" loading={variant === 'card' ? 'lazy' : undefined} />
        </div>
      )) : (
        <div className="portfolio-slide-window">
          {(variant === 'detail' ? items : items.slice(0, 1)).map((capture, index) => (
            <div key={capture.src} className={`portfolio-slide-frame${portraitSources.has(capture.src) ? ' portfolio-slide-portrait' : ''}`} hidden={index !== activeIndex % items.length}>
              <span className="portfolio-slide-backdrop" style={{ backgroundImage: `url("${capture.src}")` }} aria-hidden="true" />
              <img
                ref={index === activeIndex % items.length ? frameRef : undefined}
                src={capture.src}
                alt={capture.caption[language]}
                decoding="async"
                draggable={false}
                loading={variant === 'card' ? 'lazy' : undefined}
                onLoad={(event) => {
                  if (event.currentTarget.naturalHeight > event.currentTarget.naturalWidth) {
                    setPortraitSources((sources) => sources.has(capture.src) ? sources : new Set(sources).add(capture.src));
                  }
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`portfolio-project-image portfolio-media-${media.mode}${isStack ? ' portfolio-project-captures' : ''}${media.brand ? ' portfolio-media-branded' : ''}${items.length > 5 ? ' portfolio-media-many' : ''}${portraitSources.has(active.src) ? ' portfolio-active-portrait' : ''} portfolio-media-${variant} portfolio-media-${slug}`}
      role={isGallery ? 'region' : undefined}
      aria-roledescription={isGallery ? (isAr ? 'معرض صور' : 'gallery') : undefined}
      aria-label={isGallery ? (isAr ? `صور ${name}` : `${name} images`) : undefined}
    >
      {variant === 'detail' ? (
        <button type="button" className="portfolio-media-link portfolio-media-preview" {...slideGestures} onClick={() => setGalleryOpen(true)} aria-haspopup="dialog" aria-label={`${isAr ? 'عرض الصور:' : 'View images:'} ${active.caption[language]}`}>{frame}<span className="portfolio-media-expand" aria-hidden="true"><ZoomIcon size={20} /></span></button>
      ) : (
        <SiteLink tab="work" slug={slug} className="portfolio-media-link" aria-label={`${isAr ? 'اكتشف مشروع' : 'Explore'} ${name}`}>
          {frame}
          <span className="portfolio-project-open" aria-hidden="true"><ArrowUpRightRef size={22} strokeWidth={1.5} /></span>
        </SiteLink>
      )}
      {variant === 'detail' && !isStack && (
        <div className="portfolio-gallery-controls">
          <div className="portfolio-gallery-navigation" dir={isAr ? 'rtl' : 'ltr'}>
          <button type="button" className="portfolio-gallery-arrow" disabled={items.length < 2} aria-label={isAr ? 'الصورة السابقة' : 'Previous image'} onClick={() => moveSlide(-1)}>
            {isAr ? <ArrowRightRef size={20} aria-hidden="true" /> : <ArrowLeftRef size={20} aria-hidden="true" />}
          </button>
          <button type="button" className="portfolio-gallery-arrow" disabled={items.length < 2} aria-label={isAr ? 'الصورة التالية' : 'Next image'} onClick={() => moveSlide(1)}>
            {isAr ? <ArrowLeftRef size={20} aria-hidden="true" /> : <ArrowRightRef size={20} aria-hidden="true" />}
          </button>
          </div>
          <div className="portfolio-gallery-info" dir={isAr ? 'rtl' : 'ltr'}>
            <span className="portfolio-gallery-caption" aria-live="polite" title={active.caption[language]}>{active.caption[language]}</span>
            <span className="portfolio-gallery-count" dir="ltr">{String(activeIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
          </div>
          <button type="button" className="portfolio-media-gallery-hint" onClick={() => setGalleryOpen(true)} dir={isAr ? 'rtl' : 'ltr'}><ZoomIcon size={16} aria-hidden="true" />{isAr ? 'اضغط لعرض الصور' : 'Click to view images'}</button>
        </div>
      )}
      {variant === 'detail' && isStack && <button type="button" className="portfolio-media-gallery-hint" onClick={() => setGalleryOpen(true)}><ZoomIcon size={16} aria-hidden="true" />{isAr ? 'اضغط لعرض الصور' : 'Click to view images'}</button>}
      {galleryOpen && <ImageGallery items={items} activeIndex={activeIndex} name={name} onSelect={setActiveIndex} onClose={() => setGalleryOpen(false)} />}
    </div>
  );
}
// codeguard:components:end
