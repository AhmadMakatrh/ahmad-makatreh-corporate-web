// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: Preloader
import { useEffect, useRef, useState } from 'react';
import { useLanguage as useLang } from '../../hooks/useLanguage';
import { useReducedMotion as useMotionPref } from '../../hooks/useReducedMotion';
import { usePublishedSite as useSite } from '../../providers/publishedSiteContext';
import brandLogo from '../../assets/AhmadMakatrh Light logo.png';
import englishBrandLogo from '../../assets/AhmadMakatreh Latin Ivory logo.png';
const waitForSiteReadyRef = waitForSiteReady;


async function waitForSiteReady(initialLoad) {
  if (initialLoad && document.readyState !== 'complete') {
    await new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
  }

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  if (document.querySelector('[data-site-loading]')) {
    await new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        if (!document.querySelector('[data-site-loading]')) {
          observer.disconnect();
          resolve();
        }
      });
      observer.observe(document.getElementById('root'), { childList: true, subtree: true });
      if (!document.querySelector('[data-site-loading]')) {
        observer.disconnect();
        resolve();
      }
    });
  }

  await document.fonts.ready;
  const visibleImages = [...document.images].filter((image) => {
    // Uncached images may not have dimensions yet, even when their box is in the viewport.
    if (!image.getClientRects().length || getComputedStyle(image).visibility !== 'visible') return false;
    const rect = image.getBoundingClientRect();
    return rect.bottom >= 0 && rect.top < innerHeight && rect.right >= 0 && rect.left < innerWidth;
  });
  await Promise.all(visibleImages.map((image) => {
    const loaded = image.complete ? Promise.resolve() : new Promise((resolve) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    });
    // Failed images have settled too; their native fallback must not keep the page hidden.
    return loaded.then(() => image.decode?.()).catch(() => image.complete);
  }));
}

export function Preloader({ onReady }) {
  const { t: tRef, language, pendingLanguage, finishLanguageChange: finishLanguageChangeRef } = useLang();
  const { loaded } = useSite();
  const reducedMotion = useMotionPref();
  const preloaderRef = useRef(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const mode = initialLoading ? 'welcome' : pendingLanguage === language ? 'language' : null;

  useEffect(() => {
    if (!mode || !loaded) return;
    let cancelled = false;
    let timer;
    let animation;
    const finish = () => {
      if (cancelled) return;
      if (mode === 'welcome') {
        setInitialLoading(false);
        onReady?.();
      } else finishLanguageChangeRef();
    };
    const finishRef = finish;
    const fadeOut = () => {
      if (cancelled) return;
      animation = preloaderRef.current.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: reducedMotion ? 0 : 400,
        easing: 'ease-in-out',
        fill: 'forwards',
      });
      animation.onfinish = finishRef;
    };
    const fadeOutRef = fadeOut;
    waitForSiteReadyRef(mode === 'welcome').then(() => {
      if (!cancelled) timer = window.setTimeout(fadeOutRef, 1000);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      animation?.cancel();
    };
  }, [mode, loaded, language, reducedMotion, finishLanguageChangeRef, onReady]);

  if (!mode) return null;

  const isAr = language === 'ar';
  const message = mode === 'welcome'
    ? (isAr ? 'أهلاً وسهلاً' : <>Thank you for<br />visiting my website</>)
    : (isAr ? 'جارِ تحميل اللغة العربية' : 'Loading English');

  return (
    <div ref={preloaderRef} className="portfolio-preloader" role="status" aria-live="polite" dir={isAr ? 'rtl' : 'ltr'}>
      <span className="portfolio-preloader-mark" aria-hidden="true" />
      <p className={mode === 'welcome' ? 'portfolio-preloader-welcome' : undefined}>{message}</p>
      <span className="portfolio-preloader-line" aria-hidden="true" />
      {mode === 'welcome' && <img className="portfolio-preloader-logo" src={isAr ? brandLogo : englishBrandLogo} alt={tRef('brandName')} width="1536" height="1024" decoding="async" />}
    </div>
  );
}
// codeguard:components:end
