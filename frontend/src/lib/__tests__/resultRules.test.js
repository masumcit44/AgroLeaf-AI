import { describe, it, expect } from 'vitest';
import { getConfidenceLabel, shouldShowOfficialGuidance } from '../resultRules.js';

describe('getConfidenceLabel', () => {
  it('returns high confidence for prob >= 0.90 in Bangla and English', () => {
    expect(getConfidenceLabel(0.95, 'bn')).toBe('উচ্চ আস্থা');
    expect(getConfidenceLabel(0.90, 'bn')).toBe('উচ্চ আস্থা');
    expect(getConfidenceLabel(0.92, 'en')).toBe('High confidence');
  });

  it('returns moderate confidence for prob < 0.90 in Bangla and English', () => {
    expect(getConfidenceLabel(0.899, 'bn')).toBe('মাঝারি আস্থা');
    expect(getConfidenceLabel(0.65, 'bn')).toBe('মাঝারি আস্থা');
    expect(getConfidenceLabel(0.70, 'en')).toBe('Moderate confidence');
  });
});

describe('shouldShowOfficialGuidance', () => {
  it('shows official guidance when verbatim text is legitimate and complete', () => {
    const valid = {
      source: 'BAMIS (কৃষি সম্প্রসারণ অধিদপ্তর)',
      url: 'https://www.bamis.gov.bd/diseases/1/all/76',
      text_bn_verbatim: 'নাটিভো৭৫ ডব্লিউপি ০.৬ গ্রাম প্রয়োগ করুন।',
    };
    expect(shouldShowOfficialGuidance(valid)).toBe(true);
  });

  it('hides official guidance when object is null or undefined', () => {
    expect(shouldShowOfficialGuidance(null)).toBe(false);
    expect(shouldShowOfficialGuidance(undefined)).toBe(false);
    expect(shouldShowOfficialGuidance({})).toBe(false);
  });

  it('hides official guidance when text starts with or contains square brackets [placeholder]', () => {
    const placeholder1 = {
      text_bn_verbatim: '[BAMIS lists Hexaconazole (Nativo WG) - copy before display]',
    };
    const placeholder2 = {
      text_bn_verbatim: 'টুংরো ভাইরাস: [BAMIS lists Malathion - copy before display]',
    };
    expect(shouldShowOfficialGuidance(placeholder1)).toBe(false);
    expect(shouldShowOfficialGuidance(placeholder2)).toBe(false);
  });
});
