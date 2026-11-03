import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import ResultCard from '../ResultCard.jsx';
import InputSafetyCard from '../InputSafetyCard.jsx';
import { INPUT_SAFETY_TIP_KEYS } from '../../lib/inputSafety.js';
import { I18nProvider } from '../../i18n/I18nProvider.jsx';
import { checkForbiddenCopy } from '../../lib/copyCheck.js';
import bn from '../../i18n/bn.js';
import en from '../../i18n/en.js';

const KEYS = ['inputSafetyTitle', 'inputSafetyIntro', 'inputSafetySource', ...INPUT_SAFETY_TIP_KEYS];
const render = (ui, lang = 'bn') => renderToString(<I18nProvider initialLang={lang}>{ui}</I18nProvider>);

describe('F7 anti-counterfeit input card: content', () => {
  it('every text exists, non-empty, in Bangla and English', () => {
    for (const key of KEYS) {
      expect(typeof bn[key] === 'string' && bn[key].length > 0, `bn.${key}`).toBe(true);
      expect(typeof en[key] === 'string' && en[key].length > 0, `en.${key}`).toBe(true);
    }
  });

  it('names no dose, unit or product and passes the copy rules', () => {
    // Dose decisions stay with the agriculture officer (app rule); units would imply a dose
    // (Bangla units matched as whole units: "মিলিয়ে", to check, must not count as millilitre)
    const doseWords = /\b(ml|mg|gram|litre|liter|kg|per acre|bigha)\b|মিলিলিটার|মি\.লি|গ্রাম|লিটার|কেজি|বিঘা|শতাংশ/i;
    for (const key of KEYS) {
      for (const text of [bn[key], en[key]]) {
        expect(doseWords.test(text), `${key}: ${text}`).toBe(false);
        expect(checkForbiddenCopy(text).pass, key).toBe(true);
      }
    }
  });

  it('does not claim a farmer can spot a fake by looking, and says how to report one', () => {
    expect(en.inputSafetyIntro).toMatch(/cannot always tell/);
    expect(en.inputSafetyTipReport).toMatch(/can be fake even if everything looks right/);
    expect(bn.inputSafetyTipReport).toContain('১৬১২৩');
    expect(en.inputSafetySource).toMatch(/not yet been reviewed/);
  });
});

describe('F7 anti-counterfeit input card: where it appears', () => {
  it('is collapsed by default (the diagnosis stays first)', () => {
    const html = render(<InputSafetyCard />);
    expect(html).toContain(bn.inputSafetyTitle);
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain(bn.inputSafetyTipDealer);
  });

  it('is shown on a disease result and not on a healthy result', () => {
    const disease = render(<ResultCard classKey="brown_spot" prob={0.9} diseaseData={{ name_bn: 'বাদামী দাগ রোগ' }} />);
    const healthy = render(<ResultCard classKey="healthy" prob={0.95} diseaseData={{ name_bn: 'সুস্থ পাতা' }} />);
    expect(disease).toContain(bn.inputSafetyTitle);
    expect(healthy).not.toContain(bn.inputSafetyTitle);
  });

  it('follows the English toggle', () => {
    const html = render(<ResultCard classKey="blast" prob={0.9} diseaseData={{ name_en: 'Blast' }} />, 'en');
    expect(html).toContain(en.inputSafetyTitle);
  });
});
