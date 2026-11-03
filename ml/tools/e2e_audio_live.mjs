// End-to-end voice check through the real UI: upload -> analyse -> press Listen -> is the clip really playing?
// Usage: node e2e_audio_live.mjs <baseUrl> <files.json>
import { createRequire } from 'node:module';
const require = createRequire('D:/Desktop/AIgnite 2026/AgroLeaf_lead_worktree/frontend/package.json');
const puppeteer = require('puppeteer-core');
const BASE = process.argv[2]; const FILES = JSON.parse(require('node:fs').readFileSync(process.argv[3], 'utf-8'));
const ANALYSE = 'পরীক্ষা করুন'; const PLAY_LABEL = 'ব্যাখ্যা অডিও শুনুন';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// The clip each screen should play: named results by their title, "not sure" screens by
// the explanation they show (the same rule as NotSureCard / notSureClipKey).
const DISEASE_TITLES = { 'সুস্থ পাতা': 'healthy', 'ব্লাস্ট রোগ': 'blast', 'বাদামী দাগ রোগ': 'brown_spot', 'টুংরো রোগ': 'tungro', 'খোল পোড়া রোগ': 'sheath_blight' };
const expectedClip = (text, title) =>
  text.includes('ধানের পাতার মতো দেখাচ্ছে না') ? 'not_rice'
    : text.includes('জানা ৫টি রোগের মধ্যে পড়ে') ? 'other_rice'
      : text.includes('পাতাটি সুস্থ মনে হতে পারে') ? 'healthy_caution'
        : DISEASE_TITLES[title.trim()] || (title.includes('নিশ্চিত নই') ? 'not_sure' : null);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
  args: ['--autoplay-policy=user-gesture-required'] });
let bad = 0;
try {
  for (const f of FILES) {
    const page = await browser.newPage();
    const errs = [];
    page.on('console', (m) => ['error', 'warn', 'warning'].includes(m.type()) && errs.push(m.text()));
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle0' });
    await (await page.$('input[type=file]:not([capture])')).uploadFile(f);
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
    const want = expectedClip(await page.evaluate(() => document.body.innerText), title);
    const plays = r.t > 0.5 && !r.paused;
    const right = Boolean(want) && r.src === `/audio/${want}-v1.mp3`;
    if (!plays || !right) bad++;
    console.log(`${plays && right ? 'PLAYS ' : plays ? 'WRONG ' : 'FAIL  '} ${f.split(/[\\/]/).pop().padEnd(36)} ${title.padEnd(22)} want=${want} ${JSON.stringify(r)} ${errs.length ? errs.join(' | ').slice(0, 160) : ''}`);
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(bad ? `${bad} result screens without the right working voice` : 'the right voice plays on every result screen');
