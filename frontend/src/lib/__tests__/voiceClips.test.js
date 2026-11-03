import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { notSureClipKey, resolveAudioEntry } from '../audioManifest.js';
import bn from '../../i18n/bn.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..', '..', '..');
const AUDIO_DIR = path.join(ROOT_DIR, 'frontend', 'public', 'audio');
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf-8'));

const manifest = read(path.join(AUDIO_DIR, 'manifest.json'));
const classes = read(path.join(ROOT_DIR, 'disease_knowledge', 'disease_information_bn.json')).classes;
const outcomes = read(path.join(ROOT_DIR, 'disease_knowledge', 'voice_outcomes_bn.json')).outcomes;

describe('Voice clip for each "not sure" reason (F4b)', () => {
  it('maps every reason that has its own on-screen text to its own clip', () => {
    expect(notSureClipKey('not_leaf')).toBe('not_rice');
    expect(notSureClipKey('other_problem')).toBe('other_rice');
    expect(notSureClipKey('healthy_needs_high_confidence')).toBe('healthy_caution');
  });

  it('keeps the general clip for low confidence, the suppressed class and unknown reasons', () => {
    expect(notSureClipKey('low_confidence')).toBe('not_sure');
    expect(notSureClipKey('suppressed')).toBe('not_sure');
    expect(notSureClipKey(undefined)).toBe('not_sure');
  });

  it('every clip the app can pick is in the manifest', () => {
    for (const reason of ['not_leaf', 'other_problem', 'healthy_needs_high_confidence', 'low_confidence', 'suppressed']) {
      expect(resolveAudioEntry(manifest, notSureClipKey(reason)), reason).not.toBeNull();
    }
    for (const key of Object.keys(classes)) {
      expect(resolveAudioEntry(manifest, key), key).not.toBeNull();
    }
  });
});

describe('Voice manifest matches the files and the approved scripts', () => {
  it('every manifest entry points to a real MP3 file', () => {
    for (const [key, entry] of Object.entries(manifest)) {
      const file = path.join(AUDIO_DIR, path.basename(entry.file));
      expect(fs.existsSync(file), key).toBe(true);
      const head = fs.readFileSync(file).subarray(0, 3);
      // MPEG frame sync (0xFFEx) or an ID3 tag
      const isMp3 = (head[0] === 0xff && (head[1] & 0xe0) === 0xe0) || head.toString('latin1') === 'ID3';
      expect(isMp3, `${key} is not an MP3`).toBe(true);
    }
  });

  it('each transcript is exactly the approved script it was generated from', () => {
    const approved = {
      ...Object.fromEntries(Object.entries(classes).map(([k, v]) => [k, v.voice_script_bn])),
      ...Object.fromEntries(Object.entries(outcomes).map(([k, v]) => [k, v.voice_script_bn])),
    };
    for (const [key, entry] of Object.entries(manifest)) {
      expect(entry.script, key).toBe(approved[key]);
      expect(entry.chars, key).toBe(approved[key].length);
    }
  });

  it('each outcome script belongs to an existing on-screen explanation', () => {
    for (const [key, o] of Object.entries(outcomes)) {
      expect(typeof bn[o.matches_screen_text], key).toBe('string');
    }
  });
});
