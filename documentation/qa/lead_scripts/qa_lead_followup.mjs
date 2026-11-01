// Follow-up checks for C4 (bad files), E3 (audio without MP3s) and E7 (share/copy).
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const puppeteer = createRequire(path.join(REPO, 'frontend', 'package.json'))('puppeteer-core');
const [BASE, IN] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const ctx = b.defaultBrowserContext();
await ctx.overridePermissions(BASE, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
for (const f of ['anim.gif', 'doc.pdf', 'notimage.jpg']) {
  await p.goto('about:blank'); await p.goto(`${BASE}/#/`, { waitUntil: 'networkidle0' });
  await (await p.$('input[type=file]:not([capture])')).uploadFile(path.join(IN, f)); await sleep(1500);
  const t = await p.evaluate(() => document.body.innerText);
  console.log(`C4 ${f}:`, t.split('\n').filter((l) => /শুধু ছবি|খোলা যাচ্ছে না|ছবি/.test(l)).slice(0, 3).join(' / '));
}
await p.goto('about:blank'); await p.goto(`${BASE}/#/`, { waitUntil: 'networkidle0' });
await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.innerText.includes('ব্লাস্ট রোগ')).click()); await sleep(800);
await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.innerText.includes('পরীক্ষা করুন')).click()); await sleep(6000);
const audioReqs = []; p.on('request', (r) => r.url().includes('/audio/') && audioReqs.push(r.url()));
p.on('response', (r) => r.url().includes('/audio/') && audioReqs.push(`${r.status()} ${r.headers()['content-type']}`));
errs.length = 0;
await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.innerText.includes('শুনুন')).click()); await sleep(2500);
const audioUi = await p.evaluate(() => [...document.querySelectorAll('button, [role=status], p, span')].map((e) => e.innerText.trim()).filter((s) => /শুনুন|থামান|বিরতি|অডিও|কণ্ঠ|চালানো|পাওয়া/.test(s)).slice(0, 6));
console.log('E3 requests:', audioReqs.join(' ; ') || 'none', '| ui:', JSON.stringify(audioUi), '| errors:', errs.join(' ; ') || 'none');
await p.evaluate(() => navigator.clipboard.writeText('BEFORE'));
errs.length = 0;
const hasShare = await p.evaluate(() => typeof navigator.share);
await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.innerText.includes('শেয়ার')).click()); await sleep(1500);
const clip = await p.evaluate(() => navigator.clipboard.readText());
const ui = await p.evaluate(() => document.body.innerText.split('\n').filter((l) => /কপি|শেয়ার/.test(l)).join(' / '));
console.log('E7 navigator.share:', hasShare, '| clipboard:', JSON.stringify(clip), '| ui:', ui, '| errors:', errs.join(' ; ') || 'none');
await b.close();
