import { describe, it, expect } from 'vitest';
import { normalizeQuery, queryAgriculturalCopilot } from '../copilotEngine.js';

describe('F30 Copilot Engine - Normalization', () => {
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
});

describe('F30 Copilot Engine - Grounded Agricultural Retrieval', () => {
  it('retrieves blast treatment when blast is explicitly mentioned in query', () => {
    const res = queryAgriculturalCopilot('ধানের ব্লাস্ট রোগের কী ওষুধ দেব?');
    expect(res.intent).toBe('treatment');
    expect(res.diseaseKey).toBe('blast');
    expect(res.isAbstention).toBe(false);
    expect(res.textBn).toContain('ট্রাইসাইক্লাজোল');
    expect(res.safetyNote).toBeTruthy();
  });

  it('inherits active scan disease context when farmer does not name the disease', () => {
    const res = queryAgriculturalCopilot('কী স্প্রে করতে হবে?', 'brown_spot');
    expect(res.intent).toBe('treatment');
    expect(res.diseaseKey).toBe('brown_spot');
    expect(res.textBn).toContain('ম্যানকোজেব');
  });

  it('explicitly spoken disease overrides active scan context', () => {
    // Farmer's scan was brown_spot, but they ask about blast
    const res = queryAgriculturalCopilot('টুংরো হলে কী করব?', 'brown_spot');
    expect(res.diseaseKey).toBe('tungro');
    expect(res.textBn).toContain('সবুজ পাতা ফড়িং');
  });

  it('returns organic / cultural recommendations for natural farming queries', () => {
    const res = queryAgriculturalCopilot('জৈব উপায়ে কীভাবে ব্লাস্ট দমন করব?');
    expect(res.intent).toBe('organic');
    expect(res.diseaseKey).toBe('blast');
    expect(res.textBn).toContain('ট্রাইকোডার্মা');
  });

  it('warns against urea and recommends potash for bacterial leaf blight fertilizer query', () => {
    const res = queryAgriculturalCopilot('সার কি দেওয়া যাবে?', 'bacterial_leaf_blight');
    expect(res.intent).toBe('fertilizer');
    expect(res.textBn).toContain('ইউরিয়া');
    expect(res.textBn).toContain('পটাশ');
  });

  it('advises water drainage for sheath blight', () => {
    const res = queryAgriculturalCopilot('জমির পানি কি রাখব?', 'sheath_blight');
    expect(res.intent).toBe('water');
    expect(res.textBn).toContain('পানি');
    expect(res.textBn).toContain('নিষ্কাশন');
  });

  it('explains viral transmission and vector for tungro disease spread query', () => {
    const res = queryAgriculturalCopilot('এই রোগ কি দ্রুত ছড়ায়?', 'tungro');
    expect(res.intent).toBe('spread');
    expect(res.textBn).toContain('সবুজ পাতা ফড়িং');
  });

  it('handles healthy crop advice appropriately', () => {
    const res = queryAgriculturalCopilot('কী ওষুধ দেব?', 'healthy');
    expect(res.intent).toBe('treatment');
    expect(res.textBn).toContain('স্প্রে করার প্রয়োজন নেই');
  });
});

describe('F30 Copilot Engine - Safety Guardrails & Honest Abstention', () => {
  it('triggers banned chemical safety warning when prohibited agrochemical is named', () => {
    const res = queryAgriculturalCopilot('প্যারাকুয়াট স্প্রে করা যাবে কি?');
    expect(res.intent).toBe('banned_chemical_alert');
    expect(res.textBn).toContain('প্যারাকুয়াট');
    expect(res.textBn).toContain('নিষিদ্ধ');
    expect(res.helplinePrompt).toBe(true);
  });

  it('abstains honestly on out-of-domain non-rice crops (e.g. potato / mango)', () => {
    const res = queryAgriculturalCopilot('আলু চাষের জন্য কী ওষুধ দেব?');
    expect(res.intent).toBe('out_of_domain_abstention');
    expect(res.isAbstention).toBe(true);
    expect(res.helplinePrompt).toBe(true);
    expect(res.textBn).toContain('শুধুমাত্র বাংলাদেশের ধানের রোগ');
    expect(res.textBn).toContain('১৬১২৩');
  });

  it('abstains honestly on completely unrelated or obscure queries without context', () => {
    const res = queryAgriculturalCopilot('আজকের খবর কি ভাই');
    expect(res.intent).toBe('honest_abstention');
    expect(res.isAbstention).toBe(true);
    expect(res.helplinePrompt).toBe(true);
    expect(res.textBn).toContain('যাচাই করা নিশ্চিত তথ্য নেই');
  });

  it('asks for disease context when a treatment query is posed without scan context or disease name', () => {
    const res = queryAgriculturalCopilot('কী ওষুধ স্প্রে করব?');
    expect(res.intent).toBe('need_disease_context');
    expect(res.diseaseKey).toBeNull();
    expect(res.titleBn).toContain('কোন রোগের জন্য জানতে চান');
  });

  it('provides official helpline information when asked for agricultural officer or 16123', () => {
    const res = queryAgriculturalCopilot('কৃষি অফিসের ফোন নম্বর দরকার');
    expect(res.intent).toBe('helpline');
    expect(res.textBn).toContain('১৬১২৩');
    expect(res.helplinePrompt).toBe(true);
  });
});
