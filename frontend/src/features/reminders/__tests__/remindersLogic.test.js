import { describe, it, expect } from 'vitest';
import {
  toBanglaDigits,
  getRecommendedFollowUpDays,
  getFutureDateStr,
  formatBengaliDate,
  getDayDifference,
  formatRelativeBengali,
  getActivityPresets,
} from '../remindersLogic.js';

describe('remindersLogic', () => {
  it('converts digits to Bengali numbers', () => {
    expect(toBanglaDigits(12345)).toBe('১২৩৪৫');
    expect(toBanglaDigits('09:30')).toBe('০৯:৩০');
    expect(toBanglaDigits(null)).toBe('');
  });

  it('provides agronomically guided follow-up days', () => {
    expect(getRecommendedFollowUpDays('blast')).toBe(3);
    expect(getRecommendedFollowUpDays('sheath_blight')).toBe(3);
    expect(getRecommendedFollowUpDays('brown_spot')).toBe(5);
    expect(getRecommendedFollowUpDays('tungro')).toBe(5);
    expect(getRecommendedFollowUpDays('leaf_smut')).toBe(7);
    expect(getRecommendedFollowUpDays('healthy')).toBe(7);
    expect(getRecommendedFollowUpDays('not_sure')).toBe(2);
    expect(getRecommendedFollowUpDays('unknown')).toBe(3);
  });

  it('calculates future dates properly', () => {
    const base = new Date(2026, 10, 4); // 4 Nov 2026
    const plus3 = getFutureDateStr(3, base);
    expect(plus3).toBe('2026-11-07');

    const plus7 = getFutureDateStr(7, base);
    expect(plus7).toBe('2026-11-11');
  });

  it('formats dates in Bengali', () => {
    expect(formatBengaliDate('2026-11-04')).toBe('৪ নভেম্বর, ২০২৬');
    expect(formatBengaliDate('2026-01-15')).toBe('১৫ জানুয়ারি, ২০২৬');
  });

  it('computes day difference accurately', () => {
    expect(getDayDifference('2026-11-07', '2026-11-04')).toBe(3);
    expect(getDayDifference('2026-11-04', '2026-11-04')).toBe(0);
    expect(getDayDifference('2026-11-01', '2026-11-04')).toBe(-3);
  });

  it('formats relative status labels for farmers', () => {
    const dueToday = formatRelativeBengali('2026-11-04', '2026-11-04');
    expect(dueToday.text).toBe('আজকের করণীয়');
    expect(dueToday.isDue).toBe(true);
    expect(dueToday.isOverdue).toBe(false);

    const dueTomorrow = formatRelativeBengali('2026-11-05', '2026-11-04');
    expect(dueTomorrow.text).toBe('আগামীকাল');
    expect(dueTomorrow.isDue).toBe(false);

    const dueFuture = formatRelativeBengali('2026-11-07', '2026-11-04');
    expect(dueFuture.text).toBe('৩ দিন বাকি');

    const overdue = formatRelativeBengali('2026-11-02', '2026-11-04');
    expect(overdue.text).toBe('২ দিন অতিক্রান্ত');
    expect(overdue.isOverdue).toBe(true);
  });

  it('returns valid crop-care activity presets', () => {
    const presetsBn = getActivityPresets('bn');
    expect(presetsBn.length).toBeGreaterThanOrEqual(4);
    expect(presetsBn[0].title).toBe('জমিতে নতুন লক্ষণ পর্যবেক্ষণ');

    const presetsEn = getActivityPresets('en');
    expect(presetsEn[0].title).toBe('Check for new crop symptoms');
  });
});
