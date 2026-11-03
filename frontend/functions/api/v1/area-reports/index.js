// POST /api/v1/area-reports
// Body: { id: uuid, district_code, iso_week, class, band, model_version }
// Idempotent: same key → 200; new → 201; max 10 per device per day → 429
// Missing HASH_SALT → 503

import { verifyDevice } from '../../auth.js';
import { errorResponse, json } from '../_middleware.js';

const ALLOWED_CLASSES = ['blast', 'brown_spot', 'sheath_blight', 'tungro', 'healthy'];
const ALLOWED_BANDS = ['high'];

export async function onRequestPost(context) {
  try {
    const device = await verifyDevice(context.request, context.env);
    const body = await context.request.text();
    let data;
    try { data = JSON.parse(body); }
    catch { return errorResponse(new Error('bad_json')); }

    const { id, district_code, iso_week, class: classKey, band, model_version } = data;

    // Validate required fields
    if (!id || !district_code || !iso_week || !classKey || !band || !model_version) {
      return errorResponse(new Error('missing_fields'));
    }

    // Validate class
    if (!ALLOWED_CLASSES.includes(classKey)) {
      return errorResponse(new Error('invalid_class'));
    }

    // Validate band (only 'high' allowed)
    if (!ALLOWED_BANDS.includes(band)) {
      return errorResponse(new Error('invalid_band'));
    }

    // Validate model_version
    if (model_version !== 'v10') {
      return errorResponse(new Error('invalid_model_version'));
    }

    // Validate district_code exists in districts.json
    const districtsResp = await fetch('districts.json');
    const districts = await districtsResp.json();
    if (!districts.some(d => d.district_code === district_code)) {
      return errorResponse(new Error('invalid_district'));
    }

    // Validate iso_week format (YYYY-Www) and recency
    const isoWeekRegex = /^\d{4}-W\d{2}$/;
    if (!isoWeekRegex.test(iso_week)) {
      return errorResponse(new Error('invalid_iso_week'));
    }
    // Current or previous week only
    const currentYearWeek = new Date().toISOString().slice(0, 10).replace(/-/, '') + '-W' + new Date().toISOString().slice(8, 10);
    if (iso_week > currentYearWeek) {
      return errorResponse(new Error('future_week'));
    }

    // Check idempotency: same key → 200
    const db = await context.env.DB.prepare(
      'SELECT id FROM area_reports WHERE id = ? LIMIT 1'
    ).bind(id).first();
    if (db) {
      return json({ status: 'accepted', duplicate: true }, 200);
    }

    // Check daily limit: max 10 per device per day
    const sinceIso = new Date().toISOString().slice(0, 10);
    const count = await context.env.DB.prepare(
      'SELECT COUNT(*) AS n FROM area_reports WHERE device_hash = ? AND created_at >= ?'
    ).bind(device.id, sinceIso).first();
    if ((count?.n ?? 0) >= 10) {
      return errorResponse(new Error('daily_limit_exceeded'));
    }

    // Compute device_hash = HMAC-SHA256(device_id, HASH_SALT) hex
    const salt = context.env.HASH_SALT;
    if (!salt) {
      return errorResponse(new Error('hash_salt_not_configured'));
    }
    const deviceHash = await crypto.subtle.sign(
      'HMAC',
      await crypto.subtle.importKey('raw', new Uint8Array(Buffer.from(salt, 'hex')), [], 'HMAC', ['sign']),
      new TextEncoder().encode(device.id)
    ).then(r => btoa(String.fromCharCode(...new Uint8Array(r))));

    // Insert the report
    await context.env.DB.prepare(
      'INSERT INTO area_reports (id, device_hash, district_code, iso_week, class, band, model_version, verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)'
    ).bind(id, deviceHash, district_code, iso_week, classKey, band, model_version, new Date().toISOString()).run();

    return json({ status: 'accepted', duplicate: false }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}