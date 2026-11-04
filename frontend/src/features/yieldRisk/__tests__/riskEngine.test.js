import { describe, it, expect } from 'vitest';
import { evaluateRiskContext, resolveCalendarContext, evaluateSheathBlightMicroclimate } from '../riskEngine.js';

describe('F26 Yield Risk Engine: Pure Calculations', () => {
  // Test 1: Inconclusive diagnosis ('not_sure')
  it('handles "not_sure" diagnosis with "uncertain" risk level and zero fake percentages', () => {
    const result = evaluateRiskContext({
      diseaseClass: 'not_sure',
      weather: { temperature: 24, relativeHumidity: 90 },
      growthStage: 'booting_flowering',
    });

    expect(result.riskLevel).toBe('uncertain');
    expect(result.confidence.band).toBe('low');
    expect(result.uncertaintyExplanationBn).toBeTruthy();
    expect(result.uncertaintyExplanationEn).toBeTruthy();
    // Verify strict ban on fabricated percentage strings in qualitative text
    expect(result.qualitativeImpactBn).not.toMatch(/[০-৯0-9]+%/);
    expect(result.qualitativeImpactEn).not.toMatch(/\d+%/);
    expect(result.immediateActions[0].actionType).toBe('inspection');
  });

  // Test 2: Healthy leaf under benign weather
  it('evaluates "healthy" leaf under benign weather as "low" risk', () => {
    const result = evaluateRiskContext({
      diseaseClass: 'healthy',
      weather: { temperature: 30, relativeHumidity: 55 },
      growthStage: 'tillering',
    });

    expect(result.riskLevel).toBe('low');
    expect(result.confidence.band).toBe('high');
    expect(result.qualitativeImpactBn).toContain('সম্পূর্ণ সুস্থ দেখাচ্ছে');
    expect(result.immediateActions.some((a) => a.actionType === 'sanitation')).toBe(true);
  });

  // Test 3: Healthy leaf under extreme blast weather pressure (Preventative Watch)
  it('escalates "healthy" leaf to "medium" watch if regional weather is hyper-conducive', () => {
    const result = evaluateRiskContext({
      diseaseClass: 'healthy',
      weather: { temperature: 20, relativeHumidity: 96, diurnalRange: 12 },
      growthStage: 'booting_flowering',
    });

    expect(result.riskLevel).toBe('medium');
    expect(result.qualitativeImpactBn).toContain('আশেপাশের আবহাওয়া ব্লাস্ট');
    expect(result.contributingFactors.length).toBeGreaterThan(0);
  });

  // Test 4: Critical Neck Blast window (Booting/Flowering + Conducive Weather)
  it('triggers "high" risk for blast during booting/flowering with cool damp weather', () => {
    const result = evaluateRiskContext({
      diseaseClass: 'blast',
      cropSeason: 'boro',
      growthStage: 'booting_flowering',
      weather: {
        temperature: 19,
        relativeHumidity: 94,
        diurnalRange: 11,
        forecast3d: [{ isFavorable: true }, { isFavorable: true }, { isFavorable: true }],
      },
    });

    expect(result.riskLevel).toBe('high');
    expect(result.confidence.band).toBe('high');
    expect(result.qualitativeImpactBn).toContain('নেক ব্লাস্ট বা শিষ ব্লাস্ট');
    expect(result.qualitativeImpactBn).toContain('চিটা');
    expect(result.immediateActions[0].actionType).toBe('fertilizer_adjustment');
    expect(result.immediateActions[0].urgencyDays).toBe(1);
  });

  // Test 5: Missing weather telemetry (Graceful Degradation)
  it('gracefully degrades confidence and provides phenological assessment when weather is null', () => {
    const result = evaluateRiskContext({
      diseaseClass: 'sheath_blight',
      growthStage: 'tillering',
      weather: null,
    });

    expect(result.riskLevel).toBeDefined();
    expect(result.confidence.isDegraded).toBe(true);
    expect(result.confidence.band).toBe('medium');
    expect(result.uncertaintyExplanationBn).toContain('আবহাওয়া তথ্য অফলাইনে থাকার কারণে');
    expect(result.citations.length).toBeGreaterThan(0);
  });

  // Test 6: Extreme Weather (Heatwave > 40°C)
  it('correctly suppresses blast risk under extreme non-biological heat (42°C)', () => {
    const result = evaluateRiskContext({
      diseaseClass: 'blast',
      growthStage: 'tillering',
      weather: { temperature: 42, relativeHumidity: 30 },
    });

    expect(result.riskLevel).toBe('low');
    expect(result.contributingFactors.some((f) => f.impactDirection === 'decreases_risk')).toBe(true);
  });

  // Test 7: Season and Stage auto-estimation from BRRI Crop Calendar
  it('accurately resolves Boro season and booting stage for late March', () => {
    const marchDate = new Date('2026-03-25T10:00:00Z');
    const cal = resolveCalendarContext(marchDate);
    expect(cal.season).toBe('boro');
    expect(cal.stage).toBe('booting_flowering');

    const result = evaluateRiskContext({
      diseaseClass: 'blast',
      referenceDate: marchDate,
    });

    expect(result.evaluatedContext.isStageEstimated).toBe(true);
    expect(result.evaluatedContext.cropSeason).toBe('boro');
    expect(result.evaluatedContext.growthStage).toBe('booting_flowering');
  });

  // Test 8: Tungro vector and sanitation priority
  it('prioritizes rogueing and vector control for Tungro in seedling/tillering stage', () => {
    const result = evaluateRiskContext({
      diseaseClass: 'tungro',
      growthStage: 'seedling',
    });

    expect(result.qualitativeImpactBn).toContain('সবুজ পাতাফড়িং');
    expect(result.immediateActions.some((a) => a.descriptionBn.includes('১৬১২৩'))).toBe(true);
  });

  // Test 9: Sheath Blight Microclimate Evaluation
  it('evaluates Sheath Blight under warm humid BAMIS conditions', () => {
    const weather = { temperature: 30, relativeHumidity: 88 };
    const evalShb = evaluateSheathBlightMicroclimate(weather);
    expect(evalShb.score).toBeGreaterThanOrEqual(0.8);
    expect(evalShb.factors.length).toBe(2);
  });
});
