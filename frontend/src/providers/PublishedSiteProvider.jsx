// codeguard:components:start
// codeguard:defines: PublishedSiteProvider
import { useCallback, useEffect, useMemo, useState } from 'react';
import { request as apiRequest } from '../api/httpClient';
import { PublishedSiteContext as PublishedSiteContextRef } from './publishedSiteContext';
const loadSnapshotRef = loadSnapshot;


let initialSnapshot;
function loadSnapshot() {
  initialSnapshot ??= apiRequest('/api/site');
  return initialSnapshot;
}

export function PublishedSiteProvider({ children, initialSnapshot: renderedSnapshot }) {
  const [snapshot, setSnapshot] = useState(renderedSnapshot ?? {});
  const [loaded, setLoaded] = useState(renderedSnapshot != null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [clock, setClock] = useState(() => Date.now());
  useEffect(() => {
    let active = true;
    loadSnapshotRef().then(value => { if (active) { setSnapshot(value ?? {}); setClock(Date.now()); setLoaded(true); } })
      .catch(cause => { if (active) { setError(cause); setLoaded(true); } });
    return () => { active = false; };
  }, [attempt]);
  const refresh = useCallback(() => {
    initialSnapshot = undefined;
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
