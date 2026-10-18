// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: MobileNav
import React, { useEffect, useRef } from 'react';
import { useLanguage as useLang } from '../../hooks/useLanguage';
import { useNavigation as useNav } from '../../hooks/useNavigation';
import { usePublishedSite as useSite } from '../../providers/publishedSiteContext';

export function MobileNav({ isOpen, onClose }) {
  const { t: tRef, language, toggleLanguage: toggleLanguageRef } = useLang();
  const { currentTab, currentSlug, navigateTo: navigateToRef } = useNav();
  const { snapshot } = useSite();
  const closeBtnRef = useRef(null);
  const modalRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);

  // Complete accessibility: Focus trap, background scroll lock, and focus restoration
  useEffect(() => {
    if (!isOpen) return;

    // 1. Remember the trigger element for focus restoration upon closure
    previouslyFocusedElementRef.current = document.activeElement;

    // 2. Lock background scroll safely
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // 3. Auto-focus close button when modal opens
    const focusTimer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    // 4. Keyboard trap and Escape handler
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusableElements = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab: Wrap from first to last element
          if (document.activeElement === firstElement || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: Wrap from last to first element
          if (document.activeElement === lastElement || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    const handleKeyDownRef = handleKeyDown;

    window.addEventListener('keydown', handleKeyDownRef);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDownRef);

      // Restore document scroll behavior
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;

      // Restore focus to opener element
      if (previouslyFocusedElementRef.current && typeof previouslyFocusedElementRef.current.focus === 'function') {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLinkClick = (action) => {
    action();
    onClose();
  };
  const handleLinkClickRef = handleLinkClick;

  const navItems = [
    {
      num: '01',
      label: tRef('home'),
      active: currentTab === 'home',
      onClick: () => navigateToRef('home'),
    },
    {
      num: '02',
      label: tRef('servicesNav'),
      active: currentTab === 'services',
      onClick: () => navigateToRef('services'),
    },
    {
      num: '03',
      label: tRef('workNav'),
      active: currentTab === 'work',
      onClick: () => navigateToRef('work'),
    },
    {
      num: '04',
      label: tRef('aboutNav'),
      active: currentTab === 'about',
      onClick: () => navigateToRef('about'),
    },
    {
      num: '05',
      label: tRef('journal'),
      active: currentTab === 'journal',
      onClick: () => navigateToRef('journal'),
    },
    ...(snapshot.pages?.pages ?? []).filter(page => page.visible && page.showInNav).map(page => ({
      label: page.title[language], active: currentTab === 'page' && currentSlug === page.slug, onClick: () => navigateToRef('page', page.slug)
    })),
    {
      num: '06',
      label: tRef('bookSession'),
      active: currentTab === 'booking',
      onClick: () => navigateToRef('booking'),
      isCta: true,
    },
  ].map((item, index) => ({ ...item, num: String(index + 1).padStart(2, '0') }));

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label={tRef('menu')}
      className="portfolio-mobile-menu fixed inset-0 z-[110] flex flex-col justify-between p-6 sm:p-10"
    >
      {/* Top Header Controls */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <span className="font-mono text-xs text-[#D4EC31] tracking-widest uppercase">
          {tRef('menu')}
        </span>
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label={tRef('close')}
          className="portfolio-mobile-close font-display font-bold tracking-widest uppercase text-xs text-white hover:text-[#D4EC31] transition-colors flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4EC31] px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02]"
        >
          <span>{tRef('close')}</span>
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      {/* Architectural Indexed Navigation List */}
      <nav className="flex flex-col gap-5 sm:gap-6 my-auto text-start-logical">
        {navItems.map((item) => (
          <button
            key={item.num}
            onClick={() => handleLinkClickRef(item.onClick)}
            aria-current={item.active ? 'page' : undefined}
            className={`portfolio-mobile-link group flex items-baseline gap-4 sm:gap-6 cursor-pointer text-start-logical transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4EC31] rounded-lg py-1 ${
              item.active
                ? 'text-[#D4EC31]'
                : item.isCta
                ? 'text-[#D4EC31] hover:text-white'
                : 'text-zinc-300 hover:text-[#D4EC31]'
            }`}
          >
            <span className="portfolio-mobile-number font-mono text-sm sm:text-base text-zinc-400 group-hover:text-[#D4EC31] tracking-wider transition-colors select-none">
              {item.num} —
            </span>
            <span
              className={`portfolio-mobile-label font-display text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight ${
                item.isCta ? 'underline decoration-[#D4EC31]/40 underline-offset-8' : ''
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Bottom Auxiliary Controls */}
      <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={() => {
            toggleLanguageRef();
            onClose();
          }}
          type="button"
          aria-label={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
          className="portfolio-mobile-language border border-[#D4EC31]/60 text-[#D4EC31] rounded-full px-6 py-2.5 text-xs font-mono font-bold tracking-wider hover:bg-[#D4EC31] hover:text-black transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4EC31] cursor-pointer w-full sm:w-auto text-center"
        >
          {language === 'ar' ? 'SWITCH TO ENGLISH (EN)' : 'التبديل إلى العربية (AR)'}
        </button>

        <span className="font-mono text-[11px] text-zinc-400">
          {language === 'ar' ? 'أحمد المخاترة · مهندس برمجيات' : 'AHMAD MAKATREH · SOFTWARE ENGINEER'}
        </span>
      </div>
    </div>
  );
}
// codeguard:components:end
