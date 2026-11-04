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

const mockKnowledge = {
  classes: {
    blast: {
      name_bn: 'ব্লাস্ট রোগ',
      name_en: 'Rice blast',
      what_to_do_now_bn: 'জমিতে ইউরিয়া সারের উপরিপ্রয়োগ সাময়িক বন্ধ রাখুন এবং জমির রস বজায় রাখুন।',
      what_to_do_now_en: 'Suspend urea top-dressing immediately and ensure fields do not dry out.',
      prevention_bn: ['রোগমুক্ত বীজ শোধন করে ব্যবহার করুন।', 'চারা অতিরিক্ত ঘন করে রোপণ করবেন না।'],
      prevention_en: ['Use treated disease-free certified seeds.', 'Avoid excessively dense planting.'],
    },
    brown_spot: {
      name_bn: 'বাদামী দাগ রোগ',
      name_en: 'Brown spot',
      what_to_do_now_bn: 'সুষম সার নিশ্চিত করুন এবং পটাশ সারের ঘাটতি পূরণ করুন।',
      what_to_do_now_en: 'Ensure balanced fertilization and correct potassium deficiency.',
      prevention_bn: ['জমিতে পর্যাপ্ত জৈব সার প্রয়োগ করুন।', 'সুস্থ ও পরিষ্কার বীজ ব্যবহার করুন।'],
      prevention_en: ['Apply adequate organic manure to field.', 'Use clean and healthy certified seeds.'],
    },
    sheath_blight: {
      name_bn: 'খোল পোড়া রোগ',
      name_en: 'Sheath blight',
      what_to_do_now_bn: 'জমির অতিরিক্ত পানি নিষ্কাশন করে ২-৩ দিন জমিতে বাতাস চলাচলের সুযোগ দিন।',
      what_to_do_now_en: 'Drain stagnant field water and allow aeration for 2–3 days.',
      prevention_bn: ['ঘন গোছা রোপণ পরিহার করুন।', 'জমির আগাছা ও অবশিষ্টাংশ পরিষ্কার রাখুন।'],
      prevention_en: ['Avoid congested hill transplanting.', 'Keep field bunds free from weeds and residues.'],
    },
    tungro: {
      name_bn: 'টুংরো রোগ',
      name_en: 'Rice tungro',
      what_to_do_now_bn: 'আক্রান্ত ধান গাছ তুলে ধ্বংস করুন যাতে সবুজ পাতাফড়িং রোগ ছড়াতে না পারে।',
      what_to_do_now_en: 'Rogue and destroy infected hills to prevent green leafhopper vector spread.',
      prevention_bn: ['একই এলাকায় একই সাথে ধান রোপণ করুন।', 'আলোর ফাঁদ দিয়ে পাতাফড়িং উপস্থিতি পর্যবেক্ষণ করুন।'],
      prevention_en: ['Synchronise planting across community.', 'Monitor green leafhoppers with light traps.'],
    },
    bacterial_leaf_blight: {
      name_bn: 'ব্যাকটেরিয়াজনিত পাতা পোড়া',
      name_en: 'Bacterial leaf blight',
      what_to_do_now_bn: 'ইউরিয়া সার প্রয়োগ বন্ধ রাখুন এবং অতিরিক্ত পটাশ সার উপরিপ্রয়োগ করুন।',
      what_to_do_now_en: 'Halt urea top-dressing and apply supplemental muriate of potash.',
      prevention_bn: ['আক্রান্ত জমির পানি সুস্থ জমিতে যেতে দেবেন না।', 'সুষম মাত্রায় সার ব্যবহার করুন।'],
      prevention_en: ['Prevent runoff into adjacent healthy plots.', 'Maintain balanced N-P-K ratios.'],
    },
    healthy: {
      name_bn: 'সুস্থ পাতা',
      name_en: 'Healthy leaf',
      prevention_bn: ['নিয়মিত ক্ষেত ঘুরে রোগ-বালাইয়ের প্রাথমিক লক্ষণ পর্যবেক্ষণ করুন।', 'সুষম মাত্রায় সুষম সার দিন।'],
      prevention_en: ['Inspect fields weekly for early symptoms.', 'Maintain balanced fertilizer application.'],
    },
  },
};

describe('F10 Action Plan - planRules.js', () => {
  const ALL_CLASSES = ['blast', 'brown_spot', 'sheath_blight', 'tungro', 'bacterial_leaf_blight'];
  const ALLOWED_SOURCES = ['bamis', 'safety'];
  const DOSE_REGEX = /\d+(\.\d+)?\s*(ml|L|g|%|ppm|মিলি|গ্রাম|লিটার)/i;

  it('loops over every class x [bn, en] and verifies step parity, safety regex, and allowed labels', () => {
    for (const cls of ALL_CLASSES) {
      const decision = createMockDecision({ top: { key: cls, prob: 0.92 } });
      const planBn = buildPlan(decision, mockKnowledge, [], 'bn');
      const planEn = buildPlan(decision, mockKnowledge, [], 'en');

      // 1. Same step count
      expect(planBn.length, `${cls} step count parity`).toBe(planEn.length);
      expect(planBn.length).toBeGreaterThanOrEqual(3);
      expect(planBn.length).toBeLessThanOrEqual(5);

      // 2. No pesticide doses or chemical active ingredients
      for (const step of [...planBn, ...planEn]) {
        expect(step.text).not.toMatch(DOSE_REGEX);
        expect(step.text.toLowerCase()).not.toContain('nativo');
        expect(step.text.toLowerCase()).not.toContain('hexaconazole');
        expect(step.text.toLowerCase()).not.toContain('chlorpyrifos');

        // 3. Labels from allowed list
        expect(ALLOWED_SOURCES).toContain(step.source);
      }

      // 4. Last step is always 16123 safety call
      expect(planBn[planBn.length - 1].text).toContain('১৬১২৩');
      expect(planBn[planBn.length - 1].source).toBe('safety');
      expect(planEn[planEn.length - 1].text).toContain('16123');
      expect(planEn[planEn.length - 1].source).toBe('safety');
    }
  });

  it('healthy plan has exact parity between bn and en', () => {
    const decision = createMockDecision({ top: { key: 'healthy', prob: 0.98 } });
    const planBn = buildPlan(decision, mockKnowledge, [], 'bn');
    const planEn = buildPlan(decision, mockKnowledge, [], 'en');

    expect(planBn.length).toBe(planEn.length);
    expect(planBn.length).toBeGreaterThanOrEqual(2);
    for (const step of [...planBn, ...planEn]) {
      expect(ALLOWED_SOURCES).toContain(step.source);
      expect(step.text).not.toMatch(DOSE_REGEX);
    }
    expect(planBn[planBn.length - 1].text).toContain('১৬১২৩');
    expect(planEn[planEn.length - 1].text).toContain('16123');
  });

  it('not-sure plan has exact parity between bn and en', () => {
    const decision = createMockDecision({ top: { key: 'not_sure', prob: 0.4 }, status: 'not_sure' });
    const planBn = buildPlan(decision, mockKnowledge, [], 'bn');
    const planEn = buildPlan(decision, mockKnowledge, [], 'en');

    expect(planBn.length).toBe(planEn.length);
    expect(planBn.length).toBe(2);
    expect(planBn[0].source).toBe('safety');
    expect(planBn[1].source).toBe('safety');
    expect(planBn[1].text).toContain('১৬১২৩');
    expect(planEn[1].text).toContain('16123');
  });

  it('adds weather-favourable advice when weather risk is present', () => {
    const decision = createMockDecision({ top: { key: 'blast', prob: 0.9 } });
    const weatherRisk = [{ diseaseKey: 'blast', source: 'BAMIS' }];
    const planBn = buildPlan(decision, mockKnowledge, weatherRisk, 'bn');
    const planEn = buildPlan(decision, mockKnowledge, weatherRisk, 'en');

    expect(planBn.length).toBe(planEn.length);
    expect(planBn.some((s) => s.text.includes('অনুকূল'))).toBe(true);
    expect(planEn.some((s) => s.text.includes('Weather favours'))).toBe(true);
  });
});

describe('F10 ActionPlan i18n keys', () => {
  it('has matching keys in bn and en with actionPlan. prefix', async () => {
    const i18n = (await import('../i18n.js')).default;
    const bnKeys = Object.keys(i18n.bn).sort();
    const enKeys = Object.keys(i18n.en).sort();
    expect(enKeys).toEqual(bnKeys);
    for (const key of bnKeys) {
      expect(key.startsWith('actionPlan.')).toBe(true);
    }
    expect(i18n.bn['actionPlan.source.bamis']).toBe('বামিস/ডিএই নির্দেশনা');
    expect(i18n.bn['actionPlan.source.safety']).toBe('এগ্রোলিফ নিরাপত্তা নিয়ম');
    expect(i18n.en['actionPlan.source.bamis']).toBe('BAMIS/DAE guidance');
    expect(i18n.en['actionPlan.source.safety']).toBe('AgroLeaf safety rule');
  });
});
