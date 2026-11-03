import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetDbForTests } from '../../../lib/store/db.js';
import { getProfile, saveProfile, deleteProfile } from '../profileStore.js';
import { locateAndSaveProfile, nearestDistrict, round2, PROFILE_CHANGED_EVENT } from '../gpsLocation.js';

function fakeGeo({ lat, lon, accuracy = 30, errorCode = null }) {
  return {
    getCurrentPosition: (ok, fail) =>
      errorCode ? fail({ code: errorCode }) : ok({ coords: { latitude: lat, longitude: lon, accuracy } }),
  };
}

// Node has no window: give globalThis the EventTarget methods the code dispatches through
if (!globalThis.addEventListener) {
  const target = new EventTarget();
  globalThis.addEventListener = target.addEventListener.bind(target);
  globalThis.removeEventListener = target.removeEventListener.bind(target);
  globalThis.dispatchEvent = target.dispatchEvent.bind(target);
}

describe('GPS profile location', () => {
  beforeEach(async () => {
    await resetDbForTests();
    await deleteProfile();
  });

  it('rounds to 2 decimals', () => {
    expect(round2(23.856789)).toBe(23.86);
    expect(round2(90.264321)).toBe(90.26);
  });

  it('maps Savar to Dhaka district and Sylhet city to Sylhet', () => {
    expect(nearestDistrict(23.85, 90.26).district_name_en).toBe('Dhaka');
    expect(nearestDistrict(24.9, 91.87).district_name_en).toBe('Sylhet');
  });

  it('saves the rounded point, keeps other profile fields and announces the change', async () => {
    await saveProfile({ season: 'aman' });
    const heard = vi.fn();
    globalThis.addEventListener(PROFILE_CHANGED_EVENT, heard);
    const { profile, approximate } = await locateAndSaveProfile(fakeGeo({ lat: 23.856789, lon: 90.264321 }));
    globalThis.removeEventListener(PROFILE_CHANGED_EVENT, heard);

    expect(profile).toMatchObject({ lat: 23.86, lon: 90.26, location_source: 'gps', season: 'aman' });
    expect(profile.district_name_en).toBe('Dhaka');
    expect(approximate).toBe(false);
    expect(heard).toHaveBeenCalledTimes(1);
    const stored = await getProfile();
    expect(stored.lat).toBe(23.86);
    expect(String(stored.lat).split('.')[1].length).toBeLessThanOrEqual(2);
  });

  it('flags a weak fix as approximate', async () => {
    const { approximate } = await locateAndSaveProfile(fakeGeo({ lat: 23.85, lon: 90.26, accuracy: 5000 }));
    expect(approximate).toBe(true);
  });

  it('reports denied, timeout and unsupported without touching the profile', async () => {
    await expect(locateAndSaveProfile(fakeGeo({ errorCode: 1 }))).rejects.toThrow('denied');
    await expect(locateAndSaveProfile(fakeGeo({ errorCode: 3 }))).rejects.toThrow('timeout');
    await expect(locateAndSaveProfile(null)).rejects.toThrow('unsupported');
    expect(await getProfile()).toBeNull();
  });
});
