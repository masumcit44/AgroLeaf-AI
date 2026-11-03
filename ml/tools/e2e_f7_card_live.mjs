// Live check of the F7 card: present + expandable on a disease result, absent on healthy / not sure.
import { createRequire } from 'node:module';
const require = createRequire('D:/Desktop/AIgnite 2026/AgroLeaf_lead_worktree/frontend/package.json');
const puppeteer = require('puppeteer-core');
const [,, BASE, SHOT] = process.argv;
const IMG = 'D:/Desktop/AIgnite 2026/AgroLeaf_manual_test_images/';
const CASES = [['brown_spot/brown_spot_01.jpg', true], ['sheath_blight/sheath_blight_01.jpg', true], ['healthy/healthy_01.jpg', false], ['not_rice/not_rice_01_sticker.png', false]];
const TITLE = 'কীটনাশক কেনার আগে যাচাই করুন', TIP = 'কৃষি অফিসে নিবন্ধিত (লাইসেন্সধারী) ডিলারের';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
let bad = 0;
for (const [f, want] of CASES) {
  const p = await b.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.setViewport({ width: 390, height: 844 });
  await p.goto(`${BASE}/#/`, { waitUntil: 'networkidle0' });
  await (await p.$('input[type=file]:not([capture])')).uploadFile(IMG + f);
  await sleep(1200);
  await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.innerText.includes('পরীক্ষা করুন'))?.click());
  await p.waitForFunction(() => /সম্ভাব্য সমস্যা|সুস্থ পাতা|নিশ্চিত নই/.test(document.body.innerText) && !document.body.innerText.includes('পরীক্ষা করুন'), { timeout: 60000 }).catch(() => {});
  const shown = await p.evaluate((t) => document.body.innerText.includes(t), TITLE);
  let opened = null;
  if (shown) {
    await p.evaluate((t) => [...document.querySelectorAll('button')].find((x) => x.innerText.includes(t)).click(), TITLE);
    await sleep(300);
    opened = await p.evaluate((t) => document.body.innerText.includes(t), TIP);
    if (SHOT && f.startsWith('brown')) {
      const el = await p.evaluateHandle((t) => [...document.querySelectorAll('button')].find((x) => x.innerText.includes(t)).parentElement, TITLE);
      await el.screenshot({ path: SHOT });
    }
  }
  const ok = shown === want && (!want || opened) && !errs.length;
  if (!ok) bad++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${f.padEnd(36)} card shown=${shown} expected=${want} expands=${opened} errors=${errs.length}`);
  await p.close();
}
await b.close();
console.log(bad ? `${bad} F7 checks failed` : 'F7 card correct on all cases');
