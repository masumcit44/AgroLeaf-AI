import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from '../../../i18n/I18nProvider.jsx';
import FollowUpCard from '../FollowUpCard.jsx';
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

describe('FollowUpCard', () => {
  it('renders nothing if context is not result or scan decision is missing', () => {
    const html1 = renderWithI18n(<FollowUpCard context="home" scan={{}} />);
    expect(html1).toBe('');

    const html2 = renderWithI18n(<FollowUpCard context="result" scan={null} />);
    expect(html2).toBe('');
  });

  it('renders follow-up prompt for Rice Blast diagnosis in Bengali with visible intervals and action button', () => {
    const scan = {
      classKey: 'blast',
      isConfident: true,
      decision: { status: 'confident', top: { key: 'blast' } },
    };
    const html = renderWithI18n(<FollowUpCard context="result" scan={scan} />, 'bn');
    expect(html).toContain('পরবর্তী মাঠ পর্যবেক্ষণ স্মরণবার্তা');
    expect(html).toContain('ধানের ব্লাস্ট');
    // Main action button displays both icon and text label
    expect(html).toContain('⏰');
    expect(html).toContain('স্মরণবার্তা তৈরি করুন');
    expect(html).toContain('aria-label="স্মরণবার্তা তৈরি করুন"');

    // Every interval option renders its clear, visible Bangla label
    expect(html).toContain('২ দিন পর');
    expect(html).toContain('৩ দিন পর');
    expect(html).toContain('৫ দিন পর');
    expect(html).toContain('৭ দিন পর');

    // Selected option (3 days for blast) has aria-pressed="true" and bg-leaf-700
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('bg-leaf-700 text-white');
  });

  it('renders follow-up prompt in English with visible intervals and action button', () => {
    const scan = {
      classKey: 'blast',
      isConfident: true,
      decision: { status: 'confident', top: { key: 'blast' } },
    };
    const html = renderWithI18n(<FollowUpCard context="result" scan={scan} />, 'en');
    expect(html).toContain('Follow-up Inspection Reminder');
    expect(html).toContain('Rice Blast');
    expect(html).toContain('⏰');
    expect(html).toContain('Create Reminder');
    expect(html).toContain('aria-label="Create Reminder"');
    expect(html).toContain('In 2 days');
    expect(html).toContain('In 3 days');
    expect(html).toContain('In 5 days');
    expect(html).toContain('In 7 days');
  });

  it('renders routine follow-up prompt for healthy leaf', () => {
    const scan = {
      classKey: 'healthy',
      isConfident: true,
      decision: { status: 'confident', top: { key: 'healthy' } },
    };
    const html = renderWithI18n(<FollowUpCard context="result" scan={scan} />, 'bn');
    expect(html).toContain('সুস্থ ধান গাছ');
  });
});
