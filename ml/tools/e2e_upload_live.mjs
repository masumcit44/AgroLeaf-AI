// End-to-end upload check through the real UI: home -> choose file -> analyse -> read the verdict.
// Usage: node e2e_upload.mjs <baseUrl> <file>...
import { createRequire } from 'node:module';
const require = createRequire('D:/Desktop/AIgnite 2026/AgroLeaf_lead_worktree/frontend/package.json');
const puppeteer = require('puppeteer-core');
const BASE = process.argv[2]; const FILES = JSON.parse(require('node:fs').readFileSync(process.argv[3], 'utf-8'));
const ANALYSE = 'পরীক্ষা করুন';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const verdict = (t) =>
  t.includes('ধানের পাতার মতো দেখাচ্ছে না') ? 'NOT_SURE: not a rice leaf'
    : t.includes('জানা ৫টি রোগের মধ্যে পড়ে') ? 'NOT_SURE: other rice problem'
      : t.includes('যথেষ্ট নিশ্চিত নই') ? 'NOT_SURE: healthy caution'
        : /আমি নিশ্চিত নই/.test(t) ? 'NOT_SURE'
          : /সম্ভাব্য সমস্যা/.test(t) ? `DISEASE: ${(t.split('\n').find((l) => /রোগ$/.test(l.trim())) || '?').trim()}`
            : /সুস্থ পাতা/.test(t) ? 'HEALTHY' : 'OTHER';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const errors = [];
try {
  for (const f of FILES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 });
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle0' });
    await (await page.$('input[type=file]:not([capture])')).uploadFile(f);
    await sleep(1200);
    await page.evaluate((s) => [...document.querySelectorAll('button')].find((b) => b.innerText.includes(s))?.click(), ANALYSE);
    await page.waitForFunction((a) => !document.body.innerText.includes(a) && /সম্ভাব্য সমস্যা|সুস্থ পাতা|নিশ্চিত নই/.test(document.body.innerText), { timeout: 60000 }, ANALYSE).catch(() => {});
    console.log(`${f.split(/[\\/]/).pop().padEnd(40)} -> ${verdict(await page.evaluate(() => document.body.innerText))}`);
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(errors.length ? `console/page errors: ${[...new Set(errors)].join(' | ')}` : 'no console or page errors');
