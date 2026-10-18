// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: ArticleView
import React, { useState, useEffect } from 'react';
import { useLanguage as useLang } from '../../hooks/useLanguage';
import { useNavigation as useNav } from '../../hooks/useNavigation';
import { getArticleBySlug as loadArticle } from '../../api/articlesApi';
import { updatePageMeta as setPageMeta } from '../../utils/seo';
import { fallbackArticles as fallbackArticlesRef } from '../../data/fallbackArticles';
import { useSiteData as usePageData } from '../../hooks/useSiteData';

export function ArticleView({ slug }) {
  const siteArticles = usePageData('articles', fallbackArticlesRef);
  const { t: tRef, language } = useLang();
  const { navigateTo: navigateToRef } = useNav();

  const [result, setResult] = useState(() => import.meta.env.SSR
    ? { slug, language, source: siteArticles, article: siteArticles.find(item => item.slug === slug && item.language === language) ?? null }
    : null);
  const loading = !result || result.slug !== slug || result.language !== language || result.source !== siteArticles;
  const article = loading ? null : result.article;

  useEffect(() => {
    let isMounted = true;

    loadArticle(slug, language, siteArticles)
      .then((data) => {
        if (isMounted) {
          setResult({ slug, language, source: siteArticles, article: data });
        }
      })
      .catch((err) => {
        console.error('[ArticleView] Error fetching article:', err);
        if (isMounted) {
          setResult({ slug, language, source: siteArticles, article: null });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug, language, siteArticles]);

  useEffect(() => {
    if (!article) {
      if (!loading) setPageMeta({ title: tRef('articleNotFound'), description: '', path: `/journal/${slug}`, language, noindex: true });
      return;
    }
    setPageMeta({
      title: `${article.title} — ${tRef('brandName')}`,
      description: article.summary,
      path: `/journal/${slug}`,
      language: article.language || language,
      article,
      image: article.imageUrl,
      alternateLanguages: [...new Set(siteArticles.filter(item => item.slug === slug).map(item => item.language))],
    });
  }, [article, slug, language, tRef, siteArticles, loading]);

  if (loading) {
    return (
      <div data-site-loading className="portfolio-article min-h-screen pt-40 pb-32 text-center bg-[var(--portfolio-paper)] text-[var(--portfolio-muted)] font-display text-sm tracking-widest uppercase">
        {tRef('loadingJournal')}
      </div>
    );
  }

  if (!article) {
    return (
      <div className="portfolio-article min-h-screen pt-40 pb-32 text-center bg-[var(--portfolio-paper)] px-6">
        <div className="text-[var(--portfolio-green)] text-5xl mb-6">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4 uppercase text-[var(--portfolio-ink)]">
          404 — {tRef('articleNotFound')}
        </h2>
        <p className="text-[var(--portfolio-muted)] text-sm mb-8">
          {language === 'ar' ? 'تحقق من الرابط أو عد إلى قائمة المقالات.' : 'Check the link or return to the articles list.'}
        </p>
        <button
          onClick={() => navigateToRef('journal')}
          className="portfolio-action portfolio-button-outline border border-[var(--portfolio-green)] text-[var(--portfolio-green)] hover:bg-[var(--portfolio-sage)] font-display font-bold text-xs uppercase tracking-widest px-8 py-3 rounded-lg transition-all cursor-pointer focus:outline-none"
        >
          {tRef('backToJournal')}
        </button>
      </div>
    );
  }

  return (
    <article className="portfolio-article bg-[var(--portfolio-paper)] text-[var(--portfolio-ink)] w-full flex-grow pt-36 pb-20 px-6 sm:px-8 text-start-logical animate-in fade-in">
      <div className="max-w-4xl margin-inline-auto">
        <div className="mb-10 font-display">
          <button
            onClick={() => navigateToRef('journal')}
            className="portfolio-control-link text-[var(--portfolio-green)] hover:text-[var(--portfolio-ink)] font-bold text-xs sm:text-sm tracking-widest uppercase flex items-center gap-2 cursor-pointer transition-colors focus:outline-none"
          >
            <i className={`fa-solid ${language === 'ar' ? 'fa-arrow-right' : 'fa-arrow-left'}`}></i>
            <span>{tRef('backToJournal')}</span>
          </button>
        </div>

        <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-black text-[var(--portfolio-ink)] leading-tight mb-8">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[var(--portfolio-muted)] mb-12 font-display tracking-widest uppercase border-b border-[var(--portfolio-line)] pb-6">
          <span className="text-[var(--portfolio-green)] font-bold">{article.date}</span>
          <span>•</span>
          <span>
            {tRef('by')} {tRef('brandName')}
          </span>
          {article.labels?.map((label) => (
            <span
              key={label}
              className="border border-[var(--portfolio-line)] text-[var(--portfolio-muted)] px-3 py-1 rounded-full text-[10px]"
            >
              {label}
            </span>
          ))}
        </div>

        {article.imageUrl && <img src={article.imageUrl} alt={article.title} className="w-full h-auto mb-12" decoding="async" />}
        {article.contentIsPlainText ? <div className="portfolio-article-content text-[var(--portfolio-ink)] text-base sm:text-lg leading-loose space-y-6 font-sans">
          {article.content.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index} style={{ whiteSpace: 'pre-wrap' }}>{paragraph}</p>)}
        </div> : <div
          className="portfolio-article-content text-[var(--portfolio-ink)] text-base sm:text-lg leading-loose space-y-6 font-sans"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />}
      </div>
    </article>
  );
}
// codeguard:components:end
