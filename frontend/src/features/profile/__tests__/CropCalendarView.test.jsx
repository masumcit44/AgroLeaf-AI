import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from '../../../i18n/I18nProvider.jsx';
import { CropCalendarView } from '../CropCalendarView.jsx';

function renderWithI18n(ui, lang = 'bn') {
  return renderToString(<I18nProvider initialLang={lang}>{ui}</I18nProvider>);
}

describe('CropCalendarView Component', () => {
  const sampleProfile = {
    division_name_bn: 'ঢাকা',
    district_code: '3',
    district_name_bn: 'গাজীপুর',
    upazila_name_bn: 'কালিয়াকৈর',
    season: 'boro',
    variety: 'BRRI dhan28 (ব্রি ধান২৮)',
    variety_id: 'brri_28',
    cultivation_method: 'transplanted',
    transplant_date: '2026-01-15',
    completed_task_ids: [],
    active_reminder_ids: [],
  };

  const mockT = (key) => key;

  it('renders overview card, progress, next task, and timeline', () => {
    const html = renderWithI18n(
      <CropCalendarView profile={sampleProfile} t={mockT} lang="bn" />
    );

    expect(html).toContain('data-testid="crop-calendar-view"');
    expect(html).toContain('data-testid="next-task-card"');
    expect(html).toContain('গাজীপুর');
    expect(html).toContain('BRRI dhan28');
    expect(html).toContain('profile.editSetup');
    expect(html).toContain('profile.enableReminder');
    expect(html).toContain('profile.timelineTitle');
  });

  it('renders in English when lang is en', () => {
    const html = renderWithI18n(
      <CropCalendarView profile={sampleProfile} t={mockT} lang="en" />,
      'en'
    );

    expect(html).toContain('data-testid="crop-calendar-view"');
    expect(html).toContain('Progress');
  });
});

