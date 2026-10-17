// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: JournalPreviewSection
import React from 'react';
import { useLanguage as useLang } from '../../hooks/useLanguage';
import { useNavigation as useNav } from '../../hooks/useNavigation';
import { fallbackArticles as fallbackArticlesRef } from '../../data/fallbackArticles';
import { JournalArticleLink as ArticleLink } from './JournalArticleLink';
import { useSiteData as usePageData } from '../../hooks/useSiteData';

export function JournalPreviewSection() {
  const siteArticles = usePageData('articles', fallbackArticlesRef);
  const { t: tRef, language } = useLang();
  const { navigateTo: navigateToRef } = useNav();

  // Filter articles for current language
  const currentArticles = siteArticles.filter(
    (a) => a.language === (language === 'ar' ? 'ar' : 'en')
  ).slice(0, 2);

  return (
    <section id="journal-preview" className="section-space-lg bg-[#090909] text-white border-t border-white/5 relative">
      <div className="container mx-auto page-gutter">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-[var(--section-space-md)] gap-6 border-b border-white/10 pb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#D4EC31]"></span>
              <span className="font-display font-bold text-xs uppercase tracking-widest text-[#D4EC31]">
                {tRef('journalTag')}
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-[2.85rem] font-black uppercase text-start-logical leading-tight">
              {tRef('journalHeading')}
            </h2>
          </div>
          <p className="text-zinc-400 text-sm md:text-base max-w-md text-start-logical font-light">
            {tRef('journalSubtitle')}
          </p>
        </div>

        {/* 2 Latest Article Previews */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-fluid-md mb-fluid-md">
          {currentArticles.map((article) => (
            <ArticleLink
              key={article.slug}
              slug={article.slug}
              className="bg-[#121212] border border-white/10 hover:border-[#D4EC31]/60 card-pad-md rounded-3xl cursor-pointer transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                {/* Meta Header */}
                <div className="flex items-center justify-between gap-4 mb-6">
                  <span className="text-xs font-mono text-[#D4EC31] tracking-wider uppercase">
                    {article.date}
                  </span>
                  <div className="flex gap-2">
                    {article.labels?.map((label) => (
                      <span
                        key={label}
                        className="text-[10px] font-mono bg-white/5 text-zinc-400 px-2.5 py-0.5 rounded-full"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Article Title */}
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-4 group-hover:text-[#D4EC31] transition-colors leading-snug text-start-logical">
                  {article.title}
                </h3>

                {/* Summary */}
                <p className="text-zinc-400 text-xs sm:text-sm font-light leading-relaxed mb-6 text-start-logical line-clamp-3">
                  {article.summary}
                </p>
              </div>

              {/* Action Link */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-start-logical text-[#D4EC31] font-display text-xs font-bold uppercase tracking-widest group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                <span>{tRef('readArticle')}</span>
                <i className={`fa-solid ${language === 'ar' ? 'fa-arrow-left' : 'fa-arrow-right'} text-sm`}></i>
              </div>
            </ArticleLink>
          ))}
        </div>

        {/* View All Essays Link */}
        <div className="text-center pt-4">
          <button
            onClick={() => navigateToRef('journal')}
            className="inline-flex items-center gap-3 text-zinc-400 hover:text-white font-display text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors"
          >
            <span>{tRef('viewAllEssays')}</span>
            <i className={`fa-solid ${language === 'ar' ? 'fa-arrow-left' : 'fa-arrow-right'} text-xs text-[#D4EC31]`}></i>
          </button>
        </div>
      </div>
    </section>
  );
}
// codeguard:components:end
