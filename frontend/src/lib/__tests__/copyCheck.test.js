import { describe, it, expect } from 'vitest';
import { checkForbiddenCopy } from '../copyCheck.js';
import bnData from '../../../../disease_knowledge/disease_information_bn.json';
import enData from '../../../../disease_knowledge/disease_information_en.json';
import bnDict from '../../i18n/bn.js';
import enDict from '../../i18n/en.js';

describe('Copy Compliance Check (copyCheck)', () => {
  const allowedDisclaimers = [
    bnData._meta.disclaimer_bn,
    enData._meta.disclaimer_en,
    bnDict.footerDisclaimer,
    enDict.footerDisclaimer,
    bnDict.aboutWhatItIsNot,
    enDict.aboutWhatItIsNot,
  ];

  it('passes when text only contains legitimate negated disclaimers', () => {
    const pageSampleWithDisclaimer = `
      AgroLeaf AI - Rice Disease Screening
      ${enDict.footerDisclaimer}
      ${enDict.aboutWhatItIsNot}
    `;
    const resultEn = checkForbiddenCopy(pageSampleWithDisclaimer, allowedDisclaimers);
    expect(resultEn.pass).toBe(true);
    expect(resultEn.found).toEqual([]);

    const pageSampleBn = `
      এগ্রোলিফ এআই - ধান ফসলের রোগ স্ক্রীনিং
      ${bnDict.footerDisclaimer}
      ${bnDict.aboutWhatItIsNot}
    `;
    const resultBn = checkForbiddenCopy(pageSampleBn, allowedDisclaimers);
    expect(resultBn.pass).toBe(true);
    expect(resultBn.found).toEqual([]);
  });

  it('fails when prohibited phrases appear outside exempted disclaimers', () => {
    const badExamples = [
      'Accurate AI diagnosis of leaf diseases',
      'ধানের রোগ নির্ণয় করুন সহজেই',
      'Guaranteed 100% accurate results',
      'Contact our free call helpline',
    ];

    for (const bad of badExamples) {
      const res = checkForbiddenCopy(bad, allowedDisclaimers);
      expect(res.pass).toBe(false);
      expect(res.found.length).toBeGreaterThan(0);
    }
  });

  it('still detects prohibited phrases even if a valid disclaimer is also present', () => {
    const mixed = `
      ${enDict.footerDisclaimer}
      Our new AI diagnosis engine is fast.
    `;
    const res = checkForbiddenCopy(mixed, allowedDisclaimers);
    expect(res.pass).toBe(false);
    expect(res.found).toContain('diagnosis');
  });
});
