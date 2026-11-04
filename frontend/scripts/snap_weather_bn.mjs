import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function snap() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('agroleaf_lang', 'bn');
  });
  await page.goto('https://agroleaf-ai.pages.dev/?features=weatherReport#/weather', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(el => el.innerText.includes('এলাকা') || el.innerText.includes('বদলান'));
    b?.click();
  });
  await new Promise(r => setTimeout(r, 500));
  const input = await page.$('input[type="text"]');
  if (input) {
    await input.type('Savar');
    await page.keyboard.press('Enter');
    await page.waitForSelector('div[class*="overflow-y-auto"] button', { timeout: 6000 }).catch(() => {});
    await page.evaluate(() => {
      document.querySelector('div[class*="overflow-y-auto"] button')?.click();
    });
    await new Promise(r => setTimeout(r, 3500));
  }

  // Scroll down to the disease concerns section
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('h2')].find(h => h.innerText.includes('অনুকূল আবহাওয়া'));
    el?.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 1000));

  const outPath = path.resolve(__dirname, '../../documentation/features/F8v2_WEATHER_REPORT/screenshots/07_disease_section_bn.png');
  await page.screenshot({ path: outPath, fullPage: false });
  console.log('Saved disease section screenshot to:', outPath);
  await browser.close();
}
snap().catch(console.error);
