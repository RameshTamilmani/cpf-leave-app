import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
  const release = {
    ...JSON.parse(readFileSync('public/version.json', 'utf8')),
    version,
    buildTime: Date.now(),
    buildId: randomUUID(),
  };
  return {
    define: { __APP_RELEASE__: JSON.stringify(release) },
    plugins: [
      {
        name: 'cutisg-release',
        generateBundle() {
          this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify(release) });
        },
      },
      react(),
      tailwindcss(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.js',
        manifest: false,
        registerType: 'prompt',
        injectRegister: null,
        includeAssets: [
          'icon.svg',
          'favicon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png'
        ],
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json,xlsx}'],
          globIgnores: ['version.json'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
