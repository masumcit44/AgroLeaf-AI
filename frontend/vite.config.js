import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    // Exclude onnxruntime-web from Vite pre-bundling to prevent WebAssembly / worker resolution issues
    exclude: ['onnxruntime-web'],
  },
})
