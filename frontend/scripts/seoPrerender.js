// The file was created by Ahmed Al-Makhatreh.
// codeguard:components:start
// codeguard:defines: seoPrerender, renderSeoDocument
import { createServer as createViteServer } from 'vite';
import react from '@vitejs/plugin-react';
import { readFile as readFileRef } from 'node:fs/promises';
const renderSeoDocumentRef = renderSeoDocument;

export function renderSeoDocument(template, page, head, body) {
  return template.replace(/<html[^>]*>/, () => `<html lang="${page.language}" dir="${page.language === 'ar' ? 'rtl' : 'ltr'}" data-seo-language="${page.language}">`)
    .replace(/<!-- seo:start -->[\s\S]*?<!-- seo:end -->/, () => `<!-- seo:start -->\n${head}\n<!-- seo:end -->`)
    .replace('<div id="root"></div>', () => `<div id="root">${body}</div>`);
}

export function seoPrerender() {
  let config;
  return {
    name: 'portfolio-seo-prerender',
    apply: 'build',
    enforce: 'post',
    configResolved(value) { config = value; },
    async generateBundle(_options, bundle) {
      const template = String(bundle['index.html'].source);
      // Prerender optimization must not overwrite the running development server's dependency cache.
      const server = await createViteServer({
        root: config.root, configFile: false, cacheDir: 'node_modules/.vite-seo-build', plugins: [react()],
        ssr: { optimizeDeps: { include: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/server', 'react-dom/client'] } },
        server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error',
      });
      const serverRef = server;
      try {
        const { seoPages: listPages, renderPage: renderPageRef, origin: originRef } = await serverRef.ssrLoadModule('/src/entry-seo.jsx');
        const snapshot = process.env.SEO_SNAPSHOT_FILE ? JSON.parse(await readFileRef(process.env.SEO_SNAPSHOT_FILE, 'utf8')) : {};
        const pages = listPages(snapshot);
        const outputPaths = new Set();
        const assetPaths = new Map();
        for (const asset of Object.values(bundle)) {
          if (asset.type !== 'asset') continue;
          for (const original of asset.originalFileNames ?? []) assetPaths.set('/' + original.replaceAll('\\', '/'), '/' + asset.fileName);
        }
        for (const page of pages) {
          const rendered = await renderPageRef(page, snapshot);
          const body = rendered.html.replace(/(?:src|href)="(\/src\/assets\/[^"?]+)(?:\?[^" ]*)?"/g, (match, asset) => {
            const built = assetPaths.get(decodeURI(asset));
            if (!built) throw new Error(`Prerender asset was not emitted: ${asset}`);
            return match.replace(asset, built);
          });
          const html = renderSeoDocumentRef(template, page, rendered.head, body);
          const fileName = page.pathname.endsWith('/') ? `${page.pathname.replace(/^\//, '')}index.html` : `${page.pathname.replace(/^\//, '')}.html`;
          if (outputPaths.has(fileName)) throw new Error(`Duplicate SEO output path: ${fileName}`);
          outputPaths.add(fileName);
          if (fileName === 'index.html') bundle[fileName].source = html;
          else this.emitFile({ type: 'asset', fileName, source: html });
        }
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(page => `  <url><loc>${originRef}${page.pathname}</loc></url>`).join('\n')}\n</urlset>\n`;
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap });
        this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin/\n\nSitemap: ${originRef}/sitemap.xml\n` });
      } finally {
        await serverRef.close();
      }
    },
  };
}
// codeguard:components:end
