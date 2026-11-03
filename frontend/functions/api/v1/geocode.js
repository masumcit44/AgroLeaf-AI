// GET /api/v1/geocode?q=...
// Lightweight Cloudflare Pages Function proxy to OpenStreetMap Nominatim.
// Nominatim policy: identifying User-Agent, max 1 request/s, cache results. Answers are kept
// in the edge cache for 24 h per normalised query, so repeated searches never reach Nominatim.

import { json, ApiError } from '../../../server/http.js';

const MAX_QUERY_LENGTH = 100;
const CACHE_SECONDS = 86400;

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const query = (url.searchParams.get('q') || '').trim().replace(/\s+/g, ' ');
  if (!query) {
    return json({ results: [] });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    throw new ApiError(422, 'query_too_long', `Search text must be at most ${MAX_QUERY_LENGTH} characters`);
  }

  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const cacheKey = new Request(`${url.origin}/api/v1/geocode?q=${encodeURIComponent(query.toLowerCase())}`);
  if (cache) {
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  }

  const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=json&limit=5&countrycodes=bd&addressdetails=1`;

  try {
    const res = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'AgroLeaf-AI/1.0 (+https://agroleaf-ai.pages.dev; rice leaf advisory)',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new ApiError(502, 'geocoding_upstream_error', 'Geocoding service unavailable');
    }

    const data = await res.json();
    const response = json({ results: Array.isArray(data) ? data : [] }, 200, {
      'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
    });
    if (cache) context.waitUntil?.(cache.put(cacheKey, response.clone()));
    return response;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(502, 'geocoding_failed', 'Geocoding service unavailable');
  }
}
