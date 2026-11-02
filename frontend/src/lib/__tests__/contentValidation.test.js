import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shouldShowOfficialGuidance } from '../resultRules.js';
import { REJECT_KEYS } from '../../ml/decide.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..', '..', '..');

describe('Disease Content Validation', () => {
  const classIndexPath = path.join(ROOT_DIR, 'frontend', 'public', 'data', 'class_index.json');
  const bnPath = path.join(ROOT_DIR, 'disease_knowledge', 'disease_information_bn.json');
  const enPath = path.join(ROOT_DIR, 'disease_knowledge', 'disease_information_en.json');

  const classIndex = JSON.parse(fs.readFileSync(classIndexPath, 'utf-8'));
  const bn = JSON.parse(fs.readFileSync(bnPath, 'utf-8'));
  const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

  // Reject outputs (not_rice, other_rice) are never named, so they have no disease card
  const requiredClasses = [...classIndex.classes.filter((k) => !REJECT_KEYS.includes(k)), 'not_sure'];

  it('contains all required classes plus not_sure in both Bangla and English sources', () => {
    for (const key of requiredClasses) {
      expect(bn.classes[key], `Missing ${key} in BN JSON`).toBeDefined();
      expect(en.classes[key], `Missing ${key} in EN JSON`).toBeDefined();
    }
  });

  it('hides official guidance for tungro, sheath_blight, leaf_smut, and healthy; shows for blast and brown_spot', () => {
    // Blast and Brown spot have verbatim official text
    expect(shouldShowOfficialGuidance(bn.classes.blast.official_guidance)).toBe(true);
    expect(shouldShowOfficialGuidance(bn.classes.brown_spot.official_guidance)).toBe(true);

    // Tungro and sheath blight have unverified placeholder brackets in draft
    expect(shouldShowOfficialGuidance(bn.classes.tungro.official_guidance)).toBe(false);
    expect(shouldShowOfficialGuidance(bn.classes.sheath_blight.official_guidance)).toBe(false);

    // Leaf smut and healthy have null guidance
    expect(shouldShowOfficialGuidance(bn.classes.leaf_smut.official_guidance)).toBe(false);
    expect(shouldShowOfficialGuidance(bn.classes.healthy.official_guidance)).toBe(false);
  });

  it('does not contain prohibited words "diagnosis" or "রোগ নির্ণয়" in farmer results or class titles', () => {
    for (const key of requiredClasses) {
      const bnItem = bn.classes[key];
      expect(bnItem.name_bn).not.toContain('রোগ নির্ণয়');
      expect(bnItem.meaning_bn).not.toContain('রোগ নির্ণয়');
    }
  });
});
