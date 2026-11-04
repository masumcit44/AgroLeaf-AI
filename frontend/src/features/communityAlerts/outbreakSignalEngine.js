// F32 Outbreak Early Warning & Neighbor Risk Alert Engine
// Grounded in BRRI / DAE epidemiological protocols and statistical rate anomaly modeling.
// Strict Free-Only, Local-First, Zero-Fake-Outbreak Policy.

import { getNeighbors, getDistrictName } from './districtAdjacency.js';

export const SUPPORTED_DISEASES = {
  blast: {
    key: 'blast',
    nameBn: 'ধানের ব্লাস্ট',
    nameEn: 'Rice Blast',
    pathogen: 'Magnaporthe oryzae',
    dangerLevel: 'high',
  },
  brown_spot: {
    key: 'brown_spot',
    nameBn: 'বাদামী দাগ',
    nameEn: 'Brown Spot',
    pathogen: 'Bipolaris oryzae',
    dangerLevel: 'medium',
  },
  sheath_blight: {
    key: 'sheath_blight',
    nameBn: 'শীথ ব্লাইট',
    nameEn: 'Sheath Blight',
    pathogen: 'Rhizoctonia solani',
    dangerLevel: 'high',
  },
  tungro: {
    key: 'tungro',
    nameBn: 'টুংরো ভাইরাস',
    nameEn: 'Rice Tungro Virus',
    pathogen: 'RTBV / RTSV',
    dangerLevel: 'critical',
  },
};

export const ALERT_LEVELS = {
  INSUFFICIENT_DATA: {
    code: 'INSUFFICIENT_DATA',
    rank: -1,
    titleBn: 'তথ্য অপর্যাপ্ত',
    titleEn: 'Insufficient Data',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: 'ℹ️',
  },
  NORMAL: {
    code: 'NORMAL',
    rank: 0,
    titleBn: 'স্বাভাবিক অবস্থা',
    titleEn: 'Normal Activity',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    icon: '🟢',
  },
  MONITORING: {
    code: 'MONITORING',
    rank: 1,
    titleBn: 'সতর্ক নজরদারি',
    titleEn: 'Monitoring Signal',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    icon: '🟡',
  },
  ELEVATED: {
    code: 'ELEVATED',
    rank: 2,
    titleBn: 'রোগের রিপোর্ট বৃদ্ধি',
    titleEn: 'Increased Reporting Activity',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-300',
    icon: '🟠',
  },
  HIGH_RISK: {
    code: 'HIGH_RISK',
    rank: 3,
    titleBn: 'উচ্চ ঝুঁকি সংকেত',
    titleEn: 'Elevated Community Risk',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300',
    icon: '🔴',
  },
  VERIFIED: {
    code: 'VERIFIED',
    rank: 4,
    titleBn: 'সরকারি নিশ্চিত সতর্কতা',
    titleEn: 'Official Field Advisory',
    badgeClass: 'bg-purple-50 text-purple-900 border-purple-300',
    icon: '🏛️',
  },
};

export const BRRI_PREVENTIVE_ACTIONS = {
  blast: {
    titleBn: 'ব্লাস্ট রোগ ব্যবস্থাপনা ও সতর্কতা',
    titleEn: 'Rice Blast Management & Precaution',
    actionsBn: [
      'ধানক্ষেতে ২ থেকে ৩ সেন্টিমিটার পানি ধরে রাখুন (পানি থাকলে ব্লাস্টের স্পোর সহজে ছড়ায় না)।',
      'ইউরিয়া (নাইট্রোজেন) সার উপরিপ্রয়োগ সম্পূর্ণ বন্ধ রাখুন।',
      'ভোরবেলা কুয়াশার আর্দ্রতায় ধানের পাতার নিচের অংশ পর্যবেক্ষণ করুন (চোখের মতো দাগ আছে কি না)।',
      'লক্ষণ বেশি দেখা দিলে উপসহকারী কৃষি কর্মকর্তা (SAAO)-এর পরামর্শে ট্রাইসাইক্লাজল বা ডাইফেনোকোনাজল গ্রুপের অনুমোদিত ছত্রাকনাশক স্প্রে করুন।',
    ],
    actionsEn: [
      'Maintain 2–3 cm standing water in paddy (inhibits blast spore establishment).',
      'Suspend all urea (nitrogen) top-dressing immediately.',
      'Scout lower leaves in early morning dew for spindle-shaped grey-center lesions.',
      'If active lesions persist, consult your local SAAO or apply approved fungicide (Tricyclazole / Difenoconazole).',
    ],
  },
  brown_spot: {
    titleBn: 'বাদামী দাগ রোগ ব্যবস্থাপনা',
    titleEn: 'Brown Spot Management',
    actionsBn: [
      'জমিতে পানির তীব্র ঘাটতি হতে দেবেন না; নিয়মিত সেচ দিন।',
      'পটাশ (MoP) ও দস্তা সারের অভাব থাকলে অনুমোদিত মাত্রায় প্রয়োগ করুন।',
      'পরবর্তী মৌসুমের জন্য রোগমুক্ত ও শোধিত বীজ ব্যবহার নিশ্চিত করুন।',
    ],
    actionsEn: [
      'Prevent drought stress and maintain adequate field moisture.',
      'Apply recommended muriate of potash and zinc if deficient.',
      'Ensure disease-free, treated seed for subsequent seasons.',
    ],
  },
  sheath_blight: {
    titleBn: 'শীথ ব্লাইট ব্যবস্থাপনা',
    titleEn: 'Sheath Blight Management',
    actionsBn: [
      'জমিতে অতিরিক্ত পানি জমিয়ে রাখবেন না; প্রয়োজনে ২–৩ দিন পানি নিষ্কাশন করে দিন।',
      'আইলের আগাছা ও অবশিষ্টাংশ পরিষ্কার রাখুন যেন পরজীবী ছড়িয়ে না পড়ে।',
      'গাছের গোড়ায় আক্রান্ত অংশে ভ্যালিডামাইসিন বা হেক্সাকোনাজল স্প্রে করুন।',
    ],
    actionsEn: [
      'Avoid deep standing water; drain field temporarily for 2–3 days if soil permits.',
      'Clear field bund weeds to remove collateral hosts.',
      'Direct approved fungicide spray (Validamycin / Hexaconazole) at leaf sheaths near water line.',
    ],
  },
  tungro: {
    titleBn: 'টুংরো ভাইরাস ও পাতাফড়িং নিয়ন্ত্রণ',
    titleEn: 'Tungro Virus & Leafhopper Control',
    actionsBn: [
      'আক্রান্ত হলুদ বা কমলা রঙের খর্বাকৃতির গাছ দেখা মাত্রই উপড়ে ফেলে মাটিতে পুঁতে ফেলুন।',
      'রাতে আলোর ফাঁদ (Light Trap) স্থাপন করে সবুজ পাতাফড়িংয়ের সংখ্যা পর্যবেক্ষণ করুন।',
      'পাতাফড়িং বেশি হলে কৃষি কর্মকর্তার পরামর্শে অনুমোদিত কীটনাশক প্রয়োগ করুন।',
    ],
    actionsEn: [
      'Rogue and bury yellow-orange stunted diseased hills immediately.',
      'Deploy nocturnal light traps to monitor Green Leafhopper vector activity.',
      'Target vector with approved insecticide only upon reaching economic threshold.',
    ],
  },
};

/**
 * Calculate statistical outbreak early-warning signal for a disease in a district.
 * 
 * @param {Object} params
 * @param {string|number} params.districtCode
 * @param {string} params.classKey
 * @param {number} params.currentContributors - distinct positive devices this week
 * @param {number} params.totalActiveContributors - total distinct devices in district this week
 * @param {number} [params.baselineRate=0.10] - historical baseline rate (mean over prior 3 weeks)
 * @param {boolean} [params.verified=false] - whether verified by DAE/official bulletin
 * @returns {Object} Signal evaluation result
 */
export function calculateDiseaseSignal({
  districtCode,
  classKey,
  currentContributors = 0,
  totalActiveContributors = 0,
  baselineRate = 0.10,
  verified = false,
}) {
  const code = String(districtCode);
  const disease = SUPPORTED_DISEASES[classKey] || {
    key: classKey,
    nameBn: classKey,
    nameEn: classKey,
  };

  // 1. Minimum Evidence / k-Anonymity Gate
  // At least 3 independent contributing devices required to generate an alert.
  if (totalActiveContributors < 3 || currentContributors < 3) {
    return {
      districtCode: code,
      classKey,
      disease,
      alertLevel: ALERT_LEVELS.INSUFFICIENT_DATA,
      currentContributors,
      totalActiveContributors,
      rateRatio: 0,
      zScore: 0,
      isSuppressed: true,
      messageBn: 'এই এলাকায় সতর্কতা দেওয়ার মতো পর্যাপ্ত নির্ভরযোগ্য তথ্য পাওয়া যায়নি।',
      messageEn: 'Insufficient data available to assess disease activity in this area.',
      timestamp: new Date().toISOString(),
    };
  }

  // 2. Relative Reporting Rate
  const currentRate = currentContributors / Math.max(1, totalActiveContributors);
  const safeBaselineRate = Math.max(0.05, baselineRate || 0.10);
  const rateRatio = Number((currentRate / safeBaselineRate).toFixed(2));

  // 3. Poisson Standardized Anomaly Index (Z-Score)
  const expectedContributors = safeBaselineRate * totalActiveContributors;
  const zScore = Number(
    ((currentContributors - expectedContributors) / Math.sqrt(Math.max(1, expectedContributors))).toFixed(2)
  );

  // 4. Alert Level Decision
  let alertLevel = ALERT_LEVELS.NORMAL;
  if (verified) {
    alertLevel = ALERT_LEVELS.VERIFIED;
  } else if (currentContributors >= 5 && zScore >= 3.0 && rateRatio >= 2.5) {
    alertLevel = ALERT_LEVELS.HIGH_RISK;
  } else if (currentContributors >= 3 && zScore >= 1.96 && rateRatio >= 1.75) {
    alertLevel = ALERT_LEVELS.ELEVATED;
  } else if (currentContributors >= 3 && (zScore >= 1.0 || rateRatio >= 1.25)) {
    alertLevel = ALERT_LEVELS.MONITORING;
  }

  // 5. User-facing explanations
  let messageBn = 'স্বাভাবিক অবস্থা। নতুন কোনো অস্বাভাবিক রোগের প্রবণতা পাওয়া যায়নি।';
  let messageEn = 'Normal conditions. No unusual disease reporting activity detected.';

  if (alertLevel.code === ALERT_LEVELS.VERIFIED.code) {
    messageBn = `কৃষি সম্প্রসারণ অধিদপ্তর কর্তৃক আপনার এলাকায় ${disease.nameBn} সংক্রান্ত সরকারি সতর্কবার্তা সক্রিয় আছে।`;
    messageEn = `Official agricultural advisory active for ${disease.nameEn} in this district.`;
  } else if (alertLevel.code === ALERT_LEVELS.HIGH_RISK.code) {
    messageBn = `AgroLeaf ব্যবহারকারীদের স্ক্যান রিপোর্টে আপনার এলাকায় ${disease.nameBn} রোগের উল্লেখযোগ্য বৃদ্ধি দেখা যাচ্ছে।`;
    messageEn = `Significant increase in ${disease.nameEn} reports detected among AgroLeaf scans in your area.`;
  } else if (alertLevel.code === ALERT_LEVELS.ELEVATED.code) {
    messageBn = `সাম্প্রতিক স্ক্যান তথ্যে আপনার এলাকায় ${disease.nameBn} রোগের রিপোর্ট বৃদ্ধির একটি প্রাথমিক সংকেত পাওয়া গেছে।`;
    messageEn = `Increased reporting signal for ${disease.nameEn} detected in your area compared to baseline.`;
  } else if (alertLevel.code === ALERT_LEVELS.MONITORING.code) {
    messageBn = `আপনার এলাকায় ${disease.nameBn} রোগের মৃদু বৃদ্ধি পরিলক্ষিত হচ্ছে। নিয়মিত নজর রাখুন।`;
    messageEn = `Mild increase in ${disease.nameEn} reports observed. Monitor your fields regularly.`;
  }

  const preventiveAdvice = BRRI_PREVENTIVE_ACTIONS[classKey] || null;

  return {
    districtCode: code,
    classKey,
    disease,
    alertLevel,
    currentContributors,
    totalActiveContributors,
    currentRate: Number(currentRate.toFixed(3)),
    baselineRate: Number(safeBaselineRate.toFixed(3)),
    rateRatio,
    zScore,
    isSuppressed: false,
    messageBn,
    messageEn,
    preventiveAdvice,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Evaluate spatial neighbor risk based on the 64-district adjacency graph.
 * If target district is at NORMAL/MONITORING, but an adjacent neighbor has ELEVATED or HIGH_RISK,
 * synthesize a Neighbor Risk Alert.
 * 
 * @param {Object} params
 * @param {string|number} params.targetDistrictCode
 * @param {Object<string, Object>} params.allDistrictSignals - map of districtCode -> diseaseSignal
 * @returns {Object|null} Neighbor risk report or null
 */
export function evaluateNeighborRisk({ targetDistrictCode, allDistrictSignals }) {
  const targetCode = String(targetDistrictCode);
  const targetSignal = allDistrictSignals[targetCode];

  // If target district already has local ELEVATED or HIGH_RISK or VERIFIED alert, local alert takes priority.
  if (targetSignal && targetSignal.alertLevel && targetSignal.alertLevel.rank >= 2) {
    return null;
  }

  const neighbors = getNeighbors(targetCode);
  if (!neighbors.length) return null;

  let highestNeighbor = null;
  let highestRank = 1; // only care about rank >= 2 (ELEVATED or above)

  for (const nCode of neighbors) {
    const nSignal = allDistrictSignals[nCode];
    if (nSignal && nSignal.alertLevel && nSignal.alertLevel.rank > highestRank) {
      highestRank = nSignal.alertLevel.rank;
      highestNeighbor = nSignal;
    }
  }

  if (!highestNeighbor) {
    return null;
  }

  const neighborNameBn = getDistrictName(highestNeighbor.districtCode, 'bn');
  const neighborNameEn = getDistrictName(highestNeighbor.districtCode, 'en');
  const disease = highestNeighbor.disease;

  return {
    isNeighborAlert: true,
    targetDistrictCode: targetCode,
    sourceDistrictCode: highestNeighbor.districtCode,
    sourceDistrictNameBn: neighborNameBn,
    sourceDistrictNameEn: neighborNameEn,
    alertLevel: highestNeighbor.alertLevel,
    disease,
    messageBn: `আপনার পাশের এলাকা ${neighborNameBn}-এ ${disease.nameBn} রোগের রিপোর্ট বেড়েছে। নিজের ধানক্ষেত নিয়মিত পর্যবেক্ষণ করুন।`,
    messageEn: `Increased ${disease.nameEn} reports detected in neighboring ${neighborNameEn}. Inspect your fields regularly.`,
    preventiveAdvice: highestNeighbor.preventiveAdvice,
    timestamp: highestNeighbor.timestamp,
  };
}

/**
 * Build complete community report for a district incorporating local signals and neighbor risks.
 */
export function buildCommunitySurveillanceReport({
  districtCode,
  localSignal,
  neighborRisk = null,
  lang = 'bn',
}) {
  const code = String(districtCode);
  const districtName = getDistrictName(code, lang);

  const primaryAlert = (localSignal && localSignal.alertLevel.rank >= 2)
    ? localSignal
    : (neighborRisk || localSignal);

  return {
    districtCode: code,
    districtName,
    primaryAlert,
    localSignal,
    neighborRisk,
    disclaimerBn: 'এই সতর্কতা AgroLeaf ব্যবহারকারীদের স্ক্যান রিপোর্টের ওপর ভিত্তি করে তৈরি। এটি সরকারি বা মাঠপর্যায়ে নিশ্চিত রোগের ঘোষণা নয়।',
    disclaimerEn: 'This early warning is derived from anonymous AgroLeaf user scan reports. It is not an official government epidemic declaration.',
    generatedAt: new Date().toISOString(),
  };
}
