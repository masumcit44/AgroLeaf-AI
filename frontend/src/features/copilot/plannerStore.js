// On-device IndexedDB store for F30 Personalized Agricultural Plans.
// Backed by "agroleaf" database, "plans" store.
// 100% Free, local-first, privacy-safe, works offline.

import { getDb, STORES, newId } from '../../lib/store/db.js';

/**
 * Returns today's date formatted as local "YYYY-MM-DD".
 */
export function getLocalTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Save or update a personalized crop farming plan.
 * @param {Object} plan
 * @returns {Promise<Object>}
 */
export async function savePlan(plan) {
  if (!plan) throw new Error('Plan object is required');

  const db = await getDb();
  const now = new Date().toISOString();

  const record = {
    ...plan,
    id: plan.id || newId(),
    created_at: plan.created_at || now,
    updated_at: now,
    is_saved: true,
  };

  await db.put(STORES.PLANS, record);
  return record;
}

/**
 * Retrieve a plan by ID.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getPlan(id) {
  if (!id) return null;
  const db = await getDb();
  const result = await db.get(STORES.PLANS, id);
  return result || null;
}

/**
 * List all saved plans, sorted from newest to oldest.
 * @returns {Promise<Array<Object>>}
 */
export async function listPlans() {
  const db = await getDb();
  const all = await db.getAll(STORES.PLANS);
  return (all || []).sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeB - timeA;
  });
}

/**
 * Delete a plan by ID.
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deletePlan(id) {
  if (!id) return false;
  const db = await getDb();
  await db.delete(STORES.PLANS, id);
  return true;
}

/**
 * Link or unlink an active F24 reminder to a task in a saved plan.
 * @param {string} planId
 * @param {string} taskId
 * @param {string|null} reminderId
 */
export async function updatePlanTaskReminder(planId, taskId, reminderId) {
  const plan = await getPlan(planId);
  if (!plan || !Array.isArray(plan.roadmap)) return null;

  let taskFound = false;
  for (const stage of plan.roadmap) {
    if (Array.isArray(stage.tasks)) {
      for (const t of stage.tasks) {
        if (t.task_id === taskId) {
          t.reminder_id = reminderId || null;
          t.reminder_active = Boolean(reminderId);
          taskFound = true;
          break;
        }
      }
    }
    if (taskFound) break;
  }

  if (taskFound) {
    return await savePlan(plan);
  }
  return plan;
}
