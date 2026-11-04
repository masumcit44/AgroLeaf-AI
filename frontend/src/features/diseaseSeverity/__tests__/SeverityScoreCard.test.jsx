import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from '../../../i18n/I18nProvider.jsx';
import { SeverityScoreCard } from '../SeverityScoreCard.jsx';

function makeMockCanvas(width, height, fillFn) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const [r, g, b, a] = fillFn(i % width, Math.floor(i / width));
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = a ?? 255;
  }

  return {
    width,
    height,
    getContext(type) {
      if (type !== '2d') return null;
      return {
        getImageData: (x, y, w, h) => ({
          data,
          width: w,
          height: h,
        }),
      };
    },
  };
}

function renderCard(ui, lang = 'bn') {
  return renderToString(<I18nProvider initialLang={lang}>{ui}</I18nProvider>);
}

describe('SeverityScoreCard Component', () => {
  it('renders nothing when context is not result or scan is null', () => {
    expect(renderCard(<SeverityScoreCard context="home" scan={{}} />)).toBe('');
    expect(renderCard(<SeverityScoreCard context="result" scan={null} />)).toBe('');
  });

  it('renders nothing for healthy scan', () => {
    const scan = {
      classKey: 'healthy',
      decision: { status: 'confident', top: { prob: 0.95 } },
      canvas: makeMockCanvas(50, 50, () => [40, 160, 40, 255]),
    };
    expect(renderCard(<SeverityScoreCard context="result" scan={scan} />)).toBe('');
  });

  it('renders honest abstention card for Tungro systemic stunting', () => {
    const scan = {
      classKey: 'tungro',
      decision: { status: 'confident', top: { prob: 0.91 } },
      canvas: makeMockCanvas(50, 50, () => [40, 160, 40, 255]),
    };
    const html = renderCard(<SeverityScoreCard context="result" scan={scan} />, 'bn');
    expect(html).toContain('data-testid="severity-card-abstain"');
    expect(html).toContain('16123');
  });

  it('renders honest abstention card for Sheath Blight culm height limitation', () => {
    const scan = {
      classKey: 'sheath_blight',
      decision: { status: 'confident', top: { prob: 0.88 } },
      canvas: makeMockCanvas(50, 50, () => [40, 160, 40, 255]),
    };
    const html = renderCard(<SeverityScoreCard context="result" scan={scan} />, 'bn');
    expect(html).toContain('data-testid="severity-card-abstain"');
  });

  it('renders honest abstention card when leaf area is insufficient (<3%)', () => {
    const scan = {
      classKey: 'blast',
      decision: { status: 'confident', top: { prob: 0.92 } },
      canvas: makeMockCanvas(100, 100, () => [255, 255, 255, 255]), // no leaf pixels
    };
    const html = renderCard(<SeverityScoreCard context="result" scan={scan} />, 'bn');
    expect(html).toContain('data-testid="severity-card-abstain"');
  });

  it('renders full severity card with IRRI scale and BRRI recommendations for Rice Blast', () => {
    // 100x100 canvas. 800 green pixels, 200 brown lesion pixels -> 20% coverage -> IRRI Scale 5 (Medium)
    const canvas = makeMockCanvas(100, 100, (x, y) => {
      const idx = y * 100 + x;
      if (idx < 800) return [40, 160, 40, 255];
      if (idx < 1000) return [160, 80, 30, 255];
      return [255, 255, 255, 255];
    });

    const scan = {
      classKey: 'blast',
      decision: { status: 'confident', top: { prob: 0.94 } },
      canvas,
    };

    const htmlBn = renderCard(<SeverityScoreCard context="result" scan={scan} />, 'bn');
    expect(htmlBn).toContain('data-testid="disease-severity-card"');
    expect(htmlBn).toContain('data-testid="severity-level-badge"');
    expect(htmlBn).toContain('ইরি (IRRI) স্কেল');
    expect(htmlBn).toContain('BRRI / DAE');

    const htmlEn = renderCard(<SeverityScoreCard context="result" scan={scan} />, 'en');
    expect(htmlEn).toContain('data-testid="disease-severity-card"');
    expect(htmlEn).toContain('IRRI Scale');
  });
});
