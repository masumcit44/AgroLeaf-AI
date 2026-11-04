// Free-only deterministic on-device agricultural RAG & Intent Matching Engine
// Evaluates farmer spoken queries against verified BRRI/DAE knowledge base.
// Zero paid APIs, zero cloud inference dependencies, sub-5ms latency.
// Strictly adheres to Bangla Response Language Policy (100% Bangla answers in BN mode).

import { sanitizeResponse } from './safety.js';
import { AGRICULTURAL_KB } from './data/agricultural_kb.js';
import {
  parseFarmingPlannerSlots,
  calculateBarcFertilizer,
  buildPersonalizedRoadmap,
  runAgriculturalResearch,
} from './researchPlannerEngine.js';

export {
  parseFarmingPlannerSlots,
  calculateBarcFertilizer,
  buildPersonalizedRoadmap,
  runAgriculturalResearch,
};

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normalization & tokenization helper.
 * Strips Unicode noise, zero-width characters, Bengali & Western punctuation.
 */
export function normalizeQuery(query) {
  if (!query || typeof query !== 'string') return '';
  return query
    .toLowerCase()
    .normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Strip zero-width joiners/spaces
    .replace(/[।?!.,;:’'"()\-—_/\\`~@#$%^&*+=[\]{}|<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Helper: checks if a word root or inflected token exists in the normalized string.
 * Supports common Bengali inflections (-র, -ের, -ে, -কে, -তে).
 * Prevents false prefix collisions (e.g. "আমার" colliding with "আম").
 */
function hasStemToken(normalizedText, stem) {
  if (!normalizedText || !stem) return false;
  // Inflection pattern: stem followed optionally by Bengali case endings or English suffix
  const pattern = new RegExp(`(^|\\s)${escapeRegex(stem)}(র|ের|ে|য়|কে|তে|er|s)?(\\s|$)`, 'i');
  return pattern.test(normalizedText);
}

/**
 * Helper: checks if any of the given keywords exist as token or phrase
 */
function containsKeyword(normalizedText, keywords) {
  for (const kw of keywords) {
    if (kw.includes(' ')) {
      if (normalizedText.includes(kw)) return true;
    } else {
      if (hasStemToken(normalizedText, kw)) return true;
    }
  }
  return false;
}

// Banned / Highly Hazardous Agrochemicals
const BANNED_CHEMICAL_KEYWORDS = [
  'প্যারাকুয়াট',
  'প্যারাকোট',
  'গ্রামোক্সন',
  'গ্রামাক্সন',
  'paraquat',
  'gramoxone',
  'ডিডিটি',
  'ddt',
  'এন্ডোসালফান',
  'endosulfan',
  'এলড্রিন',
  'aldrin',
  'ডাইএলড্রিন',
  'dieldrin',
];

// Out-of-Domain Non-Rice Entities (Stems checked with inflection support)
export const OUT_OF_DOMAIN_STEMS = [
  'আলু',
  'গম',
  'ভুট্টা',
  'পাট',
  'লিচু',
  'পেঁয়াজ',
  'মরিচ',
  'টমেটো',
  'বেগুন',
  'সরিষা',
  'মাছ',
  'পুকুর',
  'মুরগি',
  'পোল্ট্রি',
  'গরু',
  'ছাগল',
  'ডালিম',
  'কলা',
  'আপেল',
  'কমলা',
  'চা গাছ',
  'তামাক',
  'নির্বাচন',
  'রাজনীতি',
  'সিনেমা',
  'টাকা ঋণ',
  'ব্যাংক ঋণ',
  'ক্রিকেট',
  'ফুটবল',
  'potato',
  'wheat',
  'maize',
  'tomato',
  'poultry',
  'chicken',
];

// Disease Keyword Lexicon with dialect, colloquial & Banglish aliases
const DISEASE_LEXICON = {
  blast: [
    'ব্লাস্ট', 'ব্লাষ্ট', 'বলাস্ট', 'ব্লাস্ত', 'মাকু দাগ', 'শীষ ব্লাস্ট', 'পাতা ব্লাস্ট', 'ব্লাস্ট রোগ',
    'blast', 'blast rog', 'maku dag', 'shish blast', 'pata blast',
  ],
  brown_spot: [
    'বাদামি দাগ', 'বাদামী দাগ', 'বাদামি ফোটা', 'বাদামী ফোটা', 'ব্রাউন স্পট', 'ব্রাউনস্পট', 'তিলের মতো', 'বাদামি রোগ',
    'পাতায় দাগ', 'পাতায় দাগ', 'পাতার দাগ',
    'brown spot', 'brownspot', 'badami dag', 'tiler moto', 'patay dag', 'patar dag', 'dag dekha',
  ],
  leaf_smut: [
    'লিফ স্মাট', 'লিফস্মাট', 'স্মাট', 'কালো দাগ', 'ছাই দাগ', 'ন্যারো ব্রাউন', 'সরু দাগ',
    'leaf smut', 'leafsmut', 'smut', 'kalo dag', 'narrow brown',
  ],
  tungro: [
    'টুংরো', 'টুংগ্রো', 'টংরো', 'টুংরু', 'সবুজ পাতা ফড়িং', 'পাতা ফড়িং', 'বেঁটে রোগ', 'গাছ খর্ব', 'টুংরো রোগ',
    'tungro', 'tungru', 'tongro', 'sobuj pata foring', 'bente rog',
  ],
  sheath_blight: [
    'খোল পোড়া', 'খোলপোড়া', 'শীথ ব্লাইট', 'শীথব্লাইট', 'শিথ ব্লাইট', 'সাপের খোলস', 'কাণ্ডের খোল', 'খোল পচা',
    'sheath blight', 'sheathblight', 'khol pora', 'kholpora', 'shith blight',
  ],
  other_rice: [
    'পামরি', 'হিসপা', 'মাজরা', 'গান্ধি পোকা', 'ব্যাকটেরিয়াল পাতা পোড়া', 'বিএলবি', 'পাতা ঝলসানো',
    'hispa', 'pamri', 'majra', 'blb', 'bacterial blight',
  ],
  healthy: [
    'সুস্থ ধান', 'ভালো ধান', 'রোগমুক্ত', 'তাজা ধান', 'কোনো রোগ নেই', 'সুস্থ পাতা', 'সুস্থ',
    'healthy', 'bhalo dhan', 'shustho', 'rog mukto',
  ],
};

// Priority-ordered Intent Lexicon
const INTENT_LEXICON = {
  comparison: [
    'পার্থক্য', 'আলাদা', 'ভিন্ন', 'তুলনা', 'বনাম',
    'difference', 'compare', 'comparison', 'vs', 'alada', 'parthokko',
  ],
  safety: [
    'মাস্ক', 'গ্লাভস', 'সতর্কতা', 'সাবধানতা', 'গায়ে লাগলে', 'ক্ষতিকর', 'বিষাক্ত',
    'safety', 'ppe', 'caution', 'mask', 'gloves',
  ],
  progression: [
    'বাড়ছে', 'বাড়ছে', 'বেশি হচ্ছে', 'ছড়াচ্ছে', 'ছড়াচ্ছে', 'খারাপ হচ্ছে', 'পাতা শুকিয়ে যাচ্ছে', 'পাতা শুকিয়ে যাচ্ছে',
    'barche', 'beshi hocche', 'chorae', 'kharap hocche',
  ],
  follow_up_scan: [
    'আবার ছবি', 'কবে ছবি', 'পুনরায় স্ক্যান', 'পুনরায় স্ক্যান', 'আবার স্ক্যান', 'ফলো আপ', 'কয়দিন পর', 'কদিন পর',
    'ছবি তুলব', 'ছবি তুলবো', 'কবে ছবি তুলব', 'আবার কবে',
    'abar photo', 'kobe chobi', 'abar scan', 'koy din por', 'next scan', 'follow up', 'kobe photo', 'photo tulbo', 'abar kobe',
  ],
  treatment: [
    'কী করব', 'কি করব', 'কী করণীয়', 'কি করণীয়', 'কী করণীয়', 'উপায় কী', 'উপায় কী', 'প্রতিকার', 'দমন', 'চিকিৎসা',
    'ওষুধ', 'ঔষধ', 'কীটনাশক', 'ছত্রাকনাশক', 'বালাইনাশক', 'বিষ', 'স্প্রে', 'ছিটাব', 'ছিটাবো', 'ছিটানো', 'ডোজ',
    'ki korbo', 'kivabe domon korbo', 'protikar', 'treatment', 'remedy', 'spray', 'medicine', 'dose', 'chitao',
  ],
  organic: [
    'জৈব', 'প্রাকৃতিক', 'ভেষজ', 'ভেষজনাশক', 'গোবর', 'গোমূত্র', 'নিম পাতা', 'নিম', 'ছাই', 'ট্রাইকোডার্মা',
    'organic', 'natural', 'home made', 'neem', 'gobor', 'trichoderma',
  ],
  fertilizer: [
    'ইউরিয়া', 'নাইট্রোজেন', 'পটাশ', 'এমওপি', 'দস্তা', 'জিংক', 'জিপসাম', 'টিএসপি', 'ডিএপি',
    'সার', 'সার দেওয়া', 'খাবার', 'urea', 'potash', 'fertilizer', 'zinc', 'sar',
  ],
  water: [
    'পানি', 'জল', 'সেচ', 'শুকানো', 'নিষ্কাশন', 'ড্রেন', 'রস', 'জলাবদ্ধতা', 'পানি কি রাখব',
    'water', 'irrigation', 'drainage', 'pani', 'sech',
  ],
  spread: [
    'ছড়ায়', 'ছড়াবে', 'ছোঁয়াচে', 'বিস্তার', 'সংক্রামক', 'অন্য গাছে', 'নষ্ট হবে', 'বিপদ', 'ক্ষতি', 'মারাত্মক', 'মহামারী', 'কীভাবে হয়', 'কীভাবে হয়',
    'spread', 'danger', 'contagious', 'chorae', 'chorabe', 'kivabe hoy',
  ],
  symptoms: [
    'লক্ষণ', 'চেনার উপায়', 'উপসর্গ', 'কেমন দেখায়', 'চিহ্ন', 'কিভাবে বুঝব', 'সিম্পটম', 'কেন হয়', 'কেন হয়', 'কারণ', 'কেন',
    'symptom', 'sign', 'lokkhon', 'chinar upay', 'kemon dekhay', 'keno hoy', 'karon', 'keno',
  ],
  prevention: [
    'প্রতিরোধ', 'আগের সতর্কতা', 'বীজ শোধন', 'পরবর্তী মৌসুম', 'ভবিষ্যতে', 'আগে থেকে',
    'prevention', 'preventive', 'protirodh', 'seed treatment',
  ],
  weather: [
    'বৃষ্টি', 'কুয়াশা', 'মেঘ', 'রোদ', 'তাপমাত্রা', 'আবহাওয়া', 'শিশির', 'বাতাস', 'ঝড়',
    'rain', 'weather', 'bristi', 'kuwasha', 'rode',
  ],
  helpline: [
    'কল', 'ফোন', 'নম্বর', '১৬১২৩', '16123', 'অফিসার',
    'help', 'helpline', 'call', 'phone', 'officer',
  ],
};

/**
 * Checks if the user is genuinely asking about Mango (আম)
 * Guarantees that pronouns (আমার, আমি, আমাদের) NEVER match as mango!
 */
function isGenuineMangoInquiry(normalizedText) {
  // If the sentence contains rice context, it is NEVER mango
  if (
    normalizedText.includes('ধান') ||
    normalizedText.includes('ধানে') ||
    normalizedText.includes('ব্লাস্ট') ||
    normalizedText.includes('টুংরো') ||
    normalizedText.includes('খোল') ||
    normalizedText.includes('পাতায়') ||
    normalizedText.includes('পাতায়') ||
    normalizedText.includes('dhan') ||
    normalizedText.includes('rice')
  ) {
    return false;
  }

  // Check for genuine mango plant phrases
  const mangoPhrases = ['আম গাছ', 'আমগাছ', 'আমের', 'আমবাগান', 'কাঁচা আম', 'পাকা আম', 'mango tree', 'mango'];
  for (const mp of mangoPhrases) {
    if (normalizedText.includes(mp)) return true;
  }

  // Standalone token "আম" or "mango"
  const tokens = normalizedText.split(/\s+/).filter(Boolean);
  for (const tok of tokens) {
    if (tok === 'আম' || tok === 'mango') {
      return true;
    }
  }

  return false;
}

/**
 * Extracts explicitly mentioned diseases from the query.
 * Returns array of matched disease keys.
 */
function detectExplicitDiseases(normalizedText) {
  const matches = [];

  for (const [diseaseKey, keywords] of Object.entries(DISEASE_LEXICON)) {
    if (containsKeyword(normalizedText, keywords)) {
      if (!matches.includes(diseaseKey)) {
        matches.push(diseaseKey);
      }
    }
  }

  return matches;
}

/**
 * Detect Intent from query using priority weights
 */
function detectIntent(normalizedText) {
  // P1: Check comparison first
  if (containsKeyword(normalizedText, INTENT_LEXICON.comparison)) {
    return 'comparison';
  }

  // P2: Check safety/PPE
  if (containsKeyword(normalizedText, INTENT_LEXICON.safety)) {
    return 'safety';
  }

  // P3: Check progression/worsening
  if (containsKeyword(normalizedText, INTENT_LEXICON.progression)) {
    return 'progression';
  }

  // P4: Check follow-up scan
  if (containsKeyword(normalizedText, INTENT_LEXICON.follow_up_scan)) {
    return 'follow_up_scan';
  }

  let bestIntent = null;
  let maxMatches = 0;

  for (const [intentKey, keywords] of Object.entries(INTENT_LEXICON)) {
    let matches = 0;
    for (const kw of keywords) {
      if (kw.includes(' ')) {
        if (normalizedText.includes(kw)) matches += 2; // multi-word phrase bonus
      } else if (hasStemToken(normalizedText, kw)) {
        matches += 1;
      }
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      bestIntent = intentKey;
    }
  }

  return bestIntent;
}

/**
 * Main Deterministic Agricultural Copilot Retrieval Engine
 *
 * @param {string} rawQuery - Farmer spoken or typed query (in Bangla or Banglish)
 * @param {string|null} activeScanDisease - Active scan class key (e.g. 'blast', 'brown_spot')
 * @returns {Object} Structured agronomic answer guaranteed in natural Bangla
 */
/** Public entry: every answer passes the no-pesticide-dose safety rule (safety.js). */
export function queryAgriculturalCopilot(rawQuery, activeScanDisease = null) {
  return sanitizeResponse(queryAgriculturalCopilotRaw(rawQuery, activeScanDisease));
}

function queryAgriculturalCopilotRaw(rawQuery, activeScanDisease = null) {
  const normalized = normalizeQuery(rawQuery);

  // 1. Empty / Incomplete Query Check
  if (!normalized) {
    return {
      intent: 'empty',
      diseaseKey: activeScanDisease,
      titleBn: 'আপনার প্রশ্ন বলুন বা লিখুন',
      textBn: 'মাইক্রোফোন বাটনে চাপ দিয়ে ধানের রোগ বা পরিচর্যা সম্পর্কে যেকোনো প্রশ্ন করুন। যেমন: "কী ওষুধ দেব?", "সার দেওয়া যাবে কি?" ইত্যাদি।',
      voiceBn: 'মাইক্রোফোন বাটনে চাপ দিয়ে আপনার প্রশ্ন বলুন। যেমন কী ওষুধ দেব বা সার দেওয়া যাবে কিনা।',
      suggestedFollowups: ['কী ওষুধ দেব?', 'সার দেওয়া যাবে?', 'পানি ব্যবস্থাপনা কেমন হবে?'],
      isAbstention: false,
      helplinePrompt: false,
      confidence: 1.0,
    };
  }

  // Incomplete pronoun check (e.g. user just said "আমার" or "আমি")
  if (normalized === 'আমার' || normalized === 'আমি' || normalized === 'আমাদের' || normalized === 'amar') {
    return {
      intent: 'incomplete_query',
      diseaseKey: activeScanDisease,
      titleBn: 'আপনার সম্পূর্ণ প্রশ্নটি বলুন',
      textBn: 'আপনার সম্পূর্ণ প্রশ্নটি বলুন বা লিখুন। যেমন: "আমার ধানে ব্লাস্ট হয়েছে, এখন কী করব?" অথবা "আমার ধানের পাতায় বাদামি দাগ কেন?"।',
      voiceBn: 'আপনার পুরো প্রশ্নটি একসাথে বলুন। যেমন আমার ধানে ব্লাস্ট হয়েছে এখন কি করব।',
      suggestedFollowups: ['আমার ধানে ব্লাস্ট হয়েছে', 'আমার ধানের পাতায় দাগ', 'কী ওষুধ দিতে হবে?'],
      isAbstention: false,
      helplinePrompt: false,
      confidence: 0.9,
    };
  }

  // Incomplete "আমার ধান" check
  if (normalized === 'আমার ধান' || normalized === 'amar dhan') {
    return {
      intent: 'incomplete_query',
      diseaseKey: activeScanDisease,
      titleBn: 'ধানের কী সমস্যা হয়েছে?',
      textBn: 'আপনার ধানের কী সমস্যা হয়েছে তা বলুন বা আক্রান্ত পাতার ছবি স্ক্যান করুন। যেমন: পাতায় দাগ আছে কিনা, গাছ হলুদ হয়েছে কিনা বা কী ওষুধ দিতে চান।',
      voiceBn: 'আপনার ধানের কি সমস্যা হয়েছে বলুন। পাতায় দাগ আছে কিনা বা কি ওষুধ দিতে চান।',
      suggestedFollowups: ['পাতায় বাদামি দাগ আছে', 'ব্লাস্ট রোগের ওষুধ কী?', 'টুংরো হলে কী করব?'],
      isAbstention: false,
      helplinePrompt: false,
      confidence: 0.9,
    };
  }

  // 2. Prohibited / Banned Chemicals Filter
  for (const bannedKw of BANNED_CHEMICAL_KEYWORDS) {
    if (normalized.includes(bannedKw)) {
      const bannedInfo = AGRICULTURAL_KB.general_faqs.banned_chemicals;
      return {
        intent: 'banned_chemical_alert',
        diseaseKey: activeScanDisease,
        titleBn: bannedInfo.title_bn,
        textBn: bannedInfo.text_bn,
        voiceBn: bannedInfo.voice_bn,
        safetyNote: '⚠️ প্যারাকুয়াট বা নিষিদ্ধ বিষ প্রয়োগ আইনত দণ্ডনীয় এবং জীবনঘাতী।',
        suggestedFollowups: ['অনুমোদিত ওষুধ কী কী?', 'জৈব উপায়ে কী করব?', '১৬১২৩ নম্বরে কল করতে চাই'],
        isAbstention: false,
        helplinePrompt: true,
        confidence: 1.0,
      };
    }
  }

  // 3. Out of Domain Non-Rice Guardrail Filter
  // First check specific genuine mango inquiry
  if (isGenuineMangoInquiry(normalized)) {
    return {
      intent: 'out_of_domain_abstention',
      diseaseKey: null,
      titleBn: 'ধান ব্যতীত অন্যান্য ফসল (তথ্য সীমাবদ্ধতা)',
      textBn: 'আপনি "আম" সম্পর্কে জানতে চেয়েছেন। এগ্রোলিফ এআই বর্তমানে শুধুমাত্র বাংলাদেশের ধানের রোগ ও পরিচর্যা সম্পর্কে তথ্য দিতে পারে। অন্যান্য ফসলের সঠিক পরামর্শ পেতে কৃষি কল সেন্টারে ১৬১২৩ নম্বরে যোগাযোগ করতে পারেন। কলের বর্তমান চার্জ আগে যাচাই করুন।',
      voiceBn: 'এগ্রোলিফ এআই বর্তমানে শুধু ধানের রোগ ও পরামর্শ দিতে পারে। অন্যান্য ফসলের তথ্যের জন্য দয়া করে কৃষি কল সেন্টার ১৬১২৩ নম্বরে যোগাযোগ করুন।',
      suggestedFollowups: ['ধানের ব্লাস্ট রোগের ওষুধ কী?', 'টুংরো হলে কী করব?', '১৬১২৩ হেল্পলাইনে কল করুন'],
      isAbstention: true,
      helplinePrompt: true,
      confidence: 0.95,
    };
  }

  // Check general out-of-domain keywords (using inflection stem matching)
  for (const oodStem of OUT_OF_DOMAIN_STEMS) {
    if (containsKeyword(normalized, [oodStem])) {
      return {
        intent: 'out_of_domain_abstention',
        diseaseKey: null,
        titleBn: 'ধান ব্যতীত অন্যান্য ফসল (তথ্য সীমাবদ্ধতা)',
        textBn: `আপনি "${oodStem}" সম্পর্কে জানতে চেয়েছেন। এগ্রোলিফ এআই বর্তমানে শুধুমাত্র বাংলাদেশের ধানের রোগ ও পরিচর্যা সম্পর্কে তথ্য দিতে পারে। অন্যান্য ফসলের সঠিক পরামর্শ পেতে কৃষি কল সেন্টারে ১৬১২৩ নম্বরে যোগাযোগ করতে পারেন। কলের বর্তমান চার্জ আগে যাচাই করুন।`,
        voiceBn: 'এগ্রোলিফ এআই বর্তমানে শুধু ধানের রোগ ও পরামর্শ দিতে পারে। অন্যান্য তথ্যের জন্য কৃষি কল সেন্টার ১৬১২৩ নম্বরে যোগাযোগ করুন।',
        suggestedFollowups: ['ধানের ব্লাস্ট রোগের ওষুধ কী?', 'টুংরো হলে কী করব?', '১৬১২৩ হেল্পলাইনে কল করুন'],
        isAbstention: true,
        helplinePrompt: true,
        confidence: 0.95,
      };
    }
  }

  // 4. Disease resolution (multi-disease detection for comparisons)
  const explicitDiseases = detectExplicitDiseases(normalized);
  const detectedIntent = detectIntent(normalized);

  // Check Comparison Intent (either intent is comparison OR two diseases are named)
  if (detectedIntent === 'comparison' || explicitDiseases.length >= 2) {
    if (
      (explicitDiseases.includes('blast') && explicitDiseases.includes('brown_spot')) ||
      (explicitDiseases.includes('blast') && (normalized.includes('ব্রাউন') || normalized.includes('brown')))
    ) {
      const comp = AGRICULTURAL_KB.comparisons.blast_vs_brown_spot;
      return {
        intent: 'comparison',
        diseaseKey: 'blast_vs_brown_spot',
        titleBn: comp.title_bn,
        textBn: comp.text_bn,
        voiceBn: comp.voice_bn,
        suggestedFollowups: ['ব্লাস্টের ওষুধ কী?', 'বাদামী দাগের ওষুধ কী?', 'ইউরিয়া কি বন্ধ রাখব?'],
        isAbstention: false,
        helplinePrompt: false,
        confidence: 0.95,
      };
    }

    if (
      (explicitDiseases.includes('blast') && explicitDiseases.includes('sheath_blight')) ||
      (explicitDiseases.includes('blast') && normalized.includes('খোল'))
    ) {
      const comp = AGRICULTURAL_KB.comparisons.blast_vs_sheath_blight;
      return {
        intent: 'comparison',
        diseaseKey: 'blast_vs_sheath_blight',
        titleBn: comp.title_bn,
        textBn: comp.text_bn,
        voiceBn: comp.voice_bn,
        suggestedFollowups: ['ব্লাস্টের ওষুধ কী?', 'খোল পোড়ার ওষুধ কী?', 'পানি কি নিষ্কাশন করব?'],
        isAbstention: false,
        helplinePrompt: false,
        confidence: 0.95,
      };
    }

    // Generic comparison
    const comp = AGRICULTURAL_KB.comparisons.general_comparison;
    return {
      intent: 'comparison',
      diseaseKey: explicitDiseases[0] || activeScanDisease || null,
      titleBn: comp.title_bn,
      textBn: comp.text_bn,
      voiceBn: comp.voice_bn,
      suggestedFollowups: ['ব্লাস্ট রোগের ওষুধ কী?', 'বাদামী দাগের ওষুধ কী?', 'খোল পোড়া হলে কী করব?'],
      isAbstention: false,
      helplinePrompt: false,
      confidence: 0.9,
    };
  }

  // 5. Follow-up Scan intent
  if (detectedIntent === 'follow_up_scan') {
    const diseaseKey = explicitDiseases[0] || activeScanDisease || 'blast';
    const diseaseObj = AGRICULTURAL_KB.diseases[diseaseKey];
    const followUpData = diseaseObj?.follow_up_scan || AGRICULTURAL_KB.general_faqs.follow_up_scan;

    return {
      intent: 'follow_up_scan',
      diseaseKey,
      titleBn: 'পুনরায় ছবি তোলা ও পর্যবেক্ষণ (ফলো-আপ)',
      textBn: followUpData.text_bn,
      voiceBn: followUpData.voice_bn,
      suggestedFollowups: ['কী ওষুধ দিতে হবে?', 'সার কি দেওয়া যাবে?', 'পানি ব্যবস্থাপনা?'],
      isAbstention: false,
      helplinePrompt: false,
      confidence: 0.95,
    };
  }

  // 6. Disease Progression / Worsening intent
  if (detectedIntent === 'progression') {
    const diseaseKey = explicitDiseases[0] || activeScanDisease || 'brown_spot';
    if (AGRICULTURAL_KB.diseases[diseaseKey]?.progression) {
      const prog = AGRICULTURAL_KB.diseases[diseaseKey].progression;
      return {
        intent: 'progression',
        diseaseKey,
        titleBn: `${AGRICULTURAL_KB.diseases[diseaseKey].name_bn} - রোগ বা দাগ বেড়ে যাওয়ার করণীয়`,
        textBn: prog.text_bn,
        voiceBn: prog.voice_bn,
        suggestedFollowups: ['কী ওষুধ দিতে হবে?', 'সার কি দেওয়া যাবে?', '১৬১২৩ নম্বরে কল দিন'],
        isAbstention: false,
        helplinePrompt: false,
        confidence: 0.9,
      };
    }
  }

  // 7. General FAQs (Safety, Weather, Helpline)
  if (detectedIntent === 'safety') {
    const faq = AGRICULTURAL_KB.general_faqs.safety_ppe;
    return {
      intent: 'safety',
      diseaseKey: explicitDiseases[0] || activeScanDisease || null,
      titleBn: faq.title_bn,
      textBn: faq.text_bn,
      voiceBn: faq.voice_bn,
      suggestedFollowups: ['বৃষ্টির মধ্যে স্প্রে করা যাবে?', 'কী ওষুধ দেব?'],
      isAbstention: false,
      helplinePrompt: false,
      confidence: 0.95,
    };
  }

  if (detectedIntent === 'weather') {
    const faq = AGRICULTURAL_KB.general_faqs.weather_spray;
    return {
      intent: 'weather',
      diseaseKey: explicitDiseases[0] || activeScanDisease || null,
      titleBn: faq.title_bn,
      textBn: faq.text_bn,
      voiceBn: faq.voice_bn,
      suggestedFollowups: ['কী ওষুধ দেব?', 'সার দেওয়া যাবে?', '১৬১২৩ নম্বরে কল'],
      isAbstention: false,
      helplinePrompt: false,
      confidence: 0.95,
    };
  }

  if (detectedIntent === 'helpline') {
    const faq = AGRICULTURAL_KB.general_faqs.helpline;
    return {
      intent: 'helpline',
      diseaseKey: explicitDiseases[0] || activeScanDisease || null,
      titleBn: faq.title_bn,
      textBn: faq.text_bn,
      voiceBn: faq.voice_bn,
      suggestedFollowups: ['কী ওষুধ দেব?', 'সার দেওয়া যাবে?', 'পানি ব্যবস্থাপনা?'],
      isAbstention: false,
      helplinePrompt: true,
      confidence: 1.0,
    };
  }

  // 7.1 Complex Research & Cultivation Roadmap Query
  if (
    normalized.includes('ধান কাটা পর্যন্ত') ||
    normalized.includes('কী কী করতে হবে') ||
    normalized.includes('সম্পূর্ণ গাইডলাইন') ||
    normalized.includes('পরিকল্পনা তৈরি') ||
    normalized.includes('চারা রোপণ করেছি') ||
    normalized.includes('সরাসরি বীজ বপন') ||
    (normalized.includes('রোপণ') && (normalized.includes('কী করব') || normalized.includes('কী করণীয়')))
  ) {
    const slots = parseFarmingPlannerSlots(rawQuery);
    if (!slots.variety) {
      return {
        intent: 'clarification_needed',
        slotNeeded: 'variety',
        diseaseKey: null,
        titleBn: 'কোন জাতের ধান চাষ করছেন?',
        textBn: 'আপনার জন্য সম্পূর্ণ চাষাবাদ পরিকল্পনা ও সময়সূচি সাজাতে আপনি কোন জাতের ধান চাষ করছেন তা জানান (যেমন: ব্রি ধান২৮ বা ব্রি ধান২৯)।',
        voiceBn: 'সঠিক পরিকল্পনার জন্য আপনি কোন জাতের ধান চাষ করছেন তা জানান।',
        chips: ['ব্রি ধান২৮', 'ব্রি ধান২৯', 'ব্রি ধান৮৯', 'ব্রি ধান৪৯'],
        isAbstention: false,
        helplinePrompt: false,
        confidence: 0.95,
      };
    }
    const plan = buildPersonalizedRoadmap(slots, {}, activeScanDisease);
    return {
      intent: 'crop_roadmap',
      isPlan: true,
      plan,
      diseaseKey: null,
      titleBn: plan.title_bn,
      textBn: `${plan.overview.summary_bn}\n\n👉 ${plan.overview.immediate_action_bn}`,
      voiceBn: plan.overview.voice_summary_bn,
      suggestedFollowups: ['১ম কিস্তি ইউরিয়া কবে দেব?', 'ব্লাস্ট রোগ কীভাবে আটকাব?', 'পরিকল্পনাটি সংরক্ষণ করুন'],
      isAbstention: false,
      helplinePrompt: false,
      confidence: 0.95,
    };
  }

  // 7.2 Nutrient comparison / education (e.g. "পটাশ আর ইউরিয়ার কাজ কী?")
  if (
    (normalized.includes('পটাশ') && normalized.includes('ইউরিয়া') && (normalized.includes('কাজ') || normalized.includes('পার্থক্য'))) ||
    normalized.includes('পটাশ আর ইউরিয়ার কাজ')
  ) {
    return {
      intent: 'nutrient_education',
      diseaseKey: null,
      titleBn: 'ইউরিয়া ও পটাশ সারের ভূমিকা ও ব্যবহার',
      textBn: `🌾 ইউরিয়া ও পটাশ সারের মূল কাজ:
১. ইউরিয়া (নাইট্রোজেন): গাছের পাতা ও কুশি দ্রুত বৃদ্ধি করে এবং গাছকে ঘন সবুজ রাখে। এটি ৩ কিস্তিতে প্রয়োগ করতে হয়। ফুল ফোটার পর ইউরিয়া দিলে ধান চিটা হয়।
২. পটাশ / এমওপি (পটাশিয়াম): গাছের কান্ড শক্ত করে, শিষ মজবুত করে এবং ব্লাস্ট ও খোল পোড়া রোগ প্রতিরোধ ক্ষমতা বৃদ্ধি করে। ৬০% শেষ চাষে এবং বাকি ৪০% সর্বোচ্চ কুশিতে দেওয়া উত্তম।`,
      voiceBn: 'ইউরিয়া গাছের বৃদ্ধি ও কুশি বাড়ায়, আর পটাশ কান্ড শক্ত করে রোগ প্রতিরোধ বাড়ায়। ফুল ফোটার পর ইউরিয়া দেওয়া যাবে না।',
      suggestedFollowups: ['কোন সার কখন দিতে হয়?', 'আমার জমির জন্য সার হিসাব করুন'],
      isAbstention: false,
      helplinePrompt: false,
      confidence: 0.95,
    };
  }

  // 7.3 General fertilizer schedule inquiry (e.g. "আমি কোন পর্যায়ে কী সার দেব?")
  if (
    normalized.includes('কোন পর্যায়ে কী সার') ||
    normalized.includes('কোন সার কখন') ||
    (normalized.includes('সার') && normalized.includes('পর্যায়'))
  ) {
    const fert = calculateBarcFertilizer('boro', null, 33);
    return {
      intent: 'fertilizer_schedule',
      diseaseKey: null,
      titleBn: 'বার্ক (BARC) অনুমোদিত সার প্রয়োগের সময়সূচি',
      textBn: `🌾 ধানে সার প্রয়োগের নিয়ম (প্রতি বিঘা / ৩৩ শতক):
১. জমি তৈরির শেষ চাষে (Basal): ১০০% টিএসপি (${fert.tsp.totalKg} কেজি), জিপসাম (${fert.gypsum.totalKg} কেজি), দস্তা (${fert.zinc.totalKg} কেজি) ও ৬০% পটাশ (${fert.mop.basalKg} কেজি) দিন।
২. ১ম কিস্তি ইউরিয়া (${fert.urea.split1Kg} কেজি): চারা রোপণের ১৫-২০ দিন পর (কুশি গজানোর সময়)।
৩. ২য় কিস্তি ইউরিয়া (${fert.urea.split2Kg} কেজি) ও বাকি ৪০% পটাশ (${fert.mop.topdressKg} কেজি): রোপণের ৩০-৩৫ দিন পর।
৪. ৩য় কিস্তি ইউরিয়া (${fert.urea.split3Kg} কেজি): কাইচথোড় আসার ৫-৭ দিন আগে।
⚠️ সতর্কতা: ফুল ফোটার পর কখনো ইউরিয়া দেবেন না।`,
      voiceBn: 'জমি তৈরিতে টিএসপি, জিপসাম ও পটাশ দিন। ইউরিয়া চারা লাগানোর ১৫, ৩০ এবং ৪৫ দিন পর ৩ কিস্তিতে দিন। ফুল আসার পর ইউরিয়া দেওয়া যাবে না।',
      suggestedFollowups: ['আমার জমির জন্য সার হিসাব করুন', 'ব্লাস্ট হলে কি সার দেওয়া যাবে?'],
      isAbstention: false,
      helplinePrompt: false,
      confidence: 0.95,
    };
  }

  // 8. Primary Disease Resolution
  const resolvedDisease = explicitDiseases[0] || activeScanDisease || null;

  if (resolvedDisease && AGRICULTURAL_KB.diseases[resolvedDisease]) {
    const diseaseObj = AGRICULTURAL_KB.diseases[resolvedDisease];
    const diseaseName = diseaseObj.name_bn;

    // Check specific intent or fallback to treatment / action
    const intentKey = (detectedIntent && diseaseObj[detectedIntent]) ? detectedIntent : 'treatment';
    const intentData = diseaseObj[intentKey] || diseaseObj.treatment;

    const intentTitles = {
      treatment: `${diseaseName} - অনুমোদিত ওষুধ ও দমন ব্যবস্থা`,
      organic: `${diseaseName} - জৈব ও প্রাকৃতিক প্রতিকার`,
      fertilizer: `${diseaseName} - সার প্রয়োগ ও সতর্কতা`,
      water: `${diseaseName} - সেচ ও পানি ব্যবস্থাপনা`,
      spread: `${diseaseName} - বিস্তার ও ক্ষয়ক্ষতির ঝুঁকি`,
      symptoms: `${diseaseName} - লক্ষণ ও শনাক্তকরণ`,
      prevention: `${diseaseName} - প্রতিরোধ ও বীজ শোধন`,
    };

    return {
      intent: intentKey,
      diseaseKey: resolvedDisease,
      diseaseNameBn: diseaseName,
      titleBn: intentTitles[intentKey] || `${diseaseName} - তথ্য ও পরামর্শ`,
      textBn: intentData.text_bn,
      voiceBn: intentData.voice_bn,
      safetyNote: intentData.safety_note || null,
      suggestedFollowups: getFollowupSuggestions(intentKey, resolvedDisease),
      isAbstention: false,
      helplinePrompt: false,
      confidence: 0.9,
    };
  }

  // 9. If intent was detected (e.g. treatment/fertilizer) but disease context is missing
  if (detectedIntent === 'treatment' || detectedIntent === 'fertilizer' || detectedIntent === 'water' || detectedIntent === 'symptoms') {
    return {
      intent: 'need_disease_context',
      diseaseKey: null,
      titleBn: 'কোন রোগের জন্য জানতে চান?',
      textBn: 'সঠিক ওষুধ বা সারের পরামর্শ পেতে আপনার ধানের আক্রান্ত পাতাটি এগ্রোলিফ স্ক্যানারে স্ক্যান করুন অথবা নির্দিষ্ট রোগের নাম বলুন (যেমন: ব্লাস্ট, বাদামী দাগ, খোল পোড়া বা টুংরো)।',
      voiceBn: 'সঠিক পরামর্শের জন্য ধানের পাতার ছবি স্ক্যান করুন অথবা নির্দিষ্ট রোগের নাম বলুন, যেমন ব্লাস্ট বা খোল পোড়া।',
      suggestedFollowups: ['ব্লাস্ট রোগের ওষুধ কী?', 'বাদামী দাগের ওষুধ কী?', 'খোল পোড়া হলে কী করব?'],
      isAbstention: false,
      helplinePrompt: false,
      confidence: 0.8,
    };
  }

  // 10. Honest Abstention Fallback (No hallucination, guaranteed natural Bangla)
  const abs = AGRICULTURAL_KB.abstention;
  return {
    intent: 'honest_abstention',
    diseaseKey: null,
    titleBn: abs.title_bn,
    textBn: abs.text_bn,
    voiceBn: abs.voice_bn,
    suggestedFollowups: ['ব্লাস্ট রোগের ওষুধ কী?', 'ইউরিয়া সার কি দেওয়া যাবে?', '১৬১২৩ কৃষি কল সেন্টারে কল দিন'],
    isAbstention: true,
    helplinePrompt: true,
    confidence: 0.5,
  };
}

// Generate contextual follow-up chips
function getFollowupSuggestions(currentIntent, _diseaseKey) {
  const suggestions = [];

  if (currentIntent !== 'treatment') {
    suggestions.push('কী ওষুধ দেব?');
  }
  if (currentIntent !== 'fertilizer') {
    suggestions.push('সার দেওয়া যাবে?');
  }
  if (currentIntent !== 'water') {
    suggestions.push('পানি ব্যবস্থাপনা?');
  }
  if (currentIntent !== 'organic') {
    suggestions.push('জৈব প্রতিকার কী?');
  }

  return suggestions.slice(0, 3);
}
