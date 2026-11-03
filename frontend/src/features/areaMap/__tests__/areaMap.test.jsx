import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { AreaReportPrompt, MapPage } from '../index.jsx';
import { getIsoWeek } from '../isoWeek.js';
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

describe('F23 areaMap i18n', () => {
  it('has identical keys for bn and en and all start with areaMap.', () => {
    const bnKeys = Object.keys(i18nTexts.bn).sort();
    const enKeys = Object.keys(i18nTexts.en).sort();
    expect(bnKeys).toEqual(enKeys);

    for (const k of bnKeys) {
      expect(k.startsWith('areaMap.')).toBe(true);
    }
  });
});

describe('F23 ISO week helper', () => {
  it('generates valid ISO week strings', () => {
    const week = getIsoWeek(new Date(2026, 10, 4));
    expect(week).toMatch(/^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/);
    expect(week).toBe('2026-W45');
  });
});

describe('F23 AreaReportPrompt component', () => {
  it('returns null if scan is not confident or missing', () => {
    expect(renderWithLang(<AreaReportPrompt scan={null} />)).toBe('');
    expect(renderWithLang(<AreaReportPrompt scan={{ isConfident: false }} />)).toBe('');
  });
});

describe('F23 MapPage component', () => {
  it('renders title, class selector, map container, legend and attribution', () => {
    const html = renderWithLang(<MapPage />, 'bn');
    expect(html).toContain('ধানের রোগের এলাকার মানচিত্র');
    expect(html).toContain('ব্লাস্ট');
    expect(html).toContain('leaflet-map-container');
    expect(html).toContain('area-map-legend');
    expect(html).toContain('geoBoundaries / BBS / OCHA ROAP');
  });

  it('renders English texts in en mode', () => {
    const html = renderWithLang(<MapPage />, 'en');
    expect(html).toContain('Area Rice Disease Map');
    expect(html).toContain('Blast');
    expect(html).toContain('leaflet-map-container');
  });
});
