import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), {
    name: 'local-dev-csp',
    apply: 'serve',
    // Vite's refresh preamble is inline in development; packaged HTML remains strict.
    transformIndexHtml: html => html.replace("script-src 'self';", "script-src 'self' 'unsafe-inline';"),
  }],
  base: './',
  root: 'src/renderer',
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  build: { outDir: '../../dist/renderer', emptyOutDir: true },
});
