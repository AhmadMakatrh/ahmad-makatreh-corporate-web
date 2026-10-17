// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: PortfolioLink
import { useNavigation as useNav } from '../../hooks/useNavigation';
import { useLanguage as useLang } from '../../hooks/useLanguage';
import { localizedPath as languagePath } from '../../utils/seo';

export function PortfolioLink({ tab = 'home', slug, children, onClick, ...props }) {
  const { navigateTo: navigateToRef } = useNav();
  const { language } = useLang();
  const href = tab === 'page' && slug ? `/${slug}` : tab === 'home' ? '/' : `/${tab}${slug ? `/${slug}` : ''}`;
  return (
    <a {...props} href={languagePath(href, language)} onClick={(event) => {
      onClick?.(event);
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      navigateToRef(tab, slug);
    }}>{children}</a>
  );
}
// codeguard:components:end
