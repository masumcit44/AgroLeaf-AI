import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetDbForTests, DB_NAME } from '../../../lib/store/db.js';
import { HelpButton } from '../index.jsx';
import React from 'react';
import { renderToString } from 'react-dom/server';

vi.mock('../../../lib/diseaseKnowledge.js', () => ({
  getDiseaseKnowledge: vi.fn().mockResolvedValue({
    classes: {
      blast: { name_bn: 'ব্লাস্ট রোগ', name_en: 'Blast' },
      brown_spot: { name_bn: 'বাদামী দাগ রোগ', name_en: 'Brown spot' },
      healthy: { name_bn: 'সুস্থ পাতা', name_en: 'Healthy' },
      not_sure: { name_bn: 'নিশ্চিত নই', name_en: 'Not sure' },
    },
  }),
}));

vi.stubGlobal('navigator', {
  share: vi.fn().mockResolvedValue(undefined),
  canShare: vi.fn().mockReturnValue(true),
});

beforeEach(async () => {
  await resetDbForTests();
  await new Promise((resolve) => {
    const r = indexedDB.deleteDatabase(DB_NAME);
    r.onsuccess = r.onerror = r.onblocked = resolve;
  });
});

function createMockScan(overrides = {}) {
  const canvas = { width: 100, height: 100, toBlob: vi.fn(), toDataURL: vi.fn() };
  
  return {
    canvas,
    decision: {
      status: 'confident',
      top: { key: 'blast', prob: 0.9 },
      top2: [{ key: 'blast', prob: 0.9 }, { key: 'brown_spot', prob: 0.05 }],
      ...overrides.decision,
    },
    ...overrides,
  };
}

describe('HelpButton', () => {
  it('renders nothing when scan is null', () => {
    const html = renderToString(<HelpButton scan={null} context="result" />);
    expect(html).toBe('');
  });

  it('renders help button when scan provided', () => {
    const scan = createMockScan();
    const html = renderToString(<HelpButton scan={scan} context="result" />);
    // Button renders with translation key (i18n not resolved in renderToString)
    expect(html).toContain('help.title');
    expect(html).toContain('🆘');
    expect(html).toContain('bg-blue-700');
  });

  it('renders button with correct aria-label', () => {
    const scan = createMockScan();
    const html = renderToString(<HelpButton scan={scan} context="result" />);
    expect(html).toContain('aria-label="help.title"');
  });
});

describe('Help i18n keys', () => {
  it('has matching keys in bn and en', async () => {
    const i18n = (await import('../i18n.js')).default;
    const bnKeys = Object.keys(i18n.bn).sort();
    const enKeys = Object.keys(i18n.en).sort();
    expect(enKeys).toEqual(bnKeys);
    for (const key of bnKeys) {
      expect(key.startsWith('help.')).toBe(true);
    }
  });

  it('has all required help keys', async () => {
    const i18n = (await import('../i18n.js')).default;
    const requiredKeys = [
      'help.title',
      'help.callKrishi',
      'help.callChargeNote',
      'help.caseSummary',
      'help.thumbnailAria',
      'help.resultLabel',
      'help.notSure',
      'help.reasonLabel',
      'help.reasonNotLeaf',
      'help.reasonOtherProblem',
      'help.reasonLowConfidence',
      'help.reasonHealthyCaution',
      'help.reasonSuppressed',
      'help.dateLabel',
      'help.districtLabel',
      'help.noDistrict',
      'help.shareSummary',
      'help.downloadImage',
      'help.shareCopied',
      'help.shareFailed',
      'help.close',
    ];
    for (const key of requiredKeys) {
      expect(key in i18n.bn).toBe(true);
      expect(key in i18n.en).toBe(true);
    }
  });
});

describe('Exported helper functions', () => {
  it('exports getReasonText, formatDate, createSummaryImage', async () => {
    const mod = await import('../index.jsx');
    expect(typeof mod.getReasonText).toBe('function');
    expect(typeof mod.formatDate).toBe('function');
    expect(typeof mod.createSummaryImage).toBe('function');
  });

  it('getReasonText maps all reason types correctly', async () => {
    const { getReasonText } = await import('../index.jsx');
    const t = (key) => key;
    const lang = 'en';
    
    expect(getReasonText('not_leaf', t, lang)).toBe('help.reasonNotLeaf');
    expect(getReasonText('other_problem', t, lang)).toBe('help.reasonOtherProblem');
    expect(getReasonText('low_confidence', t, lang)).toBe('help.reasonLowConfidence');
    expect(getReasonText('healthy_needs_high_confidence', t, lang)).toBe('help.reasonHealthyCaution');
    expect(getReasonText('suppressed', t, lang)).toBe('help.reasonSuppressed');
    expect(getReasonText('unknown', t, lang)).toBe('help.reasonLowConfidence');
  });

  it('formatDate returns formatted date string', async () => {
    const { formatDate } = await import('../index.jsx');
    const result = formatDate('2026-01-15T10:30:00.000Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('createSummaryImage is exported and callable', async () => {
    const { createSummaryImage } = await import('../index.jsx');
    expect(typeof createSummaryImage).toBe('function');
  });
});