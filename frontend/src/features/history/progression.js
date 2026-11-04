/**
 * F14: Photo History (Before/After Tracking) — Progression Logic
 * Calculates chronological timeline day offsets and symptom trajectory
 * between baseline (Day 0) and follow-up scans.
 * 100% free, local-first, zero network dependency.
 */

/**
 * Calculates day difference between two ISO date strings.
 * @param {string} startIso 
 * @param {string} endIso 
 * @returns {number} Non-negative integer number of days
 */
export function calculateDayOffset(startIso, endIso) {
  if (!startIso || !endIso) return 0;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (isNaN(start) || isNaN(end)) return 0;
  const diffMs = Math.max(0, end - start);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Builds chronological timeline with Day 0 baseline and day offsets.
 * @param {Array<Object>} items Array of history entries for a specific field/plant
 * @returns {Array<Object>} Chronologically ordered items with day offsets
 */
export function buildTimeline(items = []) {
  if (!items || items.length === 0) return [];
  // Sort ascending (earliest first)
  const sorted = [...items].sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')));
  const baselineDate = sorted[0].created_at;

  return sorted.map((item, index) => {
    const dayOffset = calculateDayOffset(baselineDate, item.created_at);
    return {
      ...item,
      dayOffset,
      isBaseline: index === 0,
      timelineIndex: index,
    };
  });
}

/**
 * Evaluates disease symptom progression between two scans (Before vs After).
 * @param {Object} beforeEntry Baseline scan
 * @param {Object} afterEntry Follow-up scan
 * @returns {Object} Progression assessment
 */
export function evaluateProgression(beforeEntry, afterEntry) {
  if (!beforeEntry || !afterEntry) {
    return { status: 'unknown', daysApart: 0, improved: false, persistent: false };
  }

  const daysApart = calculateDayOffset(beforeEntry.created_at, afterEntry.created_at);
  const beforeClass = (beforeEntry.top_class || '').toLowerCase();
  const afterClass = (afterEntry.top_class || '').toLowerCase();

  const beforeIsHealthy = beforeClass === 'healthy' || beforeClass === 'normal';
  const afterIsHealthy = afterClass === 'healthy' || afterClass === 'normal';

  let status = 'unchanged';
  let improved = false;
  let persistent = false;

  if (!beforeIsHealthy && afterIsHealthy) {
    status = 'improved';
    improved = true;
  } else if (beforeIsHealthy && !afterIsHealthy) {
    status = 'worsened';
  } else if (!beforeIsHealthy && !afterIsHealthy) {
    if (beforeClass === afterClass) {
      status = 'unchanged';
      persistent = daysApart >= 7;
    } else {
      status = 'different_disease';
    }
  } else {
    // Both healthy
    status = 'healthy_maintained';
    improved = true;
  }

  return {
    status,
    daysApart,
    improved,
    persistent,
    beforeClass,
    afterClass,
  };
}

