// GET /api/v1/area-summary?class=<key>&weeks=2
// Public endpoint, no auth required.
// Cache-Control: public, max-age=600
// Returns items: [{ district_code, reports }] counting DISTINCT device_hash in the last N ISO weeks.
// Privacy rule (k-anonymity): districts with < 3 distinct devices return reports: null. No alert labels.

import { ApiError, requireDb, json } from '../../../../server/http.js';
import { ALLOWED_CLASSES, getIsoWeek } from '../area-reports/index.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = requireDb(env);

  const url = new URL(request.url);
  const classKey = url.searchParams.get('class');
  const weeksParam = url.searchParams.get('weeks');

  if (!classKey || !ALLOWED_CLASSES.includes(classKey)) {
    throw new ApiError(422, 'invalid_class', `Class parameter required (${ALLOWED_CLASSES.join(', ')})`);
  }

  let weeks = 2;
  if (weeksParam !== null && weeksParam !== undefined) {
    weeks = parseInt(weeksParam, 10);
    if (!Number.isFinite(weeks) || weeks < 1 || weeks > 52) {
      throw new ApiError(422, 'invalid_weeks', 'Weeks must be between 1 and 52');
    }
  }

  // Calculate cutoff week
  const now = new Date();
  const cutoffTime = new Date(now.getTime() - Math.max(0, weeks - 1) * 7 * 86400000);
  const minIsoWeek = getIsoWeek(cutoffTime);

  // Query distinct device count per district_code
  const queryResult = await db.prepare(
    `SELECT district_code, COUNT(DISTINCT device_hash) AS device_count
     FROM area_reports
     WHERE class = ? AND iso_week >= ?
     GROUP BY district_code`
  ).bind(classKey, minIsoWeek).all();

  const countsByDistrict = new Map();
  for (const row of (queryResult?.results || [])) {
    countsByDistrict.set(String(row.district_code), Number(row.device_count || 0));
  }

  // Output items for all 64 districts or observed districts
  const items = [];
  for (let i = 1; i <= 64; i++) {
    const dc = String(i);
    const count = countsByDistrict.get(dc) || 0;
    items.push({
      district_code: dc,
      reports: count >= 3 ? count : null,
    });
  }

  return json(
    { items, class: classKey, weeks },
    200,
    { 'Cache-Control': 'public, max-age=600' }
  );
}
