// On-device database (IndexedDB "agroleaf"), the local-first store for profile, history,
// the offline outbox and cached weather. Schema: documentation/feature_plan/DATABASE_API_DESIGN.md §1.
// Owned by the lead: feature agents use these helpers, they do not change the schema.
import { openDB } from 'idb';

export const DB_NAME = 'agroleaf';
export const DB_VERSION = 4;
export const STORES = {
  DEVICE: 'device',
  PROFILE: 'profile',
  HISTORY: 'history',
  OUTBOX: 'outbox',
  WEATHER: 'weather_cache',
  REMINDERS: 'reminders',
  PLANS: 'plans',
  COMMUNITY_ALERTS: 'community_alerts',
};

let dbPromise = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore(STORES.DEVICE);
          db.createObjectStore(STORES.PROFILE);
          const history = db.createObjectStore(STORES.HISTORY, { keyPath: 'id' });
          history.createIndex('created_at', 'created_at');
          history.createIndex('field_label', 'field_label');
          const outbox = db.createObjectStore(STORES.OUTBOX, { keyPath: 'id' });
          outbox.createIndex('created_at', 'created_at');
          db.createObjectStore(STORES.WEATHER);
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains(STORES.REMINDERS)) {
            const reminders = db.createObjectStore(STORES.REMINDERS, { keyPath: 'id' });
            reminders.createIndex('due_date', 'due_date');
            reminders.createIndex('status', 'status');
            reminders.createIndex('disease_id', 'disease_id');
          }
        }
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains(STORES.PLANS)) {
            const plans = db.createObjectStore(STORES.PLANS, { keyPath: 'id' });
            plans.createIndex('created_at', 'created_at');
            plans.createIndex('variety_id', 'field_profile.variety_id');
            plans.createIndex('season', 'field_profile.season');
          }
        }
        if (oldVersion < 4) {
          if (!db.objectStoreNames.contains(STORES.COMMUNITY_ALERTS)) {
            const alerts = db.createObjectStore(STORES.COMMUNITY_ALERTS, { keyPath: 'id' });
            alerts.createIndex('district_code', 'district_code');
            alerts.createIndex('updated_at', 'updated_at');
          }
        }
      },
    });
  }
  return dbPromise;
}

/** "Delete my data": clears every local store. The caller also asks the server to delete (DELETE /api/v1/devices/me). */
export async function clearAllLocalData() {
  const db = await getDb();
  const tx = db.transaction(Object.values(STORES), 'readwrite');
  await Promise.all(Object.values(STORES).map((s) => tx.objectStore(s).clear()));
  await tx.done;
}

/** Test hook: close and forget the connection so a fresh database can be opened. */
export async function resetDbForTests() {
  if (dbPromise) (await dbPromise).close();
  dbPromise = null;
}

export function newId() {
  return crypto.randomUUID();
}
