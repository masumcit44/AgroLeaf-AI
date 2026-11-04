// Project safety rule: the app never tells a farmer which pesticide to use or how much.
// Sentences that name a pesticide/fungicide (active ingredient or brand) or give a spray /
// seed-treatment dose are removed from copilot answers and replaced by one referral line.
// Fertilizer and organic-manure amounts are kept (farm management, not pesticide dosing).

const PESTICIDE_NAMES = [
  'ট্রাইসাইক্লাজোল', 'ট্রুপার', 'বিম', 'ম্যানকোজেব', 'ডাইথেন', 'ইন্ডোফিল', 'প্রপিকোনাজোল', 'টিল্ট',
  'ভ্যালিডামাইসিন', 'ভ্যালিডা', 'সেথমাইসিন', 'হেক্সাকোনাজোল', 'কার্বেনডাজিম', 'অটোস্টিন', 'প্রভ্যাক্স',
  'মিপসিন', 'এডমায়ার', 'ইমিডাক্লোপ্রিড', 'নাটিভো', 'এমিস্টার', 'কন্টাফ', 'ফিলিয়া', 'স্কোর',
  'ডব্লিউপি', 'ইসি', 'এসসি', 'tricyclazole', 'mancozeb', 'propiconazole', 'carbendazim',
  'imidacloprid', 'validamycin', 'hexaconazole',
];
const NAME_RE = new RegExp(`(^|[\\s(,/])(${PESTICIDE_NAMES.join('|')})(?=[\\s),।.:/-]|$)`, 'i');
// "per litre of water … g/ml" or "per kg seed … g": a spray or seed-treatment dose
const DOSE_RE = /(লিটার পানিতে|প্রতি কেজি বীজ|গ্রাম\s*\/\s*কেজি|কেজি বীজে)[^।\n]*?[০-৯0-9.]+\s*(গ্রাম|মিলি|ml|g)\b|[০-৯0-9.]+\s*(গ্রাম|মিলি|ml)\s*(প্রতি লিটার|\/\s*লিটার|প্রতি কেজি বীজ|\/\s*কেজি)/i;

export const REFERRAL_BN =
  'কোন ওষুধ, কতটুকু ও কখন দেবেন, তা উপজেলা কৃষি অফিসার বা ১৬১২৩ নম্বরে কল করে জেনে নিন।';

// A repeat-spray instruction only makes sense after a removed pesticide sentence
const RESPRAY_RE = /পুনরায় স্প্রে|আবার স্প্রে|দ্বিতীয়বার স্প্রে/;

export function isUnsafeChemicalSentence(sentence) {
  return NAME_RE.test(sentence) || DOSE_RE.test(sentence) || RESPRAY_RE.test(sentence);
}

/** Removes pesticide names/doses sentence by sentence; adds the referral once if anything was removed. */
export function sanitizeChemicalDoses(text) {
  if (!text || typeof text !== 'string') return text;
  let removed = false;
  const lines = text.split('\n').map((line) => {
    const parts = line.split(/(?<=[।!?])\s*/);
    const kept = parts.filter((p) => {
      if (p.trim() && isUnsafeChemicalSentence(p)) {
        removed = true;
        return false;
      }
      return true;
    });
    return kept.join(' ').trim();
  });
  let out = lines.filter((l, i) => l || !lines[i - 1]).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  if (removed && !out.includes('১৬১২৩')) out = `${out}${out ? ' ' : ''}${REFERRAL_BN}`;
  else if (removed && !out.includes(REFERRAL_BN)) out = `${out} ${REFERRAL_BN}`;
  return out;
}

/** Applies the rule to every text field a copilot response shows or speaks. */
export function sanitizeResponse(resp) {
  if (!resp || typeof resp !== 'object') return resp;
  const out = { ...resp };
  for (const k of ['textBn', 'voiceBn']) if (typeof out[k] === 'string') out[k] = sanitizeChemicalDoses(out[k]);
  return out;
}
