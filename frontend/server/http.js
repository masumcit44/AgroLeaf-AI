// API response helpers (documentation/feature_plan/DATABASE_API_DESIGN.md §3 conventions).
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.status = status;
    this.code = code;
  }
}

export function json(data, status = 200, headers = {}) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

export function errorResponse(err) {
  if (err instanceof ApiError) return json({ error: { code: err.code, message: err.message } }, err.status);
  console.error('[api] unexpected error:', err);
  return json({ error: { code: 'internal', message: 'Unexpected server error' } }, 500);
}

/** The D1 binding, or a clear 503 when the owner has not created it yet. */
export function requireDb(env) {
  if (!env?.DB) throw new ApiError(503, 'storage_not_configured', 'The database is not set up yet');
  return env.DB;
}

export async function readJson(request, maxBytes = 16 * 1024) {
  const text = await request.text();
  if (text.length > maxBytes) throw new ApiError(413, 'too_large', `Body over ${maxBytes} bytes`);
  try {
    return { text, body: text ? JSON.parse(text) : {} };
  } catch {
    throw new ApiError(400, 'bad_json', 'Body is not valid JSON');
  }
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
