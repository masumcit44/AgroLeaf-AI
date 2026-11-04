// On-device persistence for F24 Farmer Reminders & Crop Care Scheduler.
// Backed by IndexedDB ("agroleaf" database, "reminders" store).
// Local-first, privacy-safe, works 100% offline.

import { getDb, STORES, newId } from '../../lib/store/db.js';

/**
 * Returns today's date formatted as local "YYYY-MM-DD".
 * Avoids UTC boundary drift.
 */
export function getLocalTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Save or create a reminder.
 */
export async function saveReminder(item) {
  if (!item || !item.title || !item.due_date) {
    throw new Error('Reminder requires title and due_date');
  }

  const db = await getDb();
  const now = new Date().toISOString();
  const today = getLocalTodayStr();

  // If due date is today or past, set initial status appropriately
  let initialStatus = item.status || 'upcoming';
  if (initialStatus === 'upcoming' && item.due_date <= today) {
    initialStatus = 'due';
  }

  const record = {
    id: item.id || newId(),
    title: item.title.trim(),
    description: (item.description || '').trim(),
    due_date: item.due_date,
    due_time: item.due_time || '09:00',
    status: initialStatus,
    disease_id: item.disease_id || null,
    source: item.source || 'manual',
    created_at: item.created_at || now,
    updated_at: now,
    completed_at: item.completed_at || null,
    notification_shown: item.notification_shown || false,
  };

  await db.put(STORES.REMINDERS, record);
  return record;
}

/**
 * Get a single reminder by ID.
 */
export async function getReminder(id) {
  if (!id) return null;
  const db = await getDb();
  const record = await db.get(STORES.REMINDERS, id);
  return record || null;
}

/**
 * List reminders with optional status filtering.
 * Sorted by due_date ascending, then created_at.
 */
export async function listReminders({ status, includeCompleted = false } = {}) {
  const db = await getDb();
  const all = await db.getAll(STORES.REMINDERS);
  const today = getLocalTodayStr();

  // Re-evaluate 'upcoming' vs 'due' on read
  const updated = all.map((r) => {
    if (r.status === 'upcoming' && r.due_date <= today) {
      return { ...r, status: 'due' };
    }
    return r;
  });

  return updated
    .filter((r) => {
      if (status) return r.status === status;
      if (!includeCompleted) return r.status === 'upcoming' || r.status === 'due';
      return true;
    })
    .sort((a, b) => {
      if (a.due_date !== b.due_date) return a.due_date.localeCompare(b.due_date);
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
}

/**
 * Update the status of a reminder ('completed', 'cancelled', 'upcoming', 'due').
 */
export async function updateReminderStatus(id, newStatus) {
  const db = await getDb();
  const existing = await db.get(STORES.REMINDERS, id);
  if (!existing) return null;

  const now = new Date().toISOString();
  existing.status = newStatus;
  existing.updated_at = now;
  if (newStatus === 'completed') {
    existing.completed_at = now;
  } else {
    existing.completed_at = null;
  }

  await db.put(STORES.REMINDERS, existing);
  return existing;
}

/**
 * Delete a reminder permanently.
 */
export async function deleteReminder(id) {
  if (!id) return false;
  const db = await getDb();
  await db.delete(STORES.REMINDERS, id);
  return true;
}

/**
 * Duplicate check: returns any active (upcoming or due) reminder for a given diseaseKey.
 */
export async function getActiveReminderForDisease(diseaseKey) {
  if (!diseaseKey) return null;
  const active = await listReminders({ includeCompleted: false });
  return active.find((r) => r.disease_id === diseaseKey) || null;
}

/**
 * Get all reminders currently due or overdue (due_date <= today and not completed/cancelled).
 */
export async function getDueReminders(targetDateStr = null) {
  const today = targetDateStr || getLocalTodayStr();
  const active = await listReminders({ includeCompleted: false });
  return active.filter((r) => r.due_date <= today);
}
