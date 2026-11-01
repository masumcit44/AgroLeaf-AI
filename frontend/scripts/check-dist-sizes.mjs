import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '..', 'dist');
const MAX_ALLOWED_BYTES = 25 * 1024 * 1024; // 25 MiB (Cloudflare Pages limit)

console.log('[check-dist-sizes] Checking dist file sizes against Cloudflare Pages 25 MiB ceiling...');

if (!fs.existsSync(distDir)) {
  console.error(`[check-dist-sizes] ERROR: dist directory not found: ${distDir}`);
  process.exit(1);
}

function getAllFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allFiles = getAllFiles(distDir);
let hasOversized = false;

for (const filePath of allFiles) {
  const stat = fs.statSync(filePath);
  const sizeBytes = stat.size;
  const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(2);
  const relPath = path.relative(distDir, filePath).replace(/\\/g, '/');

  if (sizeBytes >= MAX_ALLOWED_BYTES) {
    console.error(`[check-dist-sizes] ❌ OVERSIZED: ${relPath} is ${sizeMb} MiB (>= 25 MiB)!`);
    hasOversized = true;
  } else {
    // Only log larger assets (> 1 MiB) for clean build logs
    if (sizeBytes > 1024 * 1024) {
      console.log(`[check-dist-sizes] ✓ OK: ${relPath} (${sizeMb} MiB < 25 MiB)`);
    }
  }
}

if (hasOversized) {
  console.error('[check-dist-sizes] BUILD FAILED: One or more assets exceed Cloudflare Pages 25 MiB limit.');
  process.exit(1);
}

console.log('[check-dist-sizes] All assets verified under Cloudflare 25 MiB limit.');
