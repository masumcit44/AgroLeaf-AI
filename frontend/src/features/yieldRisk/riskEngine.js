// AgroLeaf AI — Context-Aware Explainable Risk Engine (F26)
// Grounded in BRRI Adhunik Dhaner Chash (2020) and DAE BAMIS Agro-Meteorological Calendars.
// Pure, deterministic function: evaluates disease diagnosis, growth stage, season, and weather.

export const STAGE_VULNERABILITY = {
  blast: { seedling: 0.65, tillering: 0.75, booting_flowering: 0.95, ripening: 0.30 },
  sheath_blight: { seedling: 0.20, tillering: 0.85, booting_flowering: 0.90, ripening: 0.40 },
  brown_spot: { seedling: 0.50, tillering: 0.60, booting_flowering: 0.70, ripening: 0.80 },
  tungro: { seedling: 0.95, tillering: 0.85, booting_flowering: 0.40, ripening: 0.15 },
  leaf_smut: { seedling: 0.15, tillering: 0.25, booting_flowering: 0.40, ripening: 0.45 },
  other_rice: { seedling: 0.40, tillering: 0.60, booting_flowering: 0.75, ripening: 0.40 },
  healthy: { seedling: 0.10, tillering: 0.10, booting_flowering: 0.10, ripening: 0.10 },
  not_sure: { seedling: null, tillering: null, booting_flowering: null, ripening: null }
};

export const CROP_SEASONS = {
  BORO: 'boro',
  AUS: 'aus',
  AMAN: 'aman'
};

/**
 * Resolves current crop season and estimated growth stage from calendar date.
 */
export function resolveCalendarContext(date = new Date()) {
  const month = date.getMonth() + 1; // 1 - 12
  const day = date.getDate();

  // Aman: July to Dec
  if (month >= 7 && month <= 10) {
    return { season: CROP_SEASONS.AMAN, stage: 'tillering' };
  }
  if (month === 11 || month === 12 || (month === 1 && day <= 15)) {
    return { season: CROP_SEASONS.AMAN, stage: 'ripening' };
  }
  // Boro: Jan 16 to May
  if ((month === 1 && day > 15) || (month >= 2 && month <= 5)) {
    const stage = month <= 2 ? 'tillering' : month <= 4 ? 'booting_flowering' : 'ripening';
    return { season: CROP_SEASONS.BORO, stage };
  }
  // Aus: June
  return { season: CROP_SEASONS.AUS, stage: 'tillering' };
}

/**
 * Continuous microclimate evaluation for Blast (DAE BAMIS Faridpur 5102.pdf).
 */
export function evaluateBlastMicroclimate(weather) {
  if (!weather || weather.temperature == null) return { score: 0.4, confidence: 'low', factors: [] };

  const temp = Math.max(-10, Math.min(55, Number(weather.temperature) || 0));
  const rh = Math.max(0, Math.min(100, Number(weather.relativeHumidity) || 75));
  const diurnal = Math.max(0, Number(weather.diurnalRange) || 8);
  const factors = [];

  // Extreme heat cutoff: spores denature at extreme heat (>38°C)
  if (temp > 38) {
    factors.push({
      factorId: 'weather_temperature',
      category: 'weather',
      labelBn: 'অতিরিক্ত তাপমাত্রা',
      labelEn: 'Extreme High Temperature',
      evidenceBn: `অতিরিক্ত তাপমাত্রা (${Math.round(temp)}°সে) ছত্রাকের স্পোরের বিস্তার কমিয়ে দেয়।`,
      evidenceEn: `Extreme temperature (${Math.round(temp)}°C) suppresses fungal sporulation.`,
      impactDirection: 'decreases_risk',
      weightNormalized: 0.40
    });
    return { score: 0.15, confidence: 'high', factors };
  }

  // Gaussian night/day temp affinity (optimal ~22°C mean, 18-20°C night, 26-28°C day)
  const tempAffinity = Math.exp(-Math.pow(temp - 22, 2) / (2 * Math.pow(4.5, 2)));
  if (temp >= 16 && temp <= 28) {
    factors.push({
      factorId: 'weather_temperature',
      category: 'weather',
      labelBn: 'তাপমাত্রা পরিস্থিতি',
      labelEn: 'Temperature Profile',
      evidenceBn: `তাপমাত্রা (${Math.round(temp)}°সে) ছত্রাকের বৃদ্ধির অনুকূলে।`,
      evidenceEn: `Temperature (${Math.round(temp)}°C) falls within the fungal germination window.`,
      impactDirection: 'increases_risk',
      weightNormalized: 0.35
    });
  }

  // Sigmoid humidity affinity: steep rise above 85%
  const rhAffinity = 1 / (1 + Math.exp(-0.25 * (rh - 88)));
  if (rh >= 85) {
    factors.push({
      factorId: 'weather_humidity',
      category: 'weather',
      labelBn: 'উচ্চ আপেক্ষিক আর্দ্রতা',
      labelEn: 'High Relative Humidity',
      evidenceBn: `বাতাসের আর্দ্রতা (${Math.round(rh)}%) ব্লাস্ট স্পোরের বিস্তার ত্বরান্বিত করে।`,
      evidenceEn: `Relative humidity (${Math.round(rh)}%) provides prolonged leaf wetness.`,
      impactDirection: 'increases_risk',
      weightNormalized: 0.40
    });
  }

  const score = (tempAffinity * 0.45) + (rhAffinity * 0.45) + (diurnal >= 10 ? 0.10 : 0.0);
  return { score: Math.min(1.0, score), confidence: 'high', factors };
}

/**
 * Continuous microclimate evaluation for Sheath Blight (DAE BAMIS Sylhet 5108.pdf).
 */
export function evaluateSheathBlightMicroclimate(weather) {
  if (!weather || weather.temperature == null) return { score: 0.4, confidence: 'low', factors: [] };

  const temp = Math.max(-10, Math.min(55, Number(weather.temperature) || 0));
  const rh = Math.max(0, Math.min(100, Number(weather.relativeHumidity) || 75));
  const factors = [];

  const tempAffinity = (temp >= 28 && temp <= 32) ? 1.0 : (temp >= 25 && temp <= 35) ? 0.6 : 0.2;
  const rhAffinity = rh >= 80 ? 1.0 : rh >= 70 ? 0.5 : 0.2;

  if (tempAffinity >= 0.6) {
    factors.push({
      factorId: 'weather_temperature',
      category: 'weather',
      labelBn: 'উষ্ণ আবহাওয়া',
      labelEn: 'Warm Temperature',
      evidenceBn: `তাপমাত্রা (${Math.round(temp)}°সে) খোল পোড়া রোগের অনুকূল (২৮-৩২°সে)।`,
      evidenceEn: `Temperature (${Math.round(temp)}°C) aligns with sheath blight progression (28-32°C).`,
      impactDirection: 'increases_risk',
      weightNormalized: 0.35
    });
  }

  if (rhAffinity >= 0.6) {
    factors.push({
      factorId: 'weather_humidity',
      category: 'weather',
      labelBn: 'আর্দ্র পরিবেশ',
      labelEn: 'Moist Canopy Environment',
      evidenceBn: `বাতাসের আর্দ্রতা (${Math.round(rh)}%) গাছের গোড়ায় স্যাঁতসেঁতে ভাব তৈরি করে।`,
      evidenceEn: `Canopy humidity (${Math.round(rh)}%) sustains microclimate at plant base.`,
      impactDirection: 'increases_risk',
      weightNormalized: 0.40
    });
  }

  const score = (tempAffinity * 0.5) + (rhAffinity * 0.5);
  return { score, confidence: 'high', factors };
}

/**
 * Main Explainable Context-Aware Evaluation Function.
 * Evaluates diseaseClass, weather, growthStage, cropSeason.
 */
export function evaluateRiskContext(params) {
  const {
    diseaseClass,
    weather = null,
    cropSeason = null,
    growthStage = null,
    referenceDate = new Date()
  } = params || {};

  const calendar = resolveCalendarContext(referenceDate);
  const resolvedSeason = cropSeason || calendar.season;
  const resolvedStage = growthStage || calendar.stage;
  const isStageEstimated = !growthStage;

  // Citations repository
  const citations = [
    {
      sourceName: 'BRRI Adhunik Dhaner Chash (23rd Ed. 2020)',
      sourceType: 'BRRI_RESEARCH',
      referenceText: 'ধানের রোগবালাই ব্যবস্থাপনা ও জলবায়ু প্রভাব নির্দেশিকা।',
      documentUrl: 'https://brri.portal.gov.bd'
    },
    {
      sourceName: 'DAE BAMIS Agro-Meteorological Advisory Calendars',
      sourceType: 'DAE_BAMIS',
      referenceText: 'ফরিদপুর ও সিলেট জেলার বোরো ও আমন ধান রোগবালাই অনুকূল আবহাওয়া চার্ট।',
      documentUrl: 'https://bamis.gov.bd/res/public/calendars/2019/08/23/5102.pdf'
    }
  ];

  // 1. Edge Case: NOT SURE / UNRESOLVED
  if (!diseaseClass || diseaseClass === 'not_sure') {
    return {
      riskLevel: 'uncertain',
      confidence: { band: 'low', numericScore: 0.20, isDegraded: true },
      qualitativeImpactBn: 'রোগের ধরন নির্দিষ্ট করা যায়নি। পাতাটি পুনরায় পরিষ্কার আলোতে পরীক্ষা না করা পর্যন্ত ঝুঁকির মাত্রা নিশ্চিতভাবে নির্ধারণ করা সম্ভব নয়।',
      qualitativeImpactEn: 'Diagnosis inconclusive. Risk severity cannot be reliably calculated until a clearer image of the affected leaf is examined.',
      evaluatedContext: {
        diseaseClass: 'not_sure',
        cropSeason: resolvedSeason,
        growthStage: resolvedStage,
        isStageEstimated
      },
      contributingFactors: [],
      immediateActions: [
        {
          priority: 1,
          actionType: 'inspection',
          titleBn: 'দিনের পরিষ্কার আলোতে আরেকটি ছবি তুলুন',
          titleEn: 'Retake photo in natural daylight',
          descriptionBn: 'সরাসরি আক্রান্ত পাতার খুব কাছ থেকে পরিষ্কার আলোতে ছবি তুলুন যেন পাতার দাগ স্পষ্টভাবে বোঝা যায়।',
          descriptionEn: 'Take a focused, close-up photo of only the damaged leaf area under daylight.',
          urgencyDays: 1
        },
        {
          priority: 2,
          actionType: 'helpline',
          titleBn: 'কৃষি কল সেন্টার ১৬১২৩ নম্বরে কল করুন',
          titleEn: 'Call Krishi Call Centre 16123',
          descriptionBn: 'লক্ষণ স্পষ্ট না হলে কৃষি বিশেষজ্ঞের সাথে বিনামূল্যে সরাসরি কথা বলুন।',
          descriptionEn: 'Speak directly to an agricultural extension specialist free of charge.',
          urgencyDays: 2
        }
      ],
      uncertaintyExplanationBn: 'মডেল পাতার ছবিতে কোনো পরিচিত রোগের পর্যাপ্ত বিশ্বাসযোগ্য প্যাটার্ন শনাক্ত করতে পারেনি। অনুমানের ওপর ভিত্তি করে ভুল পদক্ষেপ এড়ানো হয়েছে।',
      uncertaintyExplanationEn: 'The visual classifier did not detect distinctive disease hallmarks. Risk output is kept uncertain to prevent inappropriate chemical application.',
      citations,
      generatedAt: new Date().toISOString()
    };
  }

  // 2. Edge Case: HEALTHY LEAF
  if (diseaseClass === 'healthy') {
    let envScore = 0.2;
    let factors = [];
    if (weather && weather.temperature != null) {
      const blastEnv = evaluateBlastMicroclimate(weather);
      envScore = blastEnv.score;
      if (blastEnv.score >= 0.75) {
        factors = blastEnv.factors;
      }
    }

    const isHighEnvPressure = envScore >= 0.75;

    return {
      riskLevel: isHighEnvPressure ? 'medium' : 'low',
      confidence: { band: 'high', numericScore: 0.88, isDegraded: !weather },
      qualitativeImpactBn: isHighEnvPressure
        ? 'বর্তমানে পরীক্ষা করা পাতাটি সুস্থ রয়েছে। তবে আশেপাশের আবহাওয়া ব্লাস্ট ও অন্যান্য ছত্রাক সংক্রমণের অনুকূলে থাকায় আগাম সতর্কতা অবলম্বন করুন।'
        : 'পাতাটি সম্পূর্ণ সুস্থ দেখাচ্ছে এবং তাৎক্ষণিক ফসলের ঝুঁকির লক্ষণ নেই। নিয়মিত স্বাভাবিক পরিচর্যা চালিয়ে যান।',
      qualitativeImpactEn: isHighEnvPressure
        ? 'The sampled leaf is healthy. However, prevailing humid microclimate creates regional disease pressure; maintain preventive scouting.'
        : 'The plant appears healthy with no imminent yield risk detected. Maintain standard agronomic monitoring.',
      evaluatedContext: {
        diseaseClass: 'healthy',
        cropSeason: resolvedSeason,
        growthStage: resolvedStage,
        isStageEstimated
      },
      contributingFactors: factors,
      immediateActions: [
        {
          priority: 1,
          actionType: 'inspection',
          titleBn: 'সপ্তাহে অন্তত দুই দিন ক্ষেত ঘুরে পাতা পরীক্ষা করুন',
          titleEn: 'Regular bi-weekly field monitoring',
          descriptionBn: 'ক্ষেতের বিভিন্ন অংশের পাতা ও গোড়ার খোলে কোনো নতুন দাগ দেখা দেয় কিনা লক্ষ্য রাখুন।',
          descriptionEn: 'Walk through different field sections to detect any early focal spots on lower sheaths or leaves.',
          urgencyDays: 4
        },
        {
          priority: 2,
          actionType: 'sanitation',
          titleBn: 'ক্ষেত ও আইল আগাছামুক্ত রাখুন',
          titleEn: 'Keep field bunds weed-free',
          descriptionBn: 'আগাছা পোকা ও রোগের বিকল্প আশ্রয়দাতা হিসেবে কাজ করে। পরিষ্কার আইল রোগ বিস্তার কমায়।',
          descriptionEn: 'Weeds host pathogen vectors and alternative hosts; clean bunds reduce invasion risk.',
          urgencyDays: 7
        }
      ],
      uncertaintyExplanationBn: weather ? null : 'আবহাওয়ার লাইভ তথ্য না থাকায় আঞ্চলিক জলবায়ু ঝুঁকি হিসাব করা যায়নি; শুধুমাত্র পাতার সুস্থতার ওপর মূল্যায়ন করা হয়েছে।',
      uncertaintyExplanationEn: weather ? null : 'Real-time weather telemetry was unavailable; risk is based exclusively on visual leaf health.',
      citations,
      generatedAt: new Date().toISOString()
    };
  }

  // 3. Known Pathogen Disease Classes
  const stageMap = STAGE_VULNERABILITY[diseaseClass] || STAGE_VULNERABILITY.blast;
  const stageVulnerability = stageMap[resolvedStage] ?? 0.60;

  let microclimateResult = { score: 0.5, confidence: 'medium', factors: [] };
  const hasWeather = weather && weather.temperature != null;

  if (diseaseClass === 'blast') {
    microclimateResult = evaluateBlastMicroclimate(weather);
  } else if (diseaseClass === 'sheath_blight') {
    microclimateResult = evaluateSheathBlightMicroclimate(weather);
  } else {
    // Generic baseline for brown_spot, tungro, leaf_smut, other_rice
    microclimateResult = {
      score: 0.5,
      confidence: hasWeather ? 'high' : 'low',
      factors: []
    };
  }

  // Trajectory multiplier from 3-day forecast
  let trajectoryMult = 1.0;
  if (Array.isArray(weather?.forecast3d) && weather.forecast3d.length >= 3) {
    const favorableDays = weather.forecast3d.filter(d => d.isFavorable).length;
    if (favorableDays >= 2) trajectoryMult = 1.15;
    else if (favorableDays === 0) trajectoryMult = 0.85;
  }

  // Multi-factor aggregation
  const weatherWeight = hasWeather ? 0.40 : 0.15;
  const stageWeight = hasWeather ? 0.45 : 0.70;
  const seasonalWeight = 0.15;

  // Composite raw risk
  const rawScore = ((stageVulnerability * stageWeight) + (microclimateResult.score * weatherWeight) + (0.6 * seasonalWeight)) * trajectoryMult;
  // If extreme heat or suppressive microclimate, suppress the score
  const effectiveScore = microclimateResult.score <= 0.2 ? rawScore * 0.6 : rawScore;
  const normalizedScore = Math.min(1.0, Math.max(0.0, effectiveScore));

  let riskLevel = 'medium';
  if (normalizedScore >= 0.68) riskLevel = 'high';
  else if (normalizedScore < 0.38) riskLevel = 'low';

  // Construct factor attributions
  const factors = [...microclimateResult.factors];
  factors.unshift({
    factorId: 'stage_vulnerability',
    category: 'crop_stage',
    labelBn: 'ফসলের বৃদ্ধি পর্যায় ও সংবেদনশীলতা',
    labelEn: 'Crop Growth Stage Vulnerability',
    evidenceBn: `ফসল বর্তমানে ${resolvedStage === 'booting_flowering' ? 'থোড় ও ফুল ফোটার' : resolvedStage === 'tillering' ? 'কুশি গজানোর' : 'বৃদ্ধি'} পর্যায়ে আছে, যা এ রোগের সংবেদনশীল ধাপ।`,
    evidenceEn: `Plant is at the ${resolvedStage.replace('_', ' ')} stage, which carries ${stageVulnerability >= 0.8 ? 'critical' : 'moderate'} biological susceptibility.`,
    impactDirection: stageVulnerability >= 0.7 ? 'increases_risk' : 'neutral',
    weightNormalized: stageWeight
  });

  // Construct grounded qualitative impacts without fake percentages
  let qualitativeImpactBn = '';
  let qualitativeImpactEn = '';

  if (diseaseClass === 'blast') {
    if (resolvedStage === 'booting_flowering' && riskLevel === 'high') {
      qualitativeImpactBn = 'উচ্চ ঝুঁকি — ধান বর্তমানে শিষ বের হওয়ার সংবেদনশীল পর্যায়ে রয়েছে। বর্তমান স্যাঁতসেঁতে আবহাওয়ায় নেক ব্লাস্ট বা শিষ ব্লাস্ট দ্রুত ছড়িয়ে দানায় চিটা দেখা দিতে পারে। এখনই জমিতে পানি রাখা ও ইউরিয়া বন্ধ রাখা জরুরি।';
      qualitativeImpactEn = 'High Risk — Rice is in the critical panicle emergence window. Current humid weather encourages neck blast, leading to severe grain sterility (chita) if unmanaged.';
    } else {
      qualitativeImpactBn = 'মাঝারি ঝুঁকি — পাতার ব্লাস্ট দাগ দেখা যাচ্ছে। পাতা ক্ষতিগ্রস্ত হলে গাছের খাদ্য তৈরি ব্যাহত হতে পারে। দ্রুত ইউরিয়ার অতিরিক্ত প্রয়োগ বন্ধ করুন।';
      qualitativeImpactEn = 'Moderate Risk — Foliar blast lesions observed. Photosynthetic area is threatened. Restrict nitrogen top-dressing to prevent vertical spread.';
    }
  } else if (diseaseClass === 'sheath_blight') {
    qualitativeImpactBn = 'খোল পোড়া রোগের লক্ষণ পানির কাছাকাছি গোড়ায় শুরু হয়ে উপরের খোলে ছড়াতে পারে। অতিরিক্ত ইউরিয়া দিলে এবং জমিতে দীর্ঘক্ষণ অতিরিক্ত পানি জমে থাকলে রোগ দ্রুত বাড়ে।';
    qualitativeImpactEn = 'Sheath blight symptoms initiate near water line and advance upward. Dense tillering and stagnant water exacerbate sheath rotting.';
  } else if (diseaseClass === 'tungro') {
    qualitativeImpactBn = 'টুংরো ভাইরাসজনিত রোগ। সবুজ পাতাফড়িং পোকা এই রোগ এক গাছ থেকে অন্য গাছে ছড়ায়। আক্রান্ত গাছ তুলে মাটিতে পুঁতে ফেলুন এবং পোকা নিয়ন্ত্রণে মনোযোগ দিন।';
    qualitativeImpactEn = 'Tungro is viral and insect-vectored by green leafhoppers. Rogue infected hills to eliminate infection reservoirs and monitor leafhopper vectors.';
  } else if (diseaseClass === 'brown_spot') {
    qualitativeImpactBn = 'বাদামী দাগ সাধারণত মাটিতে পটাশ বা পুষ্টির ঘাটতি থাকলে এবং অনিয়মিত সেচের কারণে বাড়ে। পরিমিত সুষম সার ও সেচ ব্যবস্থাপনা নিশ্চিত করুন।';
    qualitativeImpactEn = 'Brown spot is aggravated by potassium deficiency and soil drought stress. Prioritize balanced fertilizer top-dressing.';
  } else if (diseaseClass === 'leaf_smut') {
    qualitativeImpactBn = 'পাতার স্মাট রোগ সাধারণত ধানের ফলনে বড় ক্ষতি করে না। তবে গাছের পাতা দুর্বল হওয়া ঠেকাতে অতিরিক্ত ইউরিয়া পরিহার করুন।';
    qualitativeImpactEn = 'Leaf smut is generally a minor foliar condition. Avoid excessive nitrogen to maintain leaf vigor.';
  } else {
    qualitativeImpactBn = 'ধানের পাতার লক্ষণ নিবিড় পর্যবেক্ষণ প্রয়োজন। নিয়মিত ক্ষেত পরিদর্শন করুন এবং সুষম সার ও সেচ ব্যবস্থাপনা বজায় রাখুন।';
    qualitativeImpactEn = 'Rice leaf symptoms require close monitoring. Maintain balanced fertilization and scheduled field inspection.';
  }

  // Immediate Action Items adhering to non-chemical DAE recommendations
  const immediateActions = [
    {
      priority: 1,
      actionType: 'fertilizer_adjustment',
      titleBn: 'ইউরিয়া সারের উপরিপ্রয়োগ আপাতত বন্ধ রাখুন',
      titleEn: 'Pause urea top-dressing',
      descriptionBn: 'আক্রান্ত অবস্থায় অতিরিক্ত ইউরিয়া দিলে গাছের কোষ নরম হয়ে রোগজীবাণু খুব দ্রুত গোটা ক্ষেতে ছড়িয়ে পড়ে।',
      descriptionEn: 'Excessive nitrogen increases plant succulence, facilitating rapid fungal spread across the canopy.',
      urgencyDays: 1
    },
    {
      priority: 2,
      actionType: 'inspection',
      titleBn: '২-৩ দিন পর পর ক্ষেতের ভেতরের পাতা ও গোড়া পরীক্ষা করুন',
      titleEn: 'Field scouting every 2-3 days',
      descriptionBn: 'দাগ উপরের পাতায় বা শীষে ছড়াচ্ছে কিনা লক্ষ্য রাখুন। আক্রান্ত খড়কুটা বা আগাছা থাকলে সরিয়ে ফেলুন।',
      descriptionEn: 'Monitor whether lesions are climbing to upper flag leaves or emerging panicles. Remove rogue diseased stubble.',
      urgencyDays: 3
    },
    {
      priority: 3,
      actionType: 'helpline',
      titleBn: 'উপজেলা কৃষি অফিসার বা ১৬১২৩ নম্বরে পরামর্শ নিন',
      titleEn: 'Consult Upazila Agriculture Officer or call 16123',
      descriptionBn: 'কোনো বালাইনাশক স্প্রে করার আগে অনুমোদিত ডোজ ও সঠিক সময় জানতে সরকারি কৃষি কর্মকর্তা বা ১৬১২৩ নম্বরে পরামর্শ নিন।',
      descriptionEn: 'Always confirm registered chemical choices and dilution rates directly with government extension agents or call 16123.',
      urgencyDays: 3
    }
  ];

  return {
    riskLevel,
    confidence: {
      band: hasWeather ? 'high' : 'medium',
      numericScore: hasWeather ? 0.86 : 0.62,
      isDegraded: !hasWeather
    },
    qualitativeImpactBn,
    qualitativeImpactEn,
    evaluatedContext: {
      diseaseClass,
      cropSeason: resolvedSeason,
      growthStage: resolvedStage,
      isStageEstimated
    },
    contributingFactors: factors,
    immediateActions,
    uncertaintyExplanationBn: hasWeather ? null : 'আবহাওয়া তথ্য অফলাইনে থাকার কারণে সাধারণ জাত ও মৌসুমের গড় অনুমানে ঝুঁকি হিসাব করা হয়েছে।',
    uncertaintyExplanationEn: hasWeather ? null : 'Live meteorological inputs were unavailable; assessment is running in degraded mode based on phenological baselines.',
    citations,
    generatedAt: new Date().toISOString()
  };
}
