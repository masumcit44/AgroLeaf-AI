import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { AUDIO_CACHE_NAME, AUDIO_URL_PATTERN, MODEL_CACHE_NAME, MODEL_URL_PATTERN } from './src/features/pwa/cacheConfig.js'

// Dev only: ONNX Runtime dynamically imports /ort/ort-wasm-simd-threaded.mjs.
// Vite's dev server refuses to transform-import files from /public, so serve
// /ort/* raw before its transform middleware runs. The production build is
// unaffected (public/ is copied as-is and the browser loads the file directly).
function serveOrtRawInDev() {
  return {
    name: 'serve-ort-raw-in-dev',
    apply: 'serve',
    configureServer(server) {
      const ortDir = path.resolve(server.config.root, 'public', 'ort')
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0]
        if (!url.startsWith('/ort/')) return next()
        const file = path.join(ortDir, path.basename(url))
        if (!fs.existsSync(file)) return next()
        res.setHeader('Content-Type', file.endsWith('.wasm') ? 'application/wasm' : 'text/javascript')
        fs.createReadStream(file).pipe(res)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    serveOrtRawInDev(),
    react(),
    tailwindcss(),
    // F9 Offline PWA. Nothing registers automatically: PwaStatus registers the
    // service worker only when the 'pwa' feature flag is on, so production gets
    // no service worker until the lead enables the flag.
    VitePWA({
      injectRegister: false,
      registerType: 'prompt',
      manifestFilename: 'manifest.webmanifest',
      manifest: {
        name: 'AgroLeaf AI — ধানের পাতার রোগ',
        short_name: 'AgroLeaf AI',
        description: 'ধানের পাতার রোগ শনাক্তকরণ ও পরামর্শ সেবা (on-device rice leaf disease screening)',
        lang: 'bn',
        dir: 'ltr',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        theme_color: '#1f6b3a',
        background_color: '#f7f5ef',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell, data, samples and icons are small enough to precache.
        // Voice clips are not: Chrome answers a fetch() of a .mp3 URL with 204
        // (media cache), so they are runtime cached and warmed by PwaStatus.
        // The ONNX models and ONNX Runtime wasm (~30 MB) stay runtime-cached below.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,ico,json,webmanifest,woff2}'],
        globIgnores: [
          'models/**',
          'ort/**',
          'assets/*.wasm',
          'accuracy/**',
          'brand/aignite-sticker-original.png',
          'data/parity_samples.json',
        ],
        maximumFileSizeToCacheInBytes: 35 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/models\//, /^\/ort\//, /^\/data\//, /^\/audio\//, /^\/samples\//],
        cleanupOutdatedCaches: true,
        // registerType 'prompt' leaves the new worker waiting; the notice in
        // PwaStatus calls updateServiceWorker() when the farmer taps reload.
        skipWaiting: false,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: MODEL_URL_PATTERN,
            handler: 'CacheFirst',
            options: {
              cacheName: MODEL_CACHE_NAME,
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Voice clips. PwaStatus fills this cache with full 200 responses
            // (fetched with Range: bytes=0-), and RangeRequestsPlugin turns
            // them back into partial responses for the <audio> element.
            urlPattern: AUDIO_URL_PATTERN,
            handler: 'CacheFirst',
            options: {
              cacheName: AUDIO_CACHE_NAME,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [200] },
              rangeRequests: true,
            },
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    // Exclude onnxruntime-web from Vite pre-bundling to prevent WebAssembly / worker resolution issues
    exclude: ['onnxruntime-web'],
  },
})
