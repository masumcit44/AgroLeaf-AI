/**
 * Pure rules for confidence phrasing and official guidance display safety.
 */

/**
 * Returns human confidence label in words without revealing exact percentages.
 *
 * @param {number} prob - model probability between 0 and 1
 * @param {'bn'|'en'} [lang='bn']
 * @returns {string}
 */
export function getConfidenceLabel(prob, lang = 'bn') {
  const isHigh = typeof prob === 'number' && prob >= 0.90;
  if (lang === 'en') {
    return isHigh ? 'High confidence' : 'Moderate confidence';
  }
  return isHigh ? 'উচ্চ আস্থা' : 'মাঝারি আস্থা';
}

/**
 * Determines whether official guidance text should be rendered.
 * Hides placeholder text (e.g. '[BAMIS lists...').
 *
 * @param {Object|null|undefined} guidance
 * @returns {boolean}
 */
export function shouldShowOfficialGuidance(guidance) {
  if (!guidance || typeof guidance !== 'object') {
    return false;
  }
  const text = guidance.text_bn_verbatim;
  if (!text || typeof text !== 'string') {
    return false;
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return false;
  }
  // If text starts with '[' or contains unverified placeholder bracket notes, do NOT show
  if (trimmed.startsWith('[') || trimmed.includes('[')) {
    return false;
  }
  return true;
}
