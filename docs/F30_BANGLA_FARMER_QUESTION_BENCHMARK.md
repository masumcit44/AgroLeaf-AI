# F30 Bangla Farmer Question Benchmark
**AgroLeaf AI — Golden Evaluation Benchmark for Spoken Agricultural Q&A**
**Date:** 2026-11-04  
**Status:** COMPLETE & VERIFIED  
**Author:** Lead QA Engineer & Bengali Computational Linguist

---

## 1. Benchmark Overview & Test Scope

This document establishes the official 35-question evaluation benchmark for AgroLeaf AI's F30 Farmer Copilot. The benchmark exercises 6 critical domains:
1. **Core Golden Questions** (Standard agricultural advisory)
2. **"আম" vs "আমার" Regression Suite** (Pronoun disambiguation)
3. **Banglish Agricultural Questions** (Phonetic Romanized Bangla)
4. **Ambiguous Context-Dependent Inquiries** (Scan inheritance)
5. **Out-of-Domain Non-Rice Questions** (Respectful guardrail rejection)
6. **Prohibited Agrochemicals & Safety Inquiries** (Hazard alerts)

---

## 2. Comprehensive Benchmark Evaluation Matrix

| Category | # | Query Text (Spoken/Typed) | Scan Context | Expected Disease | Expected Intent | Expected Key Content in Bangla Response | Test Verdict |
|---|---|---|---|---|---|---|---|
| **Core Golden** | 1 | "আমার ধানে ব্লাস্ট হয়েছে, এখন কী করব?" | `null` | `blast` | `treatment` | ট্রাইসাইক্লাজোল ৭৫ ডব্লিউপি / অ্যামিস্টার টপ | **PASS** |
| | 2 | "এই রোগ কি অন্য গাছে ছড়াবে?" | `blast` | `blast` | `spread` | বাতাসের মাধ্যমে দ্রুত ছড়ায়, কুয়াশা | **PASS** |
| | 3 | "ব্লাস্ট রোগ কেন হয়?" | `null` | `blast` | `symptoms` | ম্যাগনাপোর্টে ওরাইজি ছত্রাক, মাকু আকৃতির দাগ | **PASS** |
| | 4 | "ব্লাস্ট আর ব্রাউন স্পটের পার্থক্য কী?" | `null` | `['blast', 'brown_spot']` | `comparison` | মাকু দাগ বনাম তিলের মতো গোল দাগের তুলনা | **PASS** |
| | 5 | "আমার ধানের পাতায় বাদামি দাগ কেন?" | `null` | `brown_spot` | `symptoms` | বাইপোলারিস ওরাইজি, পুষ্টিহীনতা ও দস্তা ঘাটতি | **PASS** |
| | 6 | "আমি আবার কবে ছবি তুলব?" | `blast` | `blast` | `follow_up_scan` | ৫ থেকে ৭ দিন পর পুনরায় স্ক্যান করার পরামর্শ | **PASS** |
| | 7 | "শীথ ব্লাইটের লক্ষণ কী?" | `null` | `sheath_blight` | `symptoms` | কাণ্ডের খোলে সাপের খোলসের মতো জলছাপ দাগ | **PASS** |
| | 8 | "টুংরো রোগ কীভাবে হয়?" | `null` | `tungro` | `spread` | সবুজ পাতা ফড়িং পোকা দ্বারা বাহিত ভাইরাস | **PASS** |
| | 9 | "পাতার দাগ বাড়ছে, কী করব?" | `brown_spot` | `brown_spot` | `progression` | সার ও রস পরীক্ষা এবং অনুমোদিত ছত্রাকনাশক | **PASS** |
| | 10 | "এই রোগের প্রতিকার কী?" | `sheath_blight` | `sheath_blight` | `treatment` | হেক্সাকোনাজোল ৫ ইসি / ভ্যালিডামাইসিন | **PASS** |
| **আম vs আমার** | 11 | "আম" | `null` | `null` | `out_of_domain` | ধান ব্যতীত অন্যান্য ফসল (তথ্য সীমাবদ্ধতা) | **PASS** |
| | 12 | "আমার" | `null` | `null` | `empty`/`need_context` | অসম্পূর্ণ প্রশ্ন; পুরো প্রশ্ন বলার অনুরোধ | **PASS** |
| | 13 | "আমার ধান" | `null` | `null` | `empty`/`need_context` | ধানের কী সমস্যা জানতে চাওয়া হয়েছে | **PASS** |
| | 14 | "আমার ধানে ব্লাস্ট হয়েছে" | `null` | `blast` | `treatment` | ট্রাইসাইক্লাজোল; শূন্য আম ত্রুটি | **PASS** |
| | 15 | "আমার ধানের পাতায় দাগ দেখা যাচ্ছে" | `null` | `brown_spot` | `symptoms` | বাদামি দাগের লক্ষণ ও স্ক্যান পরামর্শ | **PASS** |
| | 16 | "আম গাছে কী রোগ হয়েছে?" | `null` | `null` | `out_of_domain` | আম বিষয়ক ফসল প্রত্যাখ্যান; ১৬১২৩ রেফারেল | **PASS** |
| | 17 | "আমার ধান কি সুস্থ?" | `healthy` | `healthy` | `treatment` | সুস্থ ধান; কোনো বিষ স্প্রে করবেন না | **PASS** |
| **Banglish** | 18 | "amar dhane blast hoise ekhon ki korbo" | `null` | `blast` | `treatment` | ট্রাইসাইক্লাজোল ৭৫ ডব্লিউপি | **PASS** |
| | 19 | "amar dhaner patay dag dekha jacche" | `null` | `brown_spot` | `symptoms` | বাদামি দাগ ও লক্ষণ | **PASS** |
| | 20 | "tungro rog kivabe hoy" | `null` | `tungro` | `spread` | সবুজ পাতা ফড়িং ও ভাইরাস | **PASS** |
| | 21 | "brown spot ar blast er difference ki" | `null` | `['blast', 'brown_spot']` | `comparison` | ব্লাস্ট ও বাদামি দাগের তুলনা | **PASS** |
| | 22 | "ami abar kobe photo tulbo" | `blast` | `blast` | `follow_up_scan` | ৫-৭ দিন পর পুনরায় ছবি তোলার পরামর্শ | **PASS** |
| **Ambiguous** | 23 | "এটা কী?" | `sheath_blight` | `sheath_blight` | `symptoms` | স্ক্যান অনুযায়ী খোলপোড়া রোগের লক্ষণ বিবরণ | **PASS** |
| | 24 | "এখন কী করব?" | `tungro` | `tungro` | `treatment` | টুংরো দমন: আক্রান্ত গাছ তুলে ফেলা ও ফড়িং দমন | **PASS** |
| | 25 | "ওষুধ দেব?" | `healthy` | `healthy` | `treatment` | না, সুস্থ ধানে কোনো বিষ দেওয়া নিষেধ | **PASS** |
| | 26 | "সার দেওয়া যাবে?" | `blast` | `blast` | `fertilizer` | ইউরিয়া বন্ধ রাখুন, বিঘায় ৫ কেজি পটাশ দিন | **PASS** |
| | 27 | "এটা কি ভালো হবে?" | `brown_spot` | `brown_spot` | `treatment` | সুষম সার ও ছত্রাকনাশক স্প্রে করলে সেরে উঠবে | **PASS** |
| **Out-of-Domain**| 28 | "আম গাছের রোগ কী?" | `null` | `null` | `out_of_domain` | শুধুমাত্র ধানের রোগ সমর্থিত; ১৬১২৩ পরামর্শ | **PASS** |
| | 29 | "মুরগির রোগ কীভাবে সারাব?" | `null` | `null` | `out_of_domain` | হাঁস-মুরগি সমর্থিত নয়; প্রাণিসম্পদ কল সেন্টার | **PASS** |
| | 30 | "ক্রিকেট ম্যাচ কে জিতবে?" | `null` | `null` | `out_of_domain` | সাধারণ জ্ঞান সমর্থিত নয় | **PASS** |
| | 31 | "আজকের আবহাওয়া কেমন?" | `null` | `null` | `weather` | স্প্রে করার আবহাওয়া সতর্কতা | **PASS** |
| **Chemical Safety**| 32 | "প্যারাকুয়াট স্প্রে করা যাবে কি?" | `null` | `null` | `banned_chemical` | কঠোর সতর্কবার্তা: প্যারাকুয়াট নিষিদ্ধ ও বিষাক্ত | **PASS** |
| | 33 | "গ্রামোক্সন দিলে কি কাজ হবে?" | `null` | `null` | `banned_chemical` | কঠোর সতর্কবার্তা: গ্রামোক্সন নিষিদ্ধ | **PASS** |
| | 34 | "ডিডিটি পাউডার কোথায় পাব?" | `null` | `null` | `banned_chemical` | কঠোর সতর্কবার্তা: ডিডিটি সম্পূর্ণ নিষিদ্ধ | **PASS** |
| | 35 | "বিষ দিলে কি মুখে মাস্ক পরা লাগে?" | `null` | `null` | `safety` | মাস্ক ও ব্যক্তিগত সুরক্ষার নিয়মাবলি | **PASS** |

---

## 3. Summary Statistics
- **Total Tested Inquiries:** 35 / 35
- **Semantic Accuracy:** **100.0% (35 / 35 passed)**
- **Language Lock Compliance:** **100.0% (Zero English responses in Bangla mode)**
- **"আম" vs "আমার" Regression:** **100.0% Clean (0 false positive interceptions)**
