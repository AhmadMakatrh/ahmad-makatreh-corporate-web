// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: JournalSection
import React, { useState, useEffect } from 'react';
import { useLanguage as useLang } from '../../hooks/useLanguage';
import { useNavigation as useNav } from '../../hooks/useNavigation';
import { getArticles as loadArticles } from '../../api/articlesApi';
import { ArticleView as Article } from './ArticleView';
import { JournalArticleLink as ArticleLink } from './JournalArticleLink';
import { fallbackArticles as fallbackArticlesRef } from '../../data/fallbackArticles';
import { useSiteData as usePageData } from '../../hooks/useSiteData';

export function JournalSection() {
  const siteArticles = usePageData('articles', fallbackArticlesRef);
  const { t: tRef, language } = useLang();
  const { currentSlug } = useNav();

  const [result, setResult] = useState(() => import.meta.env.SSR
    ? { language, source: siteArticles, articles: siteArticles.filter(article => article.language === language) }
    : null);
  const loading = !result || result.language !== language || result.source !== siteArticles;
  const articles = loading ? [] : result.articles;

  useEffect(() => {
    let isMounted = true;

    loadArticles(language, siteArticles)
      .then((data) => {
        if (isMounted) {
          setResult({ language, source: siteArticles, articles: data || [] });
        }
      })
      .catch((err) => {
        console.error('[JournalSection] Error fetching articles:', err);
        if (isMounted) {
          setResult({ language, source: siteArticles, articles: [] });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [language, siteArticles]);

  // If a specific article slug is in URL/navigation, render the article view
  if (currentSlug) {
    return <Article slug={currentSlug} />;
  }

  return (
    <section className="portfolio-journal section-space-lg flex-grow bg-[var(--portfolio-paper)] text-[var(--portfolio-ink)]">
      <div className="container mx-auto page-gutter">
        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-black mb-[var(--section-space-md)] uppercase text-start-logical">
          {tRef('journalTitle')}
        </h1>

        {loading ? (
          <div data-site-loading className="py-24 text-center text-[var(--portfolio-muted)] font-display text-xs md:text-sm tracking-widest uppercase">
            {tRef('loadingJournal')}
          </div>
        ) : articles.length === 0 ? (
          <div className="py-24 text-center text-[var(--portfolio-muted)] font-display text-sm">
            {tRef('noPosts')}
          </div>
        ) : (
          <div className="flex flex-col border-t border-[var(--portfolio-line)]">
            {articles.map((article) => (
              <ArticleLink
                key={article.slug}
                slug={article.slug}
                className="py-8 md:py-12 border-b border-[var(--portfolio-line)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:bg-[var(--portfolio-sage)] transition-colors px-4 cursor-pointer"
              >
                <div className="flex-grow text-start-logical">
                  <div className="font-display text-[var(--portfolio-green)] text-xs sm:text-sm font-bold tracking-widest mb-3 uppercase">
                    {article.date}
                  </div>
                  <h3 className="font-display text-xl sm:text-3xl font-bold text-[var(--portfolio-ink)] group-hover:text-[var(--portfolio-green)] transition-colors leading-tight mb-2">
                    {article.title}
                  </h3>
                  <p className="text-[var(--portfolio-muted)] text-xs sm:text-sm line-clamp-2 max-w-2xl font-sans">
                    {article.summary}
                  </p>
                </div>

                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-[var(--portfolio-line)] flex items-center justify-center group-hover:bg-[var(--portfolio-green)] group-hover:text-[var(--portfolio-paper)] transition-all shrink-0">
                  <i className={`fa-solid ${language === 'ar' ? 'fa-arrow-left rotate-45' : 'fa-arrow-right -rotate-45'} text-lg`}></i>
                </div>
              </ArticleLink>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
// codeguard:components:end
