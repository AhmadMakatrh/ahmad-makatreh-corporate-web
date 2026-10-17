// codeguard:components:start
// codeguard:defines: module-local implementation below
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig as defineConfigRef } from 'vite';
// codeguard:components:end

export default defineConfigRef({
  root: 'admin',
  publicDir: false,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../dist-admin',
    emptyOutDir: true,
    sourcemap: false,
  },
});
