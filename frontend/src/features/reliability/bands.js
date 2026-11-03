import bandsData from './bands_v10.json';

/**
 * Categorizes a prediction into a measured reliability band.
 *
 * @param {Object} decision - The decision object from ml/decide.js (e.g. { status: 'confident' | 'not_sure' })
 * @param {Object|Array} probs - Object mapping class keys to probabilities or array of entries
 * @returns {Object} Reliability band metadata
 */
export function reliabilityBand(decision, probs) {
  const notSureBand = {
    band: 'not_sure',
    accuracy: bandsData.bands.not_sure.accuracy,
    ciLow: bandsData.bands.not_sure.ci_low,
    ciHigh: bandsData.bands.not_sure.ci_high,
    n: bandsData.bands.not_sure.n,
    percentage: Math.round(bandsData.bands.not_sure.accuracy * 100),
    condition: bandsData.bands.not_sure.condition,
    topProb: 0,
  };

  if (!decision || decision.status !== 'confident' || !probs) {
    return notSureBand;
  }

  // Find top probability
  let topProb = 0;
  if (Array.isArray(probs)) {
    for (const item of probs) {
      const p = typeof item === 'number' ? item : (item?.prob ?? item?.[1] ?? 0);
      if (p > topProb) topProb = p;
    }
  } else if (typeof probs === 'object') {
    for (const k of Object.keys(probs)) {
      const p = Number(probs[k]) || 0;
      if (p > topProb) topProb = p;
    }
  }

  const { high: highCut, medium: medCut } = bandsData.cut_points;

  if (topProb >= highCut) {
    return {
      band: 'high',
      accuracy: bandsData.bands.high.accuracy,
      ciLow: bandsData.bands.high.ci_low,
      ciHigh: bandsData.bands.high.ci_high,
      n: bandsData.bands.high.n,
      percentage: Math.round(bandsData.bands.high.accuracy * 100),
      condition: bandsData.bands.high.condition,
      topProb,
    };
  }

  if (topProb >= medCut) {
    return {
      band: 'medium',
      accuracy: bandsData.bands.medium.accuracy,
      ciLow: bandsData.bands.medium.ci_low,
      ciHigh: bandsData.bands.medium.ci_high,
      n: bandsData.bands.medium.n,
      percentage: Math.round(bandsData.bands.medium.accuracy * 100),
      condition: bandsData.bands.medium.condition,
      topProb,
    };
  }

  return {
    ...notSureBand,
    topProb,
  };
}

export { bandsData };
