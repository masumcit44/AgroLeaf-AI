// F10 Rule-based action plan: pure function to build plan steps from disease knowledge.
export function buildPlan(decision, knowledge, weatherRisk, lang) {
  const classes = knowledge?.classes || {};
  const langSuffix = lang === 'bn' ? 'bn' : 'en';

  // Handle null/undefined decision
  if (!decision) {
    return [];
  }

  // Get disease key and class data
  const classKey = decision?.top?.key;
  const classData = classKey ? classes[classKey] : null;
  const isConfident = decision?.status === 'confident' && classKey;
  const isHealthy = classKey === 'healthy';
  const isNotSure = !isConfident || classKey === 'not_sure';

  // Helper to get field in correct language
  const getField = (obj, base) => {
    const key = `${base}_${langSuffix}`;
    return obj?.[key] || obj?.[base] || '';
  };

  const steps = [];

  // Not-sure: only 16123 step
  if (isNotSure) {
    steps.push({
      text: lang === 'bn'
        ? 'উপজেলা কৃষি অফিসার বা ১৬১২৩ নম্বরে কল করুন।'
        : 'Ask your Upazila agriculture officer or call 16123.',
      source: 'App default',
    });
    return steps;
  }

  // Healthy: prevention steps only
  if (isHealthy) {
    const prevention = getField(classData, 'prevention');
    if (Array.isArray(prevention)) {
      for (const item of prevention) {
        steps.push({
          text: item,
          source: 'Disease knowledge (prevention)',
        });
      }
    }
    // Add 16123 as final step
    steps.push({
      text: lang === 'bn'
        ? 'সামান্য পরামর্শের জন্য উপজেলা কৃষি অফিসার বা ১৬১২৩ নম্বরে কল করুন।'
        : 'For general advice, ask your Upazila agriculture officer or call 16123.',
      source: 'App default',
    });
    return steps;
  }

  // Confident disease: what_to_do_now + prevention + (chemical -> 16123) + weather risk
  const whatToDo = getField(classData, 'what_to_do_now');
  if (whatToDo) {
    steps.push({
      text: whatToDo,
      source: 'Disease knowledge (what_to_do_now)',
    });
  }

  const prevention = getField(classData, 'prevention');
  if (Array.isArray(prevention)) {
    for (const item of prevention) {
      steps.push({
        text: item,
        source: 'Disease knowledge (prevention)',
      });
    }
  }

  // Official guidance - if it contains chemical info, replace with 16123
  // Check BOTH bn and en text for chemical detection
  const officialGuidance = classData?.official_guidance;
  if (officialGuidance) {
    const textBn = officialGuidance.text_bn_verbatim || '';
    const textEn = officialGuidance.text_en_verbatim || officialGuidance.text_verbatim || '';
    const text = lang === 'bn' ? textBn : (textEn || textBn);
    
    // Check both languages for chemical patterns
    const checkChemical = (t) => /\d+(\.\d+)?\s*(ml|L|লিটার|গ্রাম|g|%|ppm)/i.test(t) ||
                                /নাটিভো|এমিস্টার|থিওভিট|হেক্সাকোনাজোল|টেবুকোনাজোল|ম্যালাথিয়ন|ক্লোরপাইরিফোস|nativo|mistar|theovit|hexaconazole|tebuconazole|malathion|chlorpyrifos/i.test(t);
    
    const hasChemical = checkChemical(textBn) || checkChemical(textEn);
    
    if (hasChemical) {
      steps.push({
        text: lang === 'bn'
          ? 'কোনো রাসায়নিক ওষুধ ব্যবহার করার আগে উপজেলা কৃষি অফিসার বা ১৬১২৩ নম্বরে কল করুন।'
          : 'Ask your Upazila agriculture officer or call 16123 before using any chemical.',
        source: 'Official guidance (chemical step sanitized)',
      });
    } else if (text) {
      steps.push({
        text: text,
        source: officialGuidance.source,
      });
    }
  }

  // Weather risk step
  if (weatherRisk && weatherRisk.length > 0) {
    const matched = weatherRisk.find(w => w.diseaseKey === classKey);
    if (matched) {
      steps.push({
        text: lang === 'bn'
          ? 'আবহাওয়া এই রোগের অনুকূল এই সপ্তাহে — ২-৩ দিন পর আবার খেতে দেখুন।'
          : 'Weather favours this disease this week — check the field again in 2–3 days.',
        source: `Weather: ${matched.source} (${matched.sourceUrl || 'no URL'})`,
      });
    }
  }

  // Ensure 16123 is always present as last step if not already
  const has16123 = steps.some(s => s.text.includes('16123') || s.text.includes('কল করুন') || s.text.includes('call 16123'));
  if (!has16123) {
    steps.push({
      text: lang === 'bn'
        ? 'পরামর্শের জন্য উপজেলা কৃষি অফিসার বা ১৬১২৩ নম্বরে কল করুন।'
        : 'For advice, ask your Upazila agriculture officer or call 16123.',
      source: 'App default',
    });
  }

  // Limit to 6 steps max
  return steps.slice(0, 6);
}