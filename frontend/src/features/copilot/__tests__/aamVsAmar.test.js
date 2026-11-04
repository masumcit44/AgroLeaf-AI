// Regression: rice questions starting with "আমার" must never be answered as "আম" (mango).
// Uses the real copilot engine and the real transcript helpers (no pipeline mocks).
import { describe, it, expect } from 'vitest';
import { queryAgriculturalCopilot } from '../copilotEngine.js';
import { pickBestAlternative, needsTranscriptConfirmation } from '../voiceService.js';

const isMangoAnswer = (r) => r.intent === 'out_of_domain_abstention' && /"আম"/.test(r.textBn || '');

describe('আম vs আমার — real engine', () => {
  it.each([
    'আমার ধানে কী সমস্যা হয়েছে?',
    'আমার ধানে ব্লাস্ট হয়েছে, এখন কী করব?',
    'আমার ধানের পাতায় বাদামি দাগ দেখা যাচ্ছে।',
    'আমার ধান গাছের পাতা হলুদ হয়ে যাচ্ছে।',
    'আমি ধানের সার ব্যবস্থাপনা জানতে চাই।',
    'amar dhane blast hoyeche ki korbo',
  ])('"%s" is answered as a rice question, not mango', (q) => {
    const r = queryAgriculturalCopilot(q);
    expect(isMangoAnswer(r)).toBe(false);
    expect(r.intent).not.toBe('out_of_domain_abstention');
    expect(r.textBn).toMatch(/[ঀ-৿]/); // answer is written in Bangla
  });

  it('a genuine mango question is honestly declined', () => {
    expect(isMangoAnswer(queryAgriculturalCopilot('আম সম্পর্কে জানতে চাই।'))).toBe(true);
  });
});

describe('spoken transcript handling', () => {
  it('prefers the rice alternative over a clipped "আম" first guess', () => {
    expect(pickBestAlternative(['আম কী সমস্যা হয়েছে', 'আমার ধানে কী সমস্যা হয়েছে'])).toBe('আমার ধানে কী সমস্যা হয়েছে');
    expect(pickBestAlternative(['আম কি করব', 'আমি কি করব'])).toBe('আমি কি করব');
    expect(pickBestAlternative(['আম গাছের ফল'])).toBe('আম গাছের ফল');
    expect(pickBestAlternative([])).toBe('');
  });

  it('asks the farmer to confirm a spoken "আম" or a too-short transcript instead of answering', () => {
    expect(needsTranscriptConfirmation('আম')).toBe(true);
    expect(needsTranscriptConfirmation('আম কী সমস্যা হয়েছে')).toBe(true);
    expect(needsTranscriptConfirmation('আমার')).toBe(true);
    expect(needsTranscriptConfirmation('')).toBe(true);
    expect(needsTranscriptConfirmation('আমার ধানে ব্লাস্ট হয়েছে')).toBe(false);
    expect(needsTranscriptConfirmation('dhane blast')).toBe(false);
  });
});
