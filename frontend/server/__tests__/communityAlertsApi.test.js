import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './d1Fake.js';
import { onRequest as middleware } from '../../functions/api/v1/_middleware.js';
import { onRequestGet as getCommunityAlerts } from '../../functions/api/v1/community-alerts/index.js';
import { getIsoWeek } from '../../functions/api/v1/area-reports/index.js';

const BASE = 'https://feat.agroleaf-ai.pages.dev';
const call = (handler, request, env) => middleware({ request, env, next: () => handler({ request, env }) });

describe('F32 Community Outbreak Early Warning & Neighbor Risk Alert API', () => {
  let env;

  beforeEach(() => {
    env = {
      DB: createTestDb(),
      HASH_SALT: 'test_salt_1234567890abcdef',
    };
  });

  it('422: rejects invalid district code', async () => {
    const req = new Request(`${BASE}/api/v1/community-alerts?district_code=999&class=blast`);
    const res = await call(getCommunityAlerts, req, env);
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error.code).toBe('invalid_district');
  });

  it('422: rejects unsupported disease class', async () => {
    const req = new Request(`${BASE}/api/v1/community-alerts?district_code=1&class=unknown_disease`);
    const res = await call(getCommunityAlerts, req, env);
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error.code).toBe('invalid_class');
  });

  it('200: returns INSUFFICIENT_DATA when district has fewer than 3 contributors (k-anonymity gate)', async () => {
    const req = new Request(`${BASE}/api/v1/community-alerts?district_code=1&class=blast`);
    const res = await call(getCommunityAlerts, req, env);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.districtCode).toBe('1');
    expect(data.primaryAlert.alertLevel.code).toBe('INSUFFICIENT_DATA');
    expect(data.primaryAlert.isSuppressed).toBe(true);
    expect(data.disclaimerBn).toContain('সরকারি বা মাঠপর্যায়ে নিশ্চিত রোগের ঘোষণা নয়');
  });

  it('200: detects elevated blast signal and propagates Neighbor Risk Alert to adjacent districts', async () => {
    const currentWeek = getIsoWeek();
    const db = env.DB;

    // Insert 5 distinct device reports for Blast in District 10 (Mymensingh)
    for (let i = 1; i <= 5; i++) {
      await db.prepare(
        `INSERT INTO area_reports (id, device_hash, district_code, iso_week, class, band, model_version, verified, created_at)
         VALUES (?, ?, '10', ?, 'blast', 'high', 'v10', 0, datetime('now'))`
      ).bind(`report-mym-${i}`, `hash-device-${i}`, currentWeek).run();
    }

    // 1. Query District 10 (Mymensingh) -> Should be ELEVATED or HIGH_RISK
    const reqMym = new Request(`${BASE}/api/v1/community-alerts?district_code=10&class=blast`);
    const resMym = await call(getCommunityAlerts, reqMym, env);
    expect(resMym.status).toBe(200);
    const dataMym = await resMym.json();

    expect(dataMym.districtCode).toBe('10');
    expect(dataMym.primaryAlert.isSuppressed).toBe(false);
    expect(['ELEVATED', 'HIGH_RISK']).toContain(dataMym.primaryAlert.alertLevel.code);
    expect(dataMym.primaryAlert.preventiveAdvice).not.toBeNull();

    // 2. Query District 3 (Gazipur - adjacent neighbor of Mymensingh)
    // Gazipur has 0 local reports -> should receive Neighbor Risk Alert referencing Mymensingh!
    const reqGaz = new Request(`${BASE}/api/v1/community-alerts?district_code=3&class=blast`);
    const resGaz = await call(getCommunityAlerts, reqGaz, env);
    expect(resGaz.status).toBe(200);
    const dataGaz = await resGaz.json();

    expect(dataGaz.districtCode).toBe('3');
    expect(dataGaz.neighborRisk).not.toBeNull();
    expect(dataGaz.neighborRisk.isNeighborAlert).toBe(true);
    expect(dataGaz.neighborRisk.sourceDistrictCode).toBe('10');
    expect(dataGaz.neighborRisk.sourceDistrictNameBn).toBe('ময়মনসিংহ');
    expect(dataGaz.neighborRisk.messageBn).toContain('আপনার পাশের এলাকা ময়মনসিংহ-এ ধানের ব্লাস্ট রোগের রিপোর্ট বেড়েছে');

    // 3. Query District 64 (Satkhira - far away, not a neighbor of Mymensingh)
    // Satkhira should NOT receive a neighbor risk alert from Mymensingh
    const reqSat = new Request(`${BASE}/api/v1/community-alerts?district_code=64&class=blast`);
    const resSat = await call(getCommunityAlerts, reqSat, env);
    expect(resSat.status).toBe(200);
    const dataSat = await resSat.json();

    expect(dataSat.districtCode).toBe('64');
    expect(dataSat.neighborRisk).toBeNull();
  });
});
