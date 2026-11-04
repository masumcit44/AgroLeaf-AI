// Notification service for F24 Farmer Reminders.
// Progressive enhancement:
// 1. If Notification API is supported and granted, delivers system notification via Service Worker / Notification.
// 2. If permission is denied or unsupported, silently gracefully falls back without blocking reminder creation.

import { getDueReminders, saveReminder } from './remindersStore.js';

export function isNotificationSupported() {
  return typeof globalThis !== 'undefined' && typeof globalThis.Notification !== 'undefined';
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return globalThis.Notification.permission;
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const perm = await globalThis.Notification.requestPermission();
    return perm;
  } catch {
    return globalThis.Notification.permission;
  }
}

/**
 * Display a notification for a reminder if permission is granted.
 * Uses serviceWorkerRegistration.showNotification if available, otherwise new Notification().
 */
export async function showReminderNotification(reminder) {
  if (!reminder || getNotificationPermission() !== 'granted') {
    return false;
  }

  const title = `AgroLeaf AI: ${reminder.title}`;
  const options = {
    body: reminder.description || 'আজকের ফসল পর্যবেক্ষণ ও যত্ন নিন।',
    icon: '/brand/icon-192.png',
    badge: '/brand/icon-192.png',
    tag: `reminder-${reminder.id}`,
    data: {
      url: '/#/reminders',
      id: reminder.id,
    },
  };

  try {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready.catch(() => null);
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, options);
        return true;
      }
    }

    // Direct Notification fallback (desktop / active tab)
    if (typeof globalThis.Notification === 'function') {
      new globalThis.Notification(title, options);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('showReminderNotification warning:', err);
    return false;
  }
}

/**
 * Checks for any due reminders that have not yet had a notification fired today,
 * triggers the notification, and flags them as notification_shown.
 */
export async function checkAndTriggerDueNotifications() {
  if (getNotificationPermission() !== 'granted') return [];

  const due = await getDueReminders();
  const unnotified = due.filter((r) => !r.notification_shown);

  const sent = [];
  for (const r of unnotified) {
    const success = await showReminderNotification(r);
    if (success) {
      r.notification_shown = true;
      await saveReminder(r);
      sent.push(r);
    }
  }

  return sent;
}
