import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '..');

function findBrowser() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

async function main() {
  const chromePath = findBrowser();
  if (!chromePath) {
    console.error('No Chrome browser found');
    process.exit(1);
  }

  const preview = spawn('npx', ['vite', 'preview', '--port', '54321', '--strictPort'], {
    cwd: FRONTEND_DIR,
    shell: true,
  });

  await new Promise((res) => setTimeout(res, 3500));

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    page.on('console', msg => console.log('[browser]', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('[browser ERROR]', err.message));
    await page.goto('http://localhost:54321/?dev=1#/dev/parity', { waitUntil: 'networkidle0' });

    console.log('[parity-test] Waiting for Run Parity Verification button...');
    const btn = await page.waitForSelector('[data-testid="run-parity-btn"]', { timeout: 10000 });
    await btn.click();
    console.log('[parity-test] Clicked button [data-testid="run-parity-btn"], waiting for ONNX inference to complete...');

    await page.waitForFunction(
      () => {
        const btnEl = document.querySelector('[data-testid="run-parity-btn"]');
        return btnEl && !btnEl.disabled && !btnEl.innerText.includes('Running Checks');
      },
      { timeout: 45000 }
    );

    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('[parity-test] Parity test results from browser:\n');
    const filtered = bodyText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && (
        l.includes('Check A') ||
        l.includes('Check B') ||
        l.includes('PASS') ||
        l.includes('FAIL') ||
        l.includes('সর্বোচ্চ পার্থক্য') ||
        l.includes('সফল') ||
        l.includes('blast_')
      ));
    console.log(filtered.join('\n'));
  } catch (err) {
    console.error('[parity-test] Error:', err);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    preview.kill();
  }
}

main();
