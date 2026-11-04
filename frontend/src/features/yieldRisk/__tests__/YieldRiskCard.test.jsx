import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from '../../../i18n/I18nProvider.jsx';
import YieldRiskCard from '../YieldRiskCard.jsx';

function renderWithI18n(ui, lang = 'bn') {
  return renderToString(<I18nProvider initialLang={lang}>{ui}</I18nProvider>);
}

describe('YieldRiskCard Component', () => {
  it('renders nothing if context is not result or scan is missing', () => {
    const html1 = renderWithI18n(<YieldRiskCard context="home" scan={{}} />);
    expect(html1).toBe('');

    const html2 = renderWithI18n(<YieldRiskCard context="result" scan={null} />);
    expect(html2).toBe('');
  });

  it('renders correctly for rice blast scan in Bangla', () => {
    const scan = {
      classKey: 'blast',
      isConfident: true,
      decision: { status: 'confident', top: { key: 'blast' } },
    };
    const html = renderWithI18n(<YieldRiskCard context="result" scan={scan} />, 'bn');

    // Section landmark and title
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-labelledby="yield-risk-title"');
    expect(html).toContain('সম্ভাব্য ফলন প্রভাব ও ঝুঁকি');

    // Risk badge
    expect(html).toContain('yield-risk-band-badge');

    // Qualitative Yield impact & scouting prompt
    expect(html).toContain('yield-impact-value');
    expect(html).toContain('ক্ষেতের অন্তত ২০টি গাছ ঘুরে দেখুন');

    // Immediate action & helpline
    expect(html).toContain('ইউরিয়া সার সাময়িক বন্ধ রাখুন');
    expect(html).toContain('১৬১২৩ নম্বরে পরামর্শ নিন');
    expect(html).toContain('href="tel:16123"');

    // Sources accordion trigger & benchmark plots
    expect(html).toContain('id="yield-risk-toggle"');
    expect(html).toContain('তথ্যসূত্র ও বৈজ্ঞানিক ভিত্তি');
    expect(html).toContain('১৫%–৩৫%');
  });

  it('renders correctly in English for healthy leaf', () => {
    const scan = {
      classKey: 'healthy',
      isConfident: true,
      decision: { status: 'confident', top: { key: 'healthy' } },
    };
    const html = renderWithI18n(<YieldRiskCard context="result" scan={scan} />, 'en');

    expect(html).toContain('Yield Impact &amp; Risk Intelligence');
    expect(html).toContain('Low Risk');
    expect(html).toContain('yield-impact-value');
    expect(html).toContain('Inspect at least 20 hills across your field');
    expect(html).toContain('No intervention required');
  });

  it('renders safely for not_sure inconclusive scans', () => {
    const scan = {
      classKey: 'not_sure',
      isConfident: false,
      decision: { status: 'inconclusive', top: { key: 'not_sure' } },
    };
    const html = renderWithI18n(<YieldRiskCard context="result" scan={scan} />, 'bn');

    expect(html).toContain('অনিশ্চিত');
    expect(html).toContain('১৬১২৩');
    expect(html).toContain('দিনের আলোতে');
  });

  it('correctly maps inconclusive scan as not_sure even if decision has top key', () => {
    const scan = {
      isConfident: false,
      decision: { status: 'not_sure', top: { key: 'blast' } },
    };
    const html = renderWithI18n(<YieldRiskCard context="result" scan={scan} />, 'bn');

    expect(html).toContain('অনিশ্চিত');
    expect(html).not.toContain('নেক ব্লাস্ট বা শিষ ব্লাস্ট');
  });
});
