// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: useInitialSectionAnchor
import { useEffect } from 'react';

export function useInitialSectionAnchor() {
  useEffect(() => {
    // Lazy pages mount after the browser's initial fragment navigation.
    const target = document.getElementById(window.location.hash.slice(1));
    target?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, []);
}
// codeguard:components:end
