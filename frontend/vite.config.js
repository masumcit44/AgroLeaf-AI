import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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
  ],
  optimizeDeps: {
    // Exclude onnxruntime-web from Vite pre-bundling to prevent WebAssembly / worker resolution issues
    exclude: ['onnxruntime-web'],
  },
})
