import { ApiError, json, requireDb, UUID_RE } from '../../../../server/http.js';
import { verifyDevice } from '../../../../server/auth.js';

export async function onRequestGet({ request, env }) {
  // Verify device signature first
  const device = await verifyDevice(request, env, await request.text());
  const db = requireDb(env);

  const deviceId = device.id;
  if (!deviceId) throw new ApiError(400, 'missing_device_id', 'Device id missing after verification');

  const rows = await db.prepare('SELECT id, status, reviewed_class FROM feedback WHERE device_id = ? ORDER BY created_at DESC').bind(deviceId).all();
  return json(rows.results || []);
}