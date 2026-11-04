import { describe, it, expect } from 'vitest';
import {
  calculateDiseaseSignal,
  evaluateNeighborRisk,
  buildCommunitySurveillanceReport,
  ALERT_LEVELS,
} from '../outbreakSignalEngine.js';
import { getNeighbors, isNeighbor, getDistrictName } from '../districtAdjacency.js';

describe('F32 Outbreak Signal Engine — Statistical Anomaly & Risk Evaluation', () => {
  it('suppresses alert when total contributors or disease contributors are less than 3 (k-anonymity gate)', () => {
    // Zero reports
    const signal1 = calculateDiseaseSignal({
      districtCode: '1',
      classKey: 'blast',
      currentContributors: 0,
      totalActiveContributors: 0,
    });
    expect(signal1.alertLevel.code).toBe(ALERT_LEVELS.INSUFFICIENT_DATA.code);
    expect(signal1.isSuppressed).toBe(true);
    expect(signal1.messageBn).toContain('পর্যাপ্ত নির্ভরযোগ্য তথ্য পাওয়া যায়নি');

    // 2 reports (below threshold of 3)
    const signal2 = calculateDiseaseSignal({
      districtCode: '10',
      classKey: 'blast',
      currentContributors: 2,
      totalActiveContributors: 2,
    });
    expect(signal2.alertLevel.code).toBe(ALERT_LEVELS.INSUFFICIENT_DATA.code);
    expect(signal2.isSuppressed).toBe(true);
  });

  it('classifies reporting activity as NORMAL when reports match historical baseline', () => {
    // 3 positive out of 30 total = 10% rate, matching baseline of 10%
    const signal = calculateDiseaseSignal({
      districtCode: '1',
      classKey: 'blast',
      currentContributors: 3,
      totalActiveContributors: 30,
      baselineRate: 0.10,
    });

    expect(signal.isSuppressed).toBe(false);
    expect(signal.alertLevel.code).toBe(ALERT_LEVELS.NORMAL.code);
    expect(signal.rateRatio).toBeLessThanOrEqual(1.25);
    expect(signal.messageBn).toContain('স্বাভাবিক অবস্থা');
  });

  it('classifies reporting activity as MONITORING when preliminary mild increase is detected', () => {
    // 4 positive out of 25 = 16% rate vs 10% baseline (rateRatio 1.6x)
    const signal = calculateDiseaseSignal({
      districtCode: '3',
      classKey: 'blast',
      currentContributors: 4,
      totalActiveContributors: 25,
      baselineRate: 0.10,
    });

    expect(signal.isSuppressed).toBe(false);
    expect(signal.alertLevel.code).toBe(ALERT_LEVELS.MONITORING.code);
    expect(signal.messageBn).toContain('নজর রাখুন');
  });

  it('classifies reporting activity as ELEVATED when statistically supported increase occurs', () => {
    // 4 positive out of 25 = 16% rate vs 6% baseline (rateRatio 2.66x, Z = 2.04)
    // contributors < 5 so it qualifies as ELEVATED and not HIGH_RISK
    const signal = calculateDiseaseSignal({
      districtCode: '10',
      classKey: 'blast',
      currentContributors: 4,
      totalActiveContributors: 25,
      baselineRate: 0.06,
    });

    expect(signal.isSuppressed).toBe(false);
    expect(signal.alertLevel.code).toBe(ALERT_LEVELS.ELEVATED.code);
    expect(signal.zScore).toBeGreaterThanOrEqual(1.96);
    expect(signal.rateRatio).toBeGreaterThanOrEqual(1.75);
    expect(signal.messageBn).toContain('রিপোর্ট বৃদ্ধির একটি প্রাথমিক সংকেত');
  });

  it('classifies reporting activity as HIGH_RISK when massive burst occurs with high confidence', () => {
    // 12 positive out of 25 = 48% rate vs 5% baseline (Z > 3.0, rateRatio > 2.5)
    const signal = calculateDiseaseSignal({
      districtCode: '10',
      classKey: 'blast',
      currentContributors: 12,
      totalActiveContributors: 25,
      baselineRate: 0.05,
    });

    expect(signal.isSuppressed).toBe(false);
    expect(signal.alertLevel.code).toBe(ALERT_LEVELS.HIGH_RISK.code);
    expect(signal.zScore).toBeGreaterThanOrEqual(3.0);
    expect(signal.rateRatio).toBeGreaterThanOrEqual(2.5);
    expect(signal.messageBn).toContain('উল্লেখযোগ্য বৃদ্ধি দেখা যাচ্ছে');
  });

  it('prioritizes VERIFIED official advisory when verified flag is true', () => {
    const signal = calculateDiseaseSignal({
      districtCode: '10',
      classKey: 'blast',
      currentContributors: 4,
      totalActiveContributors: 20,
      verified: true,
    });

    expect(signal.alertLevel.code).toBe(ALERT_LEVELS.VERIFIED.code);
    expect(signal.messageBn).toContain('কৃষি সম্প্রসারণ অধিদপ্তর কর্তৃক');
  });

  it('provides BRRI/DAE preventive guidance specific to the disease', () => {
    const signal = calculateDiseaseSignal({
      districtCode: '10',
      classKey: 'blast',
      currentContributors: 6,
      totalActiveContributors: 20,
      baselineRate: 0.08,
    });

    expect(signal.preventiveAdvice).not.toBeNull();
    expect(signal.preventiveAdvice.titleBn).toContain('ব্লাস্ট');
    expect(signal.preventiveAdvice.actionsBn.some((a) => a.includes('২ থেকে ৩ সেন্টিমিটার পানি'))).toBe(true);
    expect(signal.preventiveAdvice.actionsBn.some((a) => a.includes('ইউরিয়া (নাইট্রোজেন) সার উপরিপ্রয়োগ সম্পূর্ণ বন্ধ'))).toBe(true);
  });
});

describe('F32 64-District Adjacency Graph & Neighbor Risk Propagation', () => {
  it('correctly maps neighbors for key districts across Bangladesh', () => {
    // Dhaka (1) neighbors: Gazipur (3), Manikganj (8), Munshiganj (9), Narayanganj (11), Tangail (17), Faridpur (2)
    const dhakaNeighbors = getNeighbors('1');
    expect(dhakaNeighbors).toContain('3');
    expect(dhakaNeighbors).toContain('8');
    expect(dhakaNeighbors).toContain('9');
    expect(dhakaNeighbors).toContain('11');
    expect(isNeighbor('1', '3')).toBe(true);
    expect(isNeighbor('1', '64')).toBe(false); // Dhaka is not neighbor of Satkhira

    // Mymensingh (10) neighbors: Gazipur (3), Jamalpur (5), Kishoreganj (6), Netrokona (13), Sherpur (16), Tangail (17)
    const mymNeighbors = getNeighbors('10');
    expect(mymNeighbors).toContain('3');
    expect(mymNeighbors).toContain('5');
    expect(mymNeighbors).toContain('6');
    expect(mymNeighbors).toContain('13');
    expect(mymNeighbors).toContain('16');
  });

  it('returns localized district names correctly', () => {
    expect(getDistrictName('1', 'en')).toBe('Dhaka');
    expect(getDistrictName('1', 'bn')).toBe('ঢাকা');
    expect(getDistrictName('10', 'bn')).toBe('ময়মনসিংহ');
  });

  it('propagates Neighbor Risk Alert to adjacent district when neighbor has elevated alert', () => {
    // District 10 (Mymensingh) has ELEVATED blast signal
    const mymSignal = calculateDiseaseSignal({
      districtCode: '10',
      classKey: 'blast',
      currentContributors: 4,
      totalActiveContributors: 25,
      baselineRate: 0.06,
    });
    expect(mymSignal.alertLevel.code).toBe(ALERT_LEVELS.ELEVATED.code);

    // District 3 (Gazipur) has NORMAL blast signal (neighbor of Mymensingh)
    const gazipurSignal = calculateDiseaseSignal({
      districtCode: '3',
      classKey: 'blast',
      currentContributors: 3,
      totalActiveContributors: 30,
      baselineRate: 0.10,
    });
    expect(gazipurSignal.alertLevel.code).toBe(ALERT_LEVELS.NORMAL.code);

    const allSignals = {
      '10': mymSignal,
      '3': gazipurSignal,
    };

    // Evaluate neighbor risk for Gazipur (3)
    const neighborRisk = evaluateNeighborRisk({
      targetDistrictCode: '3',
      allDistrictSignals: allSignals,
    });

    expect(neighborRisk).not.toBeNull();
    expect(neighborRisk.isNeighborAlert).toBe(true);
    expect(neighborRisk.sourceDistrictCode).toBe('10');
    expect(neighborRisk.sourceDistrictNameBn).toBe('ময়মনসিংহ');
    expect(neighborRisk.messageBn).toContain('আপনার পাশের এলাকা ময়মনসিংহ-এ ধানের ব্লাস্ট রোগের রিপোর্ট বেড়েছে');
  });

  it('does NOT override target district if target district already has high local alert', () => {
    // Both Mymensingh (10) and Gazipur (3) have local ELEVATED alert
    const mymSignal = calculateDiseaseSignal({
      districtCode: '10',
      classKey: 'blast',
      currentContributors: 6,
      totalActiveContributors: 20,
      baselineRate: 0.08,
    });
    const gazipurSignal = calculateDiseaseSignal({
      districtCode: '3',
      classKey: 'blast',
      currentContributors: 8,
      totalActiveContributors: 20,
      baselineRate: 0.08,
    });

    const allSignals = {
      '10': mymSignal,
      '3': gazipurSignal,
    };

    const neighborRisk = evaluateNeighborRisk({
      targetDistrictCode: '3',
      allDistrictSignals: allSignals,
    });

    // Null because local alert takes priority over neighbor alert
    expect(neighborRisk).toBeNull();
  });

  it('builds complete community surveillance report with proper disclaimers', () => {
    const localSignal = calculateDiseaseSignal({
      districtCode: '1',
      classKey: 'blast',
      currentContributors: 3,
      totalActiveContributors: 30,
    });

    const report = buildCommunitySurveillanceReport({
      districtCode: '1',
      localSignal,
      neighborRisk: null,
      lang: 'bn',
    });

    expect(report.districtCode).toBe('1');
    expect(report.districtName).toBe('ঢাকা');
    expect(report.disclaimerBn).toContain('সরকারি বা মাঠপর্যায়ে নিশ্চিত রোগের ঘোষণা নয়');
    expect(report.primaryAlert.alertLevel.code).toBe(ALERT_LEVELS.NORMAL.code);
  });
});
