import { describe, it, expect } from 'vitest';
import { generateCropCalendar, CROP_STAGES } from '../cropCalendarEngine.js';

describe('Personalized Crop Calendar Engine', () => {
  it('generates 8 chronological tasks for transplanted Boro rice', () => {
    const profile = {
      season: 'boro',
      variety_id: 'brri_28',
      cultivation_method: 'transplanted',
      transplant_date: '2026-01-15',
      district_name_bn: 'গাজীপুর',
    };

    const calendar = generateCropCalendar(profile);
    expect(calendar.season).toBe('boro');
    expect(calendar.variety_id).toBe('brri_28');
    expect(calendar.duration_days).toBe(140);
    expect(calendar.tasks.length).toBe(8);
    expect(calendar.tasks[0].id).toBe('task_topdress_1');
    expect(calendar.tasks[7].id).toBe('task_harvest');
  });

  it('calculates current crop stage and progress percentage correctly', () => {
    // Transplanted 30 days ago for 150-day duration -> 20% progress -> active tillering
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const dateStr = d.toISOString().split('T')[0];

    const profile = {
      season: 'boro',
      variety_id: 'unknown',
      variety_duration_days: 150,
      transplant_date: dateStr,
    };

    const calendar = generateCropCalendar(profile);
    expect(calendar.days_elapsed).toBe(30);
    expect(calendar.progress_pct).toBe(20);
    expect(calendar.current_stage.id).toBe('stage_tillering');
  });

  it('adjusts offsets earlier for direct-seeded rice', () => {
    const baseDate = '2026-06-01';
    const calTransplant = generateCropCalendar({
      cultivation_method: 'transplanted',
      transplant_date: baseDate,
      variety_duration_days: 140,
    });

    const calDirect = generateCropCalendar({
      cultivation_method: 'direct_seeded',
      direct_seeding_date: baseDate,
      variety_duration_days: 140,
    });

    // In direct seeded rice, seedling topdress offset is shifted earlier
    expect(calDirect.tasks[1].day_offset).toBeLessThan(calTransplant.tasks[1].day_offset);
  });

  it('handles missing date with crop_stage fallback and marks is_estimated', () => {
    const profile = {
      season: 'aman',
      variety_id: 'brri_49',
      crop_stage: 'stage_booting',
    };

    const calendar = generateCropCalendar(profile);
    expect(calendar.is_estimated).toBe(true);
    expect(calendar.base_date).toBeTruthy();
    expect(calendar.tasks[0].is_estimated).toBe(true);
  });

  it('identifies next_task from uncompleted tasks', () => {
    const profile = {
      season: 'boro',
      variety_id: 'brri_28',
      transplant_date: '2026-01-01',
      completed_task_ids: ['task_topdress_1'],
    };

    const calendar = generateCropCalendar(profile);
    expect(calendar.next_task).toBeTruthy();
    expect(calendar.next_task.id).not.toBe('task_topdress_1');
  });
});
