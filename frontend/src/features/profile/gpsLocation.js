// "Use my location" for the farmer profile: browser GPS (only on a button press), rounded to
// 2 decimals (~1 km) before it is stored, mapped to the nearest district centroid for the name.
// Weather then uses the rounded GPS point itself, not the district centre.
import districts from './districts.json';
import { getProfile, saveProfile } from './profileStore.js';

export const PROFILE_CHANGED_EVENT = 'agroleaf:profile-changed';
export const APPROX_ACCURACY_M = 2000;

export function round2(value) {
  return Math.round(Number(value) * 100) / 100;
}

export function nearestDistrict(lat, lon) {
  let best = null;
  let bestDist = Infinity;
  for (const d of districts) {
    const dist = (lat - d.lat) ** 2 + ((lon - d.lon) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  return best;
}

function getPosition(geo) {
  return new Promise((resolve, reject) => {
    geo.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  });
}

/** Error codes: 'unsupported' | 'denied' | 'unavailable' | 'timeout'. */
export function gpsErrorCode(err) {
  if (err?.code === 1) return 'denied';
  if (err?.code === 3) return 'timeout';
  return 'unavailable';
}

/**
 * Reads the GPS position, saves district + rounded point into the profile and announces the change.
 * Resolves to { profile, accuracy, approximate }; rejects with Error(code).
 */
export async function locateAndSaveProfile(geo = globalThis.navigator?.geolocation) {
  if (!geo) throw new Error('unsupported');
  let pos;
  try {
    pos = await getPosition(geo);
  } catch (err) {
    throw new Error(gpsErrorCode(err));
  }
  const lat = round2(pos.coords.latitude);
  const lon = round2(pos.coords.longitude);
  const accuracy = Math.round(pos.coords.accuracy ?? 0);
  const district = nearestDistrict(lat, lon);
  const previous = (await getProfile()) || {};
  const profile = await saveProfile({
    ...previous,
    district_code: district.code,
    district_name_en: district.district_name_en,
    district_name_bn: district.district_name_bn,
    lat,
    lon,
    location_source: 'gps',
    location_accuracy_m: accuracy,
  });
  globalThis.dispatchEvent?.(new Event(PROFILE_CHANGED_EVENT));
  return { profile, accuracy, approximate: accuracy > APPROX_ACCURACY_M };
}
