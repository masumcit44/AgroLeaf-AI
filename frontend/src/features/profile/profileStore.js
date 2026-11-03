import { getDb, STORES } from '../../lib/store/db.js';

const PROFILE_KEY = 'self';

export async function getProfile() {
  const db = await getDb();
  const result = await db.get(STORES.PROFILE, PROFILE_KEY);
  return result ?? null;
}

export async function saveProfile(profile) {
  const db = await getDb();
  const data = {
    ...profile,
    updated_at: new Date().toISOString(),
  };
  await db.put(STORES.PROFILE, data, PROFILE_KEY);
  return data;
}

export async function deleteProfile() {
  const db = await getDb();
  await db.delete(STORES.PROFILE, PROFILE_KEY);
}