import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { resetDbForTests, DB_NAME } from '../../../lib/store/db.js';
import {
  saveReminder,
  getReminder,
  listReminders,
  updateReminderStatus,
  deleteReminder,
  getActiveReminderForDisease,
  getDueReminders,
  getLocalTodayStr,
} from '../remindersStore.js';

beforeEach(async () => {
  await resetDbForTests();
  await new Promise((resolve) => {
    const r = indexedDB.deleteDatabase(DB_NAME);
    r.onsuccess = r.onerror = r.onblocked = resolve;
  });
});

describe('remindersStore', () => {
  it('throws when saving reminder without required fields', async () => {
    await expect(saveReminder(null)).rejects.toThrow();
    await expect(saveReminder({ title: 'Only Title' })).rejects.toThrow();
    await expect(saveReminder({ due_date: '2026-11-10' })).rejects.toThrow();
  });

  it('saves and retrieves an upcoming reminder', async () => {
    const futureDate = '2099-12-31';
    const item = {
      title: 'ব্লাস্ট রোগ পর্যবেক্ষণ',
      description: 'পাতা পর্যবেক্ষণ করুন',
      due_date: futureDate,
      disease_id: 'blast',
      source: 'diagnosis',
    };

    const saved = await saveReminder(item);
    expect(saved.id).toBeDefined();
    expect(saved.status).toBe('upcoming');
    expect(saved.created_at).toBeDefined();

    const fetched = await getReminder(saved.id);
    expect(fetched).not.toBeNull();
    expect(fetched.title).toBe('ব্লাস্ট রোগ পর্যবেক্ষণ');
    expect(fetched.disease_id).toBe('blast');
  });

  it('marks reminder as due if due date is today or past', async () => {
    const today = getLocalTodayStr();
    const item = {
      title: 'আজকের পরিদর্শন',
      due_date: today,
    };
    const saved = await saveReminder(item);
    expect(saved.status).toBe('due');
  });

  it('lists active vs completed reminders', async () => {
    const r1 = await saveReminder({ title: 'Reminder 1', due_date: '2099-01-01' });
    const r2 = await saveReminder({ title: 'Reminder 2', due_date: '2099-01-02' });
    const r3 = await saveReminder({ title: 'Reminder 3', due_date: '2099-01-03' });

    await updateReminderStatus(r2.id, 'completed');

    const activeOnly = await listReminders({ includeCompleted: false });
    expect(activeOnly.length).toBe(2);
    expect(activeOnly.map((r) => r.id)).toEqual([r1.id, r3.id]);

    const all = await listReminders({ includeCompleted: true });
    expect(all.length).toBe(3);

    const completedOnly = await listReminders({ status: 'completed', includeCompleted: true });
    expect(completedOnly.length).toBe(1);
    expect(completedOnly[0].id).toBe(r2.id);
    expect(completedOnly[0].completed_at).toBeDefined();
  });

  it('detects active reminder for disease to prevent duplicates', async () => {
    await saveReminder({
      title: 'Rice Blast follow-up',
      due_date: '2099-11-15',
      disease_id: 'blast',
      source: 'diagnosis',
    });

    const activeBlast = await getActiveReminderForDisease('blast');
    expect(activeBlast).not.toBeNull();
    expect(activeBlast.title).toBe('Rice Blast follow-up');

    const activeTungro = await getActiveReminderForDisease('tungro');
    expect(activeTungro).toBeNull();
  });

  it('does not count completed reminder as active disease duplicate', async () => {
    const saved = await saveReminder({
      title: 'Old Blast follow-up',
      due_date: '2099-11-15',
      disease_id: 'blast',
    });
    await updateReminderStatus(saved.id, 'completed');

    const activeBlast = await getActiveReminderForDisease('blast');
    expect(activeBlast).toBeNull();
  });

  it('returns due or overdue reminders', async () => {
    await saveReminder({ title: 'Past 1', due_date: '2020-01-01' });
    await saveReminder({ title: 'Today', due_date: '2026-11-04' });
    await saveReminder({ title: 'Future', due_date: '2099-01-01' });

    const dueList = await getDueReminders('2026-11-04');
    expect(dueList.length).toBe(2);
    expect(dueList.some((r) => r.title === 'Past 1')).toBe(true);
    expect(dueList.some((r) => r.title === 'Today')).toBe(true);
    expect(dueList.some((r) => r.title === 'Future')).toBe(false);
  });

  it('deletes a reminder permanently', async () => {
    const saved = await saveReminder({ title: 'To Delete', due_date: '2099-01-01' });
    const success = await deleteReminder(saved.id);
    expect(success).toBe(true);

    const check = await getReminder(saved.id);
    expect(check).toBeNull();
  });
});
