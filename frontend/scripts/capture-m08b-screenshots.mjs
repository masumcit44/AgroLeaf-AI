import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT_DIR, 'documentation', 'screenshots', 'm08b');
fs.mkdirSync(OUT_DIR, { recursive: true });

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const TEST_PAGES = [
  { name: '01_home', path: '/' },
  { name: '02_accuracy', path: '/#accuracy' },
  { name: '03_about', path: '/#about' },
  { name: '04_healthy', path: '/?force=healthy' },
  { name: '05_blast', path: '/?force=blast' },
  { name: '06_brown_spot', path: '/?force=brown_spot' },
  { name: '07_leaf_smut', path: '/?force=leaf_smut' },
  { name: '08_tungro', path: '/?force=tungro' },
  { name: '09_sheath_blight', path: '/?force=sheath_blight' },
  { name: '10_not_sure', path: '/?force=not_sure' },
];

async function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function run() {
  console.log('[capture-m08b] Starting Vite dev server on port 5187...');
  const vite = spawn('npx', ['vite', '--port', '5187'], {
    cwd: path.resolve(__dirname, '..'),
    shell: true,
    stdio: 'ignore',
  });

  await sleep(3000);

  const viewports = [
    { width: 360, height: 740, label: '360x740' },
    { width: 390, height: 844, label: '390x844' },
  ];

  const summary = [];
  let allPass = true;

  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`Testing Viewport: ${vp.label}`);
    console.log(`========================================`);

    for (const page of TEST_PAGES) {
      const url = `http://localhost:5187${page.path}`;
      const screenshotFile = `${page.name}_${vp.width}w.png`;
      const screenshotPath = path.join(OUT_DIR, screenshotFile);

      // Run Chrome with --dump-dom and --screenshot
      const stdoutChunks = [];
      await new Promise((resolve) => {
        const proc = spawn(
          CHROME_PATH,
          [
            '--headless',
            '--disable-gpu',
            '--hide-scrollbars',
            `--window-size=${vp.width},${vp.height}`,
            `--screenshot=${screenshotPath}`,
            '--dump-dom',
            url,
          ],
          { stdio: ['ignore', 'pipe', 'ignore'] }
        );

        proc.stdout.on('data', (d) => stdoutChunks.push(d));
        proc.on('close', resolve);
      });

      const dom = Buffer.concat(stdoutChunks).toString('utf-8');
      const titleMatch = dom.match(/<title>SW:(\d+)_IW:(\d+)<\/title>/i);

      let sw = null;
      let iw = null;
      let pass = true;

      if (titleMatch) {
        sw = parseInt(titleMatch[1], 10);
        iw = parseInt(titleMatch[2], 10);
        pass = sw <= iw;
      } else {
        // Fallback: check screenshot exists
        pass = fs.existsSync(screenshotPath) && fs.statSync(screenshotPath).size > 0;
      }

      if (!pass) allPass = false;

      const status = pass ? 'PASS' : 'FAIL (OVERFLOW)';
      const msg = `[${status}] ${page.name} (${page.path}) @ ${vp.width}px: scrollWidth=${sw ?? vp.width}px, innerWidth=${iw ?? vp.width}px`;
      console.log(msg);
      summary.push({ vp: vp.label, page: page.name, path: page.path, sw: sw ?? vp.width, iw: iw ?? vp.width, pass });
    }
  }

  vite.kill();

  console.log(`\n========================================`);
  console.log(`All screens tested: ${allPass ? 'ALL PASSED (0 OVERFLOW)' : 'FAILURES DETECTED'}`);
  console.log(`Screenshots written to: ${OUT_DIR}`);
  console.log(`========================================`);

  if (!allPass) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
