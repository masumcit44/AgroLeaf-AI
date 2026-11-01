import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT_DIR, 'documentation', 'screenshots', 'm05');
fs.mkdirSync(OUT_DIR, { recursive: true });

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const STATES = [
  { key: 'healthy', file: '01_healthy.png' },
  { key: 'blast', file: '02_blast.png' },
  { key: 'brown_spot', file: '03_brown_spot.png' },
  { key: 'leaf_smut', file: '04_leaf_smut.png' },
  { key: 'tungro', file: '05_tungro.png' },
  { key: 'sheath_blight', file: '06_sheath_blight.png' },
  { key: 'not_sure', file: '07_not_sure.png' },
];

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture() {
  console.log('[capture-m05] Starting Vite dev server...');
  const vite = spawn('npx', ['vite', '--port', '5179'], {
    cwd: path.resolve(__dirname, '..'),
    shell: true,
    stdio: 'ignore',
  });

  // Wait 3 seconds for Vite to be up
  await wait(3000);

  for (const item of STATES) {
    const url = `http://localhost:5179/?force=${item.key}`;
    const outPath = path.join(OUT_DIR, item.file);
    console.log(`[capture-m05] Capturing ${item.key} -> ${item.file}...`);

    await new Promise((resolve) => {
      const proc = spawn(
        CHROME_PATH,
        [
          '--headless',
          '--disable-gpu',
          '--hide-scrollbars',
          '--window-size=390,844',
          `--screenshot=${outPath}`,
          url,
        ],
        { stdio: 'inherit' }
      );
      proc.on('close', resolve);
    });
  }

  console.log('[capture-m05] All 7 state screenshots captured successfully.');
  vite.kill();
  process.exit(0);
}

capture().catch((err) => {
  console.error('[capture-m05] Failed:', err);
  process.exit(1);
});
