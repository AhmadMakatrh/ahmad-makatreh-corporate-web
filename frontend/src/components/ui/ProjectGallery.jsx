// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: ProjectGallery, galleryCopy, imageCount
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft as PreviousIcon, ArrowRight as NextIcon, Check as CheckIcon, Maximize as FullscreenIcon, Minimize as ExitFullscreenIcon, X as CloseIcon, ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon } from 'lucide-react';
import { useLanguage as useLang } from '../../hooks/useLanguage';
import { useImageNavigation as useSlides } from '../../hooks/useImageNavigation';

const galleryCopy = {
  ar: { images: 'صور', close: 'إغلاق المعرض', previous: 'الصورة السابقة', next: 'الصورة التالية', zoomIn: 'تكبير الصورة', zoomOut: 'تصغير الصورة', fullscreen: 'ملء الشاشة', exitFullscreen: 'إنهاء ملء الشاشة', fullscreenError: 'تعذّر تغيير وضع ملء الشاشة. يمكنك متابعة عرض الصور داخل المعرض.', imageError: 'تعذّر تحميل الصورة. يمكنك اختيار صورة أخرى من المعرض.' },
  en: { images: 'Images', close: 'Close gallery', previous: 'Previous image', next: 'Next image', zoomIn: 'Zoom in', zoomOut: 'Zoom out', fullscreen: 'Full screen', exitFullscreen: 'Exit full screen', fullscreenError: 'Unable to change full-screen mode. You can continue viewing images in the gallery.', imageError: 'Unable to load this image. You can choose another image from the gallery.' },
};
const galleryCopyRef = galleryCopy;

function imageCount(index, total) {
  return `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
}
const imageCountRef = imageCount;

export function ProjectGallery({ items, activeIndex, name, onSelect, onClose }) {
  const { language } = useLang();
  const copy = galleryCopyRef[language];
  const titleId = useId();
  const captionId = useId();
  const dialogRef = useRef(null);
  const panelRef = useRef(null);
  const viewportRef = useRef(null);
  const [zoomed, setZoomed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState('');
  const [failedSource, setFailedSource] = useState('');
  const index = activeIndex % items.length;
  const active = items[index];
  const updateSelection = (nextIndex) => {
    setZoomed(false);
    viewportRef.current?.scrollTo(0, 0);
    onSelect(nextIndex);
  };
  const updateSelectionRef = updateSelection;
  const { frameRef, selectImage: selectImageRef, moveImage: moveImageRef, pointerHandlers: slideGestures } = useSlides({ index, count: items.length, itemKey: active.src, onSelect: updateSelectionRef, language, enabled: !zoomed });

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    const handleFullscreenChange = () => setFullscreen(document.fullscreenElement === panelRef.current);
    const handleFullscreenChangeRef = handleFullscreenChange;
    document.addEventListener('fullscreenchange', handleFullscreenChangeRef);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChangeRef);
      dialog.close();
      document.body.style.overflow = overflow;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  const toggleFullscreen = async () => {
    setFullscreenError('');
    try {
      if (document.fullscreenElement === panelRef.current) await document.exitFullscreen();
      else await panelRef.current.requestFullscreen();
    } catch {
      setFullscreenError(copy.fullscreenError);
    }
  };
  const toggleFullscreenRef = toggleFullscreen;

  return (
    <dialog
      ref={dialogRef}
      className="portfolio-image-gallery"
      aria-labelledby={titleId}
      aria-describedby={captionId}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      onClose={(event) => { if (!event.currentTarget.open) onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialogRef.current.close();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Tab') {
          const controls = [...event.currentTarget.querySelectorAll('button:not([disabled]), [tabindex="0"]')].filter(control => control.getClientRects().length);
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement))) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement))) {
            event.preventDefault();
            first?.focus();
          }
          return;
        }
        if (event.altKey || event.ctrlKey || event.metaKey || (zoomed && event.target === viewportRef.current) || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const forward = language === 'ar' ? event.key === 'ArrowLeft' : event.key === 'ArrowRight';
        moveImageRef(forward ? 1 : -1);
      }}
    >
      <div ref={panelRef} className="portfolio-image-gallery-panel">
      <header className="portfolio-image-gallery-toolbar">
        <button type="button" className="portfolio-image-gallery-tool portfolio-image-gallery-close" aria-label={copy.close} onClick={() => dialogRef.current.close()} autoFocus><CloseIcon size={24} aria-hidden="true" /></button>
        <h2 id={titleId}>{language === 'ar' ? <>{copy.images} <bdi>{name}</bdi></> : <><bdi>{name}</bdi> {copy.images.toLowerCase()}</>}</h2>
        <div className="portfolio-image-gallery-tools">
          <button type="button" className="portfolio-image-gallery-tool" aria-label={zoomed ? copy.zoomOut : copy.zoomIn} aria-pressed={zoomed} onClick={() => setZoomed(value => !value)}>{zoomed ? <ZoomOutIcon size={22} aria-hidden="true" /> : <ZoomInIcon size={22} aria-hidden="true" />}</button>
          {typeof document !== 'undefined' && document.fullscreenEnabled && <button type="button" className="portfolio-image-gallery-tool" aria-label={fullscreen ? copy.exitFullscreen : copy.fullscreen} aria-pressed={fullscreen} onClick={toggleFullscreenRef}>{fullscreen ? <ExitFullscreenIcon size={22} aria-hidden="true" /> : <FullscreenIcon size={22} aria-hidden="true" />}</button>}
          <span className="portfolio-gallery-count" dir="ltr">{imageCountRef(index, items.length)}</span>
        </div>
      </header>
      <div className="portfolio-image-gallery-stage">
        {items.length > 1 && <button type="button" className="portfolio-gallery-arrow portfolio-image-gallery-previous" aria-label={copy.previous} onClick={() => moveImageRef(-1)}>{language === 'ar' ? <NextIcon size={24} aria-hidden="true" /> : <PreviousIcon size={24} aria-hidden="true" />}</button>}
        <div ref={viewportRef} {...slideGestures} className={`portfolio-image-gallery-viewport${zoomed ? ' is-zoomed' : ''}`} tabIndex={zoomed ? 0 : undefined} role={zoomed ? 'region' : undefined} aria-label={zoomed ? active.caption[language] : undefined}>
          <button type="button" className="portfolio-image-gallery-image-button" aria-label={zoomed ? copy.zoomOut : copy.zoomIn} onClick={() => setZoomed(value => !value)}>
            <img ref={frameRef} className="portfolio-image-gallery-image" src={active.src} alt={active.caption[language]} decoding="async" draggable={false} onLoad={() => setFailedSource('')} onError={() => setFailedSource(active.src)} />
          </button>
        </div>
        {items.length > 1 && <button type="button" className="portfolio-gallery-arrow portfolio-image-gallery-next" aria-label={copy.next} onClick={() => moveImageRef(1)}>{language === 'ar' ? <PreviousIcon size={24} aria-hidden="true" /> : <NextIcon size={24} aria-hidden="true" />}</button>}
      </div>
      <div className="portfolio-image-gallery-caption" id={captionId} aria-live="polite"><p>{active.caption[language]}</p>{fullscreenError && <p role="status">{fullscreenError}</p>}{failedSource === active.src && <p role="status">{copy.imageError}</p>}</div>
      {items.length > 1 && <div className="portfolio-image-gallery-thumbnails" aria-label={language === 'ar' ? 'اختيار صورة' : 'Choose an image'}>
        {items.map((item, itemIndex) => <button key={item.src} type="button" aria-label={item.caption[language]} aria-pressed={itemIndex === index} onClick={() => selectImageRef(itemIndex)}>
          <img src={item.src} alt="" loading="lazy" decoding="async" />
          {itemIndex === index && <span><CheckIcon size={14} aria-hidden="true" /></span>}
        </button>)}
      </div>}
      </div>
    </dialog>
  );
}
// codeguard:components:end
