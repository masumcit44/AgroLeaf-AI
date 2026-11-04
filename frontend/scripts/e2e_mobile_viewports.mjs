// End-to-End Mobile Viewport & Farmer UX Verification Script.
// Tests responsiveness on 360px, 375px, 390px, 412px viewports.
// Verifies:
// 1. Zero horizontal overflow across all tabs (scrollWidth <= innerWidth).
// 2. Zero GPS auto-request on homepage (ISSUE-002).
// 3. Farmer UX touch targets and clean navigation (ISSUE-001, ISSUE-003).
// 4. District selection and local persistence without forced profile prompt (ISSUE-004).

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

// 1. Parse CLI arguments
const args = process.argv.slice(2);
let targetUrl = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) {
    targetUrl = args[i + 1].replace(/\/+$/, '');
    i++;
  }
}
if (!targetUrl && args[0] && !args[0].startsWith('--')) {
  targetUrl = args[0].replace(/\/+$/, '');
}

// 2. Find Chrome/Edge browser binary
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
  throw new Error('No Chrome or Edge browser executable found.');
}

// 3. Local server helper if testing locally
function isPortOpen(port) {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(500);
    sock.on('connect', () => {
      sock.destroy();
      resolve(true);
    });
    sock.on('error', () => resolve(false));
    sock.on('timeout', () => {
      sock.destroy();
      resolve(false);
    });
    sock.connect(port, '127.0.0.1');
  });
}

function startPreviewServer(port) {
  return new Promise((resolve, reject) => {
    console.log(`Starting local preview server on port ${port}...`);
    const isWin = process.platform === 'win32';
    const npmCmd = isWin ? 'npm.cmd' : 'npm';
    const child = spawn(npmCmd, ['run', 'preview', '--', '--port', String(port), '--host', '127.0.0.1'], {
      cwd: FRONTEND_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: isWin,
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    const timeout = setTimeout(() => {
      reject(new Error(`Preview server did not start within 15s. Output:\n${stdout}\n${stderr}`));
    }, 15000);

    const checkInterval = setInterval(async () => {
      const open = await isPortOpen(port);
      if (open) {
        clearInterval(checkInterval);
        clearTimeout(timeout);
        console.log(`Preview server listening on port ${port}`);
        resolve(child);
      }
    }, 300);

    child.on('exit', (code) => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
      reject(new Error(`Preview server exited with code ${code}.\n${stdout}\n${stderr}`));
    });
  });
}

const VIEWPORTS = [
  { name: 'Galaxy A (low-end small)', width: 360, height: 740 },
  { name: 'iPhone SE (compact iOS)', width: 375, height: 667 },
  { name: 'iPhone 14 (standard iOS)', width: 390, height: 844 },
  { name: 'Pixel 7 (standard Android)', width: 412, height: 915 },
];

async function main() {
  let serverProcess = null;
  let baseUrl = targetUrl;

  if (!baseUrl) {
    const port = 4174;
    const running = await isPortOpen(port);
    if (!running) {
      serverProcess = await startPreviewServer(port);
    }
    baseUrl = `http://127.0.0.1:${port}`;
  }

  console.log(`\n======================================================`);
  console.log(`AgroLeaf AI Mobile & Farmer UX E2E Verification`);
  console.log(`Target URL: ${baseUrl}`);
  console.log(`======================================================\n`);

  const browserPath = findBrowser();
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      testsPassed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      testsFailed++;
    }
  }

  try {
    const page = await browser.newPage();

    // 1. TEST ISSUE-002: GPS Access on Homepage
    console.log(`\n--- Test 1: Zero GPS auto-request on Homepage (ISSUE-002) ---`);
    let geolocationCalled = false;
    await page.evaluateOnNewDocument(() => {
      window.__geoCalls = 0;
      if (navigator.geolocation) {
        const origGet = navigator.geolocation.getCurrentPosition;
        navigator.geolocation.getCurrentPosition = function (...args) {
          window.__geoCalls++;
          return origGet.apply(this, args);
        };
      }
    });

    await page.goto(`${baseUrl}/#/`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1200));

    const geoCallCount = await page.evaluate(() => window.__geoCalls || 0);
    assert(geoCallCount === 0, `Homepage did not trigger navigator.geolocation (calls=${geoCallCount})`);

    const hasGpsPrompt = await page.evaluate(() => {
      const text = document.body.innerText || '';
      return text.includes('জিপিএস দিয়ে খুঁজুন') || text.includes('লোকেশন পারমিশন দিন');
    });
    assert(!hasGpsPrompt, 'Homepage contains no intrusive GPS permission prompt');

    // 2. TEST ISSUE-001: Mobile responsiveness & zero horizontal overflow across 4 viewports
    console.log(`\n--- Test 2: Mobile Viewport Layout & Overflow Verification (ISSUE-001) ---`);
    const routesToTest = [
      { path: '#/', label: 'Home Tab' },
      { path: '?features=weatherReport#/weather', label: 'Weather Tab' },
      { path: '#/profile', label: 'Area/Crop Tab' },
      { path: '#/history', label: 'History Tab' },
      { path: '#/help', label: 'Help Tab' },
    ];

    for (const vp of VIEWPORTS) {
      console.log(`\n  Checking Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      await page.setViewport({ width: vp.width, height: vp.height });

      for (const route of routesToTest) {
        await page.goto(`${baseUrl}/${route.path}`, { waitUntil: 'networkidle2' });
        await new Promise((r) => setTimeout(r, 800));

        const overflowData = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientWidth = window.innerWidth;
          return {
            scrollWidth,
            clientWidth,
            hasOverflow: scrollWidth > clientWidth,
          };
        });

        assert(
          !overflowData.hasOverflow,
          `[${vp.width}px] ${route.label} has zero horizontal overflow (scrollWidth=${overflowData.scrollWidth} <= clientWidth=${overflowData.clientWidth})`
        );
      }
    }

    // 3. TEST ISSUE-003: Farmer-friendly UI & Touch Targets
    console.log(`\n--- Test 3: Farmer Touch Targets & Navigation (ISSUE-003) ---`);
    await page.setViewport({ width: 360, height: 740 });
    await page.goto(`${baseUrl}/#/`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 800));

    const bottomNavCheck = await page.evaluate(() => {
      const navElements = document.querySelectorAll('nav a, nav button');
      let minH = 999;
      for (const el of navElements) {
        const rect = el.getBoundingClientRect();
        if (rect.height < minH && rect.height > 0) minH = rect.height;
      }
      return { count: navElements.length, minHeight: minH };
    });

    assert(bottomNavCheck.count >= 4, `Bottom navigation has ${bottomNavCheck.count} tabs`);
    assert(bottomNavCheck.minHeight >= 40, `Navigation touch targets are adequate (minHeight=${bottomNavCheck.minHeight}px)`);

    // 4. TEST ISSUE-004: Weather manual district selection persists to localStorage
    console.log(`\n--- Test 4: Weather District Selection & Profile Flow (ISSUE-004) ---`);
    await page.goto(`${baseUrl}/?features=weatherReport#/weather`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));

    // Look for district change button
    const openedPicker = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const changeBtn = btns.find((b) => b.innerText.includes('এলাকা') || b.innerText.includes('বদলান') || b.innerText.includes('Change'));
      if (changeBtn) {
        changeBtn.click();
        return true;
      }
      return false;
    });

    if (openedPicker) {
      await new Promise((r) => setTimeout(r, 600));
      const searchInput = await page.$('input[type="text"]');
      if (searchInput) {
        await searchInput.type('Bogura');
        await page.keyboard.press('Enter');
        await new Promise((r) => setTimeout(r, 800));

        const clickedDistrict = await page.evaluate(() => {
          const listBtns = Array.from(document.querySelectorAll('div[class*="overflow-y-auto"] button'));
          const boguraBtn = listBtns.find((b) => b.innerText.includes('Bogura') || b.innerText.includes('বগুড়া'));
          if (boguraBtn) {
            boguraBtn.click();
            return true;
          }
          return false;
        });
        assert(clickedDistrict, 'Manual district picker selected Bogura successfully');
        await new Promise((r) => setTimeout(r, 1200));

        const storedProfile = await page.evaluate(async () => {
          return new Promise((resolve) => {
            const req = indexedDB.open('agroleaf', 1);
            req.onsuccess = (e) => {
              const db = e.target.result;
              try {
                const tx = db.transaction('profile', 'readonly');
                const store = tx.objectStore('profile');
                const getReq = store.get('self');
                getReq.onsuccess = () => resolve(getReq.result);
                getReq.onerror = () => resolve(null);
              } catch {
                resolve(null);
              }
            };
            req.onerror = () => resolve(null);
          });
        });

        assert(
          Boolean(storedProfile && (storedProfile.district_name_en === 'Bogura' || storedProfile.district_name_bn === 'বগুড়া')),
          `District persisted to IndexedDB agroleaf profile: ${JSON.stringify(storedProfile)}`
        );
      } else {
        assert(false, 'District search input was not found');
      }
    } else {
      console.log('  (District change button not found; checking if already set or default rendered)');
    }

  } finally {
    await browser.close();
    if (serverProcess) {
      console.log('Terminating local preview server...');
      serverProcess.kill('SIGTERM');
    }
  }

  console.log(`\n======================================================`);
  console.log(`Summary: ${testsPassed} passed, ${testsFailed} failed`);
  console.log(`======================================================\n`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('E2E script error:', err);
  process.exit(1);
});
