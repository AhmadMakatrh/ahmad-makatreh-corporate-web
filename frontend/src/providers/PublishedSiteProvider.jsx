// codeguard:components:start
// codeguard:defines: PublishedSiteProvider
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { request as apiRequest } from '../api/httpClient';
import { PublishedSiteContext as PublishedSiteContextRef } from './publishedSiteContext';
const loadSnapshotRef = loadSnapshot;


const REFRESH_INTERVAL_MS = 30000;
const REFRESH_INTERVAL_MSRef = REFRESH_INTERVAL_MS;
let pendingSnapshot;
function loadSnapshot() {
  pendingSnapshot ??= apiRequest('/api/site', { cache: 'no-cache' }).finally(() => { pendingSnapshot = undefined; });
  return pendingSnapshot;
}

export function PublishedSiteProvider({ children, initialSnapshot: renderedSnapshot }) {
  const [snapshot, setSnapshot] = useState(renderedSnapshot ?? {});
  const [loaded, setLoaded] = useState(renderedSnapshot != null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [clock, setClock] = useState(() => Date.now());
  const snapshotJsonRef = useRef(null);
  useEffect(() => {
    let active = true;
    let requesting = false;
    let timer;
    const available = () => !document.hidden && navigator.onLine !== false;
    const schedule = () => {
      window.clearTimeout(timer);
      if (active && available()) timer = window.setTimeout(update, REFRESH_INTERVAL_MSRef);
    };
    function update() {
      if (!active || requesting) return;
      requesting = true;
      loadSnapshotRef().then(value => {
        if (!active) return;
        const next = value ?? {};
        const json = JSON.stringify(next);
        if (snapshotJsonRef.current !== json) {
          snapshotJsonRef.current = json;
          setSnapshot(next);
          setClock(Date.now());
        }
        setError(null);
      }).catch(cause => { if (active) setError(cause); }).finally(() => {
        requesting = false;
        if (active) { setLoaded(true); schedule(); }
      });
    }
    const resume = () => {
      window.clearTimeout(timer);
      if (available()) update();
    };
    update();
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('focus', resume);
    window.addEventListener('online', resume);
    window.addEventListener('offline', resume);
    return () => {
      active = false;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('focus', resume);
      window.removeEventListener('online', resume);
      window.removeEventListener('offline', resume);
    };
  }, [attempt]);
  const refresh = useCallback(() => {
    setError(null); setLoaded(false); setAttempt(value => value + 1);
  }, []);
  const refreshRef = refresh;
  useEffect(() => {
    const now = Date.now();
    const dates = (snapshot.pricing?.offers ?? []).flatMap(offer => [offer.startsAtUtc, offer.endsAtUtc])
      .filter(Boolean).map(Date.parse).filter(time => time > now);
    if (!dates.length) return;
    const next = Math.min(...dates);
    const timer = setTimeout(() => setClock(Date.now()), Math.min(next - now + 10, 2147483647));
    return () => clearTimeout(timer);
  }, [snapshot, clock]);
  const value = useMemo(() => ({ snapshot, loaded, clock, error, refresh: refreshRef }), [snapshot, loaded, clock, error, refreshRef]);
  return <PublishedSiteContextRef.Provider value={value}>{children}</PublishedSiteContextRef.Provider>;
}
// codeguard:components:end
