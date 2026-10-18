// codeguard:components:start
// codeguard:defines: useSiteData
import { useMemo } from 'react';
import { selectSiteData as readSiteData, usePublishedSite as useSite } from '../providers/publishedSiteContext';

export function useSiteData(name, fallback) {
  const { snapshot } = useSite();
  const content = snapshot.content;
  return useMemo(() => readSiteData(name, fallback, content), [name, fallback, content]);
}
// codeguard:components:end
