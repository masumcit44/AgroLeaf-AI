/**
 * Temperature-scaled Softmax over raw logits array.
 * Pure function.
 *
 * @param {number[]|Float32Array} logits
 * @param {number} [temperature=1.0]
 * @returns {number[]}
 */
export function softmax(logits, temperature = 1.0) {
  const T = Math.max(0.01, temperature || 1.0);
  let maxLogit = -Infinity;

  for (let i = 0; i < logits.length; i++) {
    const val = logits[i] / T;
    if (val > maxLogit) maxLogit = val;
  }

  let sumExp = 0;
  const exps = new Array(logits.length);
  for (let i = 0; i < logits.length; i++) {
    const e = Math.exp(logits[i] / T - maxLogit);
    exps[i] = e;
    sumExp += e;
  }

  const probs = new Array(logits.length);
  for (let i = 0; i < logits.length; i++) {
    probs[i] = exps[i] / sumExp;
  }

  return probs;
}

/** Model outputs that mean "do not name a disease" (model v3 and later). */
export const REJECT_KEYS = ['not_rice', 'other_rice'];

/**
 * Apply calibrated threshold abstention rule with weak-class suppression.
 * Pure function.
 *
 * @param {Record<string, number>} probs - map of class_key -> probability
 * @param {number} [threshold=0.60] - calibrated decision threshold
 * @param {string[]} [suppress=[]] - optional array of weak class keys to suppress to not_sure
 * @param {{
 *   leafFraction?: number,
 *   leafMinFraction?: number,
 *   healthyThreshold?: number
 * }} [safety={}] - safety gate (calibration.json): images with too few
 *   plant-coloured pixels are not leaves; "healthy" needs its own, higher
 *   threshold because telling a farmer to do nothing is the costliest error.
 * @returns {{
 *   status: 'confident'|'not_sure',
 *   top: { key: string, prob: number } | null,
 *   top2: Array<{ key: string, prob: number }>,
 *   suppressed?: boolean,
 *   reason?: 'not_leaf'|'other_problem'|'low_confidence'|'healthy_needs_high_confidence'|'suppressed'
 * }}
 */
export function decide(probs, threshold = 0.60, suppress = [], safety = {}) {
  const entries = Object.entries(probs || {});
  if (entries.length === 0) {
    return {
      status: 'not_sure',
      top: null,
      top2: [],
    };
  }

  // Check for NaN or invalid probabilities
  for (const [, p] of entries) {
    if (isNaN(p) || p === null || p === undefined) {
      return {
        status: 'not_sure',
        top: null,
        top2: [],
      };
    }
  }

  // Sort descending by probability
  entries.sort((a, b) => b[1] - a[1]);

  const top1 = { key: entries[0][0], prob: entries[0][1] };
  // "Possible" candidates are diseases with a knowledge card, never the
  // model's reject outputs (v3: not_rice, other_rice)
  const top2 = entries
    .filter(([k]) => !REJECT_KEYS.includes(k))
    .slice(0, 2)
    .map(([k, p]) => ({ key: k, prob: p }));

  // Model v3 reject outputs: a photo the model itself calls "not a rice leaf",
  // or a rice problem the app does not cover (bacterial blight, hispa, ...)
  if (top1.key === 'not_rice') {
    return { status: 'not_sure', top: null, top2: [], reason: 'not_leaf' };
  }
  if (top1.key === 'other_rice') {
    return { status: 'not_sure', top: null, top2: [], reason: 'other_problem' };
  }

  // Safety gate 1: not a leaf photo. Candidates are hidden (top2 empty),
  // because "possibly blast" for a photo of a wall would be meaningless.
  const { leafFraction, leafMinFraction, healthyThreshold } = safety || {};
  if (
    typeof leafFraction === 'number' &&
    typeof leafMinFraction === 'number' &&
    leafFraction < leafMinFraction
  ) {
    return {
      status: 'not_sure',
      top: null,
      top2: [],
      reason: 'not_leaf',
    };
  }

  // Check for exact tie between top-2
  if (top2.length >= 2 && Math.abs(top2[0].prob - top2[1].prob) < 1e-6) {
    return {
      status: 'not_sure',
      top: top1,
      top2,
    };
  }

  // Weak-class suppression (M07 step 7 / X3):
  // If top-1 is in the suppression list, force abstention to 'not_sure',
  // while preserving the class in top2 so it remains visible as "possible".
  const isSuppressed = Array.isArray(suppress) && suppress.includes(top1.key);
  if (isSuppressed) {
    return {
      status: 'not_sure',
      top: top1,
      top2,
      suppressed: true,
      reason: 'suppressed',
    };
  }

  // Safety gate 2: "healthy" must clear its own, stricter threshold.
  if (top1.key === 'healthy' && typeof healthyThreshold === 'number' && top1.prob < healthyThreshold) {
    return {
      status: 'not_sure',
      top: top1,
      top2,
      reason: 'healthy_needs_high_confidence',
    };
  }

  const isConfident = top1.prob >= threshold;

  return {
    status: isConfident ? 'confident' : 'not_sure',
    top: top1,
    top2,
    ...(isConfident ? {} : { reason: 'low_confidence' }),
  };
}
