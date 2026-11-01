import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const SOURCE_DIR = path.join(ROOT_DIR, 'disease_knowledge');
const TARGET_DIR = path.resolve(__dirname, '..', 'public', 'data');
const CLASS_INDEX_PATH = path.join(TARGET_DIR, 'class_index.json');

const BN_SRC = path.join(SOURCE_DIR, 'disease_information_bn.json');
const EN_SRC = path.join(SOURCE_DIR, 'disease_information_en.json');

const BN_DEST = path.join(TARGET_DIR, 'disease_information_bn.json');
const EN_DEST = path.join(TARGET_DIR, 'disease_information_en.json');

console.log('[sync-content] Validating and syncing disease knowledge content...');

if (!fs.existsSync(CLASS_INDEX_PATH)) {
  console.error(`[sync-content] ERROR: class_index.json not found at ${CLASS_INDEX_PATH}`);
  process.exit(1);
}

if (!fs.existsSync(BN_SRC) || !fs.existsSync(EN_SRC)) {
  console.error(`[sync-content] ERROR: Disease knowledge source files missing in ${SOURCE_DIR}`);
  process.exit(1);
}

const classIndexData = JSON.parse(fs.readFileSync(CLASS_INDEX_PATH, 'utf-8'));
const bnData = JSON.parse(fs.readFileSync(BN_SRC, 'utf-8'));
const enData = JSON.parse(fs.readFileSync(EN_SRC, 'utf-8'));

const requiredKeys = [...(classIndexData.classes || []), 'not_sure'];
const missingBn = [];
const missingEn = [];

for (const key of requiredKeys) {
  if (!bnData.classes || !bnData.classes[key]) {
    missingBn.push(key);
  }
  if (!enData.classes || !enData.classes[key]) {
    missingEn.push(key);
  }
}

if (missingBn.length > 0 || missingEn.length > 0) {
  console.error('[sync-content] VALIDATION FAILED: Missing required disease classes:');
  if (missingBn.length > 0) {
    console.error(`  Missing in Bangla JSON (${BN_SRC}): ${missingBn.join(', ')}`);
  }
  if (missingEn.length > 0) {
    console.error(`  Missing in English JSON (${EN_SRC}): ${missingEn.join(', ')}`);
  }
  process.exit(1);
}

fs.mkdirSync(TARGET_DIR, { recursive: true });
fs.copyFileSync(BN_SRC, BN_DEST);
fs.copyFileSync(EN_SRC, EN_DEST);

console.log(`[sync-content] ✓ Successfully validated ${requiredKeys.length} classes.`);
console.log(`[sync-content] ✓ Synced disease_information_bn.json and disease_information_en.json to public/data/`);
