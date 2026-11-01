/**
 * Browser regression test for the real upload path: decodeImage -> predictLeaf,
 * run in headless Chrome against the app's source modules (Vite dev server).
 *
 * Fixtures and PyTorch reference probabilities come from
 * ml/tools/make_decode_fixtures.py. For each fixture it checks:
 *  - the decoded canvas is upright and capped at 1024 px (EXIF Orientation),
 *  - transparent pixels read as white (white_probe),
 *  - top-1 class equals the reference and max |p - p_ref| is within tolerance:
 *    EXACT_TOLERANCE for images under the 1024 px cap (the resize is a Pillow-exact
 *    port), expected.tolerance above it (the cap is a canvas downscale training never had).
 *
 * Usage: npm run test:decode   (exit code 1 on any failure)
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const FRONTEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE_URL = '/tests/fixtures/decode';
const expected = JSON.parse(fs.readFileSync(path.join(FRONTEND_DIR, 'tests/fixtures/decode/expected.json'), 'utf-8'));
const PORT = 54331;
const MAX_SIDE = 1024; // decodeImage.js MAX_DIMENSION
const EXACT_TOLERANCE = 0.002; // float32 noise only

function findBrowser() {
  return [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].find((c) => fs.existsSync(c));
}

async function waitForServer(url, ms = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`dev server did not start at ${url}`);
}

function cappedSize([w, h]) {
  const s = Math.max(w, h) > MAX_SIDE ? MAX_SIDE / Math.max(w, h) : 1;
  return [Math.round(w * s), Math.round(h * s)];
}

async function main() {
  const chrome = findBrowser();
  if (!chrome) throw new Error('Chrome not found');
  // Run Vite's own entry with node (no shell) so kill() stops the server itself,
  // not just a wrapper shell that would leave the port taken for the next run
  const viteBin = path.join(FRONTEND_DIR, 'node_modules', 'vite', 'bin', 'vite.js');
  const server = spawn(process.execPath, [viteBin, '--port', String(PORT), '--strictPort'], { cwd: FRONTEND_DIR });
  let browser;
  let failures = 0;
  try {
    await waitForServer(`http://localhost:${PORT}/`);
    browser = await puppeteer.launch({ executablePath: chrome, headless: 'new' });
    const page = await browser.newPage();
    // Warm-up: the first import of onnxruntime-web makes Vite pre-bundle it and
    // reload the page, which would abort a run in progress
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    await page
      .evaluate(() => Promise.all([import('/src/lib/decodeImage.js'), import('/src/ml/predict.js')]))
      .catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    // CPU_SLOWDOWN=4 roughly approximates a budget Android phone
    if (process.env.CPU_SLOWDOWN) {
      const cdp = await page.createCDPSession();
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.CPU_SLOWDOWN) });
    }

    const results = await page.evaluate(async (fixtures, base) => {
      const { decodeImage } = await import('/src/lib/decodeImage.js');
      const { predictLeaf } = await import('/src/ml/predict.js');
      const out = [];
      for (const f of fixtures) {
        const blob = await (await fetch(`${base}/${f.file}`)).blob();
        const t0 = performance.now();
        const { canvas, width, height } = await decodeImage(blob);
        const t1 = performance.now();
        let probe = null;
        if (f.white_probe) {
          const [x, y] = f.white_probe;
          probe = Array.from(canvas.getContext('2d').getImageData(x, y, 1, 1).data);
        }
        const t2 = performance.now();
        const { probs, ms } = await predictLeaf(canvas);
        const t3 = performance.now();
        out.push({
          file: f.file, size: [width, height], probe, probs,
          decodeMs: t1 - t0, preprocessMs: t3 - t2 - ms, modelMs: ms, totalMs: t3 - t0,
        });
      }
      return out;
    }, expected.fixtures, FIXTURE_URL);

    for (const r of results) {
      const f = expected.fixtures.find((x) => x.file === r.file);
      const problems = [];
      const [ew, eh] = cappedSize(f.expected_size);
      const capped = ew !== f.expected_size[0];
      const tol = capped ? expected.tolerance : EXACT_TOLERANCE;
      if (r.size[0] !== ew || r.size[1] !== eh) problems.push(`canvas ${r.size.join('x')} != ${ew}x${eh}`);
      if (r.probe && r.probe.slice(0, 3).some((v) => v < 250)) problems.push(`transparent pixel reads ${r.probe.slice(0, 3)}`);
      const diffs = expected.classes.map((k, i) => Math.abs((r.probs[k] ?? 0) - f.expected_probs[i]));
      const maxDiff = Math.max(...diffs);
      const top1 = expected.classes.reduce((a, k) => ((r.probs[k] ?? 0) > (r.probs[a] ?? 0) ? k : a));
      if (top1 !== f.expected_top1) problems.push(`top-1 ${top1} != ${f.expected_top1}`);
      if (maxDiff > tol) problems.push(`max|dp| ${maxDiff.toFixed(4)} > ${tol}`);
      if (problems.length) failures++;
      console.log(`${problems.length ? 'FAIL' : 'PASS'}  ${r.file.padEnd(32)} max|dp|=${maxDiff.toFixed(4)} (tol ${tol})  ${problems.join('; ')}`);
    }
    // The first fixture includes the model download and session start, so it is left out
    const warm = results.slice(1);
    const median = (key) => [...warm.map((r) => r[key])].sort((a, b) => a - b)[Math.floor(warm.length / 2)].toFixed(0);
    const cpu = process.env.CPU_SLOWDOWN ? `, CPU slowed x${process.env.CPU_SLOWDOWN}` : '';
    console.log(`\nmedian ms (warm${cpu}): decode ${median('decodeMs')}, preprocess ${median('preprocessMs')}, model ${median('modelMs')}, total ${median('totalMs')}`);
    console.log(`${results.length - failures}/${results.length} decode-path fixtures passed`);
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
