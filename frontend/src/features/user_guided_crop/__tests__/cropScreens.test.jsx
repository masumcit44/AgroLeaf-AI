import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from '../../../i18n/I18nProvider.jsx';
import PreviewScreen from '../../../components/PreviewScreen.jsx';
import ResultScreen from '../../../components/ResultScreen.jsx';
import CropScreen from '../CropScreen.jsx';
import { FEATURES, isFeatureOn } from '../../flags.js';
import texts from '../i18n.js';

const render = (ui, lang = 'bn') => renderToString(<I18nProvider initialLang={lang}>{ui}</I18nProvider>);
const result = {
  calibration: {},
  probs: new Float32Array(8),
  decision: { status: 'confident', top: { key: 'blast', prob: 0.9 }, top2: [] },
};

afterEach(() => { FEATURES.user_guided_crop = false; });

describe('user-guided crop is off by default and changes nothing', () => {
  it('flag defaults to OFF', () => {
    expect(FEATURES.user_guided_crop).toBe(false);
    expect(isFeatureOn('user_guided_crop')).toBe(false);
  });

  it('preview shows no focus button when the feature is off (onFocusCrop not passed)', () => {
    const html = render(<PreviewScreen canvas={null} quality={null} onRetake={() => {}} onAnalyze={() => {}} />);
    expect(html).not.toContain(texts.bn['user_guided_crop.focusButton']);
  });

  it('result shows no re-crop button or crop note when off', () => {
    const html = render(<ResultScreen canvas={null} analysisResult={result} onRetake={() => {}} />);
    expect(html).not.toContain(texts.bn['user_guided_crop.recrop']);
    expect(html).not.toContain('data-testid="crop-note"');
  });
});

describe('user-guided crop when on', () => {
  it('preview offers "focus on the diseased leaf" next to the normal analyse button', () => {
    const html = render(<PreviewScreen canvas={null} quality={null} onRetake={() => {}} onAnalyze={() => {}} onFocusCrop={() => {}} />);
    expect(html).toContain(texts.bn['user_guided_crop.focusButton']);
  });

  it('result says only the selected area was analysed, offers re-crop, or explains the fallback', () => {
    const used = render(<ResultScreen canvas={null} analysisResult={result} onRetake={() => {}} onRecrop={() => {}} cropUsed />);
    expect(used).toContain(texts.bn['user_guided_crop.usedNote']);
    expect(used).toContain(texts.bn['user_guided_crop.recrop']);
    const fb = render(<ResultScreen canvas={null} analysisResult={result} onRetake={() => {}} onRecrop={() => {}} cropFallback />, 'en');
    expect(fb).toContain(texts.en['user_guided_crop.fallback']);
  });

  it('crop screen renders its actions in both languages, with keyboard help for screen readers', () => {
    const canvas = { width: 800, height: 600 };
    for (const lang of ['bn', 'en']) {
      const html = render(<CropScreen canvas={canvas} onConfirm={() => {}} onCancel={() => {}} onAnalyseFull={() => {}} />, lang);
      for (const k of ['title', 'analyse', 'analyseFull', 'cancel', 'zoomIn', 'zoomOut']) {
        expect(html, `${lang} ${k}`).toContain(texts[lang][`user_guided_crop.${k}`]);
      }
      expect(html).toContain('id="ugc-help"');
    }
  });
});
