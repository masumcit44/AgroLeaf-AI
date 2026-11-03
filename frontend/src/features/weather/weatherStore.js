// F8 Weather Store & Cache
// Open-Meteo forecast API (free non-commercial, CC BY 4.0).
// 3-hour cache in IndexedDB STORES.WEATHER ('weather_cache').

import { getDb, STORES } from '../../lib/store/db.js';

export const CACHE_KEY = 'latest_weather';
export const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

/**
 * Retrieve farmer's location from profile in IndexedDB STORES.PROFILE ('self').
 * Returns null if no profile has been saved.
 */
export async function getProfileLocation() {
  try {
    const db = await getDb();
    const profile = await db.get(STORES.PROFILE, 'self');
    if (profile && profile.lat != null && profile.lon != null) {
      return {
        district_code: profile.district_code || null,
        district_name_en: profile.district_name_en || '',
        district_name_bn: profile.district_name_bn || '',
        lat: Number(profile.lat),
        lon: Number(profile.lon),
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch 3-day hourly forecast from Open-Meteo, with 3-hour local caching in STORES.WEATHER.
 * Returns { hourly, fetched_at, isOffline, fromCache } or null.
 */
export async function getWeatherData(location, fetchFn = globalThis.fetch) {
  if (!location || location.lat == null || location.lon == null) {
    return null;
  }

  const db = await getDb();
  let cached = null;
  try {
    cached = await db.get(STORES.WEATHER, CACHE_KEY);
  } catch {
    cached = null;
  }

  const now = Date.now();

  // If cache is fresh (< 3 hours old) and within ~10km of requested location
  if (
    cached &&
    cached.expires_at > now &&
    cached.hourly &&
    Math.abs(cached.lat - location.lat) < 0.1 &&
    Math.abs(cached.lon - location.lon) < 0.1
  ) {
    return {
      ...cached,
      isOffline: false,
      fromCache: true,
    };
  }

  // Fetch from Open-Meteo
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&hourly=temperature_2m,relative_humidity_2m,precipitation,cloud_cover&forecast_days=3&timezone=auto`;

  try {
    const res = await fetchFn(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo responded with status ${res.status}`);
    }
    const data = await res.json();
    if (!data.hourly || !Array.isArray(data.hourly.time) || data.hourly.time.length === 0) {
      throw new Error('Invalid Open-Meteo response structure');
    }

    const entry = {
      lat: location.lat,
      lon: location.lon,
      district_name_en: location.district_name_en,
      district_name_bn: location.district_name_bn,
      fetched_at: new Date(now).toISOString(),
      expires_at: now + CACHE_TTL_MS,
      hourly: data.hourly,
    };

    try {
      await db.put(STORES.WEATHER, entry, CACHE_KEY);
    } catch {
      // cache storage failure should not break live data
    }

    return {
      ...entry,
      isOffline: false,
      fromCache: false,
    };
  } catch {
    // Fallback: If offline or network error, serve stale cached data if available
    if (cached && cached.hourly) {
      return {
        ...cached,
        isOffline: true,
        fromCache: true,
      };
    }
    return null;
  }
}
