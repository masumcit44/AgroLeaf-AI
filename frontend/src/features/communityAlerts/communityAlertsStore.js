// Local-First Community Alerts Store
// Backed by IndexedDB ("agroleaf" DB, "community_alerts" store and "profile" store).
// Privacy-first, 100% Free, offline resilient.

import { getDb, STORES } from '../../lib/store/db.js';
import { getProfile, saveProfile } from '../profile/profileStore.js';
import { buildCommunitySurveillanceReport, calculateDiseaseSignal } from './outbreakSignalEngine.js';

const DISMISSAL_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Get the farmer's community alerts preferences.
 * Reuses profile store for persistence so it stays linked to the farmer's profile.
 */
export async function getAlertsPreference() {
  const profile = await getProfile();
  return {
    optIn: Boolean(profile?.community_surveillance_opt_in),
    preferredDistrictCode: profile?.district_code ? String(profile.district_code) : null,
    dismissedAlerts: Array.isArray(profile?.dismissed_alerts) ? profile.dismissed_alerts : [],
  };
}

/**
 * Update the farmer's community alerts preferences.
 */
export async function saveAlertsPreference({ optIn, preferredDistrictCode }) {
  const profile = (await getProfile()) || {};
  const updated = {
    ...profile,
    community_surveillance_opt_in: Boolean(optIn),
  };
  if (preferredDistrictCode) {
    updated.district_code = String(preferredDistrictCode);
  }
  await saveProfile(updated);
  return {
    optIn: updated.community_surveillance_opt_in,
    preferredDistrictCode: updated.district_code || null,
  };
}

/**
 * Retrieve cached alert from IndexedDB for a district.
 */
export async function getCachedAlert(districtCode) {
  if (!districtCode) return null;
  try {
    const db = await getDb();
    const result = await db.get(STORES.COMMUNITY_ALERTS, String(districtCode));
    return result || null;
  } catch (err) {
    console.warn('[CommunityAlertsStore] Failed to read cached alert:', err);
    return null;
  }
}

/**
 * Save alert report to IndexedDB cache.
 */
export async function cacheAlert(districtCode, alertData) {
  if (!districtCode || !alertData) return;
  try {
    const db = await getDb();
    const record = {
      id: String(districtCode),
      district_code: String(districtCode),
      data: alertData,
      updated_at: new Date().toISOString(),
    };
    await db.put(STORES.COMMUNITY_ALERTS, record);
  } catch (err) {
    console.warn('[CommunityAlertsStore] Failed to cache alert:', err);
  }
}

/**
 * Dismiss an alert by key (e.g. "blast_33_ELEVATED").
 */
export async function dismissAlert(alertKey) {
  if (!alertKey) return;
  const profile = (await getProfile()) || {};
  const current = Array.isArray(profile.dismissed_alerts) ? profile.dismissed_alerts : [];
  const now = Date.now();
  // Filter out expired dismissals
  const valid = current.filter((item) => now - item.timestamp < DISMISSAL_COOLDOWN_MS);
  valid.push({ key: alertKey, timestamp: now });
  await saveProfile({ ...profile, dismissed_alerts: valid });
}

/**
 * Check if an alert is currently dismissed.
 */
export async function isAlertDismissed(alertKey) {
  if (!alertKey) return false;
  const profile = await getProfile();
  const list = Array.isArray(profile?.dismissed_alerts) ? profile.dismissed_alerts : [];
  const now = Date.now();
  const record = list.find((item) => item.key === alertKey);
  if (!record) return false;
  return now - record.timestamp < DISMISSAL_COOLDOWN_MS;
}

/**
 * Fetch community alerts for a district with seamless offline fallback.
 * 
 * @param {string|number} districtCode
 * @param {string} [classKey='blast']
 * @param {'bn'|'en'} [lang='bn']
 * @returns {Promise<Object>} Complete community report
 */
export async function fetchCommunityAlerts(districtCode, classKey = 'blast', lang = 'bn') {
  const code = String(districtCode || '1');

  // If browser is offline, directly load cached alert
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const cached = await getCachedAlert(code);
    if (cached?.data) {
      return {
        ...cached.data,
        isOffline: true,
        isCached: true,
      };
    }
    return buildOfflineFallbackReport(code, classKey, lang);
  }

  // Try fetching from edge API
  try {
    const res = await fetch(`/api/v1/community-alerts?district_code=${encodeURIComponent(code)}&class=${encodeURIComponent(classKey)}`, {
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      await cacheAlert(code, data);
      return {
        ...data,
        isOffline: false,
        isCached: false,
      };
    }
  } catch (err) {
    console.warn('[CommunityAlertsStore] Network fetch failed, falling back to cache:', err);
  }

  // Fallback to cache on network failure or HTTP error
  const cached = await getCachedAlert(code);
  if (cached?.data) {
    return {
      ...cached.data,
      isOffline: true,
      isCached: true,
    };
  }

  return buildOfflineFallbackReport(code, classKey, lang);
}

/**
 * Fallback when neither network nor cache is available.
 */
function buildOfflineFallbackReport(districtCode, classKey, lang) {
  const dummySignal = calculateDiseaseSignal({
    districtCode,
    classKey,
    currentContributors: 0,
    totalActiveContributors: 0,
  });

  return {
    ...buildCommunitySurveillanceReport({
      districtCode,
      localSignal: dummySignal,
      neighborRisk: null,
      lang,
    }),
    isOffline: true,
    isCached: false,
    offlineNoticeBn: 'সর্বশেষ তথ্য পাওয়া যায়নি (ইন্টারনেট সংযোগ নেই)।',
    offlineNoticeEn: 'Latest data unavailable (offline).',
  };
}
