// End-to-end check of the user-guided crop on a preview (flag user_guided_crop via ?features=).
// Phone viewport, touch emulation, CPU slowed 4x (mid-range Android proxy). Offline after warm-up.
// Usage: node e2e_crop_live.mjs <baseUrl> <outDir>
import { createRequire } from 'node:module';
const require = createRequire('D:/Desktop/AIgnite 2026/AgroLeaf_lead_worktree/frontend/package.json');
const puppeteer = require('puppeteer-core');
const [,, BASE, OUT] = process.argv;
const IMG = 'D:/Desktop/AIgnite 2026/AgroLeaf_manual_test_images/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const text = (p) => p.evaluate(() => document.body.innerText);
const click = (p, label) => p.evaluate((l) => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.includes(l)); if (b) b.click(); return Boolean(b); }, label);
const waitResult = (p) => p.waitForFunction(() => document.querySelector('[data-testid="crop-note"]') || /উচ্চ আস্থা|নিশ্চিত নই|মাঝারি আস্থা/.test(document.body.innerText) && document.body.innerText.includes('আবার ছবি তুলুন'), { timeout: 60000 });
const checks = [];
const ok = (name, cond, extra = '') => { checks.push([name, cond]); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${extra}`); };

const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await p.emulate({ viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, userAgent: 'Mozilla/5.0 (Linux; Android 12) Chrome/130 Mobile' });
const cdp = await p.createCDPSession();

// warm up: load the model once online
await p.goto(`${BASE}/?features=user_guided_crop#/`, { waitUntil: 'networkidle0' });
await (await p.$('input[type=file]:not([capture])')).uploadFile(IMG + 'unsupported_disease/bacterial_leaf_blight_01.jpg');
await sleep(1200);
ok('preview shows "focus on the diseased leaf"', (await text(p)).includes('আক্রান্ত পাতায় ফোকাস করুন'));

// now offline + slow CPU
await p.setOfflineMode(true);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await click(p, 'আক্রান্ত পাতায় ফোকাস করুন');
await p.waitForSelector('[data-testid="crop-box"]');
ok('crop screen opens offline', true);
await p.screenshot({ path: `${OUT}/crop_screen_bn.png` });

const before = await p.$eval('[data-testid="crop-box"]', (el) => el.getAttribute('aria-label'));
const boxRect = await p.$eval('[data-testid="crop-box"]', (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
// move by dragging the middle, then resize from the bottom-right handle (mouse drives pointer events)
await p.mouse.move(boxRect.x + boxRect.w / 2, boxRect.y + boxRect.h / 2);
await p.mouse.down(); await p.mouse.move(boxRect.x + boxRect.w / 2 - 30, boxRect.y + boxRect.h / 2 - 20, { steps: 5 }); await p.mouse.up();
const se = await p.$eval('[data-testid="crop-handle-se"]', (el) => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height }; });
ok('resize handle touch target ≥ 44 px', se.w >= 44 && se.h >= 44, `(${se.w}x${se.h})`);
await p.mouse.move(se.x, se.y); await p.mouse.down(); await p.mouse.move(se.x + 25, se.y + 35, { steps: 5 }); await p.mouse.up();
const afterDrag = await p.$eval('[data-testid="crop-box"]', (el) => el.getAttribute('aria-label'));
ok('drag/resize changes the selection', afterDrag !== before, `${before} -> ${afterDrag}`);

// keyboard
await p.focus('[data-testid="crop-box"]');
await p.keyboard.down('Shift'); await p.keyboard.press('ArrowDown'); await p.keyboard.up('Shift');
const afterKey = await p.$eval('[data-testid="crop-box"]', (el) => el.getAttribute('aria-label'));
ok('Shift+Arrow resizes the box (keyboard)', afterKey !== afterDrag, afterKey);

// Crop cost itself: the exact operation cropCanvas performs (drawImage of the selected region of
// the decoded photo into a new canvas), on the real photo, CPU 4x slower. Median of 5 runs.
const cropTimes = await p.evaluate(() => {
  const src = document.querySelector('[data-testid="crop-viewport"] canvas');
  const out = [];
  for (let i = 0; i < 5; i++) {
    const t = performance.now();
    const c = document.createElement('canvas'); c.width = 600; c.height = 600;
    c.getContext('2d').drawImage(src, 100, 100, 600, 600, 0, 0, 600, 600);
    c.getContext('2d').getImageData(0, 0, 1, 1); // force the copy to finish
    out.push(performance.now() - t); c.width = 0;
  }
  return out.sort((a, b) => a - b);
});
ok('crop operation < 500 ms (CPU 4x throttled)', cropTimes[2] < 500, `(median ${cropTimes[2].toFixed(1)} ms, max ${cropTimes[4].toFixed(1)} ms)`);
// For information: tap -> "analysing" screen (includes the model's own preprocessing, same as without crop)
const t0 = Date.now();
await click(p, 'এই অংশ পরীক্ষা করুন');
await p.waitForFunction(() => /বিশ্লেষণ|পরীক্ষা করা হচ্ছে|মডেল/.test(document.body.innerText) || document.querySelector('[data-testid="crop-note"]'), { timeout: 20000 }).catch(() => {});
console.log(`INFO  tap -> analysing screen: ${Date.now() - t0} ms (includes model preprocessing)`);
await waitResult(p);
const r1 = await text(p);
ok('result (offline) says only the selected area was analysed', r1.includes('শুধু আপনার বেছে নেওয়া অংশ পরীক্ষা করা হয়েছে'));
ok('result offers "select a different area"', r1.includes('অন্য অংশ বেছে নিন'));
await p.screenshot({ path: `${OUT}/crop_result_bn.png`, fullPage: true });

// re-crop keeps the original photo and the last box; then analyse the full image
await click(p, 'অন্য অংশ বেছে নিন');
await p.waitForSelector('[data-testid="crop-box"]');
const reBox = await p.$eval('[data-testid="crop-box"]', (el) => el.getAttribute('aria-label'));
ok('re-crop reopens with the previous box', reBox === afterKey, reBox);
await click(p, 'পুরো ছবি পরীক্ষা করুন');
await waitResult(p);
const r2 = await text(p);
ok('"analyse full image" gives a result without the crop note', !r2.includes('শুধু আপনার বেছে নেওয়া অংশ'));
ok('no page errors', errs.length === 0, errs.join(' | '));
await b.close();
console.log(checks.every(([, c]) => c) ? 'ALL CROP CHECKS PASSED' : `${checks.filter(([, c]) => !c).length} CHECK(S) FAILED`);
