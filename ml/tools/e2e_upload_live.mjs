// End-to-end upload check through the real UI: home -> choose file -> analyse -> read the verdict.
// Usage: node e2e_upload_live.mjs <baseUrl> [files.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const frontendPkg = path.join(repoRoot, 'frontend', 'package.json');
const require = createRequire(frontendPkg);
const puppeteer = require('puppeteer-core');

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) throw new Error('Chrome not found. Set CHROME_PATH.');
  return found;
}

const BASE = (process.argv[2] || 'http://localhost:4173').replace(/\/$/, '');
const IMAGES_DIR = process.env.MANUAL_TEST_IMAGES || path.resolve(repoRoot, '..', 'AgroLeaf_manual_test_images');

let FILES = [];
if (process.argv[3] && fs.existsSync(process.argv[3])) {
  FILES = JSON.parse(fs.readFileSync(process.argv[3], 'utf-8'));
} else {
  FILES = ['blast/blast_01.jpg', 'brown_spot/brown_spot_01.jpg', 'tungro/tungro_01.jpg']
    .map((f) => path.join(IMAGES_DIR, f))
    .filter((p) => fs.existsSync(p));
}

if (!FILES.length) {
  console.log('No test images found. Skipping e2e_upload_live check.');
  process.exit(0);
}

const ANALYSE = 'পরীক্ষা করুন';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const verdict = (t) =>
  t.includes('ধানের পাতার মতো দেখাচ্ছে না') ? 'NOT_SURE: not a rice leaf'
    : t.includes('জানা ৫টি রোগের মধ্যে পড়ে') ? 'NOT_SURE: other rice problem'
      : t.includes('যথেষ্ট নিশ্চিত নই') ? 'NOT_SURE: healthy caution'
        : /আমি নিশ্চিত নই/.test(t) ? 'NOT_SURE'
          : /সম্ভাব্য সমস্যা/.test(t) ? `DISEASE: ${(t.split('\n').find((l) => /রোগ$/.test(l.trim())) || '?').trim()}`
            : /সুস্থ পাতা/.test(t) ? 'HEALTHY' : 'OTHER';

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: true,
  args: ['--no-sandbox'],
});

const errors = [];
try {
  for (const f of FILES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 });
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle0' });
    const input = await page.$('input[type=file]:not([capture])');
    if (!input) {
      errors.push('File input not found');
      await page.close();
      continue;
    }
    await input.uploadFile(f);
    await sleep(1200);
    await page.evaluate((s) => [...document.querySelectorAll('button')].find((b) => b.innerText.includes(s))?.click(), ANALYSE);
    await page.waitForFunction((a) => !document.body.innerText.includes(a) && /সম্ভাব্য সমস্যা|সুস্থ পাতা|নিশ্চিত নই/.test(document.body.innerText), { timeout: 60000 }, ANALYSE).catch(() => {});
    const v = verdict(await page.evaluate(() => document.body.innerText));
    console.log(`${f.split(/[\\/]/).pop().padEnd(40)} -> ${v}`);
    await page.close();
  }
} finally {
  await browser.close();
}

console.log(errors.length ? `console/page errors: ${[...new Set(errors)].join(' | ')}` : 'no console or page errors');
process.exitCode = errors.length ? 1 : 0;
