import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { reliabilityBand, bandsData } from '../bands.js';
import { ReliabilityNote } from '../index.jsx';
import i18nTexts from '../i18n.js';
import { I18nContext } from '../../../i18n/I18nContext.js';

function renderWithLang(ui, lang = 'bn') {
  const dict = i18nTexts[lang] || i18nTexts.bn;
  const t = (k) => dict[k] || k;
  return renderToString(
    <I18nContext.Provider value={{ lang, t, setLang: () => {}, toggleLang: () => {} }}>
      {ui}
    </I18nContext.Provider>
  );
}

describe('F14 Reliability Bands Logic', () => {
  it('bands_v10.json data meets mathematical acceptance criteria', () => {
    expect(bandsData.cut_points.high).toBe(0.98);
    expect(bandsData.cut_points.medium).toBe(0.53);

    // High band criteria
    expect(bandsData.bands.high.accuracy).toBeGreaterThanOrEqual(0.95);
    expect(bandsData.bands.high.ci_low).toBeGreaterThanOrEqual(0.90);
    expect(bandsData.bands.high.ci_high).toBeLessThanOrEqual(1.0);

    // Medium band criteria
    expect(bandsData.bands.medium.accuracy).toBeGreaterThanOrEqual(0.80);
    expect(bandsData.bands.medium.ci_low).toBeGreaterThan(0.0);
    expect(bandsData.bands.medium.ci_high).toBeLessThanOrEqual(1.0);

    // Total sample count matches DIU Half A
    expect(bandsData.dataset_n).toBe(1378);
    const sumN = bandsData.bands.high.n + bandsData.bands.medium.n + bandsData.bands.not_sure.n;
    expect(sumN).toBe(1378);
  });

  it('maps probabilities to correct bands when decision is confident', () => {
    const confidentDecision = { status: 'confident' };

    // High band
    const resHigh = reliabilityBand(confidentDecision, { blast: 0.99, healthy: 0.01 });
    expect(resHigh.band).toBe('high');
    expect(resHigh.percentage).toBe(99);
    expect(resHigh.n).toBe(345);

    // Medium band
    const resMed = reliabilityBand(confidentDecision, { blast: 0.75, healthy: 0.25 });
    expect(resMed.band).toBe('medium');
    expect(resMed.percentage).toBe(80);
    expect(resMed.n).toBe(350);

    // Below medium cut-point (< 0.53)
    const resLow = reliabilityBand(confidentDecision, { blast: 0.45, healthy: 0.35 });
    expect(resLow.band).toBe('not_sure');
    expect(resLow.n).toBe(683);
  });

  it('maps to not_sure when decision is abstained or invalid', () => {
    // Abstained decision with high top probability
    const notSureDecision = { status: 'not_sure', reason: 'other_problem' };
    const res = reliabilityBand(notSureDecision, { blast: 0.99 });
    expect(res.band).toBe('not_sure');

    // Missing decision or probs
    expect(reliabilityBand(null, { blast: 0.99 }).band).toBe('not_sure');
    expect(reliabilityBand({ status: 'confident' }, null).band).toBe('not_sure');
    expect(reliabilityBand(undefined, undefined).band).toBe('not_sure');
  });

  it('supports array representation of probabilities', () => {
    const res = reliabilityBand({ status: 'confident' }, [
      { classKey: 'blast', prob: 0.985 },
      { classKey: 'healthy', prob: 0.015 },
    ]);
    expect(res.band).toBe('high');
  });
});

describe('F14 i18n & Honesty Constraints', () => {
  it('has identical keys for Bangla and English starting with reliability.', () => {
    const bnKeys = Object.keys(i18nTexts.bn).sort();
    const enKeys = Object.keys(i18nTexts.en).sort();
    expect(bnKeys).toEqual(enKeys);

    for (const k of bnKeys) {
      expect(k.startsWith('reliability.')).toBe(true);
    }
  });

  it('strictly forbids the word "guarantee" or "guaranteed" or "নিশ্চিত নিশ্চয়তা"', () => {
    const allText = JSON.stringify(i18nTexts);
    expect(allText).not.toMatch(/guarantee/i);
    expect(allText).not.toMatch(/নিশ্চিত নিশ্চয়তা/);
    expect(allText).not.toMatch(/নিশ্চিত নিশ্চয়তা/);
  });
});

describe('F14 ReliabilityNote Component', () => {
  it('returns null if scan or scan.decision is missing', () => {
    expect(renderWithLang(<ReliabilityNote scan={null} />)).toBe('');
    expect(renderWithLang(<ReliabilityNote scan={{}} />)).toBe('');
  });

  it('renders high reliability badge and measured accuracy', () => {
    const scan = {
      decision: { status: 'confident' },
      probs: { blast: 0.99, healthy: 0.01 },
    };
    const htmlBn = renderWithLang(<ReliabilityNote scan={scan} />, 'bn');
    expect(htmlBn).toContain('উচ্চ নির্ভরযোগ্যতা');
    expect(htmlBn).toContain('১০০ টির মধ্যে ৯৯ টি সঠিক ছিল');

    const htmlEn = renderWithLang(<ReliabilityNote scan={scan} />, 'en');
    expect(htmlEn).toContain('High Reliability');
    expect(htmlEn).toContain('99 of 100 such results were correct');
  });

  it('renders medium reliability badge and measured accuracy', () => {
    const scan = {
      decision: { status: 'confident' },
      probs: { blast: 0.70, healthy: 0.30 },
    };
    const htmlBn = renderWithLang(<ReliabilityNote scan={scan} />, 'bn');
    expect(htmlBn).toContain('মাঝারি নির্ভরযোগ্যতা');
    expect(htmlBn).toContain('১০০ টির মধ্যে ৮০ টি সঠিক ছিল');

    const htmlEn = renderWithLang(<ReliabilityNote scan={scan} />, 'en');
    expect(htmlEn).toContain('Medium Reliability');
    expect(htmlEn).toContain('80 of 100 such results were correct');
  });

  it('renders not sure badge and hint when decision is not sure', () => {
    const scan = {
      decision: { status: 'not_sure', reason: 'other_problem' },
      probs: { other_rice: 0.95 },
    };
    const htmlBn = renderWithLang(<ReliabilityNote scan={scan} />, 'bn');
    expect(htmlBn).toContain('অনিশ্চিত');
    expect(htmlBn).toContain('ভালো আলোতে স্পষ্ট ছবি তুলুন');

    const htmlEn = renderWithLang(<ReliabilityNote scan={scan} />, 'en');
    expect(htmlEn).toContain('Not Sure');
    expect(htmlEn).toContain('The model is not confident enough');
  });
});
