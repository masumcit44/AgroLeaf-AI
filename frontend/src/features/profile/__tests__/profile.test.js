import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { resetDbForTests, DB_NAME } from '../../../lib/store/db.js';
import { getProfile, saveProfile, deleteProfile } from '../profileStore.js';
import districts from '../districts.json';

beforeEach(async () => {
  await resetDbForTests();
  await new Promise((resolve) => {
    const r = indexedDB.deleteDatabase(DB_NAME);
    r.onsuccess = r.onerror = r.onblocked = resolve;
  });
});

describe('profileStore', () => {
  it('returns null for empty profile', async () => {
    const profile = await getProfile();
    expect(profile).toBeNull();
  });

  it('saves and retrieves a profile', async () => {
    const input = {
      district_code: '1',
      district_name_en: 'Dhaka',
      district_name_bn: 'ঢাকা',
      lat: 23.7115,
      lon: 90.4111,
      season: 'boro',
      variety: 'BRRI dhan28',
      transplant_date: '2026-01-15',
    };
    await saveProfile(input);
    const profile = await getProfile();
    expect(profile).toMatchObject(input);
    expect(profile.updated_at).toBeDefined();
  });

  it('updates an existing profile', async () => {
    await saveProfile({ district_code: '1', district_name_en: 'Dhaka', district_name_bn: 'ঢাকা', lat: 23.7, lon: 90.4, season: 'boro' });
    await saveProfile({ district_code: '2', district_name_en: 'Faridpur', district_name_bn: 'ফরিদপুর', lat: 23.6, lon: 89.8, season: 'aman' });
    const profile = await getProfile();
    expect(profile.district_code).toBe('2');
    expect(profile.season).toBe('aman');
    expect(profile.district_name_en).toBe('Faridpur');
  });

  it('deletes a profile', async () => {
    await saveProfile({ district_code: '1', district_name_en: 'Dhaka', district_name_bn: 'ঢাকা', lat: 23.7, lon: 90.4 });
    await deleteProfile();
    const profile = await getProfile();
    expect(profile).toBeNull();
  });

  it('handles partial profiles (all fields optional)', async () => {
    await saveProfile({ season: 'aus', variety: 'BRRI dhan48' });
    const profile = await getProfile();
    expect(profile.season).toBe('aus');
    expect(profile.variety).toBe('BRRI dhan48');
    expect(profile.district_code).toBeUndefined();
    expect(profile.lat).toBeUndefined();
  });
});

describe('districts.json', () => {
  it('has exactly 64 districts', () => {
    expect(districts.length).toBe(64);
  });

  it('has unique codes 1-64', () => {
    const codes = districts.map((d) => d.code).sort((a, b) => Number(a) - Number(b));
    expect(codes).toEqual(Array.from({ length: 64 }, (_, i) => String(i + 1)));
  });

  it('every district has required fields', () => {
    for (const d of districts) {
      expect(d).toHaveProperty('code');
      expect(d).toHaveProperty('district_name_en');
      expect(d).toHaveProperty('district_name_bn');
      expect(d).toHaveProperty('lat');
      expect(d).toHaveProperty('lon');
      expect(typeof d.lat).toBe('number');
      expect(typeof d.lon).toBe('number');
    }
  });

  it('every lat/lon is inside Bangladesh bounds (lat 20.5–26.7, lon 88.0–92.7)', () => {
    for (const d of districts) {
      expect(d.lat).toBeGreaterThanOrEqual(20.5);
      expect(d.lat).toBeLessThanOrEqual(26.7);
      expect(d.lon).toBeGreaterThanOrEqual(88.0);
      expect(d.lon).toBeLessThanOrEqual(92.7);
    }
  });

  it('Bangla names are non-empty strings', () => {
    for (const d of districts) {
      expect(typeof d.district_name_bn).toBe('string');
      expect(d.district_name_bn.length).toBeGreaterThan(0);
    }
  });

  it('English names are non-empty strings', () => {
    for (const d of districts) {
      expect(typeof d.district_name_en).toBe('string');
      expect(d.district_name_en.length).toBeGreaterThan(0);
    }
  });
});