/**
 * Personalized Rice Crop Calendar Engine
 * Evidence-based scheduling sourced from Bangladesh Rice Research Institute (BRRI)
 * and Bangladesh Agro-Meteorological Information Service (BAMIS).
 * 100% Free, local-first, zero network dependency.
 */

import { getVarietyDuration } from './riceVarieties.js';

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function getLocalTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const CROP_STAGES = [
  { id: 'stage_seedbed', name_bn: 'বীজতলা / প্রস্তুতি', name_en: 'Seedbed / Preparation', minPct: 0, maxPct: 5 },
  { id: 'stage_establishment', name_bn: 'চারা প্রতিষ্ঠা ও আগাছা দমন', name_en: 'Establishment & Weeding', minPct: 6, maxPct: 15 },
  { id: 'stage_tillering', name_bn: 'সক্রিয় কুশি গজানো', name_en: 'Active Tillering', minPct: 16, maxPct: 35 },
  { id: 'stage_max_tillering', name_bn: 'সর্বোচ্চ কুশি ও বৃদ্ধি', name_en: 'Maximum Tillering', minPct: 36, maxPct: 50 },
  { id: 'stage_booting', name_bn: 'কাইচথোড় / থোড় পর্যায়', name_en: 'Panicle Initiation / Booting', minPct: 51, maxPct: 65 },
  { id: 'stage_flowering', name_bn: 'ফুল ফোটা ও পরাগায়ন', name_en: 'Flowering & Heading', minPct: 66, maxPct: 75 },
  { id: 'stage_grain_filling', name_bn: 'দানা গঠন (দুধ ও শক্ত চাল)', name_en: 'Grain Filling (Dough)', minPct: 76, maxPct: 88 },
  { id: 'stage_maturity', name_bn: 'ধান পাকা ও কর্তন প্রস্তুতি', name_en: 'Ripening & Harvest Prep', minPct: 89, maxPct: 100 },
];

/**
 * Generates an evidence-based personalized crop calendar for a given farmer profile.
 * @param {Object} profile 
 * @returns {Object} Complete calendar model
 */
export function generateCropCalendar(profile = {}) {
  const todayStr = getLocalTodayStr();
  const season = profile.season || 'boro';
  const varietyId = profile.variety_id || 'unknown';
  const duration = getVarietyDuration(season, varietyId, profile.variety_duration_days);
  const isDirectSeeded = profile.cultivation_method === 'direct_seeded';

  let baseDate = profile.transplant_date || profile.direct_seeding_date || null;
  let isEstimated = false;

  if (!baseDate) {
    isEstimated = true;
    // If crop_stage is provided as fallback, back-calculate approximate baseDate
    const stageId = profile.crop_stage;
    const stageOffsets = {
      stage_seedbed: -15,
      stage_establishment: 10,
      stage_tillering: 25,
      stage_booting: 60,
      stage_flowering: 75,
      stage_grain_filling: 95,
      stage_maturity: 130,
    };
    const offset = stageOffsets[stageId] || 25; // default 25 days ago
    const d = new Date();
    d.setDate(d.getDate() - offset);
    baseDate = d.toISOString().split('T')[0];
  }

  // Calculate days elapsed from baseDate to today
  const baseTime = new Date(baseDate).getTime();
  const todayTime = new Date(todayStr).getTime();
  const daysElapsed = Math.round((todayTime - baseTime) / (1000 * 60 * 60 * 24));

  // Determine current growth stage
  const progressPct = Math.min(100, Math.max(0, Math.round((daysElapsed / duration) * 100)));
  let currentStage = CROP_STAGES[0];
  for (const st of CROP_STAGES) {
    if (progressPct >= st.minPct && progressPct <= st.maxPct) {
      currentStage = st;
      break;
    }
  }

  // Adjust offsets for direct seeding (10 days earlier for post-sowing operations)
  const shift = isDirectSeeded ? -10 : 0;

  const rawTasks = [
    {
      id: 'task_topdress_1',
      stage_id: 'stage_establishment',
      day_offset: Math.max(8, Math.round(duration * 0.12) + shift),
      title_bn: '১ম কিস্তি ইউরিয়া ও আগাছা দমন',
      title_en: '1st Top-Dressing (Urea) & Hand Weeding',
      why_bn: 'রোপণের পর চারা দ্রুত শিকড় বিস্তার করে ও কুশি ছাড়ার জন্য নাইট্রোজেন প্রয়োজন।',
      why_en: 'Seedlings require nitrogen for vigorous root proliferation and initial tillering.',
      instructions_bn: 'জমিতে ছিপছিপে পানি রেখে সম্পূর্ণ আগাছা পরিষ্কার করুন। এরপর প্রতি বিঘায় অনুমোদিত ইউরিয়ার ১ম কিস্তি উপরিপ্রয়োগ করুন।',
      instructions_en: 'Clear all weeds while maintaining thin standing water, then top-dress 1st split of urea.',
      source_ref: 'BRRI ধান চাষ নির্দেশিকা',
    },
    {
      id: 'task_pest_scouting_1',
      stage_id: 'stage_tillering',
      day_offset: Math.round(duration * 0.22) + shift,
      title_bn: 'পানি ব্যবস্থাপনা ও মাঝরা পোকা পর্যবেক্ষণ',
      title_en: 'Water Management & Stem Borer Scouting',
      why_bn: 'কুশি গজানোর শুরুতে মাঝরা পোকা ও পাতা মোড়ানো পোকার আক্রমণ দেখা দিতে পারে।',
      why_en: 'Early vegetative tillers are susceptible to yellow stem borer (deadhearts) and leaf folder.',
      instructions_bn: 'জমিতে ২–৩ সেমি পানি ধরে রাখুন। জমিতে বাঁশের কঞ্চি বা ডাল পুঁতে পার্চিং (পাখি বসার ব্যবস্থা) করুন। মরা কুশি বা মথ দেখা দিলে সতর্ক হোন।',
      instructions_en: 'Maintain 2-3 cm water. Install bamboo perches for insectivorous birds. Scout for deadhearts.',
      source_ref: 'BRRI ও BAMIS সমন্বিত বালাই ব্যবস্থাপনা',
    },
    {
      id: 'task_topdress_2',
      stage_id: 'stage_tillering',
      day_offset: Math.round(duration * 0.32) + shift,
      title_bn: '২য় কিস্তি সার ও ব্লাস্ট রোগ পর্যবেক্ষণ',
      title_en: '2nd Top-Dressing & Blast Disease Scouting',
      why_bn: 'কুশি সংখ্যা বৃদ্ধির চূড়ান্ত সময়ে পটাশ ও ইউরিয়া প্রয়োগ রোগ প্রতিরোধ ক্ষমতা জোরদার করে।',
      why_en: 'Balanced nitrogen and potash reinforce cell walls against blast pathogen infection.',
      instructions_bn: 'ইউরিয়ার ২য় কিস্তি এবং অতিরিক্ত পটাশ (MOP) উপরিপ্রয়োগ করুন। পাতার ডগায় ব্লাস্টের চোখের মতো দাগ আছে কি না পরীক্ষা করুন।',
      instructions_en: 'Apply 2nd split of urea and top-dress potash. Inspect upper foliage for blast lesions.',
      source_ref: 'BRRI সার ব্যবস্থাপনা নির্দেশিকা',
    },
    {
      id: 'task_panicle_irrigation',
      stage_id: 'stage_booting',
      day_offset: Math.round(duration * 0.45) + shift,
      title_bn: 'কাইচথোড় পর্যায়: ৫–৭ সেমি পানি সংরক্ষণ',
      title_en: 'Booting Stage: Maintain 5–7 cm Standing Water',
      why_bn: 'থোড় আসার সময় পানির ঘাটতি হলে শীষ অপুষ্ট থাকে এবং ফলন মারাত্মক হ্রাস পায়।',
      why_en: 'Water stress during panicle initiation leads to spikelet sterility and severe yield loss.',
      instructions_bn: 'জমিতে সর্বদা ৫–৭ সেমি পানি ধরে রাখুন। জমি কোনোভাবেই শুকাতে দেবেন না। প্রয়োজনে সেচ নিশ্চিত করুন।',
      instructions_en: 'Ensure continuous 5–7 cm water depth. Never let the field dry during booting.',
      source_ref: 'BRRI ও BAMIS সেচ নির্দেশিকা',
    },
    {
      id: 'task_flowering_care',
      stage_id: 'stage_flowering',
      day_offset: Math.round(duration * 0.58) + shift,
      title_bn: 'ফুল ফোটা পর্যায়: সকালের পরাগায়ন রক্ষা',
      title_en: 'Flowering Stage: Protect Morning Pollination',
      why_bn: 'সকাল ৯টা থেকে বেলা ১১টা পর্যন্ত পরাগায়ন ঘটে। এ সময় জমিতে কীটনাশক ছিটানো নিষিদ্ধ।',
      why_en: 'Anthesis and pollination peak in the morning. Chemical spraying during pollination causes chaffy grain.',
      instructions_bn: 'সকালে গাছে কোনো প্রকার স্প্রে করবেন না। জমিতে আর্দ্রতা বজায় রাখুন। গান্ধী পোকা থাকলে বিকেলে সতর্কতা অবলম্বন করুন।',
      instructions_en: 'Do not spray chemicals during morning flowering. Maintain standing water.',
      source_ref: 'BRRI ফসল সুরক্ষা নির্দেশিকা',
    },
    {
      id: 'task_bph_scouting',
      stage_id: 'stage_grain_filling',
      day_offset: Math.round(duration * 0.68) + shift,
      title_bn: 'দানা গঠন: বাদামি গাছফড়িং (কারেন্ট পোকা) নিরীক্ষা',
      title_en: 'Grain Filling: Brown Planthopper (BPH) Scouting',
      why_bn: 'দানা পুষ্ট হওয়ার সময় ধানের গোড়ায় বাদামি গাছফড়িং আক্রমণ করে দ্রুত ধান পুড়িয়ে দিতে পারে।',
      why_en: 'BPH congregates at the base of rice hills causing rapid hopper burn if unchecked.',
      instructions_bn: 'ধানের গোড়া ফাঁক করে সূর্যের আলোয় পরীক্ষা করুন। গোড়া ভেজা রাখুন কিন্তু বাতাস চলাচলের জন্য মাঝে মাঝে জমি শুকিয়ে দিন।',
      instructions_en: 'Part rice hills to inspect culm bases for planthoppers. Practice intermittent drying.',
      source_ref: 'BRRI সমন্বিত বালাই দমন (IPM)',
    },
    {
      id: 'task_pre_harvest_drain',
      stage_id: 'stage_maturity',
      day_offset: Math.max(duration - 14, Math.round(duration * 0.88)),
      title_bn: 'ফসল কাটার পূর্বের পানি নিষ্কাশন',
      title_en: 'Pre-Harvest Field Drainage',
      why_bn: 'কাটার ১০–১২ দিন আগে পানি বের করে দিলে ধান সমভাবে পাকে এবং জমি মাড়াইয়ের উপযুক্ত হয়।',
      why_en: 'Draining the field 10–12 days prior promotes uniform ripening and eases combine/hand harvesting.',
      instructions_bn: 'জমির আইল কেটে সব জমে থাকা পানি দ্রুত নিষ্কাশন করে দিন যাতে মাটি শক্ত হয়।',
      instructions_en: 'Cut field bunds to discharge all standing water so soil hardens for harvesting.',
      source_ref: 'BRRI ফসল সংগ্রহ ব্যবস্থাপনা',
    },
    {
      id: 'task_harvest',
      stage_id: 'stage_maturity',
      day_offset: duration,
      title_bn: 'পাকা ধান কর্তন, মাড়াই ও নিরাপদ সংরক্ষণ',
      title_en: 'Harvesting, Threshing & Safe Storage',
      why_bn: 'শীষের ৮০% দানা সোনালী রঙ ধারণ করলে ধান কাটার উপযুক্ত সময়। দেরিতে কাটলে ঝরে পড়ার ঝুঁকি থাকে।',
      why_en: 'Harvesting at 80% golden maturity prevents grain shattering and lodging damage.',
      instructions_bn: 'সকালে কেটে দ্রুত মাড়াই করুন। রোদে ৩–৪ দিন শুকিয়ে আর্দ্রতা ১২% নামিয়ে বায়ুরোধী পাত্রে সংরক্ষণ করুন।',
      instructions_en: 'Harvest when 80% grains are straw-colored. Sun dry to 12% moisture before storage.',
      source_ref: 'BRRI ফসল সংরক্ষণ নির্দেশিকা',
    },
  ];

  const completedSet = new Set(profile.completed_task_ids || []);
  const reminderSet = new Set(profile.active_reminder_ids || []);

  const tasks = rawTasks.map((t) => {
    const targetDate = addDays(baseDate, t.day_offset);
    const isCompleted = completedSet.has(t.id);
    const hasReminder = reminderSet.has(t.id);

    let status = 'upcoming';
    if (isCompleted) {
      status = 'completed';
    } else if (targetDate < todayStr) {
      status = 'overdue';
    } else if (targetDate === todayStr || (daysElapsed >= t.day_offset - 2 && daysElapsed <= t.day_offset + 2)) {
      status = 'due';
    }

    return {
      ...t,
      target_date: targetDate,
      is_completed: isCompleted,
      has_reminder: hasReminder,
      status,
      is_estimated: isEstimated,
    };
  });

  // Find next critical task (first task that is due or upcoming and not completed)
  const nextTask = tasks.find((t) => !t.is_completed && (t.status === 'due' || t.status === 'upcoming')) ||
                   tasks.find((t) => !t.is_completed) || null;

  return {
    season,
    variety_id: varietyId,
    variety_name: profile.variety || 'BRRI Rice',
    duration_days: duration,
    cultivation_method: profile.cultivation_method || 'transplanted',
    base_date: baseDate,
    days_elapsed: daysElapsed,
    progress_pct: progressPct,
    current_stage: currentStage,
    is_estimated: isEstimated,
    tasks,
    next_task: nextTask,
    location: {
      division: profile.division_name_bn || 'ঢাকা',
      district: profile.district_name_bn || 'গাজীপুর',
      upazila: profile.upazila_name_bn || '',
    },
  };
}

