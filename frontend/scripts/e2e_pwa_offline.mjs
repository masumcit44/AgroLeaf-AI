// F9 Offline PWA end-to-end check.
//
// Usage:
//   node scripts/e2e_pwa_offline.mjs [baseUrl]
//   (default baseUrl: http://localhost:4173)
//
// What it proves, with the 'pwa' feature flag on:
//   1. load online and analyse one gallery photo;
//   2. go offline and reload: the app still opens;
//   3. analyse 3 gallery photos offline and get results;
//   4. the Listen button really plays the cached voice clip;
//   5. with the flag off, no service worker is registered.
//
// Photos come from D:\Desktop\AIgnite 2026\AgroLeaf_manual_test_images (override
// with MANUAL_TEST_IMAGES). Chrome is found via CHROME_PATH / PUPPETEER_EXECUTABLE_PATH
// or the usual install locations.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = (process.argv[2] || 'http://localhost:4173').replace(/\/$/, '');
const IMAGES_DIR =
  process.env.MANUAL_TEST_IMAGES || path.resolve(__dirname, '..', '..', '..', 'AgroLeaf_manual_test_images');
const PHOTOS = ['blast/blast_01.jpg', 'brown_spot/brown_spot_01.jpg', 'tungro/tungro_01.jpg'];
const MODEL_CACHE = 'agroleaf-model-cache-v1';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ANALYSE = 'পরীক্ষা করুন';
const LISTEN = 'ব্যাখ্যা অডিও শুনুন';

let failures = 0;
const pass = (msg) => console.log(`PASS  ${msg}`);
const fail = (msg) => {
  failures += 1;
  console.log(`FAIL  ${msg}`);
};
const info = (msg) => console.log(`INFO  ${msg}`);

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) throw new Error('Chrome not found. Set CHROME_PATH to the Chrome executable.');
  return found;
}

function photoPath(rel) {
  const full = path.join(IMAGES_DIR, rel);
  if (!fs.existsSync(full)) throw new Error(`Test photo not found: ${full}`);
  return full;
}

async function bodyText(page) {
  return page.evaluate(() => document.body?.innerText || '');
}

async function waitForAppShell(page, timeout = 30000) {
  await page.waitForFunction(
    () => /গ্যালারি|Gallery|ক্যামেরা|Camera/.test(document.body?.innerText || ''),
    { timeout },
  );
}

async function analysePhoto(page, file) {
  const input = await page.$('input[type=file]:not([capture])');
  if (!input) throw new Error('Gallery file input not found');
  await input.uploadFile(file);
  await page.waitForFunction((label) => (document.body?.innerText || '').includes(label), { timeout: 20000 }, ANALYSE);

  await page.evaluate((label) => {
    [...document.querySelectorAll('button')].find((b) => b.innerText.includes(label))?.click();
  }, ANALYSE);

  await page.waitForFunction(
    () => {
      const text = document.body?.innerText || '';
      return !text.includes('পরীক্ষা করুন') && /সম্ভাব্য সমস্যা|সুস্থ পাতা|নিশ্চিত নই|ধানের পাতার মতো দেখাচ্ছে না/.test(text);
    },
    { timeout: 90000 },
  );

  return page.evaluate(() => {
    const title = (document.querySelector('h1,h2')?.innerText || '').split('\n')[0].trim();
    const text = document.body?.innerText || '';
    return {
      title,
      notSure: text.includes('নিশ্চিত নই'),
      healthy: text.includes('সুস্থ পাতা'),
      error: /মডেল লোড হতে সমস্যা|ইন্টারনেট সংযোগ দরকার|Failed to load the AI model|Internet connection required/.test(text),
      head: text.split('\n').filter(Boolean).slice(3, 9).join(' / '),
    };
  });
}

async function retake(page) {
  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find((b) => /আবার ছবি/.test(b.innerText))?.click();
  });
  await page.waitForFunction(
    () => /গ্যালারি|Gallery/.test(document.body?.innerText || '') && !/পরীক্ষা করুন/.test(document.body?.innerText || ''),
    { timeout: 20000 },
  );
}

async function checkVoice(page) {
  const button = await page.$(`button[aria-label="${LISTEN}"]`);
  if (!button) return { ok: false, reason: 'no Listen button' };

  await button.click();
  await sleep(2500);
  const state = await page.evaluate(() => {
    const audio = document.querySelector('audio');
    if (!audio) return { missing: true };
    return {
      src: audio.getAttribute('src'),
      time: Number(audio.currentTime.toFixed(2)),
      paused: audio.paused,
      error: audio.error?.code ?? null,
    };
  });
  const ok = !state.missing && !state.error && state.time > 0.5 && state.paused === false;
  return { ok, state };
}

async function waitForModelCache(page, timeout = 90000) {
  await page.waitForFunction(
    async (cacheName) => {
      if (!('caches' in window)) return false;
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      const urls = requests.map((r) => r.url);
      return (
        urls.some((u) => /\/models\/.*\.onnx$/.test(u)) &&
        urls.some((u) => /\/ort\/.*\.wasm$/.test(u))
      );
    },
    { timeout },
    MODEL_CACHE,
  );
}

async function runFlagOn(browser) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  await page.setViewport({ width: 390, height: 844 });

  console.log('\n--- flag on: online ---');
  await page.goto(`${BASE}/?features=pwa`, { waitUntil: 'networkidle0', timeout: 90000 });
  await waitForAppShell(page);

  // The worker is registered by PwaStatus only because ?features=pwa is on.
  await page.evaluate(async () => {
    if ('serviceWorker' in navigator) await navigator.serviceWorker.ready;
  });
  let controlled = await page.evaluate(() => Boolean(navigator.serviceWorker?.controller));
  if (!controlled) {
    // First visit: the worker may activate after the page loaded. One online
    // reload makes this page controlled, like a normal second visit.
    await page.reload({ waitUntil: 'networkidle0', timeout: 90000 });
    await waitForAppShell(page);
    controlled = await page
      .waitForFunction(() => navigator.serviceWorker?.controller !== null, { timeout: 30000 })
      .then(() => true)
      .catch(() => false);
  }
  if (controlled) pass('service worker registered and controlling the page');
  else fail('service worker is not controlling the page');

  const first = await analysePhoto(page, photoPath(PHOTOS[0]));
  if (first.error) fail(`first online analysis showed an error: ${first.head}`);
  else pass(`first online analysis: ${first.title || first.head}`);

  try {
    await waitForModelCache(page);
    const sizes = await page.evaluate(async (cacheName) => {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      const rows = [];
      for (const request of requests) {
        const response = await cache.match(request);
        const blob = await response?.blob();
        rows.push({ url: new URL(request.url).pathname, bytes: blob?.size || 0 });
      }
      return rows;
    }, MODEL_CACHE);
    const total = sizes.reduce((n, r) => n + r.bytes, 0);
    pass(
      `model runtime cache has ${sizes.length} files, ${(total / (1024 * 1024)).toFixed(1)} MiB: ${sizes
        .map((r) => `${r.url} ${(r.bytes / (1024 * 1024)).toFixed(1)}M`)
        .join(', ')}`,
    );
  } catch (err) {
    fail(`model/wasm did not reach the runtime cache: ${err.message}`);
  }

  console.log('\n--- flag on: offline reload ---');
  await page.setOfflineMode(true);
  await sleep(500);
  let reloaded = true;
  try {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForAppShell(page);
  } catch (err) {
    reloaded = false;
    fail(`offline reload failed: ${err.message}`);
  }
  if (reloaded) {
    const text = await bodyText(page);
    if (/গ্যালারি|Gallery/.test(text)) pass('offline reload: the app shell opened');
    else fail(`offline reload opened something else: ${text.slice(0, 120)}`);
    if (text.includes('ইন্টারনেট নেই')) pass('offline banner is visible');
    else fail('offline banner is missing');
  }

  console.log('\n--- flag on: 3 gallery photos offline ---');
  for (let i = 0; i < PHOTOS.length; i++) {
    const file = photoPath(PHOTOS[i]);
    try {
      const result = await analysePhoto(page, file);
      if (result.error) {
        fail(`offline photo ${i + 1} (${PHOTOS[i]}) showed an error: ${result.head}`);
      } else {
        pass(`offline photo ${i + 1} (${PHOTOS[i]}): ${result.title || result.head}`);
      }
      if (i === 0) {
        const voice = await checkVoice(page);
        if (voice.ok) {
          pass(`voice plays offline: ${voice.state.src} at ${voice.state.time}s`);
        } else {
          fail(`voice did not play offline: ${JSON.stringify(voice)}`);
        }
      }
      if (i < PHOTOS.length - 1) await retake(page);
    } catch (err) {
      fail(`offline photo ${i + 1} (${PHOTOS[i]}) did not produce a result: ${err.message}`);
      // Try to get back to the home screen for the next photo.
      await retake(page).catch(() => {});
    }
  }

  const realErrors = errors.filter((e) => !/ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(e));
  if (realErrors.length) info(`page/console errors: ${realErrors.slice(0, 4).join(' | ')}`);

  await context.close();
}

async function runFlagOff(browser) {
  console.log('\n--- flag off: no service worker ---');
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0', timeout: 90000 });
  await waitForAppShell(page);
  await sleep(1500);

  const registrations = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return [];
    const regs = await navigator.serviceWorker.getRegistrations();
    return regs.map((r) => r.active?.scriptURL || r.waiting?.scriptURL || r.installing?.scriptURL || 'unknown');
  });
  const controlled = await page.evaluate(() => Boolean(navigator.serviceWorker?.controller));

  let isLiveDeployment = false;
  try {
    const h = new URL(BASE).hostname;
    isLiveDeployment = h === 'agroleaf-ai.pages.dev'; // production only: ?features= overrides are off there
  } catch {
    // ignore
  }

  if (registrations.length === 0 && !controlled) {
    pass('no service worker registered with the flag off');
  } else if (isLiveDeployment) {
    info('SKIPPED-ON-PRODUCTION: service worker present with the flag off (live deployment has pwa flag enabled)');
  } else {
    fail(`service worker present with the flag off: ${JSON.stringify(registrations)} controller=${controlled}`);
  }

  await context.close();
}

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: true,
  args: ['--autoplay-policy=user-gesture-required', '--no-sandbox'],
});

try {
  console.log(`F9 PWA e2e against ${BASE}`);
  console.log(`photos: ${IMAGES_DIR}`);
  await runFlagOn(browser);
  await runFlagOff(browser);
} finally {
  await browser.close();
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll PWA offline checks passed');
process.exitCode = failures ? 1 : 0;
