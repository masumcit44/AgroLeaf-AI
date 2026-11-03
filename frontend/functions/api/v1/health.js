// GET /api/v1/health: proves Cloudflare Pages Functions run for this project (Batch 0, T0.2).
// No bindings, no data: safe to ship before D1 / R2 exist.
export function onRequestGet() {
  return Response.json({ ok: true, api: 'v1' }, { headers: { 'Cache-Control': 'no-store' } });
}
