// GET /api/v1/community-alerts?district_code=<1-64>&class=<key>
// Public endpoint for F32 Outbreak Early Warning & Neighbor Risk Alert.
// Cache-Control: public, max-age=600
// Privacy: k-anonymity enforced (minimum 3 contributors; zero GPS coordinates).

import { ApiError, requireDb, json } from '../../../../server/http.js';
import { ALLOWED_CLASSES, VALID_DISTRICT_CODES, getIsoWeek } from '../area-reports/index.js';
import {
  calculateDiseaseSignal,
  evaluateNeighborRisk,
  buildCommunitySurveillanceReport,
} from '../../../../src/features/communityAlerts/outbreakSignalEngine.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = requireDb(env);

  const url = new URL(request.url);
  const districtCodeParam = url.searchParams.get('district_code') || '1';
  const classKey = url.searchParams.get('class') || 'blast';

  if (!VALID_DISTRICT_CODES.has(String(districtCodeParam))) {
    throw new ApiError(422, 'invalid_district', 'Invalid district code (1-64)');
  }

  if (!ALLOWED_CLASSES.includes(classKey)) {
    throw new ApiError(422, 'invalid_class', `Class must be one of: ${ALLOWED_CLASSES.join(', ')}`);
  }

  const now = new Date();
  const currentWeek = getIsoWeek(now);

  // Calculate baseline cutoff (prior 3 weeks)
  const threeWeeksAgo = new Date(now.getTime() - 21 * 86400000);
  const minBaselineWeek = getIsoWeek(threeWeeksAgo);

  // 1. Query Current Week counts per district
  const currentClassRows = await db.prepare(
    `SELECT district_code, COUNT(DISTINCT device_hash) AS contributors
     FROM area_reports
     WHERE class = ? AND iso_week = ?
     GROUP BY district_code`
  ).bind(classKey, currentWeek).all();

  const currentTotalRows = await db.prepare(
    `SELECT district_code, COUNT(DISTINCT device_hash) AS total_contributors
     FROM area_reports
     WHERE iso_week = ?
     GROUP BY district_code`
  ).bind(currentWeek).all();

  // 2. Query Baseline (prior 3 weeks) counts per district
  const baselineClassRows = await db.prepare(
    `SELECT district_code, COUNT(DISTINCT device_hash) AS contributors, COUNT(DISTINCT iso_week) AS num_weeks
     FROM area_reports
     WHERE class = ? AND iso_week >= ? AND iso_week < ?
     GROUP BY district_code`
  ).bind(classKey, minBaselineWeek, currentWeek).all();

  const baselineTotalRows = await db.prepare(
    `SELECT district_code, COUNT(DISTINCT device_hash) AS total_contributors, COUNT(DISTINCT iso_week) AS num_weeks
     FROM area_reports
     WHERE iso_week >= ? AND iso_week < ?
     GROUP BY district_code`
  ).bind(minBaselineWeek, currentWeek).all();

  // 3. Map into lookup tables
  const currentClassMap = new Map();
  for (const r of currentClassRows?.results || []) {
    currentClassMap.set(String(r.district_code), Number(r.contributors || 0));
  }

  const currentTotalMap = new Map();
  for (const r of currentTotalRows?.results || []) {
    currentTotalMap.set(String(r.district_code), Number(r.total_contributors || 0));
  }

  const baselineRateMap = new Map();
  for (const r of baselineClassRows?.results || []) {
    const dc = String(r.district_code);
    const cCount = Number(r.contributors || 0);
    const tCount = Number(baselineTotalRows?.results?.find((x) => String(x.district_code) === dc)?.total_contributors || 1);
    const rate = cCount / Math.max(1, tCount);
    baselineRateMap.set(dc, rate);
  }

  // 4. Compute signals across all active districts (needed for neighbor risk propagation)
  const allDistrictSignals = {};
  for (let i = 1; i <= 64; i++) {
    const dc = String(i);
    const cContributors = currentClassMap.get(dc) || 0;
    const tContributors = currentTotalMap.get(dc) || 0;
    const baseRate = baselineRateMap.get(dc) || 0.10;

    allDistrictSignals[dc] = calculateDiseaseSignal({
      districtCode: dc,
      classKey,
      currentContributors: cContributors,
      totalActiveContributors: tContributors,
      baselineRate: baseRate,
      verified: false,
    });
  }

  // 5. Evaluate target district signal & neighbor risk
  const targetSignal = allDistrictSignals[String(districtCodeParam)];
  const neighborRisk = evaluateNeighborRisk({
    targetDistrictCode: districtCodeParam,
    allDistrictSignals,
  });

  const report = buildCommunitySurveillanceReport({
    districtCode: districtCodeParam,
    localSignal: targetSignal,
    neighborRisk,
    lang: 'bn',
  });

  return json(
    {
      ...report,
      iso_week: currentWeek,
      class: classKey,
    },
    200,
    { 'Cache-Control': 'public, max-age=600' }
  );
}
