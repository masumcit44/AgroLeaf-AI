import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..', '..', '..');

describe('English disease name verification', () => {
  const enPath = path.join(ROOT_DIR, 'disease_knowledge', 'disease_information_en.json');
  const enData = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

  const expectedNames = {
    healthy: 'Healthy leaf',
    blast: 'Rice blast',
    brown_spot: 'Brown spot',
    leaf_smut: 'Leaf smut',
    tungro: 'Rice tungro',
    sheath_blight: 'Sheath blight',
    not_sure: 'Not sure',
  };

  it('matches expected English display names from disease_information_en.json for all classes', () => {
    for (const [key, expectedName] of Object.entries(expectedNames)) {
      const cls = enData.classes[key];
      expect(cls, `Missing class ${key} in en.json`).toBeDefined();
      expect(cls.name_en).toBe(expectedName);
      // Ensure the English name is never just the raw internal key
      expect(cls.name_en).not.toBe(key);
    }
  });
});
