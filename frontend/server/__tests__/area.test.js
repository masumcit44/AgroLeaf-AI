import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestDb } from './d1Fake.js';
import { onRequest as middleware } from '../../functions/api/v1/_middleware.js';
import { onRequestPost as postReport, getIsoWeek } from '../../functions/api/v1/area-reports/index.js';
import { onRequestGet as getSummary } from '../../functions/api/v1/area-summary/index.js';
import { onRequestPost as registerDevice } from '../../functions/api/v1/devices/index.js';
import { hmacSign, sha256Hex } from '../../src/lib/store/signing.js';

const BASE = 'https://feat.agroleaf-ai.pages.dev';
const SALT = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
const DEVICE_1 = '11111111-1111-4111-8111-111111111111';
const KEY_1 = 'a'.repeat(64);
const DEVICE_2 = '22222222-2222-4222-8222-222222222222';
const KEY_2 = 'b'.repeat(64);
const DEVICE_3 = '33333333-3333-4333-8333-333333333333';
const KEY_3 = 'c'.repeat(64);

const call = (handler, request, env) => middleware({ request, env, next: () => handler({ request, env }) });

async function signedRequest(method, path, bodyObj, deviceId = DEVICE_1, key = KEY_1, ts = new Date().toISOString()) {
  const bodyText = typeof bodyObj === 'string' ? bodyObj : JSON.stringify(bodyObj);
  const sig = await hmacSign(key, method, path, await sha256Hex(bodyText), ts);
  return new Request(BASE + path, {
    method,
    body: bodyText,
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': deviceId,
      'X-Timestamp': ts,
      'X-Device-Signature': sig,
    },
  });
}

describe('F23 Area Disease Map API', () => {
  let env;

  beforeEach(async () => {
    env = {
      DB: createTestDb(),
      HASH_SALT: SALT,
      TURNSTILE_SECRET: 'test-secret',
    };
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ success: true })));

    // Register test devices
    for (const [d, k] of [[DEVICE_1, KEY_1], [DEVICE_2, KEY_2], [DEVICE_3, KEY_3]]) {
      await call(registerDevice, new Request(`${BASE}/api/v1/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: d, signing_key: k, turnstile_token: 'tok' }),
      }), env);
    }
  });

  it('201: creates new valid area report', async () => {
    const currentWeek = getIsoWeek();
    const payload = {
      id: 'a1b2c3d4-e5f6-47a8-9b0c-1d2e3f4a5b6c',
      district_code: '1',
      iso_week: currentWeek,
      class: 'blast',
      band: 'high',
      model_version: 'v10',
    };

    const req = await signedRequest('POST', '/api/v1/area-reports', payload);
    const res = await call(postReport, req, env);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toEqual({ status: 'accepted', duplicate: false });
  });

  it('200: same report is idempotent', async () => {
    const currentWeek = getIsoWeek();
    const payload = {
      id: 'b2c3d4e5-f6a7-48b9-8c1d-2e3f4a5b6c7d',
      district_code: '2',
      iso_week: currentWeek,
      class: 'brown_spot',
      band: 'high',
      model_version: 'v10',
    };

    const req1 = await signedRequest('POST', '/api/v1/area-reports', payload);
    const res1 = await call(postReport, req1, env);
    expect(res1.status).toBe(201);

    const req2 = await signedRequest('POST', '/api/v1/area-reports', payload);
    const res2 = await call(postReport, req2, env);
    expect(res2.status).toBe(200);
    const data2 = await res2.json();
    expect(data2).toEqual({ status: 'accepted', duplicate: true });
  });

  it('401: unsigned or tampered requests are refused', async () => {
    const payload = {
      id: 'c3d4e5f6-a7b8-49c0-9d1e-2f3a4b5c6d7e',
      district_code: '3',
      iso_week: getIsoWeek(),
      class: 'blast',
      band: 'high',
      model_version: 'v10',
    };

    // Completely unsigned
    const unsignedReq = new Request(`${BASE}/api/v1/area-reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const resUnsigned = await call(postReport, unsignedReq, env);
    expect(resUnsigned.status).toBe(401);

    // Tampered body with valid signature headers for another body
    const validReq = await signedRequest('POST', '/api/v1/area-reports', payload);
    const tamperedReq = new Request(`${BASE}/api/v1/area-reports`, {
      method: 'POST',
      headers: validReq.headers,
      body: JSON.stringify({ ...payload, class: 'tungro' }),
    });
    const resTampered = await call(postReport, tamperedReq, env);
    expect(resTampered.status).toBe(401);
    expect((await resTampered.json()).error.code).toBe('bad_signature');
  });

  it('422: rejects bad district, week, or class', async () => {
    const valid = {
      id: 'd4e5f6a7-b8c9-40d1-ae2f-3a4b5c6d7e8f',
      district_code: '1',
      iso_week: getIsoWeek(),
      class: 'blast',
      band: 'high',
      model_version: 'v10',
    };

    // Bad district code
    const resDist = await call(postReport, await signedRequest('POST', '/api/v1/area-reports', { ...valid, district_code: '999' }), env);
    expect(resDist.status).toBe(422);
    expect((await resDist.json()).error.code).toBe('invalid_district');

    // Future week
    const resWeek = await call(postReport, await signedRequest('POST', '/api/v1/area-reports', { ...valid, iso_week: '2099-W50' }), env);
    expect(resWeek.status).toBe(422);
    expect((await resWeek.json()).error.code).toBe('future_week');

    // Bad class
    const resClass = await call(postReport, await signedRequest('POST', '/api/v1/area-reports', { ...valid, class: 'invalid_disease' }), env);
    expect(resClass.status).toBe(422);
    expect((await resClass.json()).error.code).toBe('invalid_class');
  });

  it('422: rejects reports when band is not high', async () => {
    const payload = {
      id: 'e5f6a7b8-c9d0-41e2-bf3a-4b5c6d7e8f90',
      district_code: '1',
      iso_week: getIsoWeek(),
      class: 'blast',
      band: 'medium', // not high
      model_version: 'v10',
    };

    const req = await signedRequest('POST', '/api/v1/area-reports', payload);
    const res = await call(postReport, req, env);
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe('invalid_band');
  });

  it('503: missing HASH_SALT gives hash_salt_not_configured', async () => {
    const payload = {
      id: 'f6a7b8c9-d0e1-42f3-804b-5c6d7e8f9012',
      district_code: '1',
      iso_week: getIsoWeek(),
      class: 'blast',
      band: 'high',
      model_version: 'v10',
    };

    const envNoSalt = { ...env, HASH_SALT: undefined };
    const req = await signedRequest('POST', '/api/v1/area-reports', payload);
    const res = await call(postReport, req, envNoSalt);
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe('hash_salt_not_configured');
  });

  it('429: limits to 10 reports per device per day (11th is rejected)', async () => {
    const currentWeek = getIsoWeek();

    for (let i = 1; i <= 10; i++) {
      const payload = {
        id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
        district_code: String(i),
        iso_week: currentWeek,
        class: 'blast',
        band: 'high',
        model_version: 'v10',
      };
      const req = await signedRequest('POST', '/api/v1/area-reports', payload);
      const res = await call(postReport, req, env);
      expect(res.status).toBe(201);
    }

    // 11th report from same device today
    const payload11 = {
      id: '00000000-0000-4000-8000-000000000011',
      district_code: '11',
      iso_week: currentWeek,
      class: 'blast',
      band: 'high',
      model_version: 'v10',
    };
    const req11 = await signedRequest('POST', '/api/v1/area-reports', payload11);
    const res11 = await call(postReport, req11, env);
    expect(res11.status).toBe(429);
    expect((await res11.json()).error.code).toBe('rate_limited');
  });

  it('summary: hides districts with < 3 distinct devices (reports: null)', async () => {
    const currentWeek = getIsoWeek();

    // District 1: 2 devices (Device 1 and Device 2)
    await call(postReport, await signedRequest('POST', '/api/v1/area-reports', {
      id: 'd1000000-0000-4000-8000-000000000001',
      district_code: '1',
      iso_week: currentWeek,
      class: 'tungro',
      band: 'high',
      model_version: 'v10',
    }, DEVICE_1, KEY_1), env);

    await call(postReport, await signedRequest('POST', '/api/v1/area-reports', {
      id: 'd1000000-0000-4000-8000-000000000002',
      district_code: '1',
      iso_week: currentWeek,
      class: 'tungro',
      band: 'high',
      model_version: 'v10',
    }, DEVICE_2, KEY_2), env);

    // District 2: 3 devices (Device 1, Device 2, Device 3)
    await call(postReport, await signedRequest('POST', '/api/v1/area-reports', {
      id: 'd2000000-0000-4000-8000-000000000001',
      district_code: '2',
      iso_week: currentWeek,
      class: 'tungro',
      band: 'high',
      model_version: 'v10',
    }, DEVICE_1, KEY_1), env);

    await call(postReport, await signedRequest('POST', '/api/v1/area-reports', {
      id: 'd2000000-0000-4000-8000-000000000002',
      district_code: '2',
      iso_week: currentWeek,
      class: 'tungro',
      band: 'high',
      model_version: 'v10',
    }, DEVICE_2, KEY_2), env);

    await call(postReport, await signedRequest('POST', '/api/v1/area-reports', {
      id: 'd2000000-0000-4000-8000-000000000003',
      district_code: '2',
      iso_week: currentWeek,
      class: 'tungro',
      band: 'high',
      model_version: 'v10',
    }, DEVICE_3, KEY_3), env);

    // Request summary for tungro
    const summaryReq = new Request(`${BASE}/api/v1/area-summary?class=tungro&weeks=2`);
    const summaryRes = await call(getSummary, summaryReq, env);
    expect(summaryRes.status).toBe(200);
    expect(summaryRes.headers.get('Cache-Control')).toBe('public, max-age=600');

    const summary = await summaryRes.json();
    const d1 = summary.items.find((i) => i.district_code === '1');
    const d2 = summary.items.find((i) => i.district_code === '2');

    // District 1 has 2 devices < 3 -> reports: null
    expect(d1.reports).toBeNull();

    // District 2 has 3 devices >= 3 -> reports: 3
    expect(d2.reports).toBe(3);
  });

  it('summary: counts distinct devices, not rows', async () => {
    const currentWeek = getIsoWeek();

    // District 3: Device 1 submits multiple reports (e.g. across different weeks)
    // First in currentWeek
    await call(postReport, await signedRequest('POST', '/api/v1/area-reports', {
      id: 'd3000000-0000-4000-8000-000000000001',
      district_code: '3',
      iso_week: currentWeek,
      class: 'sheath_blight',
      band: 'high',
      model_version: 'v10',
    }, DEVICE_1, KEY_1), env);

    // Second from Device 2
    await call(postReport, await signedRequest('POST', '/api/v1/area-reports', {
      id: 'd3000000-0000-4000-8000-000000000002',
      district_code: '3',
      iso_week: currentWeek,
      class: 'sheath_blight',
      band: 'high',
      model_version: 'v10',
    }, DEVICE_2, KEY_2), env);

    // Direct insertion of a second row for Device 1 with a different week in window
    // (Testing that 2 rows from DEVICE_1 + 1 row from DEVICE_2 = 2 distinct devices, NOT 3)
    const prevWeekTime = new Date(Date.now() - 8 * 86400000);
    const prevWeek = getIsoWeek(prevWeekTime);
    await env.DB.prepare(
      `INSERT INTO area_reports (id, device_hash, district_code, iso_week, class, band, model_version, verified, created_at)
       VALUES (?, (SELECT device_hash FROM area_reports WHERE id='d3000000-0000-4000-8000-000000000001'), '3', ?, 'sheath_blight', 'high', 'v10', 0, ?)`
    ).bind('d3000000-0000-4000-8000-000000000099', prevWeek, prevWeekTime.toISOString()).run();

    // Total rows for district 3 is 3, but distinct devices is only 2!
    const summaryReq = new Request(`${BASE}/api/v1/area-summary?class=sheath_blight&weeks=2`);
    const summaryRes = await call(getSummary, summaryReq, env);
    const summary = await summaryRes.json();
    const d3 = summary.items.find((i) => i.district_code === '3');

    // Because distinct devices = 2 < 3, reports must be null (not 3 rows!)
    expect(d3.reports).toBeNull();
  });
});
