// Safety rule: no copilot answer names a pesticide or gives a spray / seed-treatment dose.
import { describe, it, expect } from 'vitest';
import { sanitizeChemicalDoses, isUnsafeChemicalSentence, REFERRAL_BN } from '../safety.js';
import { queryAgriculturalCopilot } from '../copilotEngine.js';
import { collectCopilotTexts } from '../../../../scripts/collect_copilot_texts.mjs';

const sentences = (t) => t.split(/(?<=[।!?])\s*|\n/).filter(Boolean);

describe('no pesticide names or doses', () => {
  it('removes brand + dose sentences and adds the referral', () => {
    const t = sanitizeChemicalDoses('টুংরো একটি ভাইরাস রোগ। জমিতে মিপসিন ৭৫ ডব্লিউপি প্রতি লিটার পানিতে ২ গ্রাম স্প্রে করুন।');
    expect(t).toBe(`টুংরো একটি ভাইরাস রোগ। ${REFERRAL_BN}`);
  });

  it('keeps fertilizer and manure amounts', () => {
    const t = 'বিঘায় ৫ কেজি পটাশ সার দিন। এক কেজি গোবর ১০ লিটার পানিতে মিশিয়ে দিন।';
    expect(sanitizeChemicalDoses(t)).toBe(t);
  });

  it.each(['ব্লাস্ট হলে কী ওষুধ দেব?', 'টুংরো হলে কী করব?', 'খোল পোড়া রোগের ওষুধ কী?', 'বীজ শোধন কীভাবে করব?', 'বাদামী দাগ হলে কী স্প্রে করব?'])(
    'the engine answer to "%s" has no pesticide name or dose',
    (q) => {
      const { textBn } = queryAgriculturalCopilot(q);
      expect(sentences(textBn).filter(isUnsafeChemicalSentence)).toEqual([]);
    }
  );

  it('every recorded (fixed) answer is safe', () => {
    const unsafe = collectCopilotTexts().filter(({ text }) => sentences(text).some(isUnsafeChemicalSentence));
    expect(unsafe.map((u) => u.text.slice(0, 60))).toEqual([]);
  });
});
