// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: NavigationProvider
import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContext as NavigationContextRef } from '../hooks/useNavigation';
import { localizedPath as languagePath } from '../utils/seo';
const parseLocationRef = parseLocation;


const VALID_TABS = ['home', 'about', 'services', 'capabilities', 'work', 'journal', 'booking', 'start-project', 'page'];
const VALID_TABSRef = VALID_TABS;

/**
 * Parses route from both pathname (primary clean URLs) and hash (backward compatibility fallback).
 * Supports:
 * - Direct clean paths: /, /about, /services, /capabilities, /work, /work/:slug, /journal, /journal/:slug, /booking, /start-project, /start-project/:service, /contact
 * - Legacy hash paths: #about, #services, #capabilities, #work, #journal, #booking, #start-project
 */
function parseLocation(location = window.location) {
  // Check pathname first (primary clean URL architecture)
  const path = location.pathname.replace(/^\/page\/ar(?=\/|$)/, '').replace(/^\/|\/$/g, '').trim();
  const pathParts = path ? path.split('/') : [];
  const primarySegment = pathParts[0]?.toLowerCase() || '';

  if (primarySegment === 'about') {
    return { tab: 'about', slug: null };
  }

  if (primarySegment === 'services') {
    return { tab: 'services', slug: null };
  }

  if (primarySegment === 'capabilities') {
    return { tab: 'capabilities', slug: null };
  }

  if (primarySegment === 'work') {
    return { tab: 'work', slug: pathParts[1] || null };
  }

  if (primarySegment === 'journal') {
    return { tab: 'journal', slug: pathParts[1] || null };
  }

  if (primarySegment === 'start-project' || primarySegment === 'startproject') {
    return { tab: 'start-project', slug: pathParts[1] || null };
  }

  if (primarySegment === 'booking' || primarySegment === 'contact') {
    return { tab: 'booking', slug: null };
  }

  // Fallback check for legacy hash
  const hash = location.hash.replace(/^#\/?/, '').trim();
  if (hash) {
    const hashParts = hash.split('/');
    const hashTab = hashParts[0]?.toLowerCase();
    if (hashTab === 'about') {
      return { tab: 'about', slug: null };
    }
    if (hashTab === 'services') {
      return { tab: 'services', slug: null };
    }
    if (hashTab === 'capabilities') {
      return { tab: 'capabilities', slug: null };
    }
    if (hashTab === 'work') {
      return { tab: 'work', slug: hashParts[1] || null };
    }
    if (hashTab === 'journal') {
      return { tab: 'journal', slug: hashParts[1] || null };
    }
    if (hashTab === 'start-project' || hashTab === 'startproject') {
      return { tab: 'start-project', slug: hashParts[1] || null };
    }
    if (hashTab === 'booking' || hashTab === 'contact') {
      return { tab: 'booking', slug: null };
    }
  }

  if (pathParts.length === 1 && primarySegment) return { tab: 'page', slug: primarySegment };
  return { tab: 'home', slug: null };
}

export function NavigationProvider({ children, initialPath }) {
  const [currentRoute, setCurrentRoute] = useState(() => parseLocationRef(initialPath ? { pathname: initialPath, hash: '' } : window.location));

  const updateFromLocation = useCallback(() => {
    const route = parseLocationRef();
    setCurrentRoute(route);
    if (route.anchor) {
      setTimeout(() => {
        document.getElementById(route.anchor)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);
  const updateFromLocationRef = updateFromLocation;

  useEffect(() => {
    window.addEventListener('popstate', updateFromLocationRef);
    window.addEventListener('hashchange', updateFromLocationRef);

    // Initial anchor check if landed on /work or /about
    if (currentRoute.anchor) {
      setTimeout(() => {
        document.getElementById(currentRoute.anchor)?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }

    return () => {
      window.removeEventListener('popstate', updateFromLocationRef);
      window.removeEventListener('hashchange', updateFromLocationRef);
    };
  }, [updateFromLocationRef, currentRoute.anchor]);

  const navigateTo = useCallback((tab, slug = null) => {
    const targetTab = VALID_TABSRef.includes(tab) ? tab : 'home';
    const newPath = targetTab === 'page' && slug ? `/${slug}` : targetTab === 'home'
      ? '/' 
      : slug 
        ? `/${targetTab}/${slug}` 
        : `/${targetTab}`;

    const nextPath = languagePath(newPath, document.documentElement.lang);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({ tab: targetTab, slug }, '', nextPath);
    }
    setCurrentRoute({ tab: targetTab, slug });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  const navigateToRef = navigateTo;

  return (
    <NavigationContextRef.Provider value={{ currentTab: currentRoute.tab, currentSlug: currentRoute.slug, navigateTo: navigateToRef }}>
      {children}
    </NavigationContextRef.Provider>
  );
}

// codeguard:components:end
