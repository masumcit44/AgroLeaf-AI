/**
 * Formatting helpers and disease class display names for model accuracy reporting.
 */

export const CLASS_NAMES = {
  healthy: { bn: 'সুস্থ পাতা', en: 'Healthy leaf' },
  blast: { bn: 'ব্লাস্ট', en: 'Rice blast' },
  brown_spot: { bn: 'বাদামি দাগ', en: 'Brown spot' },
  leaf_smut: { bn: 'লিফ স্মাট', en: 'Leaf smut' },
  tungro: { bn: 'টুংরো', en: 'Tungro' },
  sheath_blight: { bn: 'শীথ ব্লাইট', en: 'Sheath blight' },
};

export function formatMetric(val, isPercent = true) {
  if (val === null || val === undefined || Number.isNaN(val)) return '—';
  if (typeof val === 'number') {
    return isPercent ? `${(val * 100).toFixed(1)}%` : val.toFixed(3);
  }
  return String(val);
}

export function formatCount(val) {
  if (val === null || val === undefined || Number.isNaN(val)) return '—';
  return Number(val).toLocaleString();
}
