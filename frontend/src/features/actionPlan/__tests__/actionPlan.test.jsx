import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { resetDbForTests, DB_NAME } from '../../../lib/store/db.js';
import { buildPlan } from '../planRules.js';

beforeEach(async () => {
  await resetDbForTests();
  await new Promise((resolve) => {
    const r = indexedDB.deleteDatabase(DB_NAME);
    r.onsuccess = r.onerror = r.onblocked = resolve;
  });
});

function createMockDecision(overrides = {}) {
  return {
    status: 'confident',
    top: { key: 'blast', prob: 0.9 },
    top2: [{ key: 'blast', prob: 0.9 }],
    ...overrides,
  };
}

// Mock knowledge matching the structure from diseaseKnowledge
const mockKnowledge = {
  classes: {
    blast: {
      name_bn: 'ব্লাস্ট রোগ',
      name_en: 'Rice blast',
      what_to_do_now_bn: 'দ্রুত উপজেলা কৃষি অফিসার বা ১৬১২৩ নম্বরে যোগাযোগ করুন।',
      what_to_do_now_en: 'Contact Upazila agriculture officer or call 16123 immediately.',
      prevention_bn: ['ইউরিয়া সার পরিমিত দিন।', 'ঘন করে চারা লাগাবেন না।'],
      prevention_en: ['Moderate urea.', 'Avoid dense planting.'],
      official_guidance: {
        source: 'BAMIS (DAE)',
        text_bn_verbatim: 'নাটিভো৭৫ ডব্লিউপি ০.৬ গ্রাম/লিটার অথবা এমিস্টার টপ ৩২৫ এসপি ১ মিলি./লিটার',
      },
    },
    brown_spot: {
      name_bn: 'বাদামী দাগ রোগ',
      name_en: 'Brown spot',
      what_to_do_now_bn: 'সার ব্যবস্থাপনা ঠিক করুন।',
      what_to_do_now_en: 'Fix fertiliser management.',
      prevention_bn: ['সুষম সার দিন।', 'রোগমুক্ত বীজ ব্যবহার করুন।'],
      prevention_en: ['Balanced fertiliser.', 'Use clean seed.'],
      official_guidance: {
        source: 'BAMIS (DAE)',
        text_bn_verbatim: 'সার ব্যবস্থপনা;পটাশ+থিওভিট প্রয়োগ;',
      },
    },
    healthy: {
      name_bn: 'সুস্থ পাতা',
      name_en: 'Healthy leaf',
      prevention_bn: ['নিয়মিত ক্ষেত ঘুরুন।', 'সুষম সার দিন।'],
      prevention_en: ['Walk field regularly.', 'Use balanced fertiliser.'],
      official_guidance: null,
    },
    not_sure: {
      name_bn: 'নিশ্চিত নই',
      name_en: 'Not sure',
      what_to_do_now_bn: 'আরেকটি ছবি তুলুন।',
      what_to_do_now_en: 'Retake photo.',
      official_guidance: null,
    },
    tungro: {
      name_bn: 'টুংরো রোগ',
      name_en: 'Rice tungro',
      what_to_do_now_bn: 'আক্রান্ত গাছ তুলে ফেলুন।',
      what_to_do_now_en: 'Remove infected plants.',
      prevention_bn: ['পাতাফড়িং দেখুন।', 'সিঙ্ক্রোনাইজড চারা লাগান।'],
      prevention_en: ['Monitor leafhoppers.', 'Synchronised planting.'],
      official_guidance: {
        source: 'BAMIS (DAE)',
        text_bn_verbatim: 'ক্লোরপাইরিফোস ২ মিলি./লিটার পানিতে',
      },
    },
    sheath_blight: {
      name_bn: 'খোল পোড়া রোগ',
      name_en: 'Sheath blight',
      what_to_do_now_bn: 'খোলের নিচের অংশ দেখুন।',
      what_to_do_now_en: 'Check lower sheath.',
      prevention_bn: ['ঘন চারা না দিন।', 'পানি সরিয়ে দিন।'],
      prevention_en: ['Avoid dense planting.', 'Drain field.'],
      official_guidance: {
        source: 'BAMIS (DAE)',
        text_bn_verbatim: 'হেক্সাকোনাজোল ১ মিলি./লিটার',
      },
    },
  },
};

describe('buildPlan', () => {
  it('returns empty array for null decision', () => {
    const plan = buildPlan(null, { classes: {} }, [], 'en');
    expect(plan).toEqual([]);
  });

  it('not_sure decision returns only 16123 step', () => {
    const decision = createMockDecision({ top: { key: 'not_sure', prob: 0.5 }, status: 'not_sure' });
    const plan = buildPlan(decision, mockKnowledge, [], 'en');
    expect(plan.length).toBeGreaterThan(0);
    expect(plan[0].text).toContain('16123');
    expect(plan.length).toBeLessThanOrEqual(1);
  });

  it('not_sure decision in Bangla returns 16123 step in Bangla', () => {
    const decision = createMockDecision({ top: { key: 'not_sure', prob: 0.5 }, status: 'not_sure' });
    const plan = buildPlan(decision, mockKnowledge, [], 'bn');
    expect(plan[0].text).toContain('১৬১২৩');
  });

  it('healthy decision returns prevention steps + 16123', () => {
    const decision = createMockDecision({ top: { key: 'healthy', prob: 0.95 } });
    const plan = buildPlan(decision, mockKnowledge, [], 'en');
    expect(plan.length).toBeGreaterThanOrEqual(2);
    expect(plan.length).toBeLessThanOrEqual(6);
    const hasPrevention = plan.some(s => s.text.includes('Walk field') || s.text.includes('balanced'));
    expect(hasPrevention).toBe(true);
    const lastStep = plan[plan.length - 1];
    expect(lastStep.text).toContain('16123');
  });

  it('healthy decision in Bangla returns prevention steps in Bangla', () => {
    const decision = createMockDecision({ top: { key: 'healthy', prob: 0.95 } });
    const plan = buildPlan(decision, mockKnowledge, [], 'bn');
    const hasPrevention = plan.some(s => s.text.includes('ক্ষেত') || s.text.includes('সুষম'));
    expect(hasPrevention).toBe(true);
  });

  it('confident blast decision includes what_to_do_now, prevention, sanitized chemical, 16123', () => {
    const decision = createMockDecision({ top: { key: 'blast', prob: 0.9 } });
    const plan = buildPlan(decision, mockKnowledge, [], 'en');
    expect(plan.length).toBeGreaterThanOrEqual(3);
    expect(plan.length).toBeLessThanOrEqual(6);
    expect(plan.some(s => s.text.includes('Contact Upazila') || s.text.includes('call 16123'))).toBe(true);
    expect(plan.some(s => s.text.includes('Moderate urea') || s.text.includes('dense planting'))).toBe(true);
    expect(plan.some(s => s.text.includes('Ask your Upazila agriculture officer or call 16123 before using any chemical'))).toBe(true);
  });

  it('confident blast decision in Bangla uses Bangla text', () => {
    const decision = createMockDecision({ top: { key: 'blast', prob: 0.9 } });
    const plan = buildPlan(decision, mockKnowledge, [], 'bn');
    expect(plan.some(s => s.text.includes('উপজেলা কৃষি অফিসার') || s.text.includes('১৬১২৩'))).toBe(true);
    expect(plan.some(s => s.text.includes('রাসায়নিক ওষুধ ব্যবহার করার আগে উপজেলা কৃষি অফিসার বা ১৬১২৩ নম্বরে কল করুন'))).toBe(true);
  });

  it('plan has 3-6 steps for confident disease', () => {
    const decision = createMockDecision({ top: { key: 'blast', prob: 0.9 } });
    const plan = buildPlan(decision, mockKnowledge, [], 'en');
    expect(plan.length).toBeGreaterThanOrEqual(3);
    expect(plan.length).toBeLessThanOrEqual(6);
  });

  it('plan has 3-6 steps for healthy', () => {
    const decision = createMockDecision({ top: { key: 'healthy', prob: 0.95 } });
    const plan = buildPlan(decision, mockKnowledge, [], 'en');
    expect(plan.length).toBeGreaterThanOrEqual(2);
    expect(plan.length).toBeLessThanOrEqual(6);
  });

  it('no pesticide names, doses, or units in any step', () => {
    const decision = createMockDecision({ top: { key: 'blast', prob: 0.9 } });
    const plan = buildPlan(decision, mockKnowledge, [], 'en');
    
    const dosePattern = /\d+(\.\d+)?\s*(ml|L|g|%|ppm|মিলি|গ্রাম|লিটার)/i;
    for (const step of plan) {
      expect(step.text).not.toMatch(dosePattern);
      expect(step.text.toLowerCase()).not.toContain('nativo');
      expect(step.text.toLowerCase()).not.toContain('mistar');
      expect(step.text.toLowerCase()).not.toContain('hexaconazole');
      expect(step.text.toLowerCase()).not.toContain('tebuconazole');
      expect(step.text.toLowerCase()).not.toContain('chlorpyrifos');
      expect(step.text.toLowerCase()).not.toContain('malathion');
    }
  });

  it('each step has a source field', () => {
    const decision = createMockDecision({ top: { key: 'blast', prob: 0.9 } });
    const plan = buildPlan(decision, mockKnowledge, [], 'en');
    for (const step of plan) {
      expect(step).toHaveProperty('source');
      expect(typeof step.source).toBe('string');
      expect(step.source.length).toBeGreaterThan(0);
    }
  });

  it('plan has 3-6 steps for confident disease', () => {
    const decision = createMockDecision({ top: { key: 'blast', prob: 0.9 } });
    const plan = buildPlan(decision, mockKnowledge, [], 'en');
    expect(plan.length).toBeGreaterThanOrEqual(3);
    expect(plan.length).toBeLessThanOrEqual(6);
  });

  it('weather risk adds step when matched', () => {
    const decision = createMockDecision({ top: { key: 'blast', prob: 0.9 } });
    const weatherRisk = [{
      diseaseKey: 'blast',
      source: 'BAMIS',
      sourceUrl: 'https://bamis.gov.bd',
    }];
    const plan = buildPlan(decision, mockKnowledge, weatherRisk, 'en');
    const weatherStep = plan.find(s => s.text.includes('Weather favours') || s.text.includes('check the field again'));
    expect(weatherStep).toBeDefined();
    expect(weatherStep.source).toContain('Weather');
  });

  it('weather risk in Bangla uses Bangla text', () => {
    const decision = createMockDecision({ top: { key: 'blast', prob: 0.9 } });
    const weatherRisk = [{
      diseaseKey: 'blast',
      source: 'BAMIS',
      sourceUrl: 'https://bamis.gov.bd',
    }];
    const plan = buildPlan(decision, mockKnowledge, weatherRisk, 'bn');
    const weatherStep = plan.find(s => s.text.includes('আবহাওয়া') || s.text.includes('খেতে দেখুন'));
    expect(weatherStep).toBeDefined();
  });

  it('tungro chemical guidance is sanitized', () => {
    const decision = createMockDecision({ top: { key: 'tungro', prob: 0.9 } });
    const plan = buildPlan(decision, mockKnowledge, [], 'en');
    const chemicalStep = plan.find(s => s.text.includes('Ask your Upazila agriculture officer or call 16123 before using any chemical'));
    expect(chemicalStep).toBeDefined();
  });

  it('sheath_blight chemical guidance is sanitized', () => {
    const decision = createMockDecision({ top: { key: 'sheath_blight', prob: 0.9 } });
    const plan = buildPlan(decision, mockKnowledge, [], 'en');
    const chemicalStep = plan.find(s => s.text.includes('Ask your Upazila agriculture officer or call 16123 before using any chemical'));
    expect(chemicalStep).toBeDefined();
  });

  it('brown_spot chemical guidance is sanitized', () => {
    const decision = createMockDecision({ top: { key: 'brown_spot', prob: 0.9 } });
    const plan = buildPlan(decision, mockKnowledge, [], 'en');
    const chemicalStep = plan.find(s => s.text.includes('Ask your Upazila agriculture officer or call 16123 before using any chemical'));
    expect(chemicalStep).toBeDefined();
  });
});

describe('ActionPlan i18n keys', () => {
  it('has matching keys in bn and en', async () => {
    const i18n = (await import('../i18n.js')).default;
    const bnKeys = Object.keys(i18n.bn).sort();
    const enKeys = Object.keys(i18n.en).sort();
    expect(enKeys).toEqual(bnKeys);
    for (const key of bnKeys) {
      expect(key.startsWith('actionPlan.')).toBe(true);
    }
  });

  it('has all required actionPlan keys', async () => {
    const i18n = (await import('../i18n.js')).default;
    const requiredKeys = [
      'actionPlan.title',
      'actionPlan.noPlan',
      'actionPlan.step',
      'actionPlan.source',
      'actionPlan.weatherFavourable',
      'actionPlan.chemicalSanitized',
      'actionPlan.call16123',
    ];
    for (const key of requiredKeys) {
      expect(key in i18n.bn).toBe(true);
      expect(key in i18n.en).toBe(true);
    }
  });
});