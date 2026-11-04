import { describe, it, expect } from 'vitest';
import { DIVISIONS, DISTRICT_TO_DIVISION, getUpazilasForDistrict } from '../bangladeshAdmin.js';
import districts from '../districts.json';

describe('Bangladesh Administrative Hierarchy', () => {
  it('defines 8 divisions', () => {
    expect(DIVISIONS.length).toBe(8);
    const ids = DIVISIONS.map((d) => d.id);
    expect(ids).toContain('dhaka');
    expect(ids).toContain('chittagong');
    expect(ids).toContain('rajshahi');
    expect(ids).toContain('khulna');
    expect(ids).toContain('barisal');
    expect(ids).toContain('sylhet');
    expect(ids).toContain('rangpur');
    expect(ids).toContain('mymensingh');
  });

  it('maps every one of the 64 districts to a valid division', () => {
    const divisionIds = new Set(DIVISIONS.map((d) => d.id));
    for (const dist of districts) {
      const mappedDivision = DISTRICT_TO_DIVISION[dist.code];
      expect(mappedDivision, `District ${dist.code} (${dist.district_name_en})`).toBeDefined();
      expect(divisionIds.has(mappedDivision)).toBe(true);
    }
  });

  it('returns indexed upazilas for Gazipur and provides fallback for unindexed districts', () => {
    const gazipurUpz = getUpazilasForDistrict('3', 'গাজীপুর', 'Gazipur');
    expect(gazipurUpz.length).toBeGreaterThanOrEqual(4);
    expect(gazipurUpz.some((u) => u.id === 'kaliakair')).toBe(true);

    const fallbackUpz = getUpazilasForDistrict('999', 'কাল্পনিক জেলা', 'Imaginary');
    expect(fallbackUpz.length).toBe(2);
    expect(fallbackUpz[0].name_bn).toContain('সদর');
  });
});
