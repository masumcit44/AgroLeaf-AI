// F10 Rule-based action plan: pure function to build "this week's" plan from disease knowledge.
// Order:
//   1. Urgent action (from what_to_do_now)
//   2. Re-check the field in 2–3 days (plus weather risk notice if favourable)
//   3. At most 2 non-chemical preventive measures
//   4. Chemical safety / 16123 helpline call step
// Allowed source keys: 'bamis' (BAMIS/DAE guidance) and 'safety' (AgroLeaf safety rule).

const CHEMICAL_REGEX = /\d+(\.\d+)?\s*(ml|L|লিটার|গ্রাম|g|%|ppm)/i;
const CHEMICAL_NAMES_REGEX = /নাটিভো|এমিস্টার|থিওভিট|হেক্সাকোনাজোল|টেবুকোনাজোল|কার্বেনডাজিম|ম্যানকোজেব|ম্যালাথিয়ন|ক্লোরপাইরিফোস|nativo|amistar|theovit|hexaconazole|tebuconazole|carbendazim|mancozeb|malathion|chlorpyrifos/i;

function hasChemicalMention(text) {
  if (!text || typeof text !== 'string') return false;
  return CHEMICAL_REGEX.test(text) || CHEMICAL_NAMES_REGEX.test(text);
}

export function buildPlan(decision, knowledge, weatherRisk, lang = 'bn') {
  if (!decision) return [];

  const classes = knowledge?.classes || {};
  const isBn = lang === 'bn';
  const langKey = isBn ? 'bn' : 'en';

  const classKey = decision?.top?.key;
  const classData = classKey ? classes[classKey] : null;
  const isConfident = decision?.status === 'confident' && Boolean(classKey);
  const isHealthy = classKey === 'healthy';
  const isNotSure = !isConfident || classKey === 'not_sure';

  const getLocalizedField = (obj, base) => {
    return obj?.[`${base}_${langKey}`] || obj?.[base] || '';
  };

  const steps = [];

  // 1. Not-Sure Case
  if (isNotSure) {
    steps.push({
      text: isBn
        ? 'দিনের আলোতে আক্রান্ত ধানের পাতার সোজা ও স্পষ্ট ছবি তুলুন এবং পাতার দাগগুলো ফ্রেমের মাঝে রাখুন।'
        : 'Take a clear, focused photo of the affected rice leaf in good daylight, centering the lesions.',
      source: 'safety',
    });
    steps.push({
      text: isBn
        ? 'সরাসরি পরামর্শের জন্য আপনার উপজেলা কৃষি কর্মকর্তা (SAAO)-এর সাথে যোগাযোগ করুন বা ১৬১২৩ নম্বরে কল করুন।'
        : 'For direct guidance, consult your Upazila agriculture officer or call the 16123 helpline.',
      source: 'safety',
    });
    return steps;
  }

  // 2. Healthy Leaf Case
  if (isHealthy) {
    steps.push({
      text: isBn
        ? 'সুস্থ ধান গাছের স্বাভাবিক বৃদ্ধি বজায় রাখতে প্রতি সপ্তাহে অন্তত একবার পুরো জমি ঘুরে দেখুন।'
        : 'Walk through your field at least once weekly to ensure normal healthy crop growth.',
      source: 'safety',
    });

    const preventionList = getLocalizedField(classData, 'prevention');
    if (Array.isArray(preventionList)) {
      const cleanItems = preventionList.filter((item) => !hasChemicalMention(item)).slice(0, 2);
      for (const item of cleanItems) {
        steps.push({
          text: item,
          source: 'bamis',
        });
      }
    }

    steps.push({
      text: isBn
        ? 'যেকোনো কৃষি পরামর্শ বা সারের সঠিক মাত্রার জন্য উপজেলা কৃষি কর্মকর্তা বা ১৬১২৩ নম্বরে কল করুন।'
        : 'For any farming queries or fertilizer guidance, consult your Upazila agriculture officer or call 16123.',
      source: 'safety',
    });
    return steps;
  }

  // 3. Confident Rice Disease Cases
  // Step 1: Urgent non-chemical action from what_to_do_now
  const rawWhatToDo = getLocalizedField(classData, 'what_to_do_now');
  if (rawWhatToDo && !hasChemicalMention(rawWhatToDo)) {
    steps.push({
      text: rawWhatToDo,
      source: 'bamis',
    });
  } else {
    steps.push({
      text: isBn
        ? 'আক্রান্ত অংশ চিহ্নিত করুন এবং জমিতে অতিরিক্ত ইউরিয়া সার প্রয়োগ সাময়িক স্থগিত রাখুন।'
        : 'Identify affected spots and pause excess urea top-dressing immediately.',
      source: 'bamis',
    });
  }

  // Step 2: Re-check field in 2–3 days (plus weather note if favourable)
  const isWeatherRisk = Array.isArray(weatherRisk) && weatherRisk.some((w) => w.diseaseKey === classKey);
  if (isWeatherRisk) {
    steps.push({
      text: isBn
        ? 'আবহাওয়া এই সপ্তাহের জন্য এই রোগের অনুকূল — ২-৩ দিন পর আবার জমি পর্যবেক্ষণ করুন।'
        : 'Weather favours this disease this week — inspect the field again in 2–3 days.',
      source: 'bamis',
    });
  } else {
    steps.push({
      text: isBn
        ? '২-৩ দিন পর আবার জমিতে গিয়ে নতুন পাতার দাগ বা লক্ষণ ছড়িয়ে পড়ছে কি না পরীক্ষা করুন।'
        : 'Inspect the field again in 2–3 days to check if lesions or symptoms are spreading.',
      source: 'bamis',
    });
  }

  // Step 3: Up to 2 non-chemical preventive items
  const preventionList = getLocalizedField(classData, 'prevention');
  if (Array.isArray(preventionList)) {
    const cleanItems = preventionList.filter((item) => !hasChemicalMention(item)).slice(0, 2);
    for (const item of cleanItems) {
      steps.push({
        text: item,
        source: 'bamis',
      });
    }
  }

  // Step 4: Final chemical safety / 16123 helpline call step
  steps.push({
    text: isBn
      ? 'কোনো রাসায়নিক কীটনাশক বা ছত্রাকনাশক ব্যবহারের আগে উপজেলা কৃষি কর্মকর্তা বা ১৬১২৩ নম্বরে কল করুন।'
      : 'Ask your Upazila agriculture officer or call 16123 before using any chemical pesticide or fungicide.',
    source: 'safety',
  });

  return steps;
}
