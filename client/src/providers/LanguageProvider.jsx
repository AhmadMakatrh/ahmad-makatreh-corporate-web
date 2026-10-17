// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: LanguageProvider
import React, { useState, useEffect, useCallback } from 'react';
import { LanguageContext as LanguageContextRef } from '../hooks/useLanguage';
import { ar as arRef } from '../i18n/ar';
import { en as enRef } from '../i18n/en';
import { usePublishedSite as useSite } from './publishedSiteContext';
import { siteCopy as siteCopyRef } from '../data/siteCopy';
import { localizedPath as languagePath } from '../utils/seo';
import { getSitePreferences as readPreferences, updateSitePreferences as savePreferences } from '../utils/sitePreferences';

export function LanguageProvider({ children, initialLanguage }) {
  const { snapshot } = useSite();
  const [language, setLanguage] = useState(() => {
    if (initialLanguage) return initialLanguage;
    try {
      if (/^\/page\/ar(?:\/|$)/.test(window.location.pathname)) return 'ar';
      const preferredLanguage = readPreferences()?.language;
      if (window.location.pathname === '/' && preferredLanguage === 'ar') return 'ar';
      if (document.documentElement.dataset.seoLanguage === 'en') return 'en';
      const saved = preferredLanguage ?? localStorage.getItem('siteLanguage');
      if (saved === 'ar' || saved === 'en') return saved;
      return 'en';
    } catch {
      return 'en';
    }
  });
  const [pendingLanguage, setPendingLanguage] = useState(null);

  // Apply language and document direction strictly to documentElement
  useEffect(() => {
    try {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      if (language === 'ar' && window.location.pathname === '/' && readPreferences()?.language === 'ar') {
        window.history.replaceState(window.history.state, '', languagePath('/', 'ar') + window.location.search + window.location.hash);
      }
      localStorage.setItem('siteLanguage', language);
      savePreferences({ language });
    } catch (e) {
      console.error('[LanguageProvider] Failed to update documentElement direction:', e);
    }
  }, [language]);

  useEffect(() => {
    const syncLocationLanguage = () => {
      const nextLanguage = /^\/page\/ar(?:\/|$)/.test(window.location.pathname) ? 'ar' : 'en';
      if (nextLanguage === language) return;
      setPendingLanguage(nextLanguage);
      setLanguage(nextLanguage);
    };
    const syncLocationLanguageRef = syncLocationLanguage;
    window.addEventListener('popstate', syncLocationLanguageRef);
    return () => window.removeEventListener('popstate', syncLocationLanguageRef);
  }, [language]);

  const toggleLanguage = () => {
    if (pendingLanguage) return;
    const nextLanguage = language === 'ar' ? 'en' : 'ar';
    const nextPath = languagePath(window.location.pathname, nextLanguage);
    window.history.replaceState(window.history.state, '', nextPath + window.location.search + window.location.hash);
    setPendingLanguage(nextLanguage);
    setLanguage(nextLanguage);
  };
  const toggleLanguageRef = toggleLanguage;

  const finishLanguageChange = useCallback(() => setPendingLanguage(null), []);
  const finishLanguageChangeRef = finishLanguageChange;

  const t = (key) => {
    const dict = language === 'ar' ? arRef : enRef;
    return snapshot.content?.[language]?.[key] ?? dict[key] ?? siteCopyRef[language][key] ?? key;
  };
  const tRef = t;

  return (
    <LanguageContextRef.Provider value={{ language, setLanguage, toggleLanguage: toggleLanguageRef, pendingLanguage, finishLanguageChange: finishLanguageChangeRef, t: tRef }}>
      {children}
    </LanguageContextRef.Provider>
  );
}

// codeguard:components:end
