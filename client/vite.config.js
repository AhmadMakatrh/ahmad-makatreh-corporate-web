// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: module-local implementation below
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig as defineConfigRef } from 'vite';
import { seoPrerender as prerenderPages } from './scripts/seoPrerender.js';
// codeguard:components:end

// https://vite.dev/config/
export default defineConfigRef({
  plugins: [
    react(),
    tailwindcss(),
    prerenderPages(),
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
