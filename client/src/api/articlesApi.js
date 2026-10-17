// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: getArticles, getArticleBySlug
import { request as apiRequest } from './httpClient';
import { fallbackArticles as fallbackArticlesRef } from '../data/fallbackArticles';
const articleLanguage = lang => lang?.toLowerCase().startsWith('en') ? 'en' : 'ar';
const articleLang = articleLanguage;

/**
 * Fetches journal articles for the specified language ('ar' or 'en').
 * Automatically falls back to bundled static articles if the backend is unreachable.
 */
export async function getArticles(lang = 'ar', siteArticles = null) {
  const normalizedLang = articleLang(lang);
  if (siteArticles) return siteArticles.filter(article => article.language === normalizedLang);
  try {
    const data = await apiRequest(`/api/articles?lang=${normalizedLang}`);
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('[ArticlesAPI] Backend unreachable or returned error, using fallback static articles:', err.message);
  }

  // Graceful fallback to guarantee zero white-screen or failure on Cloudflare Pages
  return fallbackArticlesRef.filter(a => a.language === normalizedLang);
}

/**
 * Fetches an individual article by its SEO slug and language.
 */
export async function getArticleBySlug(slug, lang = 'ar', siteArticles = null) {
  const normalizedLang = articleLang(lang);
  if (siteArticles) return siteArticles.find(article => article.slug === slug && article.language === normalizedLang)
    ?? siteArticles.find(article => article.slug === slug) ?? null;
  try {
    const data = await apiRequest(`/api/articles/${encodeURIComponent(slug)}?lang=${normalizedLang}`);
    if (data && data.slug) {
      return data;
    }
  } catch (err) {
    console.warn(`[ArticlesAPI] Failed to fetch article "${slug}" from backend, falling back to local dataset:`, err.message);
  }

  // Fallback search
  const found = fallbackArticlesRef.find(
    a => a.slug.toLowerCase() === slug.toLowerCase() && a.language === normalizedLang
  );

  return found || fallbackArticlesRef.find(a => a.slug.toLowerCase() === slug.toLowerCase()) || null;
}
// codeguard:components:end
