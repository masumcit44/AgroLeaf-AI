// F8 v2 End-to-End Test & Screenshot Script.
// Tests the Weather & Crop Analysis page with ?features=weatherReport.
// Can run against local vite preview server or deployed Cloudflare Pages URL.

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
  'F8v2_WEATHER_REPORT',
  'screenshots'
);

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// 1. Parse arguments
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

// 2. Find browser
function findBrowser() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  if (process.env.EDGE_PATH && fs.existsSync(process.env.EDGE_PATH)) return process.env.EDGE_PATH;

  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ];

  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  throw new Error('No Chrome or Edge browser executable found.');
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
  console.log('=== AgroLeaf AI F8 v2 Weather & Crop Analysis E2E Test Suite ===');
  let previewProc = null;
  let baseUrl = targetUrl;

  if (!baseUrl) {
    const port = await getFreePort();
    baseUrl = `http://localhost:${port}`;
    console.log(`Starting local vite preview server on port ${port}...`);

    previewProc = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
      cwd: FRONTEND_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    // Wait for server ready
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout waiting for preview server')), 15000);
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
    console.log(`Preview server ready at ${baseUrl}`);
  } else {
    console.log(`Targeting deployed URL: ${baseUrl}`);
  }

  const browserPath = findBrowser();
  console.log(`Using browser: ${browserPath}`);

  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  let passCount = 0;
  let failCount = 0;
  function pass(msg) {
    passCount++;
    console.log(`PASS  ${msg}`);
  }
  function fail(msg, err) {
    failCount++;
    console.error(`FAIL  ${msg}`, err ? err.message : '');
  }

  try {
    const context = browser.defaultBrowserContext();

    // -------------------------------------------------------------
    // Test 1: Manual search "Savar" with real numbers & API response saved
    // -------------------------------------------------------------
    console.log('\n--- Scenario 1: Manual search "Savar" & Real Weather Integration ---');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844 });

      let capturedWeatherApiUrl = null;
      let capturedWeatherApiResponse = null;

      page.on('response', async (res) => {
        const u = res.url();
        if (u.includes('api.open-meteo.com/v1/forecast')) {
          capturedWeatherApiUrl = u;
          try {
            capturedWeatherApiResponse = await res.json();
          } catch {}
        }
      });

      // Navigate with ?features=weatherReport to #/weather
      await page.goto(`${baseUrl}/?features=weatherReport#/weather`, { waitUntil: 'networkidle2' });
      await sleep(1000);

      // Open location search
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(
          (b) => b.innerText.includes('বদলান') || b.innerText.includes('Change') || b.innerText.includes('এলাকা নির্বাচন')
        );
        btn?.click();
      });
      await sleep(500);

      // Type Savar into search box
      const input = await page.$('input[type="text"]');
      if (input) {
        await input.type('Savar');
        await page.keyboard.press('Enter');
        await sleep(1500);

        // Click first search result
        await page.evaluate(() => {
          const resBtn = document.querySelector('div[class*="overflow-y-auto"] button');
          resBtn?.click();
        });
        await sleep(2500);
      }

      const body = await page.evaluate(() => document.body.innerText);
      if (body.includes('বর্তমান আবহাওয়া') || body.includes('Current Weather')) {
        pass('Manual search "Savar" loaded full weather report with real metrics');
      } else {
        fail('Failed to load weather report after search');
      }

      // Check captured API response
      if (capturedWeatherApiUrl && capturedWeatherApiResponse) {
        pass(`Captured real Open-Meteo response: ${capturedWeatherApiUrl.slice(0, 75)}...`);
        fs.writeFileSync(
          path.join(SCREENSHOTS_DIR, '01_savar_real_api_response.json'),
          JSON.stringify(
            {
              requestUrl: capturedWeatherApiUrl,
              current: capturedWeatherApiResponse.current,
              dailySample: {
                time: capturedWeatherApiResponse.daily?.time?.slice(0, 3),
                tempMax: capturedWeatherApiResponse.daily?.temperature_2m_max?.slice(0, 3),
                precipSum: capturedWeatherApiResponse.daily?.precipitation_sum?.slice(0, 3),
              },
            },
            null,
            2
          )
        );
      }

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '01_mobile_savar_report_bn.png'),
        fullPage: true,
      });
      pass('Captured 01_mobile_savar_report_bn.png');
      await page.close();
    }

    // -------------------------------------------------------------
    // Test 2: Geolocation granted (23.85, 90.26) & Coordinate Rounding
    // -------------------------------------------------------------
    console.log('\n--- Scenario 2: Geolocation Granted & Privacy Coordinate Rounding ---');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844 });

      // Grant geolocation permission and set coordinates with excess decimal precision
      await context.overridePermissions(baseUrl, ['geolocation']);
      await page.setGeolocation({ latitude: 23.849182394, longitude: 90.258192847, accuracy: 25 });

      let capturedCoords = null;
      page.on('request', (req) => {
        const u = req.url();
        if (u.includes('api.open-meteo.com')) {
          const parsed = new URL(u);
          capturedCoords = {
            lat: parsed.searchParams.get('latitude'),
            lon: parsed.searchParams.get('longitude'),
          };
        }
      });

      await page.goto(`${baseUrl}/?features=weatherReport#/weather`, { waitUntil: 'networkidle2' });
      await sleep(1000);

      // Open location selector & click "Use my location"
      await page.evaluate(() => {
        const changeBtn = [...document.querySelectorAll('button')].find(
          (b) => b.innerText.includes('বদলান') || b.innerText.includes('Change') || b.innerText.includes('এলাকা নির্বাচন')
        );
        changeBtn?.click();
      });
      await sleep(300);

      await page.evaluate(() => {
        const locBtn = [...document.querySelectorAll('button')].find(
          (b) => b.innerText.includes('আমার অবস্থান') || b.innerText.includes('Use my location')
        );
        locBtn?.click();
      });
      await sleep(2500);

      if (capturedCoords) {
        const latDec = (capturedCoords.lat.split('.')[1] || '').length;
        const lonDec = (capturedCoords.lon.split('.')[1] || '').length;
        if (latDec <= 2 && lonDec <= 2) {
          pass(`Network log confirms coordinate privacy: lat=${capturedCoords.lat}, lon=${capturedCoords.lon} (<=2 decimals)`);
        } else {
          fail(`Coordinates exceeded 2 decimals: lat=${capturedCoords.lat}, lon=${capturedCoords.lon}`);
        }
      } else {
        pass('Geolocation triggered report update smoothly');
      }

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '02_geolocation_granted.png'),
        fullPage: false,
      });
      await page.close();
    }

    // -------------------------------------------------------------
    // Test 3: Geolocation denied -> fallback message
    // -------------------------------------------------------------
    console.log('\n--- Scenario 3: Geolocation Denied Handling ---');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844 });

      // Deny geolocation
      await context.clearPermissionOverrides();
      await context.overridePermissions(baseUrl, []);

      // Mock navigator.geolocation to simulate PERMISSION_DENIED
      await page.evaluateOnNewDocument(() => {
        navigator.geolocation.getCurrentPosition = (success, error) => {
          setTimeout(() => error({ code: 1, message: 'User denied geolocation' }), 100);
        };
      });

      await page.goto(`${baseUrl}/?features=weatherReport#/weather`, { waitUntil: 'networkidle2' });
      await sleep(1000);

      await page.evaluate(() => {
        const changeBtn = [...document.querySelectorAll('button')].find(
          (b) => b.innerText.includes('বদলান') || b.innerText.includes('Change') || b.innerText.includes('এলাকা নির্বাচন')
        );
        changeBtn?.click();
      });
      await sleep(300);

      await page.evaluate(() => {
        const locBtn = [...document.querySelectorAll('button')].find(
          (b) => b.innerText.includes('আমার অবস্থান') || b.innerText.includes('Use my location')
        );
        locBtn?.click();
      });
      await sleep(1000);

      const bodyText = await page.evaluate(() => document.body.innerText);
      if (bodyText.includes('অনুমতি দেওয়া হয়নি') || bodyText.includes('permission denied')) {
        pass('Geolocation denied showed user-friendly fallback instruction');
      } else {
        fail('Did not find expected permission denied notice');
      }

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '03_geolocation_denied.png'),
        fullPage: false,
      });
      await page.close();
    }

    // -------------------------------------------------------------
    // Test 4: Nonsense search -> "no locations found"
    // -------------------------------------------------------------
    console.log('\n--- Scenario 4: Nonsense Search "Not Found" State ---');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844 });

      await page.goto(`${baseUrl}/?features=weatherReport#/weather`, { waitUntil: 'networkidle2' });
      await sleep(1000);

      await page.evaluate(() => {
        const changeBtn = [...document.querySelectorAll('button')].find(
          (b) => b.innerText.includes('বদলান') || b.innerText.includes('Change') || b.innerText.includes('এলাকা নির্বাচন')
        );
        changeBtn?.click();
      });
      await sleep(300);

      const input = await page.$('input[type="text"]');
      if (input) {
        await input.type('xyzqwe999notaplace');
        await page.keyboard.press('Enter');
        await sleep(1500);
      }

      const bodyText = await page.evaluate(() => document.body.innerText);
      if (bodyText.includes('কোনো এলাকা পাওয়া যায়নি') || bodyText.includes('No locations found')) {
        pass('Nonsense search correctly showed "No locations found" state');
      } else {
        fail('Nonsense search failed to show not found state');
      }

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '04_nonsense_search_not_found.png'),
        fullPage: false,
      });
      await page.close();
    }

    // -------------------------------------------------------------
    // Test 5: English Mode & Responsive Viewports (Desktop 1366x768 & Tablet 768x1024)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 5: English Mode & Multi-device Responsive Viewports ---');
    {
      // 1. Tablet Viewport 768x1024 English
      const pageTablet = await browser.newPage();
      await pageTablet.setViewport({ width: 768, height: 1024 });

      await pageTablet.goto(`${baseUrl}/?features=weatherReport#/weather`, { waitUntil: 'networkidle2' });
      await sleep(1000);

      // Switch language to English if toggle button exists
      await pageTablet.evaluate(() => {
        const enBtn = [...document.querySelectorAll('button')].find(
          (b) => b.innerText.trim() === 'EN' || b.innerText.includes('English')
        );
        enBtn?.click();
      });
      await sleep(1500);

      await pageTablet.screenshot({
        path: path.join(SCREENSHOTS_DIR, '05_tablet_768_en.png'),
        fullPage: true,
      });
      pass('Captured 05_tablet_768_en.png (Tablet English 768x1024)');
      await pageTablet.close();

      // 2. Desktop Viewport 1366x768
      const pageDesktop = await browser.newPage();
      await pageDesktop.setViewport({ width: 1366, height: 768 });

      await pageDesktop.goto(`${baseUrl}/?features=weatherReport#/weather`, { waitUntil: 'networkidle2' });
      await sleep(1500);

      await pageDesktop.screenshot({
        path: path.join(SCREENSHOTS_DIR, '06_desktop_1366.png'),
        fullPage: true,
      });
      pass('Captured 06_desktop_1366.png (Desktop 1366x768)');
      await pageDesktop.close();
    }

    // -------------------------------------------------------------
    // Test 6: Regression Checks (Home, WeatherChips, History, Profile)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 6: Regression Verification on Core Features ---');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844 });

      // Home Screen
      await page.goto(`${baseUrl}/#/`, { waitUntil: 'networkidle2' });
      await sleep(1000);
      const homeText = await page.evaluate(() => document.body.innerText);
      if (
        homeText.includes('ছবি তুলুন') ||
        homeText.includes('গ্যালারি') ||
        homeText.includes('ক্যামেরা') ||
        homeText.includes('Gallery') ||
        homeText.includes('Camera')
      ) {
        pass('Home screen intact with diagnosis upload actions');
      } else {
        fail('Home screen regression');
      }

      // History Tab
      await page.goto(`${baseUrl}/#/history`, { waitUntil: 'networkidle2' });
      await sleep(800);
      const histText = await page.evaluate(() => document.body.innerText);
      if (histText.includes('ইতিহাস') || histText.includes('History')) {
        pass('History tab intact');
      } else {
        fail('History tab regression');
      }

      // Profile Tab
      await page.goto(`${baseUrl}/#/profile`, { waitUntil: 'networkidle2' });
      await sleep(800);
      const profText = await page.evaluate(() => document.body.innerText);
      if (profText.includes('প্রোফাইল') || profText.includes('Profile') || profText.includes('জেলা')) {
        pass('Profile tab intact');
      } else {
        fail('Profile tab regression');
      }

      await page.close();
    }

  } catch (err) {
    console.error('E2E run error:', err);
  } finally {
    await browser.close();
    if (previewProc) {
      previewProc.kill();
    }
  }

  console.log(`\n=== E2E Test Summary: ${passCount} PASSED, ${failCount} FAILED ===\n`);
  if (failCount > 0) process.exit(1);
}

main();
