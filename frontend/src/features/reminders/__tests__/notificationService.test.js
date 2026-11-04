import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isNotificationSupported,
  getNotificationPermission,
  showReminderNotification,
} from '../notificationService.js';

describe('notificationService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('gracefully handles missing Notification', () => {
    const orig = globalThis.Notification;
    delete globalThis.Notification;
    expect(isNotificationSupported()).toBe(false);
    expect(getNotificationPermission()).toBe('unsupported');
    globalThis.Notification = orig;
  });

  it('checks notification support when present', () => {
    globalThis.Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted'),
    };
    expect(isNotificationSupported()).toBe(true);
    expect(getNotificationPermission()).toBe('default');
  });

  it('returns false when showing notification with denied permission', async () => {
    globalThis.Notification = {
      permission: 'denied',
      requestPermission: vi.fn().mockResolvedValue('denied'),
    };

    const res = await showReminderNotification({ id: '1', title: 'Test' });
    expect(res).toBe(false);
  });
});
