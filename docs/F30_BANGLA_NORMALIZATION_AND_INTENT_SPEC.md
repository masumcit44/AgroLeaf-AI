# F30 Bangla Normalization & Intent Specification
**AgroLeaf AI — Mathematical & Algorithmic Specification for Text Processing**
**Date:** 2026-11-04  
**Status:** COMPLETE & VERIFIED  
**Author:** Senior NLP Engineer & QA Specialist

---

## 1. Normalization Function Specification

Given raw string input $S$, the normalization function $\mathcal{N}(S)$ performs deterministic string canonicalization:

```javascript
export function normalizeQuery(query) {
  if (!query || typeof query !== 'string') return '';
  return query
    .toLowerCase()
    .normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Strip zero-width joiners and spaces
    .replace(/[।?!.,;:’'"()\-—_/\\`~@#$%^&*+=[\]{}|<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
```

### 1.1 Invariants
- **NFC Canonical Equivalence:** Combines decomposed Bengali vowel signs (e.g. `\u09c7\u09be` $\to$ `\u09cb` for o-kar).
- **Zero-Width Stripping:** Removes invisible formatting artifacts introduced by mobile virtual keyboards.
- **Punctuation Uniformity:** Replaces both Western punctuation (`. , ? !`) and Bengali DARI (`।`) with whitespace to ensure clean token splitting.

---

## 2. Intent Lexicon Taxonomy & Priority Weights

Intents are ranked by priority. If multiple intents match, the higher priority intent governs response generation:

| Priority | Intent Key | Category | Representative Bangla Keywords | Representative Banglish Keywords |
|---|---|---|---|---|
| **P1** | `banned_chemical_alert` | Safety Violation | প্যারাকুয়াট, গ্রামোক্সন, ডিডিটি, এন্ডোসালফান, বিষাক্ত বিষ | paraquat, gramoxone, ddt, endosulfan |
| **P2** | `out_of_domain` | Non-Rice Rejection | আলু, গম, ভুট্টা, পাট, আম গাছ, লিচু, বেগুন, মুরগি, গরু, মাছ | alu, ghom, mango tree, tomato, mach, goru |
| **P3** | `comparison` | Cross-Disease Diagnostic | পার্থক্য, আলাদা, ভিন্ন, তুলনা, বনাম | parthokko, difference, alada, tulona, vs |
| **P4** | `follow_up_scan` | Monitoring Lifecycle | আবার ছবি, কবে ছবি, পুনরায় স্ক্যান, ফলো আপ, কয়দিন পর | abar photo, kobe chobi, abar scan, koy din por |
| **P5** | `progression` | Severity Worsening | বাড়ছে, বেশি হচ্ছে, ছড়াচ্ছে, খারাপ হচ্ছে, পাতা শুকিয়ে যাচ্ছে | barche, beshi hocche, chorae, kharap hocche |
| **P6** | `treatment` | Chemical & Immediate Action | ওষুধ, স্প্রে, ছিটাব, কী করব, করণীয়, প্রতিকার, দমন, চিকিৎসা, ডোজ | oshudh, spray, chitao, ki korbo, remedy, treatment |
| **P7** | `organic` | Natural / Cultural Control | জৈব, ভেষজ, নিম পাতা, গোবর, গোমূত্র, ট্রাইকোডার্মা, প্রাকৃতিক | organic, neem, gobor, trichoderma, natural |
| **P8** | `fertilizer` | Nutrient & Soil Management | সার, ইউরিয়া, পটাশ, জিংক, খাবার, নাইট্রোজেন, এমওপি | sar, urea, potash, zinc, fertilizer |
| **P9** | `water` | Irrigation / Moisture | পানি, সেচ, শুকানো, নিষ্কাশন, রস, জলাবদ্ধতা | pani, sech, drainage, water, shukano |
| **P10** | `spread` | Epidemiology & Contagion | ছড়ায়, ছড়াবে, ছোঁয়াচে, অন্য গাছে, বাতাস, মহামারী | chorae, chorabe, spread, contagious |
| **P11** | `symptoms` | Pathology Identification | লক্ষণ, চেনার উপায়, উপসর্গ, চিহ্ন, কেমন দেখায় | lokkhon, symptom, chinar upay, kemon dekhay |
| **P12** | `prevention` | Prophylaxis & Seed Health | প্রতিরোধ, আগে থেকে, বীজ শোধন, প্রতিরোধী জাত | protirodh, seed treatment, prevention |
| **P13** | `weather` | Meteorology Advisory | বৃষ্টি, কুয়াশা, মেঘ, রোদ, তাপমাত্রা, আবহাওয়া, শিশির | bristi, kuwasha, weather, rain, rode |
| **P14** | `helpline` | Extension Hotline | ১৬১২৩, কল, ফোন, অফিসার, হেল্পলাইন, কথা বলতে চাই | 16123, helpline, call, phone, officer |

---

## 3. Grounded Context Inheritance Decision Table

When evaluating query $Q$ with active scan context $C$:

| Query Content | Active Scan $C$ | Resolved Disease | Resolved Intent | Output Behavior |
|---|---|---|---|---|
| "কী ওষুধ দেব?" | `blast` | `blast` | `treatment` | Blast fungicidal treatment |
| "কী ওষুধ দেব?" | `null` | `null` | `need_disease_context` | Prompts farmer to scan leaf or name disease |
| "টুংরো হলে কী করব?" | `blast` | `tungro` (Explicit override) | `treatment` | Tungro vector management |
| "ব্লাস্ট আর ব্রাউন স্পটের পার্থক্য কী?" | `blast` | `['blast', 'brown_spot']` | `comparison` | Direct contrast between blast & brown spot |
| "আমার ধানে ব্লাস্ট হয়েছে, এখন কী করব?" | `null` | `blast` | `treatment` | Blast fungicidal treatment (Zero mango error) |
| "আম গাছে কী সার দেব?" | `blast` | `null` (Out-of-domain) | `out_of_domain` | Respectful rejection: AgroLeaf supports rice only |
