// Free-only deterministic on-device agricultural RAG & Intent Matching Engine
// Evaluates farmer spoken queries against verified BRRI/DAE knowledge base.
// Zero paid APIs, zero cloud inference dependencies, sub-5ms latency.

import { AGRICULTURAL_KB } from './data/agricultural_kb.js';

// Normalization & tokenization helper
export function normalizeQuery(query) {
  if (!query || typeof query !== 'string') return '';
  return query
    .toLowerCase()
    .normalize('NFC')
    .replace(/[।?!.,;:’'"()\-—_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

// Out-of-Domain Non-Rice Entities
const OUT_OF_DOMAIN_KEYWORDS = [
  'আলু',
  'গম',
  'ভুট্টা',
  'পাট',
  'আম',
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
  'নির্বাচন',
  'রাজনীতি',
  'সিনেমা',
  'টাকা',
  'ঋণ',
  'ব্যাংক',
  'ক্রিকেট',
  'ফুটবল',
  'potato',
  'wheat',
  'maize',
  'mango',
  'tomato',
  'fish',
  'cattle',
  'poultry',
];

// Disease Keyword Lexicon
const DISEASE_LEXICON = {
  blast: ['ব্লাস্ট', 'ব্লাষ্ট', 'বলাস্ট', 'blast', 'মাকু', 'শীষ ব্লাস্ট', 'পাতা ব্লাস্ট'],
  brown_spot: ['বাদামী দাগ', 'বাদামি দাগ', 'বাদামী ফোটা', 'বাদামি ফোটা', 'brown spot', 'brown', 'তিলের মতো'],
  leaf_smut: ['লিফ স্মাট', 'স্মাট', 'smut', 'ন্যারো ব্রাউন', 'ন্যারো', 'narrow brown', 'সরু দাগ'],
  tungro: ['টুংরো', 'টুংরু', 'tungro', 'সবুজ পাতা ফড়িং', 'ফড়িং', 'বেঁটে', 'গাছ খর্ব'],
  sheath_blight: ['খোল পোড়া', 'খোলপোড়া', 'sheath blight', 'sheath', 'সাপের খোলস', 'কাণ্ডের খোল'],
  bacterial_leaf_blight: ['ব্যাকটেরিয়াল পাতা পোড়া', 'পাতা পোড়া', 'বিএলবি', 'blb', 'ব্যাকটেরিয়া', 'bacterial', 'ক্রিসেক'],
  leaf_scald: ['পাতা ঝলসানো', 'ঝলসানো', 'scald', 'leaf scald', 'সেদ্ধ পাতা'],
  healthy: ['সুস্থ', 'ভালো ধান', 'রোগমুক্ত', 'তাজা', 'healthy', 'সবুজ ধান'],
};

// Intent Keyword Lexicon with priority weights
const INTENT_LEXICON = {
  organic: [
    'জৈব', 'প্রাকৃতিক', 'ভেষজ', 'ভেষজনাশক', 'গোবর', 'গোমূত্র', 'নিম', 'ছাই', 'ট্রাইকোডার্মা', 'organic', 'natural', 'home made',
  ],
  fertilizer: [
    'ইউরিয়া', 'নাইট্রোজেন', 'পটাশ', 'এমওপি', 'দস্তা', 'জিংক', 'জিপসাম', 'টিএসপি', 'ডিএপি',
    'সার', 'সার দেওয়া', 'খাবার', 'urea', 'potash', 'fertilizer', 'zinc',
  ],
  water: [
    'পানি', 'জল', 'সেচ', 'শুকানো', 'নিষ্কাশন', 'ড্রেন', 'রস', 'জলাবদ্ধতা', 'water', 'irrigation', 'drainage',
  ],
  spread: [
    'ছড়ায়', 'ছড়াবে', 'ছোঁয়াচে', 'বিস্তার', 'সংক্রামক', 'অন্য গাছে', 'নষ্ট হবে', 'বিপদ', 'ক্ষতি', 'মারাত্মক',
    'spread', 'danger', 'contagious',
  ],
  symptoms: [
    'লক্ষণ', 'চেনার উপায়', 'উপসর্গ', 'কেমন দেখায়', 'চিহ্ন', 'কিভাবে বুঝব', 'সিম্পটম', 'symptom', 'sign',
  ],
  prevention: [
    'প্রতিরোধ', 'আগের সতর্কতা', 'বীজ শোধন', 'পরবর্তী মৌসুম', 'ভবিষ্যতে', 'আগে থেকে', 'prevention', 'preventive',
  ],
  safety: [
    'সতর্কতা', 'সাবধানতা', 'মাস্ক', 'বিষাক্ত', 'গ্লাভস', 'গায়ে লাগলে', 'ক্ষতিকর', 'safety', 'ppe', 'caution',
  ],
  weather: [
    'বৃষ্টি', 'কুয়াশা', 'মেঘ', 'রোদ', 'তাপমাত্রা', 'আবহাওয়া', 'শিশির', 'বাতাস', 'ঝড়', 'rain', 'weather',
  ],
  helpline: [
    'কল', 'ফোন', 'নম্বর', '১৬১২৩', '16123', 'অফিসার', 'help', 'helpline',
  ],
  treatment: [
    'ওষুধ', 'ঔষধ', 'কীটনাশক', 'ছত্রাকনাশক', 'বালাইনাশক', 'বিষ', 'স্প্রে', 'ছিটাব', 'ছিটাবো', 'ছিটানো',
    'চিকিৎসা', 'medicine', 'spray', 'chemical', 'fungicide', 'treatment', 'dose', 'ডোজ',
  ],
};

// Extract explicitly mentioned disease from query
function detectExplicitDisease(normalizedText) {
  for (const [diseaseKey, keywords] of Object.entries(DISEASE_LEXICON)) {
    for (const kw of keywords) {
      if (normalizedText.includes(kw)) {
        return diseaseKey;
      }
    }
  }
  return null;
}

// Detect Intent from query
function detectIntent(normalizedText) {
  let bestIntent = null;
  let maxMatches = 0;

  for (const [intentKey, keywords] of Object.entries(INTENT_LEXICON)) {
    let matches = 0;
    for (const kw of keywords) {
      if (normalizedText.includes(kw)) {
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
 * @returns {Object} Structured agronomic answer
 */
export function queryAgriculturalCopilot(rawQuery, activeScanDisease = null) {
  const normalized = normalizeQuery(rawQuery);

  // 1. Empty query check
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
        suggestedFollowups: ['অনুমোদিত ওষুধ কী কী?', 'জৈব উপায়ে কী করব?', '১৬১২৩ নম্বরে কথা বলতে চাই'],
        isAbstention: false,
        helplinePrompt: true,
        confidence: 1.0,
      };
    }
  }

  // 3. Out of Domain Non-Rice Guardrail Filter
  for (const oodKw of OUT_OF_DOMAIN_KEYWORDS) {
    if (normalized.includes(oodKw)) {
      return {
        intent: 'out_of_domain_abstention',
        diseaseKey: null,
        titleBn: 'ধান ব্যতীত অন্যান্য ফসল (তথ্য সীমাবদ্ধতা)',
        textBn: `আপনি "${oodKw}" সম্পর্কে জানতে চেয়েছেন। এগ্রোলিফ এআই বর্তমানে শুধুমাত্র বাংলাদেশের ধানের রোগ ও পরিচর্যা সম্পর্কে তথ্য দিতে পারে। অন্যান্য ফসলের সঠিক পরামর্শ পেতে কৃষি কল সেন্টারে ১৬১২৩ নম্বরে বিনামূল্যে কল করুন।`,
        voiceBn: 'এগ্রোলিফ এআই বর্তমানে শুধু ধানের রোগ ও পরামর্শ দিতে পারে। অন্যান্য ফসলের তথ্যের জন্য দয়া করে কৃষি কল সেন্টার ১৬১২৩ নম্বরে কল করুন।',
        suggestedFollowups: ['ধানের ব্লাস্ট রোগের ওষুধ কী?', 'টুংরো হলে কী করব?', '১৬১২৩ হেল্পলাইনে কল করুন'],
        isAbstention: true,
        helplinePrompt: true,
        confidence: 0.95,
      };
    }
  }

  // 4. Disease resolution (explicit query mention takes precedence, then active scan context)
  const explicitDisease = detectExplicitDisease(normalized);
  const resolvedDisease = explicitDisease || activeScanDisease || null;

  // 5. Intent detection
  const detectedIntent = detectIntent(normalized);

  // 6. Handle General FAQs if no specific disease applies or if user asked generic FAQ
  if (detectedIntent === 'helpline') {
    const faq = AGRICULTURAL_KB.general_faqs.helpline;
    return {
      intent: 'helpline',
      diseaseKey: resolvedDisease,
      titleBn: faq.title_bn,
      textBn: faq.text_bn,
      voiceBn: faq.voice_bn,
      suggestedFollowups: ['কী ওষুধ দেব?', 'সার দেওয়া যাবে?', 'পানি ব্যবস্থাপনা?'],
      isAbstention: false,
      helplinePrompt: true,
      confidence: 1.0,
    };
  }

  if (detectedIntent === 'weather') {
    const faq = AGRICULTURAL_KB.general_faqs.weather_spray;
    return {
      intent: 'weather',
      diseaseKey: resolvedDisease,
      titleBn: faq.title_bn,
      textBn: faq.text_bn,
      voiceBn: faq.voice_bn,
      suggestedFollowups: ['কী ওষুধ দেব?', 'সার দেওয়া যাবে?', '১৬১২৩ নম্বরে কল'],
      isAbstention: false,
      helplinePrompt: false,
      confidence: 0.95,
    };
  }

  if (detectedIntent === 'safety') {
    const faq = AGRICULTURAL_KB.general_faqs.safety_ppe;
    return {
      intent: 'safety',
      diseaseKey: resolvedDisease,
      titleBn: faq.title_bn,
      textBn: faq.text_bn,
      voiceBn: faq.voice_bn,
      suggestedFollowups: ['বৃষ্টির মধ্যে স্প্রে করা যাবে?', 'কী ওষুধ দেব?'],
      isAbstention: false,
      helplinePrompt: false,
      confidence: 0.95,
    };
  }

  // 7. Resolve with Disease Knowledge Base
  if (resolvedDisease && AGRICULTURAL_KB.diseases[resolvedDisease]) {
    const diseaseObj = AGRICULTURAL_KB.diseases[resolvedDisease];
    const diseaseName = diseaseObj.name_bn;

    // Check if a specific intent was identified
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

  // 8. If intent was detected (e.g. 'treatment') but no disease context is present
  if (detectedIntent === 'treatment' || detectedIntent === 'fertilizer' || detectedIntent === 'water') {
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

  // 9. Honest Abstention Fallback (No hallucination)
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
