# F30: Research Source Trust & Credibility Policy
**Document ID:** `docs/F30_RESEARCH_SOURCE_TRUST_POLICY.md`  
**Feature:** F30 AI-Powered Agricultural Research & Personalized Farming Planner  
**Author:** Lead Agricultural Knowledge Engineer & Quality Assurance Lead  
**Date:** 2026-11-04  
**Branch:** `feat/f30-research-planner-upgrade`  
**Status:** OFFICIAL POLICY SPECIFICATION  

---

## 1. Objective & Principle

In agricultural technology, erroneous or fabricated recommendations can lead to catastrophic crop failure, wasted financial investments, or chemical poisoning. 

AgroLeaf AI enforces a **Zero-Hallucination, Evidence-Linked Trust Architecture**. Every recommendation—whether concerning fertilizer doses, variety maturity windows, or pesticide sprays—must be traceable to an accredited, authoritative source.

---

## 2. Source Credibility Hierarchy

All agricultural information retrieved or utilized by AgroLeaf AI is classified into 4 strict credibility tiers:

```
┌──────────────────────────────────────────────────────────────────┐
│ TIER 1: National Statutory Agricultural Bodies (Bangladesh)     │
│ BRRI, DAE (BAMIS), BARC, BADC, BINA, Ministry of Agriculture     │
├──────────────────────────────────────────────────────────────────┤
│ TIER 2: Accredited International Agricultural Research Centers   │
│ IRRI, FAO, CIMMYT, CGIAR                                         │
├──────────────────────────────────────────────────────────────────┤
│ TIER 3: Peer-Reviewed Scientific Agronomy Journals               │
│ Bangladesh Rice Journal, BanglaJOL, Crop Science, Agronomy       │
├──────────────────────────────────────────────────────────────────┤
│ TIER 4: Unverified Commercial Blogs, Social Media & Forums       │
│ Agronomy blogs, fertilizer dealer pages, Facebook groups         │
│ [STRICTLY PROHIBITED AS BASIS FOR ADVISORIES]                    │
└──────────────────────────────────────────────────────────────────┘
```

### 2.1 Tier 1: National Statutory Agricultural Bodies (Highest Priority)
- **Entities:**
  - **BRRI (Bangladesh Rice Research Institute):** Sole national authority on rice variety development, genetic characteristics, and official cultivation manuals (*"আধুনিক ধানের চাষ"*).
  - **DAE (Department of Agricultural Extension):** Field-level agronomic advisories, BAMIS crop weather calendars, and pest surveillance.
  - **BARC (Bangladesh Agricultural Research Council):** Official Fertilizer Recommendation Guide (FRG), soil testing norms, and Agro-Ecological Zone (AEZ) zoning.
  - **BINA (Bangladesh Institute of Nuclear Agriculture):** Mutant and stress-tolerant rice varieties (e.g. BINA dhan-7, BINA dhan-10).
- **Authority:** Absolute priority for Bangladesh field practices, legal pesticide registrations, and regional planting dates.

### 2.2 Tier 2: Accredited International Centers
- **Entities:** IRRI, FAO, CGIAR.
- **Authority:** Validated global methodologies (e.g. Alternate Wetting and Drying AWD protocols, integrated pest management principles). Must be calibrated against Tier 1 Bangladesh agro-climatic conditions.

### 2.3 Tier 3: Peer-Reviewed Scientific Journals
- **Entities:** Articles published in indexed agronomic journals (e.g., Bangladesh Journal of Agricultural Research, Field Crops Research).
- **Authority:** Supporting evidence for emerging climate adaptation and physiological responses. Cannot override Tier 1 official extension directives.

### 2.4 Tier 4: Commercial & Community Sources (Unverified)
- **Policy:** **Strictly excluded** from evidence synthesis. Commercial pesticide brand claims, dealer promotions, and unvetted blog posts are rejected automatically by source filtering logic.

---

## 3. Cross-Source Verification & Discrepancy Resolution

When multiple sources provide data for the same agricultural question, the engine applies the following deterministic rules:

### Rule 1: Local Jurisdiction Precedence
If an international source (Tier 2) suggests a different planting depth or fertilizer dosage than BRRI/BARC (Tier 1), the **Tier 1 Bangladesh recommendation takes precedence**.

### Rule 2: Temporal Freshness Precedence
When older and newer editions from the same authority exist (e.g. BARC FRG-2012 vs FRG-2024), the **latest verified revision** is adopted. The publication year is explicitly recorded in the evidence object.

### Rule 3: Variety-Specific Override
General blanket recommendations (e.g. standard Boro rice fertilizer dosage) are overridden by **variety-specific manuals** published by BRRI (e.g. specific low-nitrogen guidelines for lodging-sensitive lines like BRRI dhan28).

### Rule 4: Unresolvable Discrepancy Transparency
If two credible Tier 1 sources present conflicting guidelines due to differing AEZs or soil types, the system **never guesses or averages arbitrarily**. It explicitly states:
> *"উৎসসমূহের মধ্যে তথ্যের পার্থক্য রয়েছে: [উৎস ক] অনুযায়ী ... এবং [উৎস খ] অনুযায়ী ...। আপনার স্থানীয় উপসহকারী কৃষি কর্মকর্তা (SAAO)-এর পরামর্শ নিন।"*

---

## 4. Citation & Attribution Standards

Every structured plan generated by the F30 Research Copilot must render transparent source citations:
1. **Institution / Author:** (e.g., *বাংলাদেশ ধান গবেষণা ইনস্টিটিউট (BRRI)*)
2. **Document / Portal Title:** (e.g., *আধুনিক ধানের চাষ (২৫তম সংস্করণ) / Rice Profile*)
3. **Canonical URL:** (e.g., `https://riceprofile.brri.gov.bd/varieties`)
4. **Access / Verification Timestamp:** ISO date string.
5. **Research Quality Badge:** Transparent indicator (*"সরকারি ও গবেষণা প্রতিষ্ঠান দ্বারা যাচাইকৃত"*).

---

## 5. Compliance Enforcement

The `evidenceRegistry.js` module automatically validates all retrieved claims against this trust policy. Any claim failing Tier 1 or Tier 2 verification is flagged and barred from inclusion in farmer-facing recommendations.
