// Geo and location helpers for F8 v2 Weather & Crop Analysis.
// Privacy rule: all coordinates are rounded to at most 2 decimal places (~1 km)
// BEFORE making any external network request or storing locally.

import districtsData from '../profile/districts.json';

export const DISTRICTS = districtsData;

/**
 * Round coordinate to at most 2 decimal places (~1 km precision in Bangladesh).
 * Never send or store unrounded coordinates.
 */
export function roundCoord(val) {
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return null;
  return Math.round(num * 100) / 100;
}

/**
 * Determine geographic level from Nominatim address / type.
 */
function determineLevel(item) {
  const type = item.type || '';
  const addresstype = item.addresstype || '';
  const address = item.address || {};

  if (type === 'administrative' && address.state_district) return 'district';
  if (addresstype === 'village' || address.village) return 'village';
  if (addresstype === 'subdistrict' || address.subdistrict || address.town) return 'upazila';
  if (addresstype === 'city' || address.city) return 'district';
  return 'area';
}

/**
 * Search locations via backend proxy /api/v1/geocode, falling back to direct OSM Nominatim or local districts.
 * Returns array of { name, displayName, lat, lon, level, isApproximate }.
 */
export async function searchLocations(query, fetchFn = globalThis.fetch) {
  if (!query || !query.trim()) return [];

  const q = query.trim().toLowerCase();

  // Try API proxy first
  try {
    const url = `/api/v1/geocode?q=${encodeURIComponent(q)}`;
    const res = await fetchFn(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        return data.results.map((item) => ({
          name: item.name || item.display_name.split(',')[0],
          displayName: item.display_name,
          lat: roundCoord(item.lat),
          lon: roundCoord(item.lon),
          level: determineLevel(item),
          isApproximate: false,
        }));
      }
    }
  } catch {
    // network or backend failure; fall through
  }

  // Direct Nominatim fallback (e.g. during local preview / testing where Pages Functions aren't running)
  try {
    const directUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      q
    )}&format=json&limit=5&countrycodes=bd&addressdetails=1`;
    const res = await fetchFn(directUrl);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item) => ({
          name: item.name || item.display_name.split(',')[0],
          displayName: item.display_name,
          lat: roundCoord(item.lat),
          lon: roundCoord(item.lon),
          level: determineLevel(item),
          isApproximate: false,
        }));
      }
    }
  } catch {
    // network or offline; fall back to local districts
  }

  // Local fallback: search 64 districts (works offline and on network error)
  const matched = DISTRICTS.filter((d) => {
    const en = (d.district_name_en || '').toLowerCase();
    const bn = d.district_name_bn || '';
    return en.includes(q) || bn.includes(q);
  });

  return matched.slice(0, 5).map((d) => ({
    name: d.district_name_bn,
    displayName: `${d.district_name_bn} (${d.district_name_en})`,
    lat: roundCoord(d.lat),
    lon: roundCoord(d.lon),
    level: 'district',
    isApproximate: false,
    district_code: d.district_code,
  }));
}

/**
 * Find closest district centroid to a given (lat, lon) coordinate.
 */
export function findNearestDistrict(lat, lon) {
  if (lat == null || lon == null) return null;
  const rLat = roundCoord(lat);
  const rLon = roundCoord(lon);

  let closest = null;
  let minDist = Infinity;

  for (const d of DISTRICTS) {
    const dLat = d.lat;
    const dLon = d.lon;
    const distSq = (rLat - dLat) ** 2 + (rLon - dLon) ** 2;
    if (distSq < minDist) {
      minDist = distSq;
      closest = d;
    }
  }

  return closest;
}

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBn(val) {
  if (val == null) return '';
  return String(val).replace(/[0-9]/g, (d) => BN_DIGITS[d]);
}

export function formatNumber(val, lang) {
  if (val == null || isNaN(val)) return '';
  return lang === 'bn' ? toBn(val) : String(val);
}

export function formatTimeAgo(timestamp, lang, t) {
  if (!timestamp) return '';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 2) return t('weather.updatedJustNow');
  if (diffMin < 60) {
    return t('weather.updatedMinAgo').replace('{n}', formatNumber(diffMin, lang));
  }
  const diffHours = Math.floor(diffMin / 60);
  return t('weather.updatedHourAgo').replace('{n}', formatNumber(diffHours, lang));
}

