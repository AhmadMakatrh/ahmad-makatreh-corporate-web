// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: JournalArticleLink
import { useNavigation as useNav } from '../../hooks/useNavigation';
import { useLanguage as useLang } from '../../hooks/useLanguage';
import { localizedPath as languagePath } from '../../utils/seo';

export function JournalArticleLink({ slug, className, children }) {
  const { navigateTo: navigateToRef } = useNav();
  const { language } = useLang();

  const handleClick = (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigateToRef('journal', slug);
  };
  const handleClickRef = handleClick;

  return (
    <a
      href={languagePath(`/journal/${encodeURIComponent(slug)}`, language)}
      onClick={handleClickRef}
      className={`${className} focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--portfolio-green)]`}
    >
      {children}
    </a>
  );
}
// codeguard:components:end
