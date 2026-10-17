// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: AppProviders
import React from 'react';
import { LanguageProvider as LangProvider } from './LanguageProvider';
import { NavigationProvider as NavProvider } from './NavigationProvider';
import { MotionProvider as MotionContext } from './MotionProvider';
import { PublishedSiteProvider as SiteProvider } from './PublishedSiteProvider';

/**
 * Clean Orchestration wrapper for all application contexts.
 * Decouples provider nesting from App.jsx.
 */
export function AppProviders({ children, initialPath, initialLanguage, initialSnapshot }) {
  return (
    <SiteProvider initialSnapshot={initialSnapshot}><LangProvider initialLanguage={initialLanguage}>
      <MotionContext>
        <NavProvider initialPath={initialPath}>
          {children}
        </NavProvider>
      </MotionContext>
    </LangProvider></SiteProvider>
  );
}
// codeguard:components:end
