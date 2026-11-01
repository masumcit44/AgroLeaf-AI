#!/usr/bin/env node
/**
 * Lead tester's scripted checks for TEST_PLAN_v1 (sections B-L that a script can see).
 * Usage: node documentation/qa/lead_scripts/qa_lead.mjs <baseUrl> <inputsDir>
 * Prints one line per check: ID | PASS/FAIL/INFO | detail
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..');
const require = createRequire(path.join(REPO, 'frontend', 'package.json'));
const puppeteer = require('puppeteer-core');

const BASE = process.argv[2] || 'http://localhost:4174';
const IN = process.argv[3];
const SAMPLES = path.join(REPO, 'frontend', 'public', 'samples');
const METRICS = JSON.parse(fs.readFileSync(path.join(REPO, 'frontend', 'public', 'data', 'metrics-v1.json'), 'utf-8'));
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ANALYSE = 'পরীক্ষা করুন';
const BN = /[\u0980-\u09FF]/;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = (id, res, detail) => console.log(`${id} | ${res} | ${String(detail).replace(/\s+/g, ' ').slice(0, 400)}`);

async function newPage(browser, { width = 390, height = 844 } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  page._console = [];
  page.on('console', (m) => {
    if (['error', 'warn', 'warning'].includes(m.type())) page._console.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => page._console.push(`pageerror: ${e.message}`));
  return page;
}
const text = (page) => page.evaluate(() => document.body.innerText);
async function home(page) {
  await page.goto('about:blank');
  await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle0' });
}
async function clickText(page, t) {
  return page.evaluate((s) => {
    const el = [...document.querySelectorAll('button, a')].find((b) => b.innerText.includes(s));
    if (el) el.click();
    return Boolean(el);
  }, t);
}
async function upload(page, file) {
  const input = await page.$('input[type=file]:not([capture])');
  await input.uploadFile(file);
  await sleep(1500);
}
async function analyse(page) {
  await clickText(page, ANALYSE);
  await page
    .waitForFunction(
      (a) => !document.body.innerText.includes(a) && /সম্ভাব্য সমস্যা|সুস্থ পাতা|নিশ্চিত নই|ত্রুটি|Error|error/.test(document.body.innerText),
      { timeout: 60000 },
      ANALYSE
    )
    .catch(() => {});
  return text(page);
}
const verdict = (t) =>
  /আমি নিশ্চিত নই/.test(t) ? (t.includes('ধানের পাতার মতো দেখাচ্ছে না') ? 'not_sure/not_leaf' : t.includes('যথেষ্ট নিশ্চিত নই') ? 'not_sure/healthy_caution' : 'not_sure')
    : /সম্ভাব্য সমস্যা/.test(t) ? `disease:${(t.split('\n').find((l) => /রোগ$/.test(l.trim())) || '?').trim()}`
    : /সুস্থ পাতা/.test(t) && /উচ্চ আস্থা|মাঝারি আস্থা/.test(t) ? `healthy:${/উচ্চ আস্থা/.test(t) ? 'high' : 'MEDIUM'}` : 'other';

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
try {
  // ---------- B. shell ----------
  for (const [name, hash] of [['home', '#/'], ['accuracy', '#/accuracy'], ['about', '#/about']]) {
    const p = await newPage(browser);
    await p.goto(`${BASE}/${hash}`, { waitUntil: 'networkidle0' });
    await sleep(800);
    const sticker = await p.evaluate(() => [...document.images].some((i) => /AIgnite/i.test(i.alt) && i.naturalWidth > 0));
    out(`B1-${name}`, p._console.length ? 'FAIL' : 'PASS', p._console.join(' ; ') || 'no console errors/warnings');
    out(`B2-${name}`, sticker ? 'PASS' : 'FAIL', `sticker visible=${sticker}`);
    await p.close();
  }
  {
    const p = await newPage(browser);
    await home(p);
    const navs = await p.evaluate(() => [...document.querySelectorAll('header button, header a, nav button, nav a')].map((b) => ({ t: b.innerText.trim(), a: b.getAttribute('aria-label') || '', h: b.getAttribute('href') || '' })));
    out('B3-nav-items', 'INFO', JSON.stringify(navs));
    const seq = [];
    for (const lbl of ['accuracy', 'about']) {
      await p.evaluate((l) => {
        const el = [...document.querySelectorAll('header button, header a, nav button, nav a')].find((b) => (b.getAttribute('aria-label') || b.title || '').toLowerCase().includes(l) || (b.getAttribute('href') || '').includes(l));
        el && el.click();
      }, lbl);
      await sleep(600);
      seq.push(await p.evaluate(() => location.hash));
    }
    await p.goBack(); await sleep(500); seq.push(await p.evaluate(() => location.hash));
    await p.goForward(); await sleep(500); seq.push(await p.evaluate(() => location.hash));
    out('B3-nav', seq.join(',') === '#/accuracy,#/about,#/accuracy,#/about' ? 'PASS' : 'FAIL', `hash sequence ${seq.join(',')}`);

    await home(p);
    await clickText(p, 'EN');
    await sleep(500);
    const enLines = (await text(p)).split('\n').filter((l) => BN.test(l));
    out('B4-en-home', enLines.length ? 'FAIL' : 'PASS', enLines.length ? `Bangla left in EN mode: ${enLines.slice(0, 6).join(' / ')}` : 'no Bangla in EN mode');
    for (const hash of ['#/accuracy', '#/about']) {
      await p.goto(`${BASE}/${hash}`, { waitUntil: 'networkidle0' });
      const l = (await text(p)).split('\n').filter((x) => BN.test(x));
      out(`B4-en-${hash.slice(2)}`, l.length ? 'FAIL' : 'PASS', l.length ? `Bangla left in EN mode: ${l.slice(0, 6).join(' / ')}` : 'no Bangla in EN mode');
    }
    await p.reload({ waitUntil: 'networkidle0' });
    const persisted = !BN.test((await text(p)).split('\n').slice(0, 8).join(' '));
    out('B4-persist', persisted ? 'PASS' : 'FAIL', `EN kept after reload=${persisted}`);
    await p.evaluate(() => localStorage.clear());
    const meta = await p.evaluate(async () => ({
      title: document.title,
      icon: document.querySelector('link[rel*=icon]')?.getAttribute('href'),
      robots: await fetch('/robots.txt').then((r) => r.text()),
      lang: document.documentElement.lang,
    }));
    out('B5', meta.title && meta.icon ? 'PASS' : 'FAIL', JSON.stringify(meta));
    await p.close();
  }

  // ---------- C. inputs ----------
  {
    const p = await newPage(browser);
    for (const f of ['leaf.png', 'leaf.webp', 'big_4000x3000.jpg', 'tiny_64.jpg', 'anim.gif', 'doc.pdf', 'notimage.jpg']) {
      await home(p);
      p._console = [];
      await upload(p, path.join(IN, f));
      const t = await text(p);
      const reached = t.includes(ANALYSE);
      let res = reached ? verdict(await analyse(p)) : 'no preview';
      const shown = (await text(p)).split('\n').filter((l) => /সমর্থিত|ছবি নয়|ত্রুটি|পড়া যায়নি|error|Error|invalid|Invalid/.test(l)).slice(0, 2).join(' / ');
      out(`C-${f}`, 'INFO', `preview=${reached} result=${res} msg="${shown}" console=${p._console.join(' ; ') || 'none'}`);
    }
    await home(p);
    await upload(p, path.join(IN, 'exif_rot6.jpg'));
    const dims = await p.evaluate(() => { const c = document.querySelector('canvas'); return c ? [c.width, c.height] : null; });
    out('C6-exif', dims && dims[0] > dims[1] ? 'PASS' : 'FAIL', `preview canvas ${JSON.stringify(dims)} (correct orientation is landscape)`);
    await p.close();
  }

  // ---------- D/E. analysis and result card ----------
  {
    const ctx = await browser.createBrowserContext();
    const p = await ctx.newPage();
    await p.setViewport({ width: 390, height: 844 });
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    await p.goto(`${BASE}/#/`, { waitUntil: 'networkidle0' });
    await clickText(p, 'ব্লাস্ট রোগ');
    await sleep(800);
    const t0 = Date.now();
    await clickText(p, ANALYSE);
    let sawProgress = false;
    for (let i = 0; i < 40; i++) {
      const t = await text(p);
      if (/%|লোড|ডাউনলোড|অপেক্ষা|বিশ্লেষণ/.test(t) && t.includes('Rice blast') === false) sawProgress = true;
      if (t.includes('Rice blast') || t.includes('আমি নিশ্চিত নই')) break;
      await sleep(250);
    }
    out('D2', 'INFO', `cold first analysis ${Date.now() - t0} ms, progress text seen=${sawProgress}`);
    const card = await text(p);
    const chipLine = card.split('\n').find((l) => /আস্থা/.test(l)) || '';
    out('E1', /\d+\s*%/.test(card.split('এখন কী করবেন')[0]) ? 'FAIL' : 'PASS', `confidence chip "${chipLine}"; no percentage above actions`);
    const sections = ['এটা কী?', 'লক্ষণ', 'এখন কী করবেন', 'প্রতিরোধ'].map((s) => `${s}:${card.includes(s)}`).join(' ');
    out('E2-sections', sections.includes('false') ? 'FAIL' : 'PASS', sections);
    // audio
    await clickText(p, 'শুনুন');
    await sleep(1500);
    const afterAudio = await text(p);
    const audioLine = afterAudio.split('\n').filter((l) => /শুনুন|কণ্ঠ|অডিও|audio|থামান|বিরতি/.test(l)).slice(0, 4).join(' / ');
    out('E3', errs.length ? 'FAIL' : 'INFO', `after tapping play: "${audioLine}" errors=${errs.join(' ; ') || 'none'}`);
    const shown = await clickText(p, 'লেখা দেখুন');
    await sleep(500);
    out('E4', shown ? 'INFO' : 'FAIL', `show-text clicked=${shown}; now: ${(await text(p)).split('\n').filter((l) => /লেখা/.test(l)).join(' / ')}`);
    await clickText(p, 'সরকারি পরামর্শ');
    await sleep(500);
    const links = await p.evaluate(() => [...document.querySelectorAll('a')].map((a) => ({ h: a.getAttribute('href'), t: a.target, r: a.rel, txt: a.innerText.trim().slice(0, 30) })));
    const ext = links.filter((l) => /^https?:/.test(l.h || ''));
    out('E5', ext.every((l) => l.t === '_blank' && /noopener/.test(l.r)) ? 'PASS' : 'FAIL', JSON.stringify(ext));
    const tel = links.find((l) => (l.h || '').startsWith('tel:'));
    out('E6', tel && tel.h === 'tel:16123' && card.includes('কল চার্জ প্রযোজ্য হতে পারে') ? 'PASS' : 'FAIL', JSON.stringify(tel));
    await ctx.overridePermissions(BASE, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
    await clickText(p, 'শেয়ার');
    await sleep(800);
    const clip = await p.evaluate(() => navigator.clipboard.readText().catch((e) => `ERR ${e.message}`));
    const after = (await text(p)).split('\n').filter((l) => /কপি|শেয়ার|copied/i.test(l)).join(' / ');
    out('E7', 'INFO', `clipboard="${clip}" ui="${after}"`);
    await clickText(p, 'আবার ছবি তুলুন');
    await sleep(800);
    const backHome = (await text(p)).includes('গ্যালারি');
    out('E8', backHome ? 'PASS' : 'FAIL', `retake returns to home=${backHome}`);
    // D4 double click
    await clickText(p, 'বাদামী দাগ রোগ');
    await sleep(800);
    errs.length = 0;
    await p.evaluate((a) => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.includes(a)); b.click(); b.click(); }, ANALYSE);
    await sleep(5000);
    const dbl = await text(p);
    out('D4', errs.length ? 'FAIL' : 'PASS', `double-click result=${verdict(dbl)} errors=${errs.join(' ; ') || 'none'}`);
    // D5 navigate away mid-analysis
    await clickText(p, 'আবার ছবি তুলুন');
    await sleep(600);
    await clickText(p, 'টুংরো রোগ');
    await sleep(800);
    errs.length = 0;
    await clickText(p, ANALYSE);
    await p.evaluate(() => { location.hash = '#/about'; });
    await sleep(3000);
    await p.evaluate(() => { location.hash = '#/'; });
    await sleep(2000);
    out('D5', errs.length ? 'FAIL' : 'INFO', `after nav away+back: "${verdict(await text(p))}" first line="${(await text(p)).split('\n').slice(4, 6).join(' / ')}" errors=${errs.join(' ; ') || 'none'}`);
    // K3 reload on result
    await home(p);
    await clickText(p, 'সুস্থ পাতা');
    await sleep(800);
    await analyse(p);
    errs.length = 0;
    await p.reload({ waitUntil: 'networkidle0' });
    out('K3', errs.length ? 'FAIL' : 'PASS', `after reload on result: "${(await text(p)).split('\n').slice(4, 6).join(' / ')}" errors=${errs.join(' ; ') || 'none'}`);
    await ctx.close();
  }

  // ---------- F. safety gate ----------
  {
    const p = await newPage(browser);
    const cases = [
      ['F1', path.join(REPO, 'documentation/screenshots/release/inputs/not_sure_closeup.jpg'), /^not_sure$/],
      ['F2-sticker', path.join(REPO, 'assets/brand/aignite-sticker-original.png'), /not_leaf/],
      ['F3-blur', path.join(IN, 'blast_blur.jpg'), /not_sure|disease:ব্লাস্ট/],
    ];
    for (const s of ['healthy_1', 'blast_1', 'brown_spot_1', 'tungro_1', 'sheath_blight_1']) cases.push([`D3-${s}`, path.join(SAMPLES, `${s}.jpg`), null]);
    for (const [id, f, re] of cases) {
      await home(p);
      await upload(p, f);
      const t = await analyse(p);
      const v = verdict(t);
      const cands = t.includes('সম্ভাবনা আছে');
      const ok = re ? re.test(v) && !(id === 'F2-sticker' && cands) : !v.includes('MEDIUM') && v !== 'other';
      out(id, ok ? 'PASS' : 'FAIL', `${path.basename(f)} -> ${v}${cands ? ' +candidates' : ''}; 16123=${t.includes('১৬১২৩')} tips=${t.includes('দিনের আলো')} disclaimer=${t.includes('চূড়ান্ত রোগ নির্ণয় নয়')}`);
    }
    await p.close();
  }

  // ---------- G. accuracy numbers ----------
  {
    const p = await newPage(browser, { width: 360, height: 740 });
    await p.goto(`${BASE}/#/accuracy`, { waitUntil: 'networkidle0' });
    await sleep(800);
    const t = await text(p);
    const fm = (v) => `${(v * 100).toFixed(1)}%`;
    const need = [
      ['internal macro_f1', METRICS.internal_test.macro_f1], ['internal coverage', METRICS.internal_test.coverage],
      ['internal selective', METRICS.internal_test.selective_accuracy], ['internal ece', METRICS.internal_test.ece_after],
      ...METRICS.external.flatMap((e) => [[`${e.name.slice(0, 12)} f1`, e.macro_f1_mapped], [`${e.name.slice(0, 12)} cov`, e.coverage], [`${e.name.slice(0, 12)} unseen`, e.unseen_rejection_rate]]),
      ...METRICS.safety_gate.rows.flatMap((r) => [[`${r.label_en} before`, r.before], [`${r.label_en} after`, r.after]]),
      ...Object.entries(METRICS.internal_test.per_class).flatMap(([k, v]) => [[`${k} precision`, v.precision], [`${k} recall`, v.recall]]),
    ];
    const missing = need.filter(([, v]) => !t.includes(fm(v)));
    out('G1', missing.length ? 'FAIL' : 'PASS', missing.length ? `not found on page: ${missing.map(([n, v]) => `${n}=${fm(v)}`).join('; ')}` : `${need.length} numbers all present`);
    const imgs = await p.evaluate(() => [...document.images].map((i) => `${i.getAttribute('src')}:${i.naturalWidth}x${i.naturalHeight}`));
    out('G2', imgs.some((s) => /:0x0/.test(s)) ? 'FAIL' : 'PASS', imgs.join(' '));
    const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    out('G3', over > 0 ? 'FAIL' : 'PASS', `horizontal overflow ${over}px at 360`);
    const claims = (t.match(/100%|first|only|সেরা|প্রথম|একমাত্র/gi) || []);
    out('G4', 'INFO', `claim words found: ${claims.join(',') || 'none'}; limitations=${METRICS.limitations.length}`);
    await p.close();
  }

  // ---------- H. about + privacy ----------
  {
    const p = await newPage(browser);
    await p.goto(`${BASE}/#/about`, { waitUntil: 'networkidle0' });
    const t = await text(p);
    const links = await p.evaluate(() => [...document.querySelectorAll('a')].map((a) => `${a.innerText.trim().slice(0, 25)}=>${a.getAttribute('href')} [${a.target}]`));
    out('H1', /CC BY 4\.0/.test(t) && /10\.17632/.test(t) ? 'PASS' : 'FAIL', `CC BY=${/CC BY 4\.0/.test(t)} DOI=${/10\.17632/.test(t)} links: ${links.join(' | ')}`);
    out('H3', 'INFO', t.split('\n').filter((l) => /একক|solo|team|দল|AIgnite|Ostad/i.test(l)).slice(0, 4).join(' / '));
    await home(p);
    const reqs = [];
    p.on('request', (r) => reqs.push(`${r.method()} ${r.url()}`));
    await upload(p, path.join(SAMPLES, 'blast_1.jpg'));
    await analyse(p);
    const bad = reqs.filter((r) => !r.startsWith('GET') || !r.includes('localhost'));
    out('H2', bad.length ? 'FAIL' : 'PASS', bad.length ? bad.join(' ; ') : `${reqs.length} requests during analysis, all local GET`);
    await p.close();
  }

  // ---------- I/J. layout, tap targets, a11y names ----------
  for (const [w, h] of [[360, 740], [390, 844], [768, 1024], [1280, 800]]) {
    const p = await newPage(browser, { width: w, height: h });
    const res = [];
    for (const hash of ['#/', '#/accuracy', '#/about']) {
      await p.goto(`${BASE}/${hash}`, { waitUntil: 'networkidle0' });
      await sleep(400);
      const o = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      res.push(`${hash}:${o}`);
    }
    await home(p);
    await clickText(p, 'ব্লাস্ট রোগ');
    await sleep(600);
    await analyse(p);
    res.push(`result:${await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)}`);
    const small = await p.evaluate(() => [...document.querySelectorAll('button, a, [role=button]')]
      .filter((e) => e.offsetParent !== null)
      .map((e) => { const r = e.getBoundingClientRect(); return { t: (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 20), w: Math.round(r.width), h: Math.round(r.height) }; })
      .filter((x) => x.w < 44 || x.h < 44));
    out(`I1-${w}`, res.some((r) => !r.endsWith(':0')) ? 'FAIL' : 'PASS', `overflow ${res.join(' ')}; small tap targets on result: ${JSON.stringify(small)}`);
    await p.close();
  }
  {
    const p = await newPage(browser);
    const issues = [];
    for (const hash of ['#/', '#/accuracy', '#/about']) {
      await p.goto(`${BASE}/${hash}`, { waitUntil: 'networkidle0' });
      issues.push(...(await p.evaluate((hh) => [
        ...[...document.images].filter((i) => !i.alt).map((i) => `${hh} img no alt ${i.src}`),
        ...[...document.querySelectorAll('button, a')].filter((b) => !(b.innerText.trim() || b.getAttribute('aria-label') || b.title)).map((b) => `${hh} unnamed ${b.outerHTML.slice(0, 60)}`),
      ], hash)));
    }
    out('J2', issues.length ? 'FAIL' : 'PASS', issues.join(' ; ') || 'all images have alt, all controls named');
    // J1 keyboard: tab through home and record focus visibility
    await home(p);
    const focus = [];
    for (let i = 0; i < 12; i++) {
      await p.keyboard.press('Tab');
      focus.push(await p.evaluate(() => { const e = document.activeElement; const s = getComputedStyle(e); return `${e.tagName}:${(e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 12)}:${s.outlineStyle !== 'none' || s.boxShadow !== 'none' ? 'ring' : 'NO-RING'}`; }));
    }
    out('J1', focus.some((f) => f.includes('NO-RING')) ? 'FAIL' : 'PASS', focus.join(' | '));
    await p.close();
  }

  // ---------- K. failures ----------
  {
    const ctx = await browser.createBrowserContext();
    const p = await ctx.newPage();
    await p.setViewport({ width: 390, height: 844 });
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.setRequestInterception(true);
    p.on('request', (r) => (r.url().endsWith('.onnx') ? r.abort() : r.continue()));
    await p.goto(`${BASE}/#/`, { waitUntil: 'networkidle0' });
    await clickText(p, 'ব্লাস্ট রোগ');
    await sleep(800);
    await clickText(p, ANALYSE);
    await sleep(6000);
    const t = await text(p);
    const retry = await p.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.innerText.trim()).filter((x) => /আবার|চেষ্টা|retry/i.test(x)));
    out('K1', /ত্রুটি|সমস্যা|পারেনি|error/i.test(t) && retry.length ? 'PASS' : 'FAIL', `model blocked -> "${t.split('\n').slice(4, 9).join(' / ')}" retry buttons=${JSON.stringify(retry)} pageerrors=${errs.join(' ; ') || 'none'}`);
    await ctx.close();
  }
  {
    const p = await newPage(browser);
    await home(p);
    await clickText(p, 'ব্লাস্ট রোগ');
    await sleep(600);
    await analyse(p);
    await p.setOfflineMode(true);
    await clickText(p, 'আবার ছবি তুলুন');
    await sleep(500);
    await clickText(p, 'টুংরো রোগ');
    await sleep(800);
    const t1 = verdict(await analyse(p));
    await p.reload().catch(() => {});
    await sleep(1500);
    const t2 = (await p.evaluate(() => document.body?.innerText || '').catch(() => '')).slice(0, 80);
    out('K2', 'INFO', `offline after first load: second analysis=${t1}; reload shows "${t2.replace(/\n/g, ' ')}"`);
    await p.close();
  }
} finally {
  await browser.close();
}
