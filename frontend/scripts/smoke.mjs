import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(FRONTEND_DIR, '..');
const REPORT_PATH = path.join(REPO_ROOT, 'documentation', 'qa', 'smoke_report.md');

// 1. Parse arguments
const args = process.argv.slice(2);
let targetUrl = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) {
    targetUrl = args[i + 1].replace(/\/+$/, '');
    i++;
  }
}

const isCustomUrl = Boolean(targetUrl);

// 2. Find browser executable
function findBrowser() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  if (process.env.EDGE_PATH && fs.existsSync(process.env.EDGE_PATH)) return process.env.EDGE_PATH;

  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ];

  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  throw new Error('No Chrome or Edge browser executable found on system. Set CHROME_PATH or EDGE_PATH.');
}

// 3. Port finder
async function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// 4. Asset WASM check
async function checkWasmAsset(baseUrl) {
  const wasmUrl = `${baseUrl}/ort/ort-wasm-simd-threaded.wasm`;
  return new Promise((resolve) => {
    const parsed = new URL(wasmUrl);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get(wasmUrl, (res) => {
      const contentType = res.headers['content-type'] || '';
      const isNotHtml = !contentType.includes('text/html');
      const isWasmOrOctet =
        contentType.includes('application/wasm') ||
        contentType.includes('octet-stream') ||
        contentType.includes('binary') ||
        contentType === ''; // Static servers sometimes serve octet-stream without header

      let firstBytes = Buffer.alloc(0);
      res.on('data', (chunk) => {
        if (firstBytes.length < 4) {
          firstBytes = Buffer.concat([firstBytes, chunk]);
        }
      });

      res.on('end', () => {
        const is200 = res.statusCode === 200;
        // WASM magic bytes: 0x00 0x61 0x73 0x6d (\0asm)
        const hasWasmMagic =
          firstBytes.length >= 4 &&
          firstBytes[0] === 0x00 &&
          firstBytes[1] === 0x61 &&
          firstBytes[2] === 0x73 &&
          firstBytes[3] === 0x6d;

        const pass = is200 && isNotHtml && (isWasmOrOctet || hasWasmMagic);
        resolve({
          url: wasmUrl,
          statusCode: res.statusCode,
          contentType,
          hasWasmMagic,
          pass,
          details: `HTTP ${res.statusCode}, content-type: "${contentType}", magic header: ${hasWasmMagic ? '\\0asm (valid)' : 'invalid'}`,
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        url: wasmUrl,
        statusCode: 0,
        contentType: '',
        hasWasmMagic: false,
        pass: false,
        details: `Request error: ${err.message}`,
      });
    });
  });
}

async function main() {
  console.log('='.repeat(70));
  console.log(' AgroLeaf AI — Automated Smoke Test (X1)');
  console.log('='.repeat(70));

  let previewProcess = null;
  let baseUrl = targetUrl;

  try {
    if (!baseUrl) {
      // Ensure dist exists before previewing
      const distIndex = path.join(FRONTEND_DIR, 'dist', 'index.html');
      if (!fs.existsSync(distIndex)) {
        console.log('[smoke] Building frontend for preview...');
        const buildResult = spawn('npm', ['run', 'build'], {
          cwd: FRONTEND_DIR,
          shell: true,
          stdio: 'inherit',
        });
        await new Promise((resolve, reject) => {
          buildResult.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Vite build failed with code ${code}`));
          });
        });
      }

      const port = await getFreePort();
      console.log(`[smoke] Starting Vite preview on port ${port}...`);
      previewProcess = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
        cwd: FRONTEND_DIR,
        shell: true,
        stdio: 'ignore',
      });
      baseUrl = `http://localhost:${port}`;
      await sleep(2500);
    }

    console.log(`[smoke] Testing target URL: ${baseUrl}`);
    const browserPath = findBrowser();
    console.log(`[smoke] Using browser: ${browserPath}`);

    const browser = await puppeteer.launch({
      executablePath: browserPath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    // Asset Check
    console.log('[smoke] Checking WASM asset integrity...');
    const wasmCheck = await checkWasmAsset(baseUrl);
    console.log(`[smoke] WASM Asset: ${wasmCheck.pass ? 'PASS' : 'FAIL'} (${wasmCheck.details})`);

    // Viewports to test
    const viewports = [
      { width: 360, height: 740, label: '360w (Phone standard)' },
      { width: 390, height: 844, label: '390w (iPhone modern)' },
      { width: 1280, height: 800, label: '1280w (Desktop)' },
    ];

    // Routes to test
    const baseRoutes = [
      { id: 'home', name: 'Home', path: '/' },
      { id: 'accuracy', name: 'Accuracy', path: '/#accuracy' },
      { id: 'about', name: 'About', path: '/#about' },
    ];

    const resultRoutes = isCustomUrl
      ? []
      : [
          { id: 'force_healthy', name: 'Result: Healthy', path: '/?force=healthy' },
          { id: 'force_blast', name: 'Result: Blast', path: '/?force=blast' },
          { id: 'force_brown_spot', name: 'Result: Brown Spot', path: '/?force=brown_spot' },
          { id: 'force_leaf_smut', name: 'Result: Leaf Smut', path: '/?force=leaf_smut' },
          { id: 'force_tungro', name: 'Result: Tungro', path: '/?force=tungro' },
          { id: 'force_sheath_blight', name: 'Result: Sheath Blight', path: '/?force=sheath_blight' },
          { id: 'force_not_sure', name: 'Result: Not Sure', path: '/?force=not_sure' },
        ];

    const allRoutes = [...baseRoutes, ...resultRoutes];

    const results = [];
    let overallPass = wasmCheck.pass;

    for (const vp of viewports) {
      console.log(`\n--- Viewport: ${vp.label} (${vp.width}x${vp.height}) ---`);

      for (const route of allRoutes) {
        const fullUrl = `${baseUrl}${route.path}`;
        const page = await browser.newPage();
        await page.setViewport({ width: vp.width, height: vp.height });

        const consoleErrors = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });
        page.on('pageerror', (err) => {
          consoleErrors.push(err.message);
        });

        await page.goto(fullUrl, { waitUntil: 'load', timeout: 15000 });
        await sleep(500);

        // 1. Sticker check
        const stickerCheck = await page.evaluate(() => {
          const header = document.querySelector('header');
          if (!header) return { pass: false, reason: 'No <header> element' };
          const img = header.querySelector('img[src*="aignite-sticker"]');
          if (!img) return { pass: false, reason: 'img[src*="aignite-sticker"] not inside header' };
          const rect = img.getBoundingClientRect();
          const style = window.getComputedStyle(img);
          const isVisible =
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            rect.width > 0 &&
            rect.height > 0;
          const heightGe40 = rect.height >= 39.5; // subpixel tolerance
          const inViewport =
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight + 2 &&
            rect.right <= window.innerWidth + 2;

          const pass = isVisible && heightGe40 && inViewport;
          return {
            pass,
            height: Math.round(rect.height),
            inViewport,
            reason: pass
              ? `H: ${Math.round(rect.height)}px, visible, within header`
              : `H:${rect.height}px, visible:${isVisible}, inVP:${inViewport}`,
          };
        });

        // 2. Horizontal overflow check
        const overflowCheck = await page.evaluate(() => {
          const sw = document.documentElement.scrollWidth;
          const iw = window.innerWidth;
          const pass = sw <= iw;
          return {
            pass,
            scrollWidth: sw,
            innerWidth: iw,
            diff: sw - iw,
            reason: pass ? `0px overflow (SW:${sw} <= IW:${iw})` : `${sw - iw}px overflow (SW:${sw} > IW:${iw})`,
          };
        });

        // 3. Console errors check
        const consoleCheck = {
          pass: consoleErrors.length === 0,
          errors: consoleErrors,
          reason:
            consoleErrors.length === 0
              ? '0 console errors'
              : `${consoleErrors.length} errors: ${consoleErrors.join('; ').slice(0, 100)}`,
        };

        // 4. Forbidden text check
        const forbiddenCheck = await page.evaluate(() => {
          const text = (document.body.innerText || '').toLowerCase();
          const forbidden = ['diagnosis', 'রোগ নির্ণয়', '100%', 'free call'];
          const found = [];
          for (const word of forbidden) {
            if (text.includes(word.toLowerCase())) {
              found.push(word);
            }
          }
          return {
            pass: found.length === 0,
            found,
            reason: found.length === 0 ? 'None detected' : `Found forbidden words: ${found.join(', ')}`,
          };
        });

        const routePass =
          stickerCheck.pass && overflowCheck.pass && consoleCheck.pass && forbiddenCheck.pass;
        if (!routePass) overallPass = false;

        const rowResult = {
          viewport: vp.width,
          routeName: route.name,
          routePath: route.path,
          sticker: stickerCheck,
          overflow: overflowCheck,
          console: consoleCheck,
          forbidden: forbiddenCheck,
          pass: routePass,
        };
        results.push(rowResult);

        const statusIcon = routePass ? '✓' : '✗';
        console.log(`  ${statusIcon} [${route.name}] Sticker:${stickerCheck.pass ? 'OK' : 'FAIL'} | Overflow:${overflowCheck.pass ? 'OK' : 'FAIL'} | Console:${consoleCheck.pass ? 'OK' : 'FAIL'} | Copy:${forbiddenCheck.pass ? 'OK' : 'FAIL'}`);

        await page.close();
      }
    }

    await browser.close();

    // 5. Build Markdown Smoke Report
    const bstTime = new Date().toLocaleString('en-GB', {
      timeZone: 'Asia/Dhaka',
      hour12: false,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' BST';

    let md = `# Smoke Test Report (X1 Automated Check)\n\n`;
    md += `**Date / Time:** ${bstTime}\n`;
    md += `**Target URL:** ${baseUrl} (${isCustomUrl ? 'External deployment' : 'Vite production preview'})\n`;
    md += `**Overall Status:** ${overallPass ? '✅ ALL CHECKS PASSED' : '❌ FAILED'}\n\n`;

    md += `## Asset Verification\n`;
    md += `| Asset | Check | Status | Details |\n`;
    md += `|---|---|---|---|\n`;
    md += `| \`/ort/ort-wasm-simd-threaded.wasm\` | Content-Type & WASM magic header | ${wasmCheck.pass ? '✅ PASS' : '❌ FAIL'} | ${wasmCheck.details} |\n\n`;

    md += `## UI & Responsiveness Checks\n`;
    md += `| Viewport | Route | Sticker (≥40px in header) | Horizontal Overflow | Console Errors | Forbidden Copy | Status |\n`;
    md += `|---|---|---|---|---|---|---|\n`;

    for (const r of results) {
      const sCol = r.sticker.pass ? `✅ ${r.sticker.height}px` : `❌ ${r.sticker.reason}`;
      const oCol = r.overflow.pass ? `✅ 0px (${r.overflow.scrollWidth}px)` : `❌ ${r.overflow.reason}`;
      const cCol = r.console.pass ? `✅ 0` : `❌ ${r.console.errors.length} err`;
      const fCol = r.forbidden.pass ? `✅ Clean` : `❌ ${r.forbidden.found.join(', ')}`;
      const passCol = r.pass ? `✅ PASS` : `❌ FAIL`;
      md += `| ${r.viewport}px | ${r.routeName} | ${sCol} | ${oCol} | ${cCol} | ${fCol} | ${passCol} |\n`;
    }

    md += `\n## Criteria Summary\n`;
    md += `1. **Sticker:** \`img[src*="aignite-sticker"]\` exists, is visible inside \`<header>\`, height ≥ 40 px, and within viewport.\n`;
    md += `2. **No horizontal overflow:** \`scrollWidth <= innerWidth\` on 360px, 390px, and 1280px.\n`;
    md += `3. **No console errors:** 0 runtime exceptions or console.error calls.\n`;
    md += `4. **No forbidden text:** Zero occurrences of "diagnosis", "রোগ নির্ণয়", "100%", or "free call".\n`;
    md += `5. **Asset check:** CPU WASM served with correct binary headers.\n\n`;
    md += `*Exit Code: ${overallPass ? 0 : 1}*\n`;

    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, md, 'utf-8');
    console.log(`\n[smoke] Smoke report written to: ${path.relative(REPO_ROOT, REPORT_PATH)}`);

    if (previewProcess) {
      previewProcess.kill();
    }

    if (!overallPass) {
      console.error('\n[smoke] SMOKE TEST FAILED! See report for details.');
      process.exit(1);
    }

    console.log('\n[smoke] ALL SMOKE CHECKS PASSED SUCCESSFULLY.');
    process.exit(0);
  } catch (err) {
    if (previewProcess) previewProcess.kill();
    console.error('\n[smoke] FATAL ERROR during smoke test:', err);
    process.exit(1);
  }
}

main();
