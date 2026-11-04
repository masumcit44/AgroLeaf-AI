import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from '../../../i18n/I18nProvider.jsx';
import { ConfidenceScoreCard } from '../ConfidenceScoreCard.jsx';

function renderWithI18n(ui, lang = 'bn') {
  return renderToString(<I18nProvider initialLang={lang}>{ui}</I18nProvider>);
}

describe('ConfidenceScoreCard Component', () => {
  it('renders nothing if context is not result or scan is missing', () => {
    const html1 = renderWithI18n(<ConfidenceScoreCard context="home" scan={{}} />);
    expect(html1).toBe('');

    const html2 = renderWithI18n(<ConfidenceScoreCard context="result" scan={null} />);
    expect(html2).toBe('');
  });

  it('renders nothing for not_sure or inconclusive decisions', () => {
    const scan = {
      decision: {
        status: 'inconclusive',
        top: { key: 'blast', prob: 0.45 },
      },
    };
    const html = renderWithI18n(<ConfidenceScoreCard context="result" scan={scan} />);
    expect(html).toBe('');
  });

  it('renders nothing for not_rice class', () => {
    const scan = {
      decision: {
        status: 'confident',
        top: { key: 'not_rice', prob: 0.95 },
      },
    };
    const html = renderWithI18n(<ConfidenceScoreCard context="result" scan={scan} />);
    expect(html).toBe('');
  });

  it('renders High Confidence badge (>=90%) in Bangla without retake or helpline prompts', () => {
    const scan = {
      decision: {
        status: 'confident',
        top: { key: 'blast', prob: 0.94 },
      },
    };
    const html = renderWithI18n(<ConfidenceScoreCard context="result" scan={scan} />, 'bn');

    expect(html).toContain('data-testid="confidence-score-card"');
    expect(html).toContain('AI আস্থা স্কোর');
    expect(html).toContain('উচ্চ আস্থা ✅');
    expect(html).toContain('94%');
    expect(html).toContain('bg-emerald-500');

    // No retake or helpline prompts at 94%
    expect(html).not.toContain('data-testid="confidence-retake-prompt"');
    expect(html).not.toContain('data-testid="confidence-helpline-prompt"');
  });

  it('renders Medium Confidence badge (70-89%) in English', () => {
    const scan = {
      decision: {
        status: 'confident',
        top: { key: 'brown_spot', prob: 0.78 },
      },
    };
    const html = renderWithI18n(<ConfidenceScoreCard context="result" scan={scan} />, 'en');

    expect(html).toContain('AI Confidence Score');
    expect(html).toContain('Medium Confidence ⚠️');
    expect(html).toContain('78%');
    expect(html).toContain('bg-amber-400');
    expect(html).not.toContain('data-testid="confidence-retake-prompt"');
  });

  it('renders Low Confidence badge and Retake Photo prompt when confidence is between 50% and 59%', () => {
    const scan = {
      decision: {
        status: 'confident',
        top: { key: 'tungro', prob: 0.55 },
      },
    };
    const html = renderWithI18n(<ConfidenceScoreCard context="result" scan={scan} />, 'bn');

    expect(html).toContain('কম আস্থা ❌');
    expect(html).toContain('55%');
    expect(html).toContain('bg-red-500');

    // Should prompt to retake photo (<60%)
    expect(html).toContain('data-testid="confidence-retake-prompt"');
    expect(html).toContain('আরেকটি ছবি তুলুন');

    // Should NOT prompt helpline (>=50%)
    expect(html).not.toContain('data-testid="confidence-helpline-prompt"');
  });

  it('renders Call Helpline 16123 prompt when confidence is below 50%', () => {
    const scan = {
      decision: {
        status: 'confident',
        top: { key: 'sheath_blight', prob: 0.48 },
      },
    };
    const html = renderWithI18n(<ConfidenceScoreCard context="result" scan={scan} />, 'bn');

    expect(html).toContain('কম আস্থা ❌');
    expect(html).toContain('48%');

    // Should show both retake and helpline prompts (<50%)
    expect(html).toContain('data-testid="confidence-retake-prompt"');
    expect(html).toContain('data-testid="confidence-helpline-prompt"');
    expect(html).toContain('href="tel:16123"');
    expect(html).toContain('কৃষি হেল্পলাইন 16123-এ কল করুন');
  });
});

