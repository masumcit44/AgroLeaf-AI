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

/**
 * Apply calibrated threshold abstention rule.
 * Pure function.
 *
 * @param {Record<string, number>} probs - map of class_key -> probability
 * @param {number} threshold - calibrated decision threshold
 * @returns {{
 *   status: 'confident'|'not_sure',
 *   top: { key: string, prob: number } | null,
 *   top2: Array<{ key: string, prob: number }>
 * }}
 */
export function decide(probs, threshold = 0.60) {
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
  const top2 = entries.slice(0, 2).map(([k, p]) => ({ key: k, prob: p }));

  // Check for exact tie between top-2
  if (top2.length >= 2 && Math.abs(top2[0].prob - top2[1].prob) < 1e-6) {
    return {
      status: 'not_sure',
      top: top1,
      top2,
    };
  }

  const isConfident = top1.prob >= threshold;

  return {
    status: isConfident ? 'confident' : 'not_sure',
    top: top1,
    top2,
  };
}
