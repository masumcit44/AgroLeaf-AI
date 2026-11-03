// End-to-end voice check through the real UI: upload -> analyse -> press Listen -> is the clip really playing?
// Usage: node e2e_audio_live.mjs <baseUrl> [files.json]
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
  console.log('No test images found. Skipping e2e_audio_live check.');
  process.exit(0);
}

const ANALYSE = 'পরীক্ষা করুন';
const PLAY_LABEL = 'ব্যাখ্যা অডিও শুনুন';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: true,
  args: ['--autoplay-policy=user-gesture-required', '--no-sandbox'],
});

let bad = 0;
try {
  for (const f of FILES) {
    const page = await browser.newPage();
    const errs = [];
    page.on('console', (m) => ['error', 'warn', 'warning'].includes(m.type()) && errs.push(m.text()));
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle0' });
    const input = await page.$('input[type=file]:not([capture])');
    if (!input) {
      bad++;
      console.log(`FAIL  file input not found`);
      await page.close();
      continue;
    }
    await input.uploadFile(f);
    await sleep(1200);
    await page.evaluate((s) => [...document.querySelectorAll('button')].find((b) => b.innerText.includes(s))?.click(), ANALYSE);
    await page.waitForFunction((a) => !document.body.innerText.includes(a) && /সম্ভাব্য সমস্যা|সুস্থ পাতা|নিশ্চিত নই/.test(document.body.innerText), { timeout: 60000 }, ANALYSE).catch(() => {});
    const btn = await page.$(`button[aria-label="${PLAY_LABEL}"]`);
    let r;
    if (!btn) r = { player: 'NONE' };
    else {
      await btn.click();
      await sleep(2500);
      r = await page.evaluate(() => {
        const a = document.querySelector('audio');
        return a ? { src: a.getAttribute('src'), t: +a.currentTime.toFixed(2), paused: a.paused, err: a.error && a.error.code } : { player: 'GONE after click' };
      });
    }
    const title = await page.evaluate(() => (document.querySelector('h2,h1')?.innerText || '').split('\n')[0]);
    const ok = r.t > 0.5 && !r.paused;
    if (!ok) bad++;
    console.log(`${ok ? 'PLAYS ' : 'FAIL  '} ${f.split(/[\\/]/).pop().padEnd(36)} ${title.padEnd(22)} ${JSON.stringify(r)} ${errs.length ? errs.join(' | ').slice(0, 160) : ''}`);
    await page.close();
  }
} finally {
  await browser.close();
}

console.log(bad ? `${bad} result screens without a working voice` : 'voice plays on every result screen');
process.exitCode = bad ? 1 : 0;
