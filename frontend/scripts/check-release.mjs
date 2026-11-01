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

// Guard 2: public/models/rice-mnv3l-v1.onnx exists, < 24 MiB, starts with 0x08
const modelPath = path.join(FRONTEND_ROOT, 'public/models/rice-mnv3l-v1.onnx');
if (!fs.existsSync(modelPath)) {
  fail('2. Production Model File', 'public/models/rice-mnv3l-v1.onnx is missing');
} else {
  try {
    const stat = fs.statSync(modelPath);
    const maxBytes = 24 * 1024 * 1024;
    const fd = fs.openSync(modelPath, 'r');
    const buf = Buffer.alloc(1);
    fs.readSync(fd, buf, 0, 1, 0);
    fs.closeSync(fd);

    const sizeOk = stat.size < maxBytes;
    const magicOk = buf[0] === 0x08;

    if (!sizeOk) {
      fail(
        '2. Production Model File',
        `File size ${(stat.size / (1024 * 1024)).toFixed(2)} MiB exceeds 24 MiB ceiling`
      );
    } else if (!magicOk) {
      fail(
        '2. Production Model File',
        `Magic header 0x${buf[0]?.toString(16)} != 0x08 (not valid protobuf ONNX)`
      );
    } else {
      pass(
        '2. Production Model File',
        `rice-mnv3l-v1.onnx present (${(stat.size / (1024 * 1024)).toFixed(2)} MiB), starts with byte 0x08`
      );
    }
  } catch (err) {
    fail('2. Production Model File', `Error reading model file: ${err.message}`);
  }
}

// Guard 3: config.js MODEL_URL points at rice-mnv3l-v1.onnx, placeholder model is gone
const configPath = path.join(FRONTEND_ROOT, 'src/ml/config.js');
const placeholderPath = path.join(FRONTEND_ROOT, 'public/models/rice-placeholder.onnx');
if (!fs.existsSync(configPath)) {
  fail('3. Model URL Configuration', 'src/ml/config.js is missing');
} else {
  const configText = fs.readFileSync(configPath, 'utf-8');
  const pointsToProd = configText.includes('rice-mnv3l-v1.onnx');
  const placeholderExists = fs.existsSync(placeholderPath);

  if (!pointsToProd && placeholderExists) {
    fail(
      '3. Model URL Configuration',
      'config.js still points to placeholder and rice-placeholder.onnx still exists in public/models/'
    );
  } else if (!pointsToProd) {
    fail('3. Model URL Configuration', 'config.js does not point to rice-mnv3l-v1.onnx');
  } else if (placeholderExists) {
    fail('3. Model URL Configuration', 'public/models/rice-placeholder.onnx must be deleted');
  } else {
    pass(
      '3. Model URL Configuration',
      'config.js points to rice-mnv3l-v1.onnx and placeholder model is deleted'
    );
  }
}

// Guard 4: class_index.json classes equal exact 6 classes
const classIndexPath = path.join(FRONTEND_ROOT, 'public/data/class_index.json');
if (!fs.existsSync(classIndexPath)) {
  fail('4. Class Index', 'public/data/class_index.json is missing');
} else {
  try {
    const ci = JSON.parse(fs.readFileSync(classIndexPath, 'utf-8'));
    const classes = ci.classes || [];
    const match =
      classes.length === EXPECTED_CLASSES.length &&
      EXPECTED_CLASSES.every((c, i) => classes[i] === c);
    if (!match) {
      fail(
        '4. Class Index',
        `Classes mismatch. Expected: ${JSON.stringify(EXPECTED_CLASSES)}, found: ${JSON.stringify(classes)}`
      );
    } else {
      pass(
        '4. Class Index',
        `Exact 6 classes match [${EXPECTED_CLASSES.join(', ')}]`
      );
    }
  } catch (err) {
    fail('4. Class Index', `Failed to parse class_index.json: ${err.message}`);
  }
}

// Guard 5: metrics-v1.json exists, no FIXTURE_NOT_REAL, internal_test.n > 0
const metricsPath = path.join(FRONTEND_ROOT, 'public/data/metrics-v1.json');
if (!fs.existsSync(metricsPath)) {
  fail('5. Validation Metrics', 'public/data/metrics-v1.json is missing');
} else {
  try {
    const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));
    if (metrics.FIXTURE_NOT_REAL) {
      fail('5. Validation Metrics', 'metrics-v1.json contains FIXTURE_NOT_REAL: true');
    } else if (!metrics.internal_test || !(metrics.internal_test.n > 0)) {
      fail(
        '5. Validation Metrics',
        `internal_test.n is not > 0 (found ${metrics.internal_test?.n})`
      );
    } else {
      pass(
        '5. Validation Metrics',
        `metrics-v1.json real data present (n=${metrics.internal_test.n}, macro-F1=${metrics.internal_test.macro_f1})`
      );
    }
  } catch (err) {
    fail('5. Validation Metrics', `Failed to parse metrics-v1.json: ${err.message}`);
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
    const items = Array.isArray(am) ? am : am.files || [];
    const missingAudio = [];
    for (const item of items) {
      const fn = typeof item === 'string' ? item : item.filename;
      if (fn && !fs.existsSync(path.join(FRONTEND_ROOT, 'public/audio', fn))) {
        missingAudio.push(fn);
      }
    }
    if (items.length < 7 || missingAudio.length > 0) {
      warn(
        '7. Voice Audio Manifest',
        `Audio files incomplete (${items.length}/7 present, missing: ${missingAudio.join(', ')}). Pending Azure Speech key.`
      );
    } else {
      pass('7. Voice Audio Manifest', 'All 7 audio files present on disk');
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
