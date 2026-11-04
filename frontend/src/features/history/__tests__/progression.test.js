import { describe, it, expect } from 'vitest';
import { calculateDayOffset, buildTimeline, evaluateProgression } from '../progression.js';

describe('F14 Progression Engine', () => {
  describe('calculateDayOffset', () => {
    it('returns 0 for identical dates or missing args', () => {
      expect(calculateDayOffset()).toBe(0);
      expect(calculateDayOffset('2026-05-01T10:00:00Z', '2026-05-01T10:00:00Z')).toBe(0);
    });

    it('calculates full days correctly', () => {
      const d0 = '2026-05-01T12:00:00Z';
      const d3 = '2026-05-04T12:00:00Z';
      const d7 = '2026-05-08T12:00:00Z';
      expect(calculateDayOffset(d0, d3)).toBe(3);
      expect(calculateDayOffset(d0, d7)).toBe(7);
    });

    it('handles negative or invalid gracefully', () => {
      expect(calculateDayOffset('invalid', 'date')).toBe(0);
      expect(calculateDayOffset('2026-05-05T00:00:00Z', '2026-05-01T00:00:00Z')).toBe(0);
    });
  });

  describe('buildTimeline', () => {
    it('returns empty array when no items provided', () => {
      expect(buildTimeline([])).toEqual([]);
      expect(buildTimeline(null)).toEqual([]);
    });

    it('assigns Day 0 to earliest entry and offset to later entries', () => {
      const items = [
        { id: '2', created_at: '2026-05-04T10:00:00Z', top_class: 'blast' },
        { id: '1', created_at: '2026-05-01T10:00:00Z', top_class: 'blast' },
        { id: '3', created_at: '2026-05-08T10:00:00Z', top_class: 'healthy' },
      ];
      const timeline = buildTimeline(items);
      expect(timeline.length).toBe(3);
      expect(timeline[0].id).toBe('1');
      expect(timeline[0].dayOffset).toBe(0);
      expect(timeline[0].isBaseline).toBe(true);

      expect(timeline[1].id).toBe('2');
      expect(timeline[1].dayOffset).toBe(3);
      expect(timeline[1].isBaseline).toBe(false);

      expect(timeline[2].id).toBe('3');
      expect(timeline[2].dayOffset).toBe(7);
      expect(timeline[2].isBaseline).toBe(false);
    });
  });

  describe('evaluateProgression', () => {
    it('detects recovery when infected leaf becomes healthy', () => {
      const before = { created_at: '2026-05-01T00:00:00Z', top_class: 'blast' };
      const after = { created_at: '2026-05-07T00:00:00Z', top_class: 'healthy' };
      const res = evaluateProgression(before, after);
      expect(res.status).toBe('improved');
      expect(res.improved).toBe(true);
      expect(res.daysApart).toBe(6);
    });

    it('flags persistent disease if unchanged after 7 or more days', () => {
      const before = { created_at: '2026-05-01T00:00:00Z', top_class: 'brown_spot' };
      const after = { created_at: '2026-05-09T00:00:00Z', top_class: 'brown_spot' };
      const res = evaluateProgression(before, after);
      expect(res.status).toBe('unchanged');
      expect(res.persistent).toBe(true);
      expect(res.daysApart).toBe(8);
    });

    it('detects worsening if healthy becomes infected', () => {
      const before = { created_at: '2026-05-01T00:00:00Z', top_class: 'healthy' };
      const after = { created_at: '2026-05-05T00:00:00Z', top_class: 'blast' };
      const res = evaluateProgression(before, after);
      expect(res.status).toBe('worsened');
      expect(res.improved).toBe(false);
    });

    it('detects different disease emergence', () => {
      const before = { created_at: '2026-05-01T00:00:00Z', top_class: 'blast' };
      const after = { created_at: '2026-05-05T00:00:00Z', top_class: 'bacterial_leaf_blight' };
      const res = evaluateProgression(before, after);
      expect(res.status).toBe('different_disease');
    });
  });
});
