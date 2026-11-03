#!/usr/bin/env node
/**
 * Release Guards for AgroLeaf AI (Module X4).
 *
 * Verifies all 8 production release conditions before final submission.
 * Run manually or during M09: npm run check:release
 *
 * Exit codes: 0 = ALL PASSED, 1 = RELEASE BLOCKED (one or more failed)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(FRONTEND_ROOT, '..');

const REJECT_CLASSES = ['other_rice', 'not_rice'];
const EXPECTED_CLASSES = [
  'healthy',
  'blast',
  'brown_spot',
  'leaf_smut',
  'tungro',
  'sheath_blight',
];

const results = [];
const warnings = [];

function pass(name, detail) {
  results.push({ name, status: 'PASS', detail });
  console.log(`  ✓ [PASS] ${name}: ${detail}`);
}

function fail(name, detail) {
  results.push({ name, status: 'FAIL', detail });
  console.log(`  ✗ [FAIL] ${name}: ${detail}`);
}

function warn(name, detail) {
  warnings.push({ name, detail });
  console.log(`  ⚠ [WARN] ${name}: ${detail}`);
}

console.log('======================================================================');
console.log(' AgroLeaf AI — Automated Release Guards (Module X4)');
console.log('======================================================================');

// Guard 1: calibration.json has no placeholder: true
const calPath = path.join(FRONTEND_ROOT, 'public/data/calibration.json');
if (!fs.existsSync(calPath)) {
  fail('1. Calibration JSON', 'public/data/calibration.json is missing');
} else {
  try {
    const cal = JSON.parse(fs.readFileSync(calPath, 'utf-8'));
    if (cal.placeholder === true) {
      fail('1. Calibration JSON', 'calibration.json contains placeholder: true');
    } else {
      pass('1. Calibration JSON', 'calibration.json has no placeholder flag');
    }
  } catch (err) {
    fail('1. Calibration JSON', `Failed to parse calibration.json: ${err.message}`);
  }
}

// The deployed model and metrics are read from the app's own config, so this check follows
// whatever model is live (v1, v8, v10, ...) instead of a hard-coded file name.
const configPath = path.join(FRONTEND_ROOT, 'src/ml/config.js');
const configText = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf-8') : '';
const modelUrl = (configText.match(/MODEL_URL = '([^']+)'/) || [])[1];
const partsBlock = (configText.match(/MODEL_PARTS = \[([^\]]*)\]/) || [])[1] || '';
const modelParts = [...partsBlock.matchAll(/'(\/models\/[^']+)'/g)].map((m) => m[1]);
const modelFiles = (modelParts.length ? modelParts : modelUrl ? [modelUrl] : []).map((u) => path.join(FRONTEND_ROOT, 'public', u));

// Guard 2: every deployed model file exists, each < 24 MiB, the first starts with 0x08 (ONNX protobuf)
if (!modelFiles.length) {
  fail('2. Production Model File', 'could not read MODEL_URL / MODEL_PARTS from src/ml/config.js');
} else {
  const missing = modelFiles.filter((f) => !fs.existsSync(f));
  if (missing.length) {
    fail('2. Production Model File', `missing: ${missing.map((f) => path.relative(FRONTEND_ROOT, f)).join(', ')}`);
  } else {
    const big = modelFiles.filter((f) => fs.statSync(f).size >= 24 * 1024 * 1024);
    const head = Buffer.alloc(1);
    const fd = fs.openSync(modelFiles[0], 'r');
    fs.readSync(fd, head, 0, 1, 0);
    fs.closeSync(fd);
    const total = modelFiles.reduce((n, f) => n + fs.statSync(f).size, 0);
    if (big.length) fail('2. Production Model File', `over the 24 MiB per-file ceiling: ${big.map((f) => path.basename(f)).join(', ')}`);
    else if (head[0] !== 0x08) fail('2. Production Model File', `first byte 0x${head[0].toString(16)} != 0x08 (not ONNX protobuf)`);
    else pass('2. Production Model File', `${modelUrl} present (${(total / (1024 * 1024)).toFixed(2)} MiB in ${modelFiles.length} file(s)), starts with 0x08`);
  }
}

// Guard 3: the placeholder model is not deployed
const placeholderPath = path.join(FRONTEND_ROOT, 'public/models/rice-placeholder.onnx');
if (!modelUrl) fail('3. Model URL Configuration', 'src/ml/config.js has no MODEL_URL');
else if (modelUrl.includes('placeholder')) fail('3. Model URL Configuration', 'config.js points to the placeholder model');
else if (fs.existsSync(placeholderPath)) fail('3. Model URL Configuration', 'public/models/rice-placeholder.onnx must be deleted');
else pass('3. Model URL Configuration', `config.js points to ${modelUrl}; no placeholder model`);

// Guard 4: class_index.json lists the 6 diagnosable classes first, then only the known reject outputs
const classIndexPath = path.join(FRONTEND_ROOT, 'public/data/class_index.json');
if (!fs.existsSync(classIndexPath)) {
  fail('4. Class Index', 'public/data/class_index.json is missing');
} else {
  try {
    const classes = JSON.parse(fs.readFileSync(classIndexPath, 'utf-8')).classes || [];
    const extra = classes.slice(EXPECTED_CLASSES.length);
    const ok = EXPECTED_CLASSES.every((c, i) => classes[i] === c) && extra.every((c) => REJECT_CLASSES.includes(c));
    if (!ok) fail('4. Class Index', `Expected ${JSON.stringify(EXPECTED_CLASSES)} + optional ${JSON.stringify(REJECT_CLASSES)}, found ${JSON.stringify(classes)}`);
    else pass('4. Class Index', `${classes.length} outputs: [${classes.join(', ')}]`);
  } catch (err) {
    fail('4. Class Index', `Failed to parse class_index.json: ${err.message}`);
  }
}

// Guard 5: the metrics file the Accuracy page shows is real (no fixture), internal_test.n > 0
const accuracyPage = path.join(FRONTEND_ROOT, 'src/pages/AccuracyPage.jsx');
const metricsUrl = ((fs.existsSync(accuracyPage) ? fs.readFileSync(accuracyPage, 'utf-8') : '').match(/metricsUrl = '([^']+)'/) || [])[1];
const metricsPath = metricsUrl ? path.join(FRONTEND_ROOT, 'public', metricsUrl) : null;
if (!metricsPath || !fs.existsSync(metricsPath)) {
  fail('5. Validation Metrics', `metrics file used by the Accuracy page is missing (${metricsUrl})`);
} else {
  try {
    const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));
    if (metrics.FIXTURE_NOT_REAL) fail('5. Validation Metrics', `${metricsUrl} contains FIXTURE_NOT_REAL: true`);
    else if (!(metrics.internal_test?.n > 0)) fail('5. Validation Metrics', `internal_test.n is not > 0 in ${metricsUrl}`);
    else pass('5. Validation Metrics', `${metricsUrl} real data (n=${metrics.internal_test.n}, macro-F1=${metrics.internal_test.macro_f1})`);
  } catch (err) {
    fail('5. Validation Metrics', `Failed to parse ${metricsUrl}: ${err.message}`);
  }
}

// Guard 6: samples/manifest.json has >= 3 entries, and every listed file exists
const samplesManifestPath = path.join(FRONTEND_ROOT, 'public/samples/manifest.json');
if (!fs.existsSync(samplesManifestPath)) {
  fail('6. Sample Images Manifest', 'public/samples/manifest.json is missing');
} else {
  try {
    const sm = JSON.parse(fs.readFileSync(samplesManifestPath, 'utf-8'));
    const items = Array.isArray(sm) ? sm : sm.samples || [];
    if (items.length < 3) {
      fail('6. Sample Images Manifest', `Fewer than 3 sample images listed (found ${items.length})`);
    } else {
      const missingFiles = [];
      for (const item of items) {
        // Manifest contract (X_BACKLOG / pick_samples.py): `src` is a public URL like /samples/x.jpg
        const rel = item.src ? item.src.replace(/^\/+/, '') : `samples/${item.filename}`;
        const filePath = path.join(FRONTEND_ROOT, 'public', rel);
        if (!fs.existsSync(filePath)) {
          missingFiles.push(rel);
        }
      }
      if (missingFiles.length > 0) {
        fail(
          '6. Sample Images Manifest',
          `Missing listed sample files: ${missingFiles.join(', ')}`
        );
      } else {
        pass(
          '6. Sample Images Manifest',
          `${items.length} sample images listed and all exist on disk`
        );
      }
    }
  } catch (err) {
    fail('6. Sample Images Manifest', `Failed to parse manifest: ${err.message}`);
  }
}

// Guard 7: audio/manifest.json lists 7 files that exist (warn only)
const audioManifestPath = path.join(FRONTEND_ROOT, 'public/audio/manifest.json');
if (!fs.existsSync(audioManifestPath)) {
  warn('7. Voice Audio Manifest', 'public/audio/manifest.json missing: voice is pending the user\'s Azure Speech key');
} else {
  try {
    const am = JSON.parse(fs.readFileSync(audioManifestPath, 'utf-8'));
    // ml/tools/generate_tts.py writes { <class_key>: { file: "/audio/x.mp3", ... } }
    const items = Array.isArray(am) ? am : am.files || Object.values(am);
    const missingAudio = [];
    for (const item of items) {
      const raw = typeof item === 'string' ? item : item.file || item.filename;
      const fn = raw ? path.basename(raw) : null;
      if (!fn || !fs.existsSync(path.join(FRONTEND_ROOT, 'public/audio', fn))) {
        missingAudio.push(fn || '(no file field)');
      }
    }
    if (items.length < 7 || missingAudio.length > 0) {
      warn(
        '7. Voice Audio Manifest',
        `Audio files incomplete (${items.length - missingAudio.length}/7 present, missing: ${missingAudio.join(', ') || 'manifest lists fewer than 7'}). Pending Azure Speech key.`
      );
    } else {
      pass('7. Voice Audio Manifest', `All ${items.length} audio files present on disk`);
    }
  } catch (err) {
    warn('7. Voice Audio Manifest', `Failed to parse audio manifest: ${err.message}`);
  }
}

// Guard 8: The sticker files exist
const stickerFrontend = path.join(FRONTEND_ROOT, 'public/brand/aignite-sticker-original.png');
const stickerAssets = path.join(REPO_ROOT, 'assets/brand/aignite-sticker-original.png');
const feExists = fs.existsSync(stickerFrontend);
const assetsExists = fs.existsSync(stickerAssets);

if (!feExists || !assetsExists) {
  fail(
    '8. AIgnite Competition Sticker',
    `Sticker missing in: ${[!feExists && 'frontend/public/brand', !assetsExists && 'assets/brand'].filter(Boolean).join(', ')}`
  );
} else {
  pass('8. AIgnite Competition Sticker', 'Sticker present in both assets/brand and public/brand');
}

console.log('----------------------------------------------------------------------');
const failures = results.filter((r) => r.status === 'FAIL');
const passes = results.filter((r) => r.status === 'PASS');

console.log(`Summary: ${passes.length} PASSED, ${failures.length} FAILED, ${warnings.length} WARNING(S)`);

if (failures.length > 0) {
  console.log('\n❌ RELEASE BLOCKED: The following release guards failed:');
  for (const f of failures) {
    console.log(`   - ${f.name}: ${f.detail}`);
  }
  console.log('\nNote: Today this failure is EXPECTED until tonight\'s Kaggle model is trained,');
  console.log('bundled via ml/tools/make_release_bundle.py, and samples picked via pick_samples.py.\n');
  process.exit(1);
} else {
  console.log('\n✅ ALL RELEASE GUARDS PASSED. Ready for submission release.\n');
  process.exit(0);
}
