// The file was created by Ahmed Al-Makhatreh.
// codeguard:components:start
// codeguard:defines: NavigationContext, useNavigation
import { createContext as createContextRef, useContext } from 'react';

export const NavigationContext = createContextRef(null);
const NavigationContextRef = NavigationContext;

export function useNavigation() {
  const context = useContext(NavigationContextRef);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
// codeguard:components:end
