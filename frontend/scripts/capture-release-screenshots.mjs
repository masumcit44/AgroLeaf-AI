#!/usr/bin/env node
/**
 * Captures the README / deck screenshots from a PRODUCTION preview build.
 *
 * The dev server cannot load ONNX Runtime's .mjs from /public, so screenshots
 * taken there show Vite's error overlay instead of a result. Always run:
 *   npm run build && npx vite preview --port 4173
 *   node scripts/capture-release-screenshots.mjs [baseUrl] [notSureImage]
 *
 * Writes documentation/screenshots/release/*.png (390x844, DPR 2).
 * Fails loudly if a screen does not show the expected text.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(REPO_ROOT, 'documentation', 'screenshots', 'release');
const BASE_URL = process.argv[2] || 'http://localhost:4173';
const NOT_SURE_IMAGE = path.resolve(
  process.argv[3] || path.join(OUT_DIR, 'inputs', 'not_sure_closeup.jpg')
);

const BROWSERS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickButtonWithText(page, text) {
  const clicked = await page.evaluate((t) => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.includes(t));
    if (btn) btn.click();
    return Boolean(btn);
  }, text);
  if (!clicked) throw new Error(`Button containing "${text}" not found`);
}

async function waitForText(page, text, timeout = 30000) {
  await page.waitForFunction((t) => document.body.innerText.includes(t), { timeout }, text);
}

async function shot(page, name) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);
  const file = path.join(OUT_DIR, name);
  await page.screenshot({ path: file });
  console.log(`[screenshots] wrote ${path.relative(REPO_ROOT, file)}`);
}

async function freshHome(page) {
  // A hash-only navigation keeps the result screen mounted, so force a real reload.
  await page.goto('about:blank');
  await page.goto(`${BASE_URL}/#/`, { waitUntil: 'networkidle0' });
  await waitForText(page, 'গ্যালারি');
}

async function main() {
  const browserPath = BROWSERS.find((p) => fs.existsSync(p));
  if (!browserPath) throw new Error('No Chrome/Edge found');
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

    // 1. Home
    await freshHome(page);
    await shot(page, '01_home.png');

    // 2. Real inference on the bundled blast sample
    await clickButtonWithText(page, 'ব্লাস্ট রোগ');
    await waitForText(page, 'পরীক্ষা করুন');
    await clickButtonWithText(page, 'পরীক্ষা করুন');
    await waitForText(page, 'Rice blast', 60000);
    await shot(page, '02_result_blast.png');

    // 3. Calibrated abstention on a too-close crop of a real leaf photo
    await freshHome(page);
    const input = await page.$('input[type="file"]:not([capture])');
    if (!input) throw new Error('Gallery file input not found');
    await input.uploadFile(NOT_SURE_IMAGE);
    await waitForText(page, 'পরীক্ষা করুন');
    await clickButtonWithText(page, 'পরীক্ষা করুন');
    await waitForText(page, 'নিশ্চিত নই', 60000);
    await shot(page, '03_not_sure.png');

    // 4. Accuracy page with the published metrics
    await page.goto(`${BASE_URL}/#/accuracy`, { waitUntil: 'networkidle0' });
    await waitForText(page, 'Macro-F1');
    await sleep(1000);
    await shot(page, '04_accuracy.png');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(`[screenshots] FAILED: ${err.message}`);
  process.exit(1);
});
