// Bangladesh Rice Crop Calendar & Phenology Resolver.
// Citations: Bangladesh Rice Research Institute (BRRI) Adhunik Dhaner Chash (23rd Ed. 2020),
// Department of Agricultural Extension (DAE) BAMIS Agro-Meteorological Calendars.

export const SEASONS = {
  AMAN: 'aman',
  BORO: 'boro',
  AUS: 'aus',
};

export const CROP_STAGES = [
  { id: 'seedling', labelBn: 'বীজতলা ও চারা', labelEn: 'Seedbed & Seedling' },
  { id: 'tillering', labelBn: 'কুশি পর্যায়', labelEn: 'Tillering' },
  { id: 'booting_flowering', labelBn: 'থোড় ও ফুল', labelEn: 'Booting & Flowering' },
  { id: 'ripening', labelBn: 'পাকা পর্যায়', labelEn: 'Ripening' },
];

/**
 * Determine the current active Bangladesh rice season based on calendar date.
 * BRRI calendar:
 * - Aman: Transplanted July-August, flowering Oct-Nov, harvest Nov-Jan
 * - Boro: Nursery Nov-Dec, transplanted Dec-Feb, harvest April-May
 * - Aus: Sowing March-April, harvest July-Aug
 */
export function getCurrentSeason(date = new Date()) {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  if (month >= 7 && month <= 10) {
    return {
      season: SEASONS.AMAN,
      nameBn: 'রোপা আমন',
      nameEn: 'T. Aman Rice',
      phaseBn: 'বৃদ্ধি ও থোড় পর্যায়',
      phaseEn: 'Vegetative to Booting',
      defaultStage: 'tillering',
      source: 'BRRI Adhunik Dhaner Chash (2020) & DAE BAMIS',
    };
  }

  if (month === 11 || month === 12 || (month === 1 && day <= 15)) {
    return {
      season: SEASONS.AMAN,
      nameBn: 'আমন মৌসুম (শেষ পর্ব) ও বোরো প্রস্তুতি',
      nameEn: 'Aman Harvest & Boro Nursery Preparation',
      phaseBn: 'পাকা ও কর্তন পর্যায়',
      phaseEn: 'Ripening & Harvest period',
      defaultStage: 'ripening',
      source: 'BRRI Adhunik Dhaner Chash (2020) & DAE BAMIS',
    };
  }

  if ((month === 1 && day > 15) || month >= 2 && month <= 5) {
    return {
      season: SEASONS.BORO,
      nameBn: 'বোরো ধান',
      nameEn: 'Boro Rice',
      phaseBn: month <= 2 ? 'রোপণ ও কুশি পর্যায়' : month <= 4 ? 'থোড় ও ফুল পর্যায়' : 'পাকা ও কর্তন',
      phaseEn: month <= 2 ? 'Transplanting & Tillering' : month <= 4 ? 'Booting & Flowering' : 'Harvest',
      defaultStage: month <= 2 ? 'tillering' : month <= 4 ? 'booting_flowering' : 'ripening',
      source: 'BRRI Adhunik Dhaner Chash (2020) & DAE BAMIS',
    };
  }

  return {
    season: SEASONS.AUS,
    nameBn: 'আউশ ধান',
    nameEn: 'Aus Rice',
    phaseBn: 'বৃদ্ধি ও ফুল পর্যায়',
    phaseEn: 'Growth & Flowering',
    defaultStage: 'tillering',
    source: 'BRRI Adhunik Dhaner Chash (2020)',
  };
}

/**
 * Stage-specific agronomical notes cited directly from official research.
 */
export function getStageAdvisory(stageId) {
  const notes = {
    seedling: {
      bn: 'চারা অবস্থায় ব্লাস্ট (লিফ ব্লাস্ট) রোগের ঝুঁকি বেশি থাকে। কুয়াশাচ্ছন্ন বা শীতল আবহাওয়ায় বীজতলায় রাতে স্বচ্ছ পলিথিন দিয়ে ঢেকে রাখা ও সকালে জমা শিশির ঝরিয়ে দেওয়ার পরামর্শ দেয় ব্রি।',
      en: 'Seedlings are highly susceptible to leaf blast. During cold or foggy conditions, BRRI recommends covering nursery beds with clear polythene overnight and gently sweeping morning dew.',
      source: 'BRRI Adhunik Dhaner Chash (2020, p. 55)',
    },
    tillering: {
      bn: 'কুশি গজানোর সময় অতিরিক্ত ইউরিয়া সারের ব্যবহার এবং ঘন রোপণ খোল পোড়া ও ব্যাকটেরিয়াজনিত পাতা পোড়ার বিস্তার দ্রুত করে। সুষম সার (বিশেষ করে পর্যাপ্ত পটাশ) নিশ্চিত করুন।',
      en: 'Excessive urea top-dressing and dense canopy during tillering promote sheath blight and bacterial blight spread. Ensure balanced fertilization, particularly adequate potassium.',
      source: 'DAE BAMIS Sylhet Crop Calendar (5108.pdf) & BRRI',
    },
    booting_flowering: {
      bn: 'থোড় ও ফুল ফোটার সময় নেক ব্লাস্ট (শীষ ব্লাস্ট) সবচেয়ে মারাত্মক ক্ষতি করে। মেঘলা আকাশ, দীর্ঘ শিশিরপাত ও রাতের তাপমাত্রা ১৬-২০°সে নামলে নিয়মিত শীষ পর্যবেক্ষণ করুন।',
      en: 'Booting and flowering are critical windows for neck blast. If nights cool to 16-20°C with high humidity (>90%) and cloudiness, inspect emerging panicles frequently.',
      source: 'DAE BAMIS Faridpur Crop Calendar (5102.pdf)',
    },
    ripening: {
      bn: 'ধান পাকার সময় জমি থেকে ধীরে ধীরে পানি সরিয়ে ফেলুন (ফসল কাটার ১০-১৫ দিন পূর্বে)। জমি অতিরিক্ত স্যাঁতসেঁতে থাকলে শীথ রট বা ছত্রাকের সংক্রমণ ছড়াতে পারে।',
      en: 'Gradually drain standing water from fields 10-15 days before harvest. Excessive moisture during ripening prolongs humidity and encourages secondary fungal infection.',
      source: 'BRRI Adhunik Dhaner Chash (2020, p. 38)',
    },
  };

  return notes[stageId] || notes.ripening;
}
