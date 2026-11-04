// Pure helper functions and agricultural rules for F24 Farmer Reminders.
// Tested independently with unit tests.

export const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export const BANGLA_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

/**
 * Replace ASCII digits with Bengali numerals.
 */
export function toBanglaDigits(val) {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[0-9]/g, (d) => BANGLA_DIGITS[d] || d);
}

/**
 * Recommended follow-up timeline in days based on agricultural guidance.
 * Blast & Sheath Blight: rapid progress (3 days)
 * Brown Spot & Tungro: moderate progress (5 days)
 * Leaf Smut & Healthy: routine monitoring (7 days)
 * Inconclusive: re-take photo in daylight (2 days)
 */
export function getRecommendedFollowUpDays(diseaseKey) {
  switch (diseaseKey) {
    case 'blast':
    case 'sheath_blight':
      return 3;
    case 'brown_spot':
    case 'tungro':
      return 5;
    case 'leaf_smut':
    case 'healthy':
      return 7;
    case 'not_sure':
      return 2;
    default:
      return 3;
  }
}

/**
 * Calculate future date string "YYYY-MM-DD" from given base date and days offset in local time.
 */
export function getFutureDateStr(daysOffset, baseDate = new Date()) {
  const target = new Date(baseDate);
  target.setDate(target.getDate() + Number(daysOffset));
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format "YYYY-MM-DD" into a friendly localized date (e.g. "৭ নভেম্বর, ২০২৬").
 */
export function formatBengaliDate(isoDateStr) {
  if (!isoDateStr) return '';
  const parts = isoDateStr.split('-');
  if (parts.length !== 3) return isoDateStr;

  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const monthName = BANGLA_MONTHS[monthIdx] || parts[1];
  return `${toBanglaDigits(day)} ${monthName}, ${toBanglaDigits(year)}`;
}

/**
 * Calculate day difference (dueDate - todayDate) in local days.
 */
export function getDayDifference(dueDateStr, todayDateStr) {
  if (!dueDateStr || !todayDateStr) return 0;
  const [y1, m1, d1] = dueDateStr.split('-').map(Number);
  const [y2, m2, d2] = todayDateStr.split('-').map(Number);

  const utcDue = Date.UTC(y1, m1 - 1, d1);
  const utcToday = Date.UTC(y2, m2 - 1, d2);

  const msPerDay = 86400000;
  return Math.round((utcDue - utcToday) / msPerDay);
}

/**
 * Returns a human-friendly Bengali status label based on date difference.
 */
export function formatRelativeBengali(dueDateStr, todayStr) {
  const diff = getDayDifference(dueDateStr, todayStr);

  if (diff < 0) {
    const overdueDays = Math.abs(diff);
    return {
      text: `${toBanglaDigits(overdueDays)} দিন অতিক্রান্ত`,
      badgeClass: 'bg-red-100 text-red-800 border-red-300',
      isOverdue: true,
      isDue: true,
    };
  }

  if (diff === 0) {
    return {
      text: 'আজকের করণীয়',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
      isOverdue: false,
      isDue: true,
    };
  }

  if (diff === 1) {
    return {
      text: 'আগামীকাল',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
      isOverdue: false,
      isDue: false,
    };
  }

  return {
    text: `${toBanglaDigits(diff)} দিন বাকি`,
    badgeClass: 'bg-gray-100 text-gray-800 border-gray-200',
    isOverdue: false,
    isDue: false,
  };
}

/**
 * Common crop care activity presets in Bengali and English.
 */
export function getActivityPresets(lang = 'bn') {
  const isBn = lang === 'bn';
  return [
    {
      id: 'check_symptoms',
      title: isBn ? 'জমিতে নতুন লক্ষণ পর্যবেক্ষণ' : 'Check for new crop symptoms',
      description: isBn ? 'ধানের পাতায় রোগের কোনো নতুন দাগ বা বিস্তার ঘটেছে কিনা তা ভালো করে ঘুরে দেখুন।' : 'Inspect field for any new disease lesions or spread.',
      defaultDays: 3,
    },
    {
      id: 'recheck_leaf',
      title: isBn ? 'আক্রান্ত ধান গাছ পুনর্নিরীক্ষণ' : 'Recheck affected rice plant',
      description: isBn ? 'পূর্বের আক্রান্ত অংশের লক্ষণ স্থিতিশীল হচ্ছে নাকি বাড়ছে তা নিশ্চিত করুন।' : 'Verify whether symptoms on affected hills are stabilizing or expanding.',
      defaultDays: 5,
    },
    {
      id: 'field_inspection',
      title: isBn ? 'পুরো জমি সাধারণ পরিদর্শন' : 'General field inspection',
      description: isBn ? 'জমি ঘুরে গাছের স্বাভাবিক বৃদ্ধি, পানির স্তর ও সুস্থতা পর্যবেক্ষণ করুন।' : 'Walk the field to check plant vigor, water level, and overall health.',
      defaultDays: 7,
    },
    {
      id: 'contact_saao',
      title: isBn ? 'কৃষি পরামর্শ ও সাহায্য (১৬১২৩)' : 'Agricultural guidance (16123)',
      description: isBn ? 'প্রয়োজনে উপজেলা কৃষি কর্মকর্তা বা কৃষি কল সেন্টার ১৬১২৩-এ যোগাযোগ করুন।' : 'Consult local agricultural extension officer or call 16123 helpline.',
      defaultDays: 2,
    },
  ];
}
