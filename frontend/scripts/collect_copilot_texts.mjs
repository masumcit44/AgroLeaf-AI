// Collects every FIXED Bengali answer text the copilot can show, cleaned exactly like the app does
// before speaking (voiceService.cleanTextForSpeech), with the same key the browser computes
// (first 16 hex of SHA-256 of the cleaned text). Output: JSON [{key, text}] on stdout or to a file.
// Used by ml/tools/build_copilot_audio.py and by the coverage test.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { AGRICULTURAL_KB } from '../src/features/copilot/data/agricultural_kb.js';
import { AGRICULTURAL_RESEARCH_BUNDLE } from '../src/features/copilot/data/agricultural_research_bundle.js';
import { cleanTextForSpeech } from '../src/features/copilot/voiceService.js';
import { OUT_OF_DOMAIN_STEMS } from '../src/features/copilot/copilotEngine.js';

export function audioKey(text) {
  return createHash('sha256').update(cleanTextForSpeech(text), 'utf8').digest('hex').slice(0, 16);
}

const ANSWER_FIELDS = new Set(['text_bn']);

function walk(node, out) {
  if (Array.isArray(node)) return node.forEach((n) => walk(n, out));
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (ANSWER_FIELDS.has(k) && typeof v === 'string') out.push(v);
      else walk(v, out);
    }
  }
}

export function collectCopilotTexts() {
  const texts = [];
  walk(AGRICULTURAL_KB, texts);
  walk(AGRICULTURAL_RESEARCH_BUNDLE, texts);

  // Literal answers written directly in the engine: textBn: '...' or textBn: `...` without ${}
  const engine = readFileSync(fileURLToPath(new URL('../src/features/copilot/copilotEngine.js', import.meta.url)), 'utf8');
  for (const m of engine.matchAll(/textBn:\s*'((?:[^'\\]|\\.)*)'/g)) texts.push(m[1].replace(/\\'/g, "'"));
  for (const m of engine.matchAll(/textBn:\s*`([^`]*)`/g)) if (!m[1].includes('${')) texts.push(m[1]);

  // Template answer with one variable: the out-of-domain crop name
  const ood = engine.match(/textBn:\s*`(আপনি "\$\{oodStem\}"[^`]*)`/);
  if (ood) for (const stem of OUT_OF_DOMAIN_STEMS) texts.push(ood[1].replace('${oodStem}', stem));

  const byKey = new Map();
  for (const t of texts) {
    const clean = cleanTextForSpeech(t);
    if (!clean || !/[ঀ-৿]/.test(clean)) continue;
    byKey.set(audioKey(t), clean);
  }
  return [...byKey].map(([key, text]) => ({ key, text }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const list = collectCopilotTexts();
  const out = process.argv[2];
  if (out) writeFileSync(out, JSON.stringify(list, null, 1));
  else console.log(JSON.stringify(list));
  console.error(`[collect_copilot_texts] ${list.length} fixed answers, ${list.reduce((n, x) => n + x.text.length, 0)} characters`);
}
