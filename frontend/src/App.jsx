// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: App
import React, { useCallback, useState } from 'react';
import { AppProviders as SiteProviders } from './providers/AppProviders';
import { AppLayout as SiteLayout } from './layout/AppLayout';
import { AppRoutes as SiteRoutes } from './routes/AppRoutes';
import { Preloader as LoadingScreen } from './components/Preloader/Preloader';
import { LaunchOffer as OfferPopup } from './components/LaunchOffer/LaunchOffer';
import { CookieNotice as CookieBanner } from './components/CookieNotice/CookieNotice';
import { ErrorBoundary as PageErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { useNavigation as useNav } from './hooks/useNavigation';
import { useLanguage as useLang } from './hooks/useLanguage';
const RoutedContentRef = RoutedContent;

function RoutedContent() {
  const { currentTab, currentSlug } = useNav();
  const { language } = useLang();
  return <PageErrorBoundary resetKey={`${currentTab}/${currentSlug ?? ''}`} language={language}><SiteRoutes /></PageErrorBoundary>;
}

/**
 * Lean Root Orchestrator:
 * Cleanly composes providers, universal layout, and decoupled routes.
 * Avoids monolithic state or tangled layout logic.
 */
export default function App({ initialPath, initialLanguage, initialSnapshot }) {
  const [siteReady, setSiteReady] = useState(false);
  const handleSiteReady = useCallback(() => setSiteReady(true), []);
  const handleSiteReadyRef = handleSiteReady;

  return (
    <SiteProviders initialPath={initialPath} initialLanguage={initialLanguage} initialSnapshot={initialSnapshot}>
      <SiteLayout>
        <RoutedContentRef />
        <OfferPopup ready={siteReady} />
        <CookieBanner ready={siteReady} />
      </SiteLayout>
      {!import.meta.env.SSR && <LoadingScreen onReady={handleSiteReadyRef} />}
    </SiteProviders>
  );
}
// codeguard:components:end
