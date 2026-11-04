// Responsive audit: every main screen at phone/tablet/desktop widths. Reports horizontal
// overflow, elements past the right edge, and tap targets smaller than 40x40 px.
// Usage: node scripts/responsive_audit.mjs [baseUrl]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const BASE = process.argv[2] || 'https://agroleaf-ai.pages.dev';
const WIDTHS = [320, 360, 375, 390, 393, 412, 430, 768, 1366];
const ROUTES = ['#/', '#/profile', '#/copilot', '#/reminders', '#/history', '#/weather', 'RESULT'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage();
const problems = [];
for (const w of WIDTHS) {
  await page.setViewport({ width: w, height: w < 768 ? 800 : 900, isMobile: w < 768, hasTouch: w < 768 });
  for (const route of ROUTES) {
    if (route === 'RESULT') {
      await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle0' });
      await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('ব্লাস্ট রোগ'))?.click());
      await sleep(1200);
      await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('পরীক্ষা'))?.click());
      await page.waitForFunction(() => document.body.innerText.includes('১৬১২৩ কৃষি'), { timeout: 60000 }).catch(() => {});
    } else {
      await page.goto(`${BASE}/${route}`, { waitUntil: 'networkidle0' });
    }
    await sleep(800);
    const r = await page.evaluate(() => {
      const W = document.documentElement.clientWidth;
      const overflow = document.documentElement.scrollWidth - W;
      const visible = (e) => { const s = getComputedStyle(e); return s.visibility !== 'hidden' && s.display !== 'none' && e.offsetParent !== null; };
      const outside = [...document.querySelectorAll('body *')]
        .filter((e) => visible(e) && e.getBoundingClientRect().right > W + 1 && !e.closest('[data-testid="feature-tabs"]') && !e.closest('.leaflet-container'))
        .filter((e, _, all) => !all.includes(e.parentElement))
        .slice(0, 3)
        .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ').slice(0, 3).join('.')}「${(e.innerText || '').trim().slice(0, 25)}」`);
      const small = [...document.querySelectorAll('button, a[href], input, select, textarea, [role="button"]')]
        .filter((e) => visible(e))
        .filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && (b.height < 40 || b.width < 40) && !(e.tagName === 'A' && getComputedStyle(e).display === 'inline'); })
        .slice(0, 4)
        .map((e) => { const b = e.getBoundingClientRect(); return `${Math.round(b.width)}x${Math.round(b.height)}「${(e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 18)}」`; });
      return { overflow, outside, small };
    });
    if (r.overflow > 1 || r.outside.length) problems.push(`[${w}] ${route} overflow=${r.overflow}px outside=${r.outside.join(' | ')}`);
    if (w <= 430 && r.small.length) problems.push(`[${w}] ${route} small-targets: ${r.small.join(' | ')}`);
  }
}
await browser.close();
console.log(problems.length ? problems.join('\n') : 'NO PROBLEMS');
