// codeguard:components:start
// codeguard:defines: initial language and direction
(function () {
  let saved;
  try { saved = localStorage.getItem('siteLanguage'); }
  catch { saved = null; }
  const root = document.documentElement;
  const language = /^\/page\/ar(?:\/|$)/.test(location.pathname) ? 'ar'
    : root.dataset.seoLanguage === 'en' ? 'en'
    : saved === 'ar' || saved === 'en' ? saved : 'en';
  root.setAttribute('lang', language);
  root.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
})();
// codeguard:components:end
