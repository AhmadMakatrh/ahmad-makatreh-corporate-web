// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: module-local implementation below
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig as defineConfigRef } from 'vite';
import { createHash as createHashRef } from 'node:crypto';
import { seoPrerender as prerenderPages } from './scripts/seoPrerender.js';
// codeguard:components:end

// https://vite.dev/config/
export default defineConfigRef({
  plugins: [
    react(),
    tailwindcss(),
    prerenderPages(),
    {
      name: 'development-csp',
      apply: 'serve',
      transformIndexHtml(html, context) {
        // React Fast Refresh injects this exact inline module only in development.
        const preamble = react.preambleCode.replace('__BASE__', context.server.config.base);
        const hash = createHashRef('sha256').update(preamble).digest('base64');
        return html.replace("script-src 'self'", `script-src 'self' 'sha256-${hash}'`);
      },
    },
  ],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
