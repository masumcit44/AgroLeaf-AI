// Captures the deck/README screenshots from a live build at phone size (390x844, 2x).
// Usage: node scripts/capture_release_screens.mjs <baseUrl> <outDir>
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const [, , BASE = 'https://deploy-candidate-ready.agroleaf-ai.pages.dev', OUT = '../documentation/screenshots/release'] = process.argv;
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clickText = (page, text) =>
  page.evaluate((t) => {
    const b = [...document.querySelectorAll('button, a')].find((el) => el.textContent.includes(t));
    if (b) b.click();
    return Boolean(b);
  }, text);

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--lang=bn-BD', '--autoplay-policy=user-gesture-required'],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle0' });
await sleep(1500);
await page.screenshot({ path: `${OUT}/01_home.png` });

await clickText(page, 'ব্লাস্ট রোগ');
await sleep(1500);
await clickText(page, 'পরীক্ষা');
await page.waitForFunction(() => document.body.innerText.includes('১৬১২৩ কৃষি'), { timeout: 60000 });
await sleep(1500);
await page.screenshot({ path: `${OUT}/02_result_blast.png` });

await page.goto(`${BASE}/#/copilot`, { waitUntil: 'networkidle0' });
await sleep(1500);
await page.evaluate(() => {
  const input = document.querySelector('textarea, input[type="text"]');
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value').set;
  setter.call(input, 'টুংরো হলে কী করব?');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.closest('form')?.requestSubmit();
});
await sleep(3500);
await page.evaluate(() => {
  const el = [...document.querySelectorAll('button')].find((b) => /শুনুন|থামান/.test(b.textContent));
  el?.scrollIntoView({ block: 'center' });
});
await sleep(800);
await page.screenshot({ path: `${OUT}/04_voice_assistant.png` });

await browser.close();
console.log('saved 01_home, 02_result_blast, 04_voice_assistant to', OUT);
