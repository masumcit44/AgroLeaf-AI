// GET /api/v1/geocode?q=...
// Lightweight Cloudflare Pages Function proxy to OpenStreetMap Nominatim.
// Enforces User-Agent compliance, 24-hour edge caching, and countrycodes=bd.

import { json, ApiError } from '../../../server/http.js';

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const q = url.searchParams.get('q');
  if (!q || !q.trim()) {
    return json({ results: [] });
  }

  const query = q.trim();
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=json&limit=5&countrycodes=bd&addressdetails=1`;

  try {
    const res = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'AgroLeaf-AI/1.0 (contact: masumcit44@gmail.com; agricultural advisory)',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new ApiError(502, 'geocoding_upstream_error', 'Geocoding service unavailable');
    }

    const data = await res.json();
    return json({ results: Array.isArray(data) ? data : [] }, 200, {
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, 'geocoding_failed', err.message);
  }
}
