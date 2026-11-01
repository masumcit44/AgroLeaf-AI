import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const ortDistDir = path.resolve(projectRoot, 'node_modules', 'onnxruntime-web', 'dist');
const targetOrtDir = path.resolve(projectRoot, 'public', 'ort');

const REQUIRED_FILES = [
  'ort-wasm-simd-threaded.wasm',
  'ort-wasm-simd-threaded.mjs',
];

console.log('[copy-ort] Checking and copying ONNX Runtime WebAssembly CPU assets...');

if (!fs.existsSync(ortDistDir)) {
  console.error(`[copy-ort] ERROR: onnxruntime-web dist folder not found at: ${ortDistDir}`);
  console.error('[copy-ort] Run "npm install onnxruntime-web@1.31.1 --save-exact" first.');
  process.exit(1);
}

fs.mkdirSync(targetOrtDir, { recursive: true });

for (const fileName of REQUIRED_FILES) {
  const src = path.join(ortDistDir, fileName);
  const dest = path.join(targetOrtDir, fileName);

  if (!fs.existsSync(src)) {
    console.error(`[copy-ort] ERROR: Required asset missing: ${src}`);
    process.exit(1);
  }

  fs.copyFileSync(src, dest);
  const sizeMb = (fs.statSync(dest).size / (1024 * 1024)).toFixed(2);
  console.log(`[copy-ort] Copied ${fileName} (${sizeMb} MiB) -> public/ort/${fileName}`);
}

console.log('[copy-ort] ONNX Runtime CPU WASM assets ready in public/ort/');
