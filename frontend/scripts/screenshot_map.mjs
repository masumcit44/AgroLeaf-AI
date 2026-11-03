// Capture mobile screenshots of #/map with ?features=areaMap in BN and EN.
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
const SCREENSHOTS_DIR = path.join(
  REPO_ROOT,
  'documentation',
  'features',
  'F23_AREA_MAP',
  'screenshots'
);

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function findBrowser() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  if (process.env.EDGE_PATH && fs.existsSync(process.env.EDGE_PATH)) return process.env.EDGE_PATH;

  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  throw new Error('No browser executable found.');
}

async function getFreePort() {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browserPath = findBrowser();
  const port = await getFreePort();
  const baseUrl = `http://localhost:${port}`;
  console.log(`Starting local preview server on ${baseUrl}...`);

  const previewProc = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
    cwd: FRONTEND_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout waiting for preview')), 15000);
    const check = () => {
      http.get(`${baseUrl}/`, (res) => {
        if (res.statusCode === 200) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(check, 250);
        }
      }).on('error', () => setTimeout(check, 250));
    };
    check();
  });

  console.log('Preview server ready. Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    // 1. Bengali mode
    console.log('Navigating to #/map (BN)...');
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('agroleaf_lang', 'bn');
    });
    await page.goto(`${baseUrl}/?features=areaMap#/map`, { waitUntil: 'networkidle2' });
    await sleep(2000);

    const bnPath = path.join(SCREENSHOTS_DIR, '01_mobile_map_bn.png');
    await page.screenshot({ path: bnPath, fullPage: false });
    console.log(`Saved BN screenshot: ${bnPath}`);

    // 2. English mode
    console.log('Switching to EN mode...');
    await page.evaluate(() => {
      localStorage.setItem('agroleaf_lang', 'en');
    });
    await page.goto(`${baseUrl}/?features=areaMap#/map`, { waitUntil: 'networkidle2' });
    await sleep(2000);

    const enPath = path.join(SCREENSHOTS_DIR, '02_mobile_map_en.png');
    await page.screenshot({ path: enPath, fullPage: false });
    console.log(`Saved EN screenshot: ${enPath}`);

    console.log('All screenshots captured successfully.');
  } finally {
    await browser.close();
    previewProc.kill();
  }
}

main().catch((err) => {
  console.error('Screenshot error:', err);
  process.exit(1);
});
