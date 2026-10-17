// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: SectionNav
import { useLanguage as useLang } from '../../hooks/useLanguage';
import { useInitialSectionAnchor as useSectionAnchor } from '../../hooks/useInitialSectionAnchor';

export function SectionNav({ items }) {
  const { t: tRef } = useLang();
  useSectionAnchor();

  return (
    <nav aria-label={tRef('onThisPage')} className="portfolio-section-nav border-y border-[var(--portfolio-line)] py-4 mb-[var(--section-space-sm)]">
      <p className="font-display text-xs text-[var(--portfolio-muted)] mb-2">{tRef('onThisPage')}</p>
      <ul className="flex flex-wrap justify-center gap-x-2 gap-y-1">
        {items.map(({ id, label }) => (
          <li key={id}>
            <a href={`#${id}`} className="inline-flex items-center min-h-11 px-3 rounded-lg font-display text-sm text-[var(--portfolio-ink)] hover:bg-[var(--portfolio-sage)] hover:text-[var(--portfolio-green)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--portfolio-green)]">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
// codeguard:components:end
