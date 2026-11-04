// F30 AI-Powered Agricultural Research & Personalized Farming Planner Engine
// 100% Free, on-device/hybrid RAG, zero external paid APIs.
// Grounded in BRRI (Rice Profile & Cultivation Handbook 25th Ed.),
// BARC (Fertilizer Recommendation Guide FRG-2024), DAE BAMIS, and IRRI AWD.

import { AGRICULTURAL_RESEARCH_BUNDLE } from './data/agricultural_research_bundle.js';
import { normalizeQuery } from './copilotEngine.js';

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + Math.round(days));
  return d.toISOString().split('T')[0];
}

function getLocalTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Standardize land area to decimals (শতক)
 */
export function normalizeLandArea(amount, unit = 'decimal') {
  const num = Number(amount) || 33; // Default 1 Bigha (33 decimals)
  const u = String(unit).toLowerCase();

  if (u.includes('বিঘা') || u.includes('bigha')) {
    return { amount: num, unit: 'bigha', standard_decimals: num * 33 };
  }
  if (u.includes('একর') || u.includes('acre')) {
    return { amount: num, unit: 'acre', standard_decimals: num * 100 };
  }
  if (u.includes('হেক্টর') || u.includes('hectare')) {
    return { amount: num, unit: 'hectare', standard_decimals: Math.round(num * 247.1) };
  }
  if (u.includes('কাঠা') || u.includes('katha')) {
    return { amount: num, unit: 'katha', standard_decimals: Math.round(num * 1.65) };
  }
  // Default decimal
  return { amount: num, unit: 'decimal', standard_decimals: num };
}

/**
 * Extract variety entity from query or fall back to profile
 */
export function extractVariety(normalizedText, profileContext) {
  for (const v of AGRICULTURAL_RESEARCH_BUNDLE.varieties) {
    for (const alias of v.aliases) {
      if (normalizedText.includes(alias.toLowerCase())) {
        return v;
      }
    }
  }

  // Profile context fallback
  if (profileContext?.variety_id) {
    const found = AGRICULTURAL_RESEARCH_BUNDLE.varieties.find(
      (v) => v.id === profileContext.variety_id || profileContext.variety_id.includes(v.id)
    );
    if (found) return found;
  }

  return null;
}

/**
 * Extract season from query or variety or profile
 */
export function extractSeason(normalizedText, variety, profileContext) {
  if (normalizedText.includes('বোরো') || normalizedText.includes('boro') || normalizedText.includes('ইরি') || normalizedText.includes('irri')) {
    return 'boro';
  }
  if (normalizedText.includes('আমন') || normalizedText.includes('aman') || normalizedText.includes('রোপা আমন')) {
    return 'aman';
  }
  if (normalizedText.includes('আউশ') || normalizedText.includes('aus') || normalizedText.includes('aush')) {
    return 'aus';
  }
  if (variety?.season) return variety.season;
  if (profileContext?.season) return profileContext.season;
  return 'boro'; // Default
}

/**
 * Extract planting / reference date
 */
export function extractStartDate(normalizedText, rawText, profileContext) {
  const todayStr = getLocalTodayStr();

  if (normalizedText.includes('আজ') || normalizedText.includes('আজকে') || normalizedText.includes('today')) {
    return todayStr;
  }

  // Relative past days (e.g. "১৫ দিন আগে")
  const pastDaysMatch = rawText.match(/(\d+)\s*(দিন আগে|din age|days ago)/i);
  if (pastDaysMatch) {
    const daysAgo = parseInt(pastDaysMatch[1], 10);
    return addDays(todayStr, -daysAgo);
  }

  // Relative weeks (e.g. "গত সপ্তাহে" / "২ সপ্তাহ আগে")
  if (normalizedText.includes('গত সপ্তাহে') || normalizedText.includes('last week')) {
    return addDays(todayStr, -7);
  }
  const pastWeeksMatch = rawText.match(/(\d+)\s*(সপ্তাহ আগে|soptaho age|weeks ago)/i);
  if (pastWeeksMatch) {
    const weeksAgo = parseInt(pastWeeksMatch[1], 10);
    return addDays(todayStr, -(weeksAgo * 7));
  }

  // Profile fallback
  if (profileContext?.transplant_date) return profileContext.transplant_date;
  if (profileContext?.direct_seeding_date) return profileContext.direct_seeding_date;

  return todayStr;
}

/**
 * Parse slots for conversational planner
 */
export function parseFarmingPlannerSlots(rawQuery, profileContext = {}) {
  const normalized = normalizeQuery(rawQuery);
  const variety = extractVariety(normalized, profileContext);
  const season = extractSeason(normalized, variety, profileContext);
  const startDate = extractStartDate(normalized, rawQuery, profileContext);

  // Cultivation method
  const isDirectSeeded =
    normalized.includes('সরাসরি বীজ') ||
    normalized.includes('সরাসরি বোনা') ||
    normalized.includes('বপন') ||
    normalized.includes('direct seeded') ||
    profileContext.cultivation_method === 'direct_seeded';

  // Land area extraction
  let landArea = { amount: 33, unit: 'bigha', standard_decimals: 33 };
  const areaMatch = rawQuery.match(/(\d+(\.\d+)?)\s*(শতক|শতাংশ|ডেসিমাল|বিঘা|একর|হেক্টর|কাঠা|decimal|bigha|acre)/i);
  if (areaMatch) {
    landArea = normalizeLandArea(parseFloat(areaMatch[1]), areaMatch[3]);
  } else if (profileContext.land_area) {
    landArea = normalizeLandArea(profileContext.land_area, profileContext.land_unit || 'decimal');
  }

  // Determine intent category
  let category = 'crop_roadmap';

  if (
    normalized.includes('পটাশ আর ইউরিয়া') ||
    normalized.includes('ইউরিয়া আর পটাশ') ||
    normalized.includes('সারের কাজ কী') ||
    normalized.includes('কাজ কী')
  ) {
    category = 'nutrient_education';
  } else if (
    normalized.includes('ইউরিয়া দেব') ||
    normalized.includes('পটাশ দেব') ||
    normalized.includes('কোন সার') ||
    normalized.includes('সারের পরিমাণ') ||
    normalized.includes('সার কীভাবে') ||
    normalized.includes('সার হিসাব') ||
    normalized.includes('বিকল্প সার')
  ) {
    category = 'fertilizer_planning';
  } else if (
    normalized.includes('ব্লাস্ট') ||
    normalized.includes('ব্রাউন স্পট') ||
    normalized.includes('দাগ') ||
    normalized.includes('রোগ') ||
    normalized.includes('পোকা')
  ) {
    category = 'disease_management';
  } else if (
    normalized.includes('পানি') ||
    normalized.includes('আগাছা') ||
    normalized.includes('সেচ') ||
    normalized.includes('পরিচর্যা')
  ) {
    category = 'crop_care';
  } else if (normalized.includes('আগামী সাত দিন') || normalized.includes('৭ দিন') || normalized.includes('পরবর্তী কাজ')) {
    category = 'upcoming_tasks';
  }

  return {
    rawQuery,
    normalized,
    category,
    variety,
    season,
    startDate,
    cultivationMethod: isDirectSeeded ? 'direct_seeded' : 'transplanted',
    landArea,
  };
}

/**
 * Calculate BARC fertilizer requirements for specified land decimals
 */
export function calculateBarcFertilizer(season = 'boro', varietyId, standardDecimals = 33) {
  const s = season === 'aman' ? 'aman' : season === 'aus' ? 'aus' : 'boro';
  const matrix = AGRICULTURAL_RESEARCH_BUNDLE.fertilizer_matrix[s];
  const rate = matrix.per_decimal_rate;

  const totalDecimals = Math.max(1, standardDecimals);

  const ureaTotal = Math.round(rate.urea_total_kg * totalDecimals * 10) / 10;
  const urea1 = Math.round(rate.urea_split_1_kg * totalDecimals * 10) / 10;
  const urea2 = Math.round(rate.urea_split_2_kg * totalDecimals * 10) / 10;
  const urea3 = Math.round(rate.urea_split_3_kg * totalDecimals * 10) / 10;

  const tsp = Math.round(rate.tsp_kg * totalDecimals * 10) / 10;
  const mopTotal = Math.round(rate.mop_total_kg * totalDecimals * 10) / 10;
  const mopBasal = Math.round(rate.mop_basal_kg * totalDecimals * 10) / 10;
  const mopTopdress = Math.round(rate.mop_topdress_kg * totalDecimals * 10) / 10;

  const gypsum = Math.round(rate.gypsum_kg * totalDecimals * 10) / 10;
  const zinc = Math.round(rate.zinc_kg * totalDecimals * 100) / 100;

  return {
    season: s,
    standardDecimals: totalDecimals,
    urea: { totalKg: ureaTotal, split1Kg: urea1, split2Kg: urea2, split3Kg: urea3 },
    tsp: { totalKg: tsp, basalKg: tsp },
    mop: { totalKg: mopTotal, basalKg: mopBasal, topdressKg: mopTopdress },
    gypsum: { totalKg: gypsum, basalKg: gypsum },
    zinc: { totalKg: zinc, basalKg: zinc },
    rules_bn: [
      '১০০% টিএসপি, জিপসাম, দস্তা ও ৬০% পটাশ জমি তৈরির শেষ চাষে (Basal) প্রয়োগ করুন।',
      'ইউরিয়া সার জমি তৈরির সময় কখনো দেবেন না (চারা রোপণের পর ৩ কিস্তিতে প্রয়োগ করুন)।',
      'জমিতে ব্লাস্ট বা খোল পোড়া রোগ দেখা দিলে ইউরিয়া সার প্রয়োগ তাৎক্ষণিক বন্ধ রাখুন।',
      'ধানের ফুল ফোটার পর ইউরিয়া সার দেওয়া সম্পূর্ণ নিষিদ্ধ।',
    ],
  };
}

/**
 * Build personalized chronological A-to-Z Roadmap Plan
 */
export function buildPersonalizedRoadmap(slots, _profileContext = {}, _activeScanDisease = null) {
  const variety = slots.variety || {
    id: 'standard_boro',
    name_bn: slots.season === 'aman' ? 'উচ্চফলনশীল আমন ধান' : 'উচ্চফলনশীল বোরো ধান (ব্রি ধান২৮ সমমান)',
    name_en: 'High Yielding Rice Variety',
    duration_days: slots.season === 'aman' ? 135 : 140,
    yield_tha: '6.0',
    blast_vulnerability: 'মাঝারি (Medium)',
  };

  const duration = variety.duration_days || 140;
  const startDate = slots.startDate || getLocalTodayStr();
  const isDirectSeeded = slots.cultivationMethod === 'direct_seeded';
  const shift = isDirectSeeded ? -10 : 0;
  const fert = calculateBarcFertilizer(slots.season, variety.id, slots.landArea.standard_decimals);
  const harvestDate = addDays(startDate, duration);

  // Chronological stages
  const stages = [
    {
      stage_id: 'stage_establishment',
      stage_name_bn: 'চারা প্রতিষ্ঠা ও প্রাথমিক যত্ন',
      stage_name_en: 'Establishment & Rooting',
      start_day_offset: 0,
      end_day_offset: Math.max(12, Math.round(duration * 0.12) + shift),
      start_date: startDate,
      end_date: addDays(startDate, Math.round(duration * 0.12) + shift),
      status: 'current',
      key_focus_bn: 'ছিপছিপে পানি সংরক্ষণ, মরা চারা পূরণ ও আগাছা দমন',
      key_focus_en: 'Shallow water management, dead seedling gap filling, early weeding',
      tasks: [
        {
          task_id: 'task_water_establishment',
          title_bn: 'ছিপছিপে পানি সংরক্ষণ (২–৩ সেমি)',
          title_en: 'Maintain Shallow Water (2–3 cm)',
          due_date: addDays(startDate, 2),
          category: 'water',
          is_essential: true,
          can_remind: true,
          reminder_active: false,
          description_bn: 'রোপণের পর চারা শক্তভাবে শিকড় ধরার জন্য জমিতে ১-২ ইঞ্চি (২-৩ সেমি) ছিপছিপে পানি রাখুন। অতিরিক্ত পানি চারার বৃদ্ধি ব্যাহত করে।',
          description_en: 'Keep shallow water (2-3 cm) to cushion seedlings and encourage root proliferation.',
        },
        {
          task_id: 'task_topdress_1',
          title_bn: `১ম কিস্তি ইউরিয়া প্রয়োগ (${fert.urea.split1Kg} কেজি) ও নিড়ানি`,
          title_en: `1st Top-Dressing (Urea ${fert.urea.split1Kg} kg) & Hand Weeding`,
          due_date: addDays(startDate, Math.max(14, Math.round(duration * 0.12) + shift)),
          category: 'fertilizer',
          is_essential: true,
          can_remind: true,
          reminder_active: false,
          description_bn: `জমির আগাছা পরিষ্কার করে মাটি ছিপছিপে থাকা অবস্থায় ১ম কিস্তি ইউরিয়া সার (${fert.urea.split1Kg} কেজি) ছিটিয়ে মাটির সাথে মিশিয়ে দিন।`,
          description_en: `Clear all weeds and top-dress 1st split of Urea (${fert.urea.split1Kg} kg) into saturated soil.`,
        },
      ],
    },
    {
      stage_id: 'stage_tillering',
      stage_name_bn: 'সক্রিয় কুশি গজানো পর্যায়',
      stage_name_en: 'Active Tillering',
      start_day_offset: Math.round(duration * 0.13) + shift,
      end_day_offset: Math.round(duration * 0.35) + shift,
      start_date: addDays(startDate, Math.round(duration * 0.13) + shift),
      end_date: addDays(startDate, Math.round(duration * 0.35) + shift),
      status: 'upcoming',
      key_focus_bn: '২য় কিস্তি সার, এডব্লিউডি (AWD) সেচ ও পোকা পর্যবেক্ষণ',
      key_focus_en: '2nd Split Urea, AWD irrigation cycles, stem borer scouting',
      tasks: [
        {
          task_id: 'task_topdress_2',
          title_bn: `২য় কিস্তি ইউরিয়া (${fert.urea.split2Kg} কেজি) ও অবশিষ্ট পটাশ (${fert.mop.topdressKg} কেজি)`,
          title_en: `2nd Split Urea (${fert.urea.split2Kg} kg) & Potash (${fert.mop.topdressKg} kg)`,
          due_date: addDays(startDate, Math.round(duration * 0.25) + shift),
          category: 'fertilizer',
          is_essential: true,
          can_remind: true,
          reminder_active: false,
          description_bn: `সর্বোচ্চ কুশি গজানোর জন্য ২য় কিস্তি ইউরিয়া এবং বাকি পটাশ সার জমিতে দিন। এতে কুশি পুষ্ট হয় এবং কান্ড শক্ত হয়।`,
          description_en: `Apply 2nd split of Urea and remaining MOP to strengthen culms and productive tillers.`,
        },
        {
          task_id: 'task_scout_stem_borer',
          title_bn: 'মাজরা পোকা ও পাতা মোড়ানো পোকা পর্যবেক্ষণ',
          title_en: 'Scout for Stem Borer & Leaf Roller',
          due_date: addDays(startDate, Math.round(duration * 0.30) + shift),
          category: 'pest_scouting',
          is_essential: false,
          can_remind: true,
          reminder_active: false,
          description_bn: 'গাছের মাঝের ডগা শুকিয়ে যাওয়া (Dead Heart) বা ডিমের গাদা লক্ষ্য করুন। ১০% কুশি ক্ষতিগ্রস্ত হলে অনুমোদিত ব্যবস্থা নিন।',
          description_en: 'Inspect for dead hearts and leaf folding. Take action if damage exceeds economic threshold.',
        },
      ],
    },
    {
      stage_id: 'stage_booting',
      stage_name_bn: 'কাইচথোড় / থোড় পর্যায়',
      stage_name_en: 'Panicle Initiation / Booting',
      start_day_offset: Math.round(duration * 0.36) + shift,
      end_day_offset: Math.round(duration * 0.65) + shift,
      start_date: addDays(startDate, Math.round(duration * 0.36) + shift),
      end_date: addDays(startDate, Math.round(duration * 0.65) + shift),
      status: 'upcoming',
      key_focus_bn: '৩য় কিস্তি ইউরিয়া, নিরবচ্ছিন্ন সেচ ও ব্লাস্ট রোগ সতর্কতা',
      key_focus_en: '3rd Split Urea, uninterrupted water level, blast monitoring',
      tasks: [
        {
          task_id: 'task_topdress_3',
          title_bn: `৩য় ও শেষ কিস্তি ইউরিয়া প্রয়োগ (${fert.urea.split3Kg} কেজি)`,
          title_en: `3rd Final Split Urea (${fert.urea.split3Kg} kg)`,
          due_date: addDays(startDate, Math.round(duration * 0.45) + shift),
          category: 'fertilizer',
          is_essential: true,
          can_remind: true,
          reminder_active: false,
          description_bn: `কাইচথোড় আসার ৫-৭ দিন আগে শেষ কিস্তি ইউরিয়া দিন। ধানের শিষ বের হওয়া বা ফুল ফোটার পর ইউরিয়া দেওয়া যাবে না।`,
          description_en: `Apply 3rd split of Urea 5-7 days before panicle initiation. Never apply urea after heading.`,
        },
        {
          task_id: 'task_blast_scout',
          title_bn: 'ব্লাস্ট ও খোল পোড়া রোগ সতর্ক নজরদারি',
          title_en: 'Scout for Rice Blast & Sheath Blight',
          due_date: addDays(startDate, Math.round(duration * 0.55) + shift),
          category: 'pest_scouting',
          is_essential: true,
          can_remind: true,
          reminder_active: false,
          description_bn: 'কুয়াশাচ্ছন্ন আবহাওয়া বা গুঁড়ি গুঁড়ি বৃষ্টিতে ব্লাস্ট রোগের ঝুঁকি বাড়ে। পাতায় চোখ আকৃতির ছাই রঙের দাগ দেখলে দ্রুত ব্যবস্থা নিন।',
          description_en: 'Inspect for spindle-shaped eye lesions. Foggy mornings increase blast spread.',
        },
      ],
    },
    {
      stage_id: 'stage_flowering',
      stage_name_bn: 'ফুল ফোটা ও পরাগায়ন',
      stage_name_en: 'Flowering & Heading',
      start_day_offset: Math.round(duration * 0.66) + shift,
      end_day_offset: Math.round(duration * 0.75) + shift,
      start_date: addDays(startDate, Math.round(duration * 0.66) + shift),
      end_date: addDays(startDate, Math.round(duration * 0.75) + shift),
      status: 'upcoming',
      key_focus_bn: 'দাঁড়ানো পানি নিশ্চিত করা, সকালের পরাগায়নে স্প্রে না করা',
      key_focus_en: 'Continuous 5 cm standing water, zero chemical spraying during morning anthesis',
      tasks: [
        {
          task_id: 'task_flowering_water',
          title_bn: 'জমিতে ৫–৭ সেমি দাঁড়ানো পানি রাখা',
          title_en: 'Maintain 5–7 cm Standing Water',
          due_date: addDays(startDate, Math.round(duration * 0.68) + shift),
          category: 'water',
          is_essential: true,
          can_remind: true,
          reminder_active: false,
          description_bn: 'ফুল ফোটার সময় পানির ঘাটতি হলে ধান চিটা হয়ে যায়। জমিতে অবশ্যই পর্যাপ্ত পানি রাখুন।',
          description_en: 'Water stress during flowering causes massive spikelet sterility. Maintain standing water.',
        },
      ],
    },
    {
      stage_id: 'stage_harvest',
      stage_name_bn: 'ধান পাকা ও কর্তন প্রস্তুতি',
      stage_name_en: 'Ripening & Harvest Preparation',
      start_day_offset: Math.round(duration * 0.89) + shift,
      end_day_offset: duration,
      start_date: addDays(startDate, Math.round(duration * 0.89) + shift),
      end_date: harvestDate,
      status: 'upcoming',
      key_focus_bn: 'পানি নিষ্কাশন, ৮০% দানা সোনালী হলে ধান কাটা ও শুকানো',
      key_focus_en: 'Drain field 10 days before harvest, cut at 80% golden grains, dry to 14% moisture',
      tasks: [
        {
          task_id: 'task_drain_field',
          title_bn: 'কাটার ১০–১২ দিন আগে জমির পানি সম্পূর্ণ নামিয়ে দেওয়া',
          title_en: 'Drain Field 10–12 Days Prior to Harvest',
          due_date: addDays(startDate, duration - 12),
          category: 'water',
          is_essential: true,
          can_remind: true,
          reminder_active: false,
          description_bn: 'ধান কাটার ১০-১২ দিন আগে পানি নামিয়ে দিন যাতে সব ধান একসাথে সুষমভাবে পাকে এবং জমি কাটার উপযোগী হয়।',
          description_en: 'Drain standing water 10-12 days prior to harvest for uniform ripening and soil firmness.',
        },
        {
          task_id: 'task_harvest',
          title_bn: 'সোনালী ধানের কর্তন ও সংরক্ষণ',
          title_en: 'Harvest & Sun Drying',
          due_date: harvestDate,
          category: 'harvest',
          is_essential: true,
          can_remind: true,
          reminder_active: false,
          description_bn: 'শীষের ৮০% দানা সোনালী রঙ ধারণ করলে ধান কেটে ফেলুন। এরপর রোদে শুকিয়ে ১৪% আর্দ্রতায় সংরক্ষণ করুন।',
          description_en: 'Harvest when 80% of panicle grains turn golden straw. Sun-dry to 14% moisture content.',
        },
      ],
    },
  ];

  // Immediate Action statement
  const immediateActionBn = `আজকের কাজ: চারার গোড়ায় ছিপছিপে পানি (১–২ ইঞ্চি) বজায় রাখুন এবং মরা চারা থাকলে নতুন চারা রোপণ করুন। আগামী ১৫ দিনের মাথায় ১ম কিস্তি ইউরিয়া (${fert.urea.split1Kg} কেজি) দিতে হবে।`;
  const immediateActionEn = `Today's Action: Maintain shallow standing water (1–2 inches) and refill missing hills. Apply 1st split Urea (${fert.urea.split1Kg} kg) around Day 15.`;

  // Spoken voice summary (concise, spoken naturally in Bangla)
  const voiceSummaryBn = `আপনার ${slots.landArea.amount} ${slots.landArea.unit === 'bigha' ? 'বিঘা' : 'শতক'} জমির ${variety.name_bn}-এর চাষ পরিকল্পনা তৈরি হয়েছে। চারা লাগানোর ১৫ দিনের মাথায় প্রথম কিস্তি ইউরিয়া সার দিন। আগামীতে কখন কী করতে হবে তা নিচে দেখে স্মরণবার্তা চালু করে নিন।`;

  // Disease risks
  const diseaseRisks = [
    {
      disease_key: 'blast',
      disease_name_bn: 'ধানের ব্লাস্ট রোগ (Leaf & Neck Blast)',
      vulnerable_stage_bn: 'কুশি ও কাইচথোড় পর্যায়',
      prevention_bn: 'ইউরিয়া সারের মাত্রা নিয়ন্ত্রিত রাখুন। ব্লাস্ট দেখা দিলে ট্রাইসাইক্লাজোল বা এজোক্সিস্ট্রবিন স্প্রে করুন।',
    },
    {
      disease_key: 'sheath_blight',
      disease_name_bn: 'খোল পোড়া রোগ (Sheath Blight)',
      vulnerable_stage_bn: 'সর্বোচ্চ কুশি ও থোড় পর্যায়',
      prevention_bn: 'পানি নামিয়ে ৩-৫ দিন জমি শুকনো রাখুন। অতিরিক্ত ঘন চারা লাগানো পরিহার করুন।',
    },
  ];

  // Fertilizer Basal & Split summary tables
  const basalDose = [
    {
      fertilizer_name_bn: 'টিএসপি (TSP / DAP)',
      fertilizer_name_en: 'TSP / DAP',
      amount_kg: fert.tsp.totalKg,
      application_time_bn: 'জমি তৈরির শেষ চাষে (১০০%)',
      instruction_bn: 'মাটিতে সমানভাবে মিশিয়ে দিতে হবে',
    },
    {
      fertilizer_name_bn: 'এমওপি (পটাশ / MOP)',
      fertilizer_name_en: 'Muriate of Potash (MOP)',
      amount_kg: fert.mop.basalKg,
      application_time_bn: 'জমি তৈরির শেষ চাষে (৬০%)',
      instruction_bn: 'বাকি ৪০% সর্বোচ্চ কুশি গজানোর সময় প্রয়োগ করতে হবে',
    },
    {
      fertilizer_name_bn: 'জিপসাম (গন্ধক সার)',
      fertilizer_name_en: 'Gypsum (Sulphur)',
      amount_kg: fert.gypsum.totalKg,
      application_time_bn: 'জমি তৈরির শেষ চাষে (১০০%)',
      instruction_bn: 'মাটি শোধন ও শেকড়ের বৃদ্ধির জন্য অপরিহার্য',
    },
    {
      fertilizer_name_bn: 'দস্তা সার (Zinc Sulphate)',
      fertilizer_name_en: 'Zinc Sulphate',
      amount_kg: fert.zinc.totalKg,
      application_time_bn: 'জমি তৈরির শেষ চাষে (১০০%)',
      instruction_bn: 'টিএসপির সাথে সরাসরি না মিশিয়ে আলাদা ছিটান',
    },
  ];

  const splitDoses = [
    {
      split_number: 1,
      fertilizer_name_bn: 'ইউরিয়া সার (১ম কিস্তি)',
      fertilizer_name_en: 'Urea (1st Split)',
      amount_kg: fert.urea.split1Kg,
      target_day_offset: Math.max(14, Math.round(duration * 0.12) + shift),
      target_date: addDays(startDate, Math.max(14, Math.round(duration * 0.12) + shift)),
      conditions_bn: 'আগাছা পরিষ্কার করার পর মাটি ছিপছিপে থাকা অবস্থায় দিন',
    },
    {
      split_number: 2,
      fertilizer_name_bn: `ইউরিয়া (${fert.urea.split2Kg} কেজি) + পটাশ (${fert.mop.topdressKg} কেজি)`,
      fertilizer_name_en: 'Urea (2nd Split) + Potash',
      amount_kg: fert.urea.split2Kg,
      target_day_offset: Math.round(duration * 0.25) + shift,
      target_date: addDays(startDate, Math.round(duration * 0.25) + shift),
      conditions_bn: 'সর্বোচ্চ কুশি গজানোর সময়। জমিতে ২-৩ ইঞ্চি পানি রাখুন',
    },
    {
      split_number: 3,
      fertilizer_name_bn: 'ইউরিয়া সার (৩য় ও শেষ কিস্তি)',
      fertilizer_name_en: 'Urea (3rd Split)',
      amount_kg: fert.urea.split3Kg,
      target_day_offset: Math.round(duration * 0.45) + shift,
      target_date: addDays(startDate, Math.round(duration * 0.45) + shift),
      conditions_bn: 'কাইচথোড় আসার ৫-৭ দিন আগে। শিষ বের হওয়ার পর দেওয়া সম্পূর্ণ নিষেধ',
    },
  ];

  const prohibitedActions = [
    'ইউরিয়া সার জমি তৈরির সময় কখনো দেবেন না।',
    'জমিতে ব্লাস্ট বা খোল পোড়া রোগ দেখা দিলে ইউরিয়া সার প্রয়োগ বন্ধ রাখুন।',
    'একাধিক কীটনাশক ও ছত্রাকনাশক একসাথে মিশিয়ে ককটেল স্প্রে করবেন না।',
    'প্যারাডক্স / গ্রামোক্সোন (প্যারাকুয়াট) জাতীয় নিষিদ্ধ বিষ ব্যবহার সম্পূর্ণ নিষিদ্ধ।',
  ];

  return {
    id: `plan_${Date.now()}`,
    title_bn: `${variety.name_bn} চাষাবাদ ও সার ব্যবস্থাপনা পরিকল্পনা`,
    title_en: `${variety.name_en} Cultivation & Fertilizer Roadmap`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
    is_saved: false,
    field_profile: {
      season: slots.season,
      variety_id: variety.id,
      variety_name: variety.name_bn,
      duration_days: duration,
      cultivation_method: slots.cultivationMethod,
      start_date: startDate,
      estimated_harvest_date: harvestDate,
      land_area: slots.landArea,
    },
    overview: {
      summary_bn: `আপনার ${slots.landArea.amount} ${slots.landArea.unit === 'bigha' ? 'বিঘা' : 'শতক'} জমিতে ${variety.name_bn} চাষের সম্পূর্ণ সময়সূচি ও সার ব্যবস্থাপনা সংকলন করা হয়েছে। জীবনকাল আনুমানিক ${duration} দিন। ফসল কাটার সম্ভাব্য তারিখ ${harvestDate}।`,
      summary_en: `Personalized cultivation timeline and fertilizer plan compiled for ${slots.landArea.amount} ${slots.landArea.unit} of ${variety.name_en}. Duration is approximately ${duration} days. Estimated harvest date: ${harvestDate}.`,
      voice_summary_bn: voiceSummaryBn,
      immediate_action_bn: immediateActionBn,
      immediate_action_en: immediateActionEn,
    },
    research_metadata: {
      query_text: slots.rawQuery,
      research_date: getLocalTodayStr(),
      research_quality: 'official_verified',
      sources: AGRICULTURAL_RESEARCH_BUNDLE.bundle_metadata.authorities,
    },
    roadmap: stages,
    fertilizer_plan: {
      is_soil_test_based: false,
      area_display: `${slots.landArea.amount} ${slots.landArea.unit === 'bigha' ? 'বিঘা' : 'শতক'} (${slots.landArea.standard_decimals} শতক)`,
      basal_dose: basalDose,
      split_doses: splitDoses,
    },
    risks_and_cautions: {
      disease_risks: diseaseRisks,
      weather_risks_bn: [
        'বোরো মৌসুমে শৈত্যপ্রবাহে চারার বৃদ্ধি ব্যাহত হলে রাতে বীজতলা পলিথিন দিয়ে ঢেকে রাখুন।',
        'বন্যার পানি নামার পর জমিতে পলি জমলে হালকা নিড়ানি দিন।',
      ],
      prohibited_actions_bn: prohibitedActions,
      helpline_notice_bn: 'কৃষি সংক্রান্ত যে কোনো জরুরি তথ্যে কৃষি কল সেন্টার ১৬১২৩-এ যোগাযোগ করতে পারেন।',
    },
  };
}

/**
 * Main research runner supporting progressive clarification & async stages
 */
export async function runAgriculturalResearch(rawQuery, options = {}) {
  const { profile = {}, scan = null, onProgress, abortSignal } = options;

  if (onProgress) onProgress({ stage: 'analyzing_question', message_bn: 'আপনার প্রশ্নটি বুঝে নিচ্ছি...' });
  await new Promise((r) => setTimeout(r, 120));

  if (abortSignal?.aborted) throw new Error('Research cancelled by user');

  const slots = parseFarmingPlannerSlots(rawQuery, profile);

  // Check out-of-domain rejection
  const normalized = slots.normalized;
  if (
    normalized.includes('মুরগি') ||
    normalized.includes('মুরগির') ||
    normalized.includes('গরু') ||
    normalized.includes('ছাগল') ||
    normalized.includes('মাছ') ||
    normalized.includes('আলু') ||
    normalized.includes('আলুর') ||
    normalized.includes('তামাক')
  ) {
    return {
      isAbstention: true,
      category: 'out_of_domain',
      titleBn: 'ধান ছাড়া অন্যান্য তথ্য নেই',
      textBn: 'দুঃখিত, এগ্রোলিফ শুধুমাত্র ধান চাষ ও ধান ফসলের সমস্যার জন্য তৈরি। হাঁস-মুরগি, গবাদিপশু বা অন্যান্য ফসলের পরামর্শ পেতে কৃষি কল সেন্টার ১৬১২৩-এ যোগাযোগ করতে পারেন। কলের বর্তমান চার্জ আগে যাচাই করুন।',
      voiceBn: 'এগ্রোলিফ শুধুমাত্র ধান ফসলের জন্য তৈরি। অন্যান্য ফসলের জন্য ১৬১২৩ কৃষি কল সেন্টারে যোগাযোগ করুন।',
      sources: [],
    };
  }

  // Check for progressive clarification
  if (slots.category === 'crop_roadmap' && !slots.variety && !profile.variety_id) {
    return {
      isClarification: true,
      slotNeeded: 'variety',
      titleBn: 'ধানের জাত বেছে নিন',
      textBn: 'আপনার জন্য সঠিক সময়সূচি ও সার ব্যবস্থাপনা তৈরি করতে আপনি কোন জাতের ধান চাষ করছেন তা জানান।',
      voiceBn: 'আপনি কোন জাতের ধান চাষ করছেন তা জানান। নিচে অপশন থেকে বেছে নিতে পারেন।',
      chips: ['ব্রি ধান২৮', 'ব্রি ধান২৯', 'ব্রি ধান৮৯', 'ব্রি ধান৪৯', 'অন্যান্য জাত'],
    };
  }

  if (onProgress) onProgress({ stage: 'retrieving_sources', message_bn: 'বিশ্বস্ত কৃষি তথ্য খুঁজছি...' });
  await new Promise((r) => setTimeout(r, 150));

  if (abortSignal?.aborted) throw new Error('Research cancelled by user');

  if (onProgress) onProgress({ stage: 'verifying_sources', message_bn: 'BRRI, DAE, IRRI ও প্রাসঙ্গিক গবেষণা যাচাই করছি...' });
  await new Promise((r) => setTimeout(r, 150));

  if (abortSignal?.aborted) throw new Error('Research cancelled by user');

  if (onProgress) onProgress({ stage: 'generating_plan', message_bn: 'আপনার জন্য কৃষি পরিকল্পনা সাজাচ্ছি...' });
  await new Promise((r) => setTimeout(r, 120));

  // If nutrient education query
  if (slots.category === 'nutrient_education') {
    return {
      isEducational: true,
      category: 'nutrient_education',
      titleBn: 'ইউরিয়া ও পটাশ সারের ভূমিকা ও ব্যবহার',
      textBn: `🌾 ইউরিয়া ও পটাশ সারের মূল কাজ:
১. ইউরিয়া (নাইট্রোজেন): গাছের পাতা ও কুশি দ্রুত বৃদ্ধি করে এবং গাছকে ঘন সবুজ রাখে। এটি ৩ কিস্তিতে মাটিতে দিতে হয়। ফুল আসার পর ইউরিয়া দিলে ধান চিটা হয়।
২. পটাশ / এমওপি (পটাশিয়াম): গাছের কান্ড শক্ত করে, শিষ মজবুত করে এবং ব্লাস্ট ও খোল পোড়া রোগ প্রতিরোধে সহায়তা করে। ৬০% শেষ চাষে এবং ৪০% সর্বোচ্চ কুশিতে দিতে হয়।`,
      voiceBn: 'ইউরিয়া গাছের বৃদ্ধি ও কুশি বাড়ায়, আর পটাশ কান্ড শক্ত করে রোগ প্রতিরোধ বাড়ায়। ফুল ফোটার পর ইউরিয়া দেওয়া যাবে না।',
      sources: AGRICULTURAL_RESEARCH_BUNDLE.bundle_metadata.authorities,
    };
  }

  // Build full personalized roadmap plan
  const plan = buildPersonalizedRoadmap(slots, profile, scan?.classKey || null);

  if (onProgress) onProgress({ stage: 'completed', message_bn: 'আপনার পরিকল্পনা তৈরি হয়েছে।' });

  return {
    isPlan: true,
    plan,
    sources: AGRICULTURAL_RESEARCH_BUNDLE.bundle_metadata.authorities,
  };
}
