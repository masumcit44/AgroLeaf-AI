import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { resetDbForTests, DB_NAME } from '../../../lib/store/db.js';
import {
  parseFarmingPlannerSlots,
  calculateBarcFertilizer,
  buildPersonalizedRoadmap,
  runAgriculturalResearch,
  normalizeLandArea,
} from '../researchPlannerEngine.js';
import {
  savePlan,
  getPlan,
  listPlans,
  deletePlan,
  updatePlanTaskReminder,
} from '../plannerStore.js';

beforeEach(async () => {
  await resetDbForTests();
  await new Promise((resolve) => {
    const r = indexedDB.deleteDatabase(DB_NAME);
    r.onsuccess = r.onerror = r.onblocked = resolve;
  });
});

describe('F30 Research Planner Engine — Slot Parsing & Math', () => {
  it('normalizes land area across units correctly', () => {
    const bigha = normalizeLandArea(1, 'bigha');
    expect(bigha.standard_decimals).toBe(33);

    const decimals = normalizeLandArea(20, 'decimal');
    expect(decimals.standard_decimals).toBe(20);

    const acre = normalizeLandArea(2, 'acre');
    expect(acre.standard_decimals).toBe(200);
  });

  it('extracts BRRI dhan28 and relative transplanting date', () => {
    const query = 'আমি আজ BRRI dhan28-এর চারা রোপণ করেছি। এখন থেকে ধান কাটা পর্যন্ত আমার কী কী করতে হবে?';
    const slots = parseFarmingPlannerSlots(query);

    expect(slots.variety).not.toBeNull();
    expect(slots.variety.id).toBe('brri_28');
    expect(slots.variety.duration_days).toBe(140);
    expect(slots.season).toBe('boro');
    expect(slots.category).toBe('crop_roadmap');
  });

  it('extracts land area and calculates BARC fertilizer dosages for 33 decimals (1 bigha)', () => {
    const fert = calculateBarcFertilizer('boro', 'brri_28', 33);

    expect(fert.urea.totalKg).toBeGreaterThanOrEqual(35);
    expect(fert.urea.totalKg).toBeLessThanOrEqual(40);
    expect(fert.urea.split1Kg).toBeGreaterThan(0);
    expect(fert.urea.split2Kg).toBeGreaterThan(0);
    expect(fert.urea.split3Kg).toBeGreaterThan(0);
    expect(fert.tsp.totalKg).toBeGreaterThanOrEqual(14);
    expect(fert.mop.totalKg).toBeGreaterThanOrEqual(16);
    expect(fert.gypsum.totalKg).toBeGreaterThanOrEqual(9);
    expect(fert.zinc.totalKg).toBeGreaterThanOrEqual(1.4);
  });

  it('builds a 5-stage personalized roadmap with exact dates and tasks', () => {
    const slots = parseFarmingPlannerSlots('আমি আজ BRRI dhan28 রোপণ করেছি।');
    const plan = buildPersonalizedRoadmap(slots);

    expect(plan.id).toBeDefined();
    expect(plan.title_bn).toContain('ব্রি ধান২৮');
    expect(plan.field_profile.duration_days).toBe(140);
    expect(plan.roadmap.length).toBeGreaterThanOrEqual(5);

    // Verify first stage has shallow water & 1st topdress
    const stage1 = plan.roadmap[0];
    expect(stage1.tasks.length).toBeGreaterThanOrEqual(2);
    expect(stage1.tasks.some((t) => t.category === 'water')).toBe(true);
    expect(stage1.tasks.some((t) => t.category === 'fertilizer')).toBe(true);

    // Verify final harvest stage has drainage
    const finalStage = plan.roadmap[plan.roadmap.length - 1];
    expect(finalStage.tasks.some((t) => t.category === 'harvest')).toBe(true);
  });

  it('triggers progressive clarification when roadmap is requested without variety', async () => {
    const res = await runAgriculturalResearch('আমি আজ ধানের চারা রোপণ করেছি। এখন কী করব?');

    expect(res.isClarification).toBe(true);
    expect(res.slotNeeded).toBe('variety');
    expect(res.chips).toContain('ব্রি ধান২৮');
    expect(res.chips).toContain('ব্রি ধান২৯');
  });

  it('answers nutrient education questions accurately', async () => {
    const res = await runAgriculturalResearch('পটাশ আর ইউরিয়ার কাজ কী?');

    expect(res.isEducational).toBe(true);
    expect(res.textBn).toContain('ইউরিয়া (নাইট্রোজেন)');
    expect(res.textBn).toContain('পটাশ / এমওপি');
    expect(res.sources.length).toBeGreaterThan(0);
  });

  it('honestly abstains on out-of-domain livestock and non-rice queries', async () => {
    const res = await runAgriculturalResearch('মুরগির ওষুধ কীভাবে দেব?');

    expect(res.isAbstention).toBe(true);
    expect(res.textBn).toContain('শুধুমাত্র ধান চাষ');
    expect(res.textBn).toContain('১৬১২৩');
  });
});

describe('F30 Planner Store — On-Device IndexedDB Persistence & F24 Integration', () => {
  it('saves, retrieves, updates, and deletes crop plans', async () => {
    const dummyPlan = {
      id: 'test_plan_123',
      title_bn: 'টেস্ট পরিকল্পনা',
      roadmap: [
        {
          stage_id: 'stage_1',
          tasks: [
            { task_id: 'task_1', title_bn: '১ম সার প্রয়োগ', reminder_active: false },
          ],
        },
      ],
    };

    // Save
    const saved = await savePlan(dummyPlan);
    expect(saved.id).toBe('test_plan_123');
    expect(saved.is_saved).toBe(true);

    // Retrieve
    const fetched = await getPlan('test_plan_123');
    expect(fetched).not.toBeNull();
    expect(fetched.title_bn).toBe('টেস্ট পরিকল্পনা');

    // List
    const all = await listPlans();
    expect(all.some((p) => p.id === 'test_plan_123')).toBe(true);

    // Update F24 Reminder link
    const updated = await updatePlanTaskReminder('test_plan_123', 'task_1', 'rem_999');
    expect(updated.roadmap[0].tasks[0].reminder_active).toBe(true);
    expect(updated.roadmap[0].tasks[0].reminder_id).toBe('rem_999');

    // Delete
    const deleted = await deletePlan('test_plan_123');
    expect(deleted).toBe(true);
    const afterDelete = await getPlan('test_plan_123');
    expect(afterDelete).toBeNull();
  });
});
