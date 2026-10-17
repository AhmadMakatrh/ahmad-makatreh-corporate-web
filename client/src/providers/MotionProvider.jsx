// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: MotionProvider, useMediaQuery, getServerSnapshot
import React, { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { MotionContext as MotionContextRef } from '../hooks/useReducedMotion';
import { getSitePreferences as readPreferences, updateSitePreferences as savePreferences } from '../utils/sitePreferences';
const useMediaQueryRef = useMediaQuery;
const getServerSnapshotRef = getServerSnapshot;

function getServerSnapshot() {
  return false;
}

function useMediaQuery(query, detectTouch = false) {
  const subscribe = useCallback((onChange) => {
    const mediaQuery = window.matchMedia(query);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, [query]);
  const subscribeRef = subscribe;
  const getSnapshot = useCallback(() => window.matchMedia(query).matches || (detectTouch
    && (('ontouchstart' in window) || navigator.maxTouchPoints > 0)), [query, detectTouch]);
  const getSnapshotRef = getSnapshot;
  return useSyncExternalStore(subscribeRef, getSnapshotRef, getServerSnapshotRef);
}

export function MotionProvider({ children }) {
  const systemReducedMotion = useMediaQueryRef('(prefers-reduced-motion: reduce)');
  const isTouchDevice = useMediaQueryRef('(pointer: coarse)', true);
  const [motionPaused, setMotionPaused] = useState(() => readPreferences()?.motionPaused ?? false);
  useEffect(() => { savePreferences({ motionPaused }); }, [motionPaused]);
  const toggleMotion = useCallback(() => setMotionPaused((paused) => !paused), []);
  const toggleMotionRef = toggleMotion;
  const prefersReducedMotion = systemReducedMotion || motionPaused;

  return (
    <MotionContextRef.Provider value={{ prefersReducedMotion, isTouchDevice, systemReducedMotion, motionPaused, toggleMotion: toggleMotionRef }}>
      {children}
    </MotionContextRef.Provider>
  );
}
// codeguard:components:end
