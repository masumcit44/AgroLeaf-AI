/**
 * Non-rice gate (roadmap G1): a second model (v4-B, 8 outputs) whose only job
 * here is to say "this is not a rice leaf". The rule has no tunable threshold:
 * the gate rejects when its most likely output is the not_rice class.
 * Measured before release (2 Nov 2026): wrongly rejects 0.6% of raihan and
 * 0% of Gazipur/Savar rice photos; rejects 100% of every non-rice test set.
 * Pure function.
 *
 * @param {ArrayLike<number>} logits - gate model output
 * @param {number} notRiceIndex - index of the not_rice class in the gate's outputs
 * @returns {boolean} true when the image should be treated as "not a rice leaf"
 */
export function gateSaysNotRice(logits, notRiceIndex) {
  if (!logits || logits.length <= notRiceIndex) return false;
  let best = 0;
  for (let i = 1; i < logits.length; i++) {
    if (logits[i] > logits[best]) best = i;
  }
  return best === notRiceIndex;
}
