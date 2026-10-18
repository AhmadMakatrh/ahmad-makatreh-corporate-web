// codeguard:components:start
// codeguard:defines: CookieNotice
import { useEffect, useState } from 'react';
import { useLanguage as useLang } from '../../hooks/useLanguage';
import { useMotion as useMotionRef } from '../../hooks/useReducedMotion';
import { COOKIE_SETTINGS_EVENT as settingsEvent, getCookieChoice as readChoice, saveCookieChoice as saveChoice } from '../../utils/sitePreferences';

export function CookieNotice({ ready }) {
  const { t: tRef, language } = useLang();
  const { motionPaused } = useMotionRef();
  const [visible, setVisible] = useState(() => readChoice() === null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const openSettings = () => { setError(false); setVisible(true); };
    const openSettingsRef = openSettings;
    window.addEventListener(settingsEvent, openSettingsRef);
    return () => window.removeEventListener(settingsEvent, openSettingsRef);
  }, []);

  const choose = (choice) => {
    if (saveChoice(choice, { language, motionPaused })) {
      setVisible(false);
      setError(false);
    } else setError(true);
  };
  const chooseRef = choose;

  if (!ready || !visible) return null;
  return (
    <section className="portfolio-cookie-notice" role="dialog" aria-modal="false" aria-labelledby="cookie-notice-title" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <h2 id="cookie-notice-title">{tRef('cookieNoticeTitle')}</h2>
      <p>{tRef('cookieNoticeDescription')}</p>
      <details><summary>{tRef('cookieNoticeDetailsLabel')}</summary><p>{tRef('cookieNoticeDetails')}</p></details>
      {error && <p role="alert" className="portfolio-cookie-error">{tRef('cookieNoticeError')}</p>}
      <div className="portfolio-cookie-actions">
        <button type="button" className="portfolio-button portfolio-button-primary" onClick={() => chooseRef('accepted')}>{tRef('cookieNoticeAccept')}</button>
        <button type="button" className="portfolio-button portfolio-button-outline" onClick={() => chooseRef('necessary')}>{tRef('cookieNoticeNecessary')}</button>
      </div>
    </section>
  );
}
// codeguard:components:end
