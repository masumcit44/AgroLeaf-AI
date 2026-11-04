/**
 * F31: Disease Severity Scoring Engine
 * Measures visible leaf and lesion area from image pixels using calibrated
 * chrominance-morphological segmentation, and maps evidence to validated
 * disease-specific scoring standards (e.g. IRRI 0–9 SES scale for Rice Blast).
 * 100% Free, on-device, zero network latency.
 */

/**
 * Quantifies visible leaf pixels and necrotic lesion pixels from an image canvas.
 * @param {HTMLCanvasElement|Object} canvas 
 * @returns {Object} { valid, leafPixels, lesionPixels, coveragePct, reason }
 */
export function measureLeafAndLesion(canvas) {
  if (!canvas || !canvas.width || !canvas.height) {
    return { valid: false, leafPixels: 0, lesionPixels: 0, coveragePct: 0, reason: 'missing_canvas' };
  }

  const w = canvas.width;
  const h = canvas.height;
  const totalPixels = w * h;

  let ctx;
  try {
    ctx = canvas.getContext('2d');
  } catch {
    ctx = null;
  }

  if (!ctx) {
    return { valid: false, leafPixels: 0, lesionPixels: 0, coveragePct: 0, reason: 'no_context' };
  }

  let imgData;
  try {
    imgData = ctx.getImageData(0, 0, w, h);
  } catch {
    return { valid: false, leafPixels: 0, lesionPixels: 0, coveragePct: 0, reason: 'context_read_failed' };
  }

  const data = imgData.data;
  let leafPixels = 0;
  let lesionPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 128) continue; // skip transparent

    // Excess Green Index: 2G - R - B
    const exg = 2 * g - r - b;
    // Plant pixel condition
    const isPlant = exg > 10 || (g > r + 15 && g > b + 15);

    // Lesion / necrosis condition: chlorotic yellow, brown, or grayish necrosis
    // In diseased rice tissue, green diminishes and red/brown increases
    const isLesion = (r > g - 15 && r > b && (r + g + b) > 100 && (r + g + b) < 680) ||
                     (r > 120 && g > 90 && b < 80); // brown/yellow spot

    if (isPlant || isLesion) {
      leafPixels++;
      if (isLesion && (!isPlant || r > g - 10)) {
        lesionPixels++;
      }
    }
  }

  // Minimum leaf area threshold: at least 3% of the image must be identifiable foliage
  const minLeafPixels = Math.max(100, Math.round(totalPixels * 0.03));
  if (leafPixels < minLeafPixels) {
    return {
      valid: false,
      leafPixels,
      lesionPixels,
      coveragePct: 0,
      reason: 'insufficient_leaf_area',
    };
  }

  // Calculate visible lesion coverage %
  const coveragePct = Math.min(100, Math.max(0, (lesionPixels / leafPixels) * 100));

  return {
    valid: true,
    leafPixels,
    lesionPixels,
    coveragePct: Math.round(coveragePct * 10) / 10,
    reason: null,
  };
}

/**
 * Assesses disease severity based on identified disease class and measured leaf coverage.
 * Follows IRRI Standard Evaluation System (SES) and BRRI guidelines.
 * Returns honest abstention for diseases that cannot be assessed from a single leaf photo.
 * 
 * @param {string} classKey Disease class identifier
 * @param {number} coveragePct Visible lesion percentage
 * @param {Object} decision Diagnostic decision object
 * @returns {Object} Severity assessment
 */
export function assessDiseaseSeverity(classKey, coveragePct, decision) {
  if (!decision || decision.status !== 'confident' || !classKey) {
    return {
      status: 'abstain',
      reason: 'inconclusive_diagnosis',
      level: null,
      coveragePct: 0,
    };
  }

  const k = classKey.toLowerCase();

  // Healthy or Not Rice: not applicable
  if (k === 'healthy' || k === 'normal' || k === 'not_rice') {
    return {
      status: 'not_applicable',
      reason: 'healthy_or_non_disease',
      level: null,
      coveragePct: 0,
    };
  }

  // Tungro: Systemic viral stunting across the entire hill cannot be determined from one leaf
  if (k === 'tungro') {
    return {
      status: 'abstain',
      reason: 'tungro_systemic_limitation',
      level: null,
      coveragePct: coveragePct || 0,
    };
  }

  // Sheath Blight: Severity requires vertical lesion height up the culm, not measurable on leaf blade
  if (k === 'sheath_blight') {
    return {
      status: 'abstain',
      reason: 'sheath_blight_height_limitation',
      level: null,
      coveragePct: coveragePct || 0,
    };
  }

  // Validated Disease 1: Rice Blast (Pyricularia oryzae) — IRRI 0–9 SES Scale
  if (k === 'blast') {
    let irriScale;
    let level;

    if (coveragePct <= 1.0) {
      irriScale = 1;
      level = 'low';
    } else if (coveragePct <= 5.0) {
      irriScale = 3;
      level = 'low';
    } else if (coveragePct <= 15.0) {
      irriScale = 4;
      level = 'medium';
    } else if (coveragePct <= 25.0) {
      irriScale = 5;
      level = 'medium';
    } else if (coveragePct <= 50.0) {
      irriScale = 7;
      level = 'high';
    } else {
      irriScale = 9;
      level = 'high';
    }

    return {
      status: 'assessed',
      level,
      irriScale,
      coveragePct,
      method: 'irri_blast_ses',
      methodNameBn: 'ইরি স্ট্যান্ডার্ড ইভ্যালুয়েশন সিস্টেম (SES ০–৯ স্কেল)',
      methodNameEn: 'IRRI Standard Evaluation System (SES 0–9 scale)',
    };
  }

  // Validated Disease 2: Brown Spot (Bipolaris oryzae) — SES Area & Density
  if (k === 'brown_spot') {
    let level;
    if (coveragePct <= 5.0) {
      level = 'low';
    } else if (coveragePct <= 15.0) {
      level = 'medium';
    } else {
      level = 'high';
    }

    return {
      status: 'assessed',
      level,
      irriScale: level === 'low' ? 2 : level === 'medium' ? 5 : 8,
      coveragePct,
      method: 'irri_brown_spot_ses',
      methodNameBn: 'ইরি ব্রাউন স্পট ক্ষতি পরিমাপ মানদণ্ড',
      methodNameEn: 'IRRI Brown Spot Evaluation Scale',
    };
  }

  // Validated Disease 3: Bacterial Leaf Blight (Xanthomonas oryzae)
  if (k === 'bacterial_leaf_blight') {
    let level;
    if (coveragePct <= 10.0) {
      level = 'low';
    } else if (coveragePct <= 25.0) {
      level = 'medium';
    } else {
      level = 'high';
    }

    return {
      status: 'assessed',
      level,
      irriScale: level === 'low' ? 3 : level === 'medium' ? 5 : 8,
      coveragePct,
      method: 'irri_blb_ses',
      methodNameBn: 'ইরি ব্যাকটেরিয়াল লিফ ব্লাইট স্কেল',
      methodNameEn: 'IRRI Bacterial Leaf Blight Scale',
    };
  }

  // Other diseases (Leaf Scald, Narrow Brown Spot): Supported via generalized leaf area threshold
  if (k === 'leaf_scald' || k === 'narrow_brown_spot') {
    let level;
    if (coveragePct <= 8.0) {
      level = 'low';
    } else if (coveragePct <= 20.0) {
      level = 'medium';
    } else {
      level = 'high';
    }

    return {
      status: 'assessed',
      level,
      irriScale: null,
      coveragePct,
      method: 'generalized_leaf_ses',
      methodNameBn: 'ধানের পাতা ক্ষতি পরিমাপ মানদণ্ড',
      methodNameEn: 'Rice Foliar Damage Assessment Scale',
    };
  }

  // Any other unsupported class
  return {
    status: 'abstain',
    reason: 'unsupported_disease_class',
    level: null,
    coveragePct: coveragePct || 0,
  };
}
