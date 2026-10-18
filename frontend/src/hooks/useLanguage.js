// The file was created by Ahmed Al-Makhatreh.
// codeguard:components:start
// codeguard:defines: LanguageContext, useLanguage
import { createContext as createContextRef, useContext } from 'react';

export const LanguageContext = createContextRef(null);
const LanguageContextRef = LanguageContext;

export function useLanguage() {
  const context = useContext(LanguageContextRef);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
// codeguard:components:end
