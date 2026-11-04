import { describe, it, expect } from 'vitest';
import { normalizeQuery, queryAgriculturalCopilot } from '../copilotEngine.js';

describe('F30 Copilot Engine - Normalization & Tokenization', () => {
  it('strips Bengali and English punctuation and normalizes whitespace', () => {
    const raw = '  ব্লাস্ট রোগের ওষুধ কী??? দয়া করে বলুন...  ';
    const norm = normalizeQuery(raw);
    expect(norm).toBe('ব্লাস্ট রোগের ওষুধ কী দয়া করে বলুন');
  });

  it('handles empty or null inputs gracefully', () => {
    expect(normalizeQuery(null)).toBe('');
    expect(normalizeQuery(undefined)).toBe('');
    expect(normalizeQuery('')).toBe('');
  });

  it('strips zero-width characters and combines decomposed Unicode', () => {
    const zeroWidth = 'ধানের\u200B রোগ';
    expect(normalizeQuery(zeroWidth)).toBe('ধানের রোগ');
  });
});

describe('F30 Copilot Engine - "আম" vs "আমার" / "আমি" Regression Suite (P0)', () => {
  it('never intercepts "আমার ধানে ব্লাস্ট হয়েছে" as mango out-of-domain', () => {
    const res = queryAgriculturalCopilot('আমার ধানে ব্লাস্ট হয়েছে, এখন কী করব?');
    expect(res.intent).toBe('treatment');
    expect(res.diseaseKey).toBe('blast');
    expect(res.isAbstention).toBe(false);
    expect(res.textBn).not.toContain('আম');
    expect(res.textBn).toContain('ট্রাইসাইক্লাজোল');
  });

  it('handles "আমার ধান" incomplete query cleanly without mango error', () => {
    const res = queryAgriculturalCopilot('আমার ধান');
    expect(res.intent).toBe('incomplete_query');
    expect(res.isAbstention).toBe(false);
    expect(res.textBn).toContain('ধানের কী সমস্যা');
  });

  it('handles standalone "আমার" without false mango trigger', () => {
    const res = queryAgriculturalCopilot('আমার');
    expect(res.intent).toBe('incomplete_query');
    expect(res.textBn).toContain('সম্পূর্ণ প্রশ্নটি বলুন');
  });

  it('handles "আমি আবার কবে ছবি তুলব?" without false mango trigger', () => {
    const res = queryAgriculturalCopilot('আমি আবার কবে ছবি তুলব?', 'blast');
    expect(res.intent).toBe('follow_up_scan');
    expect(res.diseaseKey).toBe('blast');
    expect(res.textBn).toContain('৫ থেকে ৭ দিন');
  });

  it('handles "আমার ধানের পাতায় দাগ দেখা যাচ্ছে" without false mango trigger', () => {
    const res = queryAgriculturalCopilot('আমার ধানের পাতায় দাগ দেখা যাচ্ছে');
    expect(res.diseaseKey).toBe('brown_spot');
    expect(res.isAbstention).toBe(false);
  });

  it('handles "আমার ধান কি সুস্থ?" without false mango trigger', () => {
    const res = queryAgriculturalCopilot('আমার ধান কি সুস্থ?', 'healthy');
    expect(res.diseaseKey).toBe('healthy');
    expect(res.textBn).toContain('সুস্থ');
  });

  it('correctly rejects genuine mango inquiries (e.g. "আম গাছে কী রোগ হয়েছে?")', () => {
    const res = queryAgriculturalCopilot('আম গাছে কী রোগ হয়েছে?');
    expect(res.intent).toBe('out_of_domain_abstention');
    expect(res.isAbstention).toBe(true);
    expect(res.textBn).toContain('আম');
    expect(res.helplinePrompt).toBe(true);
  });

  it('correctly rejects standalone "আম" query', () => {
    const res = queryAgriculturalCopilot('আম');
    expect(res.intent).toBe('out_of_domain_abstention');
    expect(res.isAbstention).toBe(true);
  });
});

describe('F30 Copilot Engine - Core Golden Agricultural Questions', () => {
  it('1. "আমার ধানে ব্লাস্ট হয়েছে, এখন কী করব?" -> Blast treatment', () => {
    const res = queryAgriculturalCopilot('আমার ধানে ব্লাস্ট হয়েছে, এখন কী করব?');
    expect(res.diseaseKey).toBe('blast');
    expect(res.intent).toBe('treatment');
    expect(res.textBn).toContain('ট্রাইসাইক্লাজোল');
  });

  it('2. "এই রোগ কি অন্য গাছে ছড়াবে?" with blast context -> Blast spread', () => {
    const res = queryAgriculturalCopilot('এই রোগ কি অন্য গাছে ছড়াবে?', 'blast');
    expect(res.diseaseKey).toBe('blast');
    expect(res.intent).toBe('spread');
    expect(res.textBn).toContain('বাতাস');
  });

  it('3. "ব্লাস্ট রোগ কেন হয়?" -> Blast symptoms & pathogen cause', () => {
    const res = queryAgriculturalCopilot('ব্লাস্ট রোগ কেন হয়?');
    expect(res.diseaseKey).toBe('blast');
    expect(res.intent).toBe('symptoms');
    expect(res.textBn).toContain('মাকু');
  });

  it('4. "ব্লাস্ট আর ব্রাউন স্পটের পার্থক্য কী?" -> Comparison intent', () => {
    const res = queryAgriculturalCopilot('ব্লাস্ট আর ব্রাউন স্পটের পার্থক্য কী?');
    expect(res.intent).toBe('comparison');
    expect(res.diseaseKey).toBe('blast_vs_brown_spot');
    expect(res.textBn).toContain('মাকু');
    expect(res.textBn).toContain('তিলের');
  });

  it('5. "আমার ধানের পাতায় বাদামি দাগ কেন?" -> Brown spot symptoms', () => {
    const res = queryAgriculturalCopilot('আমার ধানের পাতায় বাদামি দাগ কেন?');
    expect(res.diseaseKey).toBe('brown_spot');
    expect(res.intent).toBe('symptoms');
    expect(res.textBn).toContain('হলুদ বলয়');
  });

  it('6. "আমি আবার কবে ছবি তুলব?" -> Follow up scan guidance', () => {
    const res = queryAgriculturalCopilot('আমি আবার কবে ছবি তুলব?', 'sheath_blight');
    expect(res.intent).toBe('follow_up_scan');
    expect(res.textBn).toContain('৫ থেকে ৭ দিন');
  });

  it('7. "শীথ ব্লাইটের লক্ষণ কী?" -> Sheath blight symptoms', () => {
    const res = queryAgriculturalCopilot('শীথ ব্লাইটের লক্ষণ কী?');
    expect(res.diseaseKey).toBe('sheath_blight');
    expect(res.intent).toBe('symptoms');
    expect(res.textBn).toContain('সাপের চামড়ার');
  });

  it('8. "টুংরো রোগ কীভাবে হয়?" -> Tungro virus and leafhopper vector', () => {
    const res = queryAgriculturalCopilot('টুংরো রোগ কীভাবে হয়?');
    expect(res.diseaseKey).toBe('tungro');
    expect(res.intent).toBe('spread');
    expect(res.textBn).toContain('সবুজ পাতা ফড়িং');
  });

  it('9. "পাতার দাগ বাড়ছে, কী করব?" -> Progression guidance', () => {
    const res = queryAgriculturalCopilot('পাতার দাগ বাড়ছে, কী করব?', 'brown_spot');
    expect(res.intent).toBe('progression');
    expect(res.diseaseKey).toBe('brown_spot');
    expect(res.textBn).toContain('পটাশ');
  });

  it('10. "এই রোগের প্রতিকার কী?" with sheath blight context -> Sheath blight treatment', () => {
    const res = queryAgriculturalCopilot('এই রোগের প্রতিকার কী?', 'sheath_blight');
    expect(res.diseaseKey).toBe('sheath_blight');
    expect(res.intent).toBe('treatment');
    expect(res.textBn).toContain('ভ্যালিডামাইসিন');
  });
});

describe('F30 Copilot Engine - Banglish Transliteration Tests', () => {
  it('handles "amar dhane blast hoise ekhon ki korbo"', () => {
    const res = queryAgriculturalCopilot('amar dhane blast hoise ekhon ki korbo');
    expect(res.diseaseKey).toBe('blast');
    expect(res.intent).toBe('treatment');
    expect(res.textBn).toContain('ট্রাইসাইক্লাজোল');
  });

  it('handles "amar dhaner patay dag dekha jacche"', () => {
    const res = queryAgriculturalCopilot('amar dhaner patay dag dekha jacche');
    expect(res.diseaseKey).toBe('brown_spot');
    expect(res.isAbstention).toBe(false);
  });

  it('handles "tungro rog kivabe hoy"', () => {
    const res = queryAgriculturalCopilot('tungro rog kivabe hoy');
    expect(res.diseaseKey).toBe('tungro');
    expect(res.intent).toBe('spread');
    expect(res.textBn).toContain('সবুজ পাতা ফড়িং');
  });

  it('handles "brown spot ar blast er difference ki"', () => {
    const res = queryAgriculturalCopilot('brown spot ar blast er difference ki');
    expect(res.intent).toBe('comparison');
    expect(res.diseaseKey).toBe('blast_vs_brown_spot');
  });

  it('handles "ami abar kobe photo tulbo"', () => {
    const res = queryAgriculturalCopilot('ami abar kobe photo tulbo', 'blast');
    expect(res.intent).toBe('follow_up_scan');
    expect(res.textBn).toContain('৫ থেকে ৭ দিন');
  });
});

describe('F30 Copilot Engine - Safety Guardrails & Prohibited Chemicals', () => {
  it('triggers banned chemical alert on paraquat mention', () => {
    const res = queryAgriculturalCopilot('প্যারাকুয়াট স্প্রে করা যাবে কি?');
    expect(res.intent).toBe('banned_chemical_alert');
    expect(res.textBn).toContain('প্যারাকুয়াট');
    expect(res.textBn).toContain('নিষিদ্ধ');
    expect(res.safetyNote).toBeTruthy();
    expect(res.helplinePrompt).toBe(true);
  });

  it('triggers banned chemical alert on gramoxone mention', () => {
    const res = queryAgriculturalCopilot('গ্রামোক্সন দিলে কি কাজ হবে?');
    expect(res.intent).toBe('banned_chemical_alert');
    expect(res.textBn).toContain('গ্রামোক্সন');
  });

  it('triggers banned chemical alert on DDT mention', () => {
    const res = queryAgriculturalCopilot('ডিডিটি পাউডার কোথায় পাব?');
    expect(res.intent).toBe('banned_chemical_alert');
    expect(res.textBn).toContain('ডিডিটি');
  });

  it('responds with PPE safety advice when asked about mask or precautions', () => {
    const res = queryAgriculturalCopilot('বিষ দিলে কি মুখে মাস্ক পরা লাগে?');
    expect(res.intent).toBe('safety');
    expect(res.textBn).toContain('মাস্ক');
  });
});

describe('F30 Copilot Engine - Out-of-Domain & Honest Abstention', () => {
  it('abstains on poultry disease inquiry', () => {
    const res = queryAgriculturalCopilot('মুরগির রোগ কীভাবে সারাব?');
    expect(res.intent).toBe('out_of_domain_abstention');
    expect(res.isAbstention).toBe(true);
    expect(res.textBn).toContain('মুরগি');
  });

  it('abstains on sports / cricket inquiries', () => {
    const res = queryAgriculturalCopilot('ক্রিকেট ম্যাচ কে জিতবে?');
    expect(res.intent).toBe('out_of_domain_abstention');
    expect(res.isAbstention).toBe(true);
    expect(res.textBn).toContain('ক্রিকেট');
  });

  it('abstains on arbitrary gibberish without context', () => {
    const res = queryAgriculturalCopilot('আজকের বাজার দর কি ভাই');
    expect(res.intent).toBe('honest_abstention');
    expect(res.isAbstention).toBe(true);
    expect(res.textBn).toContain('যাচাইকৃত তথ্য নেই');
  });
});

describe('F30 Copilot Engine - Bangla Response Language Lock', () => {
  const testQueries = [
    'আমার ধানে ব্লাস্ট হয়েছে, এখন কী করব?',
    'ব্লাস্ট আর ব্রাউন স্পটের পার্থক্য কী?',
    'amar dhane blast hoise ekhon ki korbo',
    'tungro rog kivabe hoy',
    'কী ওষুধ দেব?',
    'সার দেওয়া যাবে কি?',
    'প্যারাকুয়াট স্প্রে করা যাবে?',
    'আম গাছে কী রোগ হয়েছে?',
    'আমি আবার কবে ছবি তুলব?',
    'আজকের খবর কি ভাই',
  ];

  for (const q of testQueries) {
    it(`guarantees response for "${q}" is in understandable Bangla`, () => {
      const res = queryAgriculturalCopilot(q, 'blast');
      expect(res.titleBn).toBeTruthy();
      expect(res.textBn).toBeTruthy();
      expect(res.voiceBn).toBeTruthy();

      // Assert that Bengali Unicode range characters (\u0980-\u09FF) dominate the response
      expect(/[\u0980-\u09FF]/.test(res.titleBn)).toBe(true);
      expect(/[\u0980-\u09FF]/.test(res.textBn)).toBe(true);
      expect(/[\u0980-\u09FF]/.test(res.voiceBn)).toBe(true);

      // Assert zero generic English leak fallbacks
      expect(res.textBn).not.toContain("I don't understand");
      expect(res.textBn).not.toContain('No information found');
      expect(res.textBn).not.toContain('Please try again');
    });
  }
});
