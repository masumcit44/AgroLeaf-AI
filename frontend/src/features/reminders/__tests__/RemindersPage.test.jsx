import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from '../../../i18n/I18nProvider.jsx';
import RemindersPage from '../RemindersPage.jsx';
import DueBanner from '../DueBanner.jsx';
import { resetDbForTests, DB_NAME } from '../../../lib/store/db.js';

beforeEach(async () => {
  await resetDbForTests();
  await new Promise((resolve) => {
    const r = indexedDB.deleteDatabase(DB_NAME);
    r.onsuccess = r.onerror = r.onblocked = resolve;
  });
});

function renderWithI18n(ui, lang = 'bn') {
  return renderToString(<I18nProvider initialLang={lang}>{ui}</I18nProvider>);
}

describe('RemindersPage & DueBanner', () => {
  it('renders reminders page with title, tabs, and action button', () => {
    const html = renderWithI18n(<RemindersPage />, 'bn');
    expect(html).toContain('স্মরণবার্তা ও ফসল সেবা');
    expect(html).toContain('নতুন স্মরণবার্তা');
    expect(html).toContain('আসন্ন ও আজকের কাজ');
    expect(html).toContain('সম্পন্ন কাজ');
  });

  it('renders DueBanner null when no due reminders exist', () => {
    const html = renderWithI18n(<DueBanner context="home" />);
    expect(html).toBe('');
  });
});
