import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import AccuracyPage from '../AccuracyPage.jsx';
import { I18nProvider } from '../../i18n/I18nProvider.jsx';
import { formatMetric, formatCount } from '../../lib/metricsFormatting.js';
import fixtureData from './fixtures/metrics-fixture.json';

function renderMarkup(ui, lang = 'en') {
  return renderToString(<I18nProvider initialLang={lang}>{ui}</I18nProvider>);
}

describe('AccuracyPage Renderer (X2)', () => {
  it('renders in-progress banner and no numbers when metrics file is missing (null metrics)', () => {
    const html = renderMarkup(<AccuracyPage initialMetrics={null} />);

    // In-progress banner must be present
    expect(html).toContain('Evaluation in progress');
    expect(html).toContain('data-testid="in-progress-banner"');

    // Metrics tables must NOT be present
    expect(html).not.toContain('data-testid="internal-metrics"');
    expect(html).not.toContain('data-testid="per-class-table"');
    expect(html).not.toContain('data-testid="external-table"');

    // Mandatory disclaimers and credits must still be present
    expect(html).toContain('data-testid="limitations-section"');
    expect(html).toContain('data-testid="dataset-credits"');
  });

  it('renders numbers accurately when metrics fixture is loaded', () => {
    const html = renderMarkup(<AccuracyPage initialMetrics={fixtureData} />);

    // Internal metrics table should be present
    expect(html).toContain('data-testid="internal-metrics"');

    // Verify formatted values from fixture (0.777 -> 77.7%, 0.666 -> 66.6%, 0.999 -> 99.9%, 0.111 -> 11.1%)
    expect(html).toContain('77.7%');
    expect(html).toContain('66.6%');
    expect(html).toContain('99.9%');
    expect(html).toContain('11.1%');

    // Per-class metrics
    expect(html).toContain('91.6%'); // healthy f1
    expect(html).toContain('83.8%'); // blast f1

    // External set
    expect(html).toContain('District Field Set Alpha');
    expect(html).toContain('84.4%'); // selective acc

    // Plain language summary
    expect(html).toContain('data-testid="plain-summary"');

    // Model facts
    expect(html).toContain('mnv3_large');
  });

  it('renders null metric values as "—" and never as "0" or "0%"', () => {
    // Test formatting helpers directly
    expect(formatMetric(null)).toBe('—');
    expect(formatMetric(undefined)).toBe('—');
    expect(formatCount(null)).toBe('—');

    // In fixtureData, leaf_smut has null precision, recall, and f1
    const html = renderMarkup(<AccuracyPage initialMetrics={fixtureData} />);

    expect(html).toContain('Leaf smut');
    // Ensure em-dash is rendered
    expect(html).toContain('—');

    // Ensure it doesn't invent 0.0% for null leaf smut metrics
    expect(html).not.toContain('Leaf smut</td><td class="px-3 py-2 text-center text-gray-600">120</td><td class="px-3 py-2 text-center text-gray-700">0.0%');
  });

  it('async fetch integration loads metrics data when 200 OK', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => fixtureData,
    });

    try {
      const res = await fetch('/data/metrics-v1.json');
      const data = await res.json();
      expect(data.FIXTURE_NOT_REAL).toBe(true);
      expect(data.internal_test.macro_f1).toBe(0.777);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('ensures fixture file contains FIXTURE_NOT_REAL and is never in public/', () => {
    expect(fixtureData.FIXTURE_NOT_REAL).toBe(true);
  });
});
