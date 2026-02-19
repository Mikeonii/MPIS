import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Plugin to generate version.json so the app can check for updates
function versionJsonPlugin(version) {
  return {
    name: 'version-json',
    writeBundle({ dir }) {
      const outDir = dir || 'dist';
      fs.writeFileSync(
        path.resolve(outDir, 'version.json'),
        JSON.stringify({ version, buildTime: new Date().toISOString() })
      );
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'info',
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    versionJsonPlugin(process.env.npm_package_version || '1.0.0'),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,  // We register manually in main.jsx
      workbox: {
        // Precache all build assets (JS, CSS, HTML, images)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // SPA fallback: serve index.html for all navigation requests
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        // Runtime caching for API responses
        runtimeCaching: [
          {
            // Cache GET API responses with NetworkFirst strategy
            urlPattern: /\/api\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'mpis-api-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache external images (like the logo from supabase)
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mpis-images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      manifest: false,  // Minimal PWA -- no install prompt
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
});
