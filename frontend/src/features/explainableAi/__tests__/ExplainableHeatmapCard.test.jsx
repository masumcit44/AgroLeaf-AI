import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from '../../../i18n/I18nProvider.jsx';
import ExplainableHeatmapCard from '../ExplainableHeatmapCard.jsx';

function renderWithI18n(ui, lang = 'bn') {
  return renderToString(<I18nProvider initialLang={lang}>{ui}</I18nProvider>);
}

describe('ExplainableHeatmapCard Component', () => {
  it('renders nothing if context is not result or scan is missing', () => {
    const html1 = renderWithI18n(<ExplainableHeatmapCard context="home" scan={{}} />);
    expect(html1).toBe('');

    const html2 = renderWithI18n(<ExplainableHeatmapCard context="result" scan={null} />);
    expect(html2).toBe('');
  });

  it('renders correctly for rice blast scan in Bangla', () => {
    // Generate synthetic camMaps
    const raw = new Float32Array(800);
    raw[1 * 100 + 55] = 10.0; // blast peak

    const scan = {
      classKey: 'blast',
      isConfident: true,
      decision: { status: 'confident', top: { key: 'blast', prob: 0.94 } },
      camMaps: { data: Array.from(raw), dims: [1, 8, 10, 10] },
    };

    const html = renderWithI18n(<ExplainableHeatmapCard context="result" scan={scan} />, 'bn');

    // Section landmark and title
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-labelledby="explainable-heatmap-title"');
    expect(html).toContain('AI কোন অংশে নজর দিয়েছে?');
    expect(html).toContain('রোগ শনাক্তকরণের দৃশ্যমান প্রমাণ (Heatmap)');

    // 3 Segmented tabs
    expect(html).toContain('মূল ছবি');
    expect(html).toContain('AI হাইলাইট');
    expect(html).toContain('একসাথে দেখুন');

    // Canvas & floating pill
    expect(html).toContain('data-testid="heatmap-canvas"');
    expect(html).toContain('মিশ্র ভিউ');

    // Opacity slider
    expect(html).toContain('id="heatmap-opacity-slider"');
    expect(html).toContain('স্বচ্ছতা (Opacity)');

    // Legend — updated to amber-crimson palette
    expect(html).toContain('কম প্রভাব');
    expect(html).toContain('বেশি প্রভাব');

    // Farmer explanation
    expect(html).toContain('লাল বা উজ্জ্বল অংশগুলো ছবির সেই অঞ্চল');

    // Technical accordion
    expect(html).toContain('id="xai-technical-toggle"');
    expect(html).toContain('বিচারক ও বিজ্ঞানীদের জন্য প্রযুক্তিগত বিবরণ');
    expect(html).toContain('EfficientNet-B0 v10');
    expect(html).toContain('Exact In-Graph Class Activation Mapping');

    // No CAM-unavailable notice when CAM data is present
    expect(html).not.toContain('data-testid="cam-unavailable-notice"');
  });

  it('renders correctly in English for healthy leaf', () => {
    const raw = new Float32Array(800);
    raw[10] = 5.0; // healthy class (index 0)

    const scan = {
      classKey: 'healthy',
      isConfident: true,
      decision: { status: 'confident', top: { key: 'healthy', prob: 0.98 } },
      camMaps: { data: Array.from(raw), dims: [1, 8, 10, 10] },
    };

    const html = renderWithI18n(<ExplainableHeatmapCard context="result" scan={scan} />, 'en');

    expect(html).toContain('Where Did AI Focus?');
    expect(html).toContain('Visual Disease Attribution (Heatmap)');
    expect(html).toContain('Original');
    expect(html).toContain('AI Highlight');
    expect(html).toContain('Overlay');
    expect(html).toContain('Blended');
    expect(html).toContain('The model analyzed the leaf surface and found no localized pathogenic lesions');
    expect(html).toContain('Attribution Intensity:');
    expect(html).toContain('Technical Details for Judges &amp; Researchers');
  });

  it('handles inconclusive not_sure scans safely with honesty disclaimer', () => {
    const scan = {
      classKey: 'not_sure',
      isConfident: false,
      decision: { status: 'inconclusive', top: null, reason: 'not_confident' },
      camMaps: null,
    };

    const html = renderWithI18n(<ExplainableHeatmapCard context="result" scan={scan} />, 'bn');

    expect(html).toContain('AI কোন অংশে নজর দিয়েছে?');
    expect(html).toContain('পাতাটির কোনো নির্দিষ্ট অংশে রোগের পর্যাপ্ত স্পষ্ট প্যাটার্ন শনাক্ত করা যায়নি');
    // not_sure: CAM unavailable notice should NOT show (not a "disease" scan)
    expect(html).not.toContain('data-testid="cam-unavailable-notice"');
  });

  it('shows cam-unavailable notice when confident disease scan has null camMaps (PWA cache miss)', () => {
    // This simulates a returning user with the old model cached:
    // camMaps is null because old model had no cam_maps output.
    const scan = {
      classKey: 'sheath_blight',
      isConfident: true,
      decision: { status: 'confident', top: { key: 'sheath_blight', prob: 0.88 } },
      camMaps: null,
    };

    const html = renderWithI18n(<ExplainableHeatmapCard context="result" scan={scan} />, 'bn');

    // Card must still render (prediction result available)
    expect(html).toContain('data-testid="explainable-heatmap-card"');
    expect(html).toContain('AI কোন অংশে নজর দিয়েছে?');

    // Farmer-friendly CAM unavailable notice must appear
    expect(html).toContain('data-testid="cam-unavailable-notice"');
    expect(html).toContain('এই ছবির জন্য AI হাইলাইট তৈরি করা যায়নি');
  });

  it('shows cam-unavailable notice for English scan with null camMaps', () => {
    const scan = {
      classKey: 'blast',
      isConfident: true,
      decision: { status: 'confident', top: { key: 'blast', prob: 0.78 } },
      camMaps: null,
    };

    const html = renderWithI18n(<ExplainableHeatmapCard context="result" scan={scan} />, 'en');

    expect(html).toContain('data-testid="cam-unavailable-notice"');
    expect(html).toContain('AI Highlight could not be generated');
  });
});
