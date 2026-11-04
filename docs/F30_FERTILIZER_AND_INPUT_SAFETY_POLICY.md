# F30: Fertilizer & Agrochemical Input Safety Policy
**Document ID:** `docs/F30_FERTILIZER_AND_INPUT_SAFETY_POLICY.md`  
**Feature:** F30 AI-Powered Agricultural Research & Personalized Farming Planner  
**Author:** Senior Agronomist, Agricultural Toxicologist & Software QA Lead  
**Date:** 2026-11-04  
**Branch:** `feat/f30-research-planner-upgrade`  
**Status:** MANDATORY SAFETY DIRECTIVE  

---

## 1. Zero-Fabrication Mandate

Miscalculated fertilizer doses or pesticide concoctions can scorch seedlings, destroy beneficial insect biomes, induce catastrophic fungal outbreaks, or cause fatal chemical poisoning among farmers.

AgroLeaf AI enforces a **Zero-Tolerance Policy for Fabricated Agricultural Dosages**. Every calculation must stem from verified Bangladesh Agricultural Research Council (BARC) Fertilizer Recommendation Guides (FRG 2018/2024) and BRRI crop management standards.

---

## 2. Standardized Land Unit Measurement Normalization

Bangladesh uses varying customary land units. To protect farmers from fatal 7.5x dosage errors (e.g. confusing hectare with bigha):

$$\text{Decimals} = \begin{cases} 
A & \text{if unit is decimal (শতক / শতাংশ)} \\
A \times 33 & \text{if unit is standard bigha (বিঘা)} \\
A \times 100 & \text{if unit is acre (একর)} \\
A \times 247.1 & \text{if unit is hectare (হেক্টর)} \\
A \times 1.65 & \text{if unit is katha (কাঠা)}
\end{cases}$$

All internal agronomic equations compute requirements per **Decimal (শতক)** first, then scale to the farmer's stated acreage.

---

## 3. Official BARC Fertilizer Matrix (Per Bigha & Per Decimal)

### 3.1 Boro Rice (Modern High Yielding Varieties: BRRI dhan28, 29, 89, 92)
*Target Yield: 6.5–7.5 t/ha | Standard 1 Bigha = 33 Decimals*

| Chemical Fertilizer | Active Nutrient | Rate per Hectare | Rate per Standard Bigha (33 Decimals) | Rate per Decimal (শতক) | Application Timing & Method |
|---|---|---|---|---|---|
| **Urea (ইউরিয়া)** | Nitrogen (N, 46%) | 260 – 300 kg | **35 – 40 kg** | **1.05 – 1.20 kg** | 3 সমান কিস্তিতে প্রয়োগ (১৫–২০ DAT, ৩০–৩৫ DAT, কাইচথোড়ের ৫-৭ দিন আগে) |
| **TSP (টিএসপি)** | Phosphorus (P, 46%) | 90 – 120 kg | **12 – 16 kg** | **0.36 – 0.48 kg** | ১০০% জমি তৈরির শেষ চাষে (Basal) মাটিতে মিশিয়ে দিন |
| **MoP (পটাশ)** | Potassium (K, 60%) | 100 – 140 kg | **13 – 19 kg** | **0.40 – 0.57 kg** | ৬০% শেষ চাষে এবং ৪০% সর্বোচ্চ কুশি গজানোর সময় (৩য় কিস্তি ইউরিয়ার সাথে) |
| **Gypsum (জিপসাম)** | Sulphur (S, 18%) | 60 – 90 kg | **8 – 12 kg** | **0.24 – 0.36 kg** | ১০০% শেষ চাষে প্রয়োগ করুন |
| **Zinc Sulphate (দস্তা)** | Zinc (Zn, 36%) | 10 – 12 kg | **1.3 – 1.6 kg** | **0.04 – 0.05 kg** | শেষ চাষে প্রয়োগ। ফসফরাস (TSP)-এর সাথে একসাথে মেশাবেন না |

### 3.2 Transplanted Aman Rice (T. Aman: BRRI dhan49, 71, 75, 87)
*Target Yield: 5.0–6.0 t/ha | Standard 1 Bigha = 33 Decimals*

| Chemical Fertilizer | Rate per Hectare | Rate per Standard Bigha (33 Decimals) | Rate per Decimal (শতক) |
|---|---|---|---|
| **Urea (ইউরিয়া)** | 150 – 180 kg | **20 – 25 kg** | **0.60 – 0.75 kg** |
| **TSP (টিএসপি)** | 60 – 80 kg | **8 – 11 kg** | **0.25 – 0.33 kg** |
| **MoP (পটাশ)** | 70 – 90 kg | **9 – 12 kg** | **0.28 – 0.36 kg** |
| **Gypsum (জিপসাম)** | 40 – 60 kg | **5 – 8 kg** | **0.15 – 0.24 kg** |
| **Zinc Sulphate (দস্তা)** | 8 – 10 kg | **1.0 – 1.3 kg** | **0.03 – 0.04 kg** |

---

## 4. Strict Timing & Split-Dosing Rules

### Rule 1: The Zero-Basal Urea Rule
**Urea must never be applied during basal plowing/puddling.** Submerged soil during final land preparation loses up to 70% of nitrogen into the atmosphere via ammonia volatilization and denitrification. Basal application is strictly reserved for TSP, Gypsum, Zinc, and basal MoP.

### Rule 2: Three-Split Urea Top-Dressing Schedule
1. **1st Top-Dress (15–20 DAT):** Active tillering phase. Hand-weed field first, drain excess water so soil is moist/saturated, apply 1/3 Urea, incorporate into mud.
2. **2nd Top-Dress (30–35 DAT):** Maximum tillering phase. Apply 1/3 Urea along with remaining Potash.
3. **3rd Top-Dress (5–7 days before Panicle Initiation, ~45–60 DAT):** Apply final 1/3 Urea. Boosts panicle branch count and grain number.

### Rule 3: Post-Heading Nitrogen Prohibition
**Never apply Urea after panicle emergence / flowering.** Post-heading nitrogen promotes vegetative leafiness, delays maturity, increases empty grains, and triggers devastating Sheath Blight and Neck Blast outbreaks.

---

## 5. Disease-Triggered Input Overrides

When an active diagnosis exists or symptoms of Leaf Blast, Neck Blast, or Sheath Blight are detected:
1. 🚨 **Immediate Urea Freeze:** The system automatically issues an urgent alert:
   > *"সতর্কতা: জমিতে ব্লাস্ট বা খোল পোড়া রোগ দেখা দিলে ইউরিয়া সার প্রয়োগ সম্পূর্ণ বন্ধ রাখুন। অতিরিক্ত ইউরিয়া রোগ দ্রুত ছড়িয়ে দেয়।"*
2. 🛡️ **Potassium Defense Boost:** Recommends a supplemental top-dressing of 5 kg/bigha MOP (Muriate of Potash) to reinforce plant epidermal cell walls against fungal hyphae.

---

## 6. Prohibited Chemicals Blacklist & Cocktail Warnings

### 6.1 Prohibited Agrochemicals
The research copilot strictly blocks and flags the following banned substances:
- **Paraquat (গ্রামোক্সোন / প্যারাডক্স):** Lethal banned herbicide causing irreversible lung and organ fibrosis.
- **DDT, Aldrin, Dieldrin, Endrin, Heptachlor:** Banned persistent organic pollutants.
- **Monocrotophos, Methyl Parathion:** Class I neurotoxic insecticides.
- **Endosulfan:** Globally banned organochlorine.

If a farmer asks about a prohibited chemical, the engine returns an immediate safety warning:
> *"প্যারাটুয়াট বা ডাইএলড্রিনের মতো নিষিদ্ধ রাসায়নিক মানবদেহ ও পরিবেশের জন্য মারাত্মক ক্ষতিকর। এগুলো বাংলাদেশে সম্পূর্ণ নিষিদ্ধ। অনুমোদিত ও নিরাপদ বিকল্প ব্যবহারের জন্য ১৬১২৩ নম্বরে পরামর্শ নিন।"*

### 6.2 Chemical Cocktail Warning ("ককটেল বিষ নিষেধ")
Mixing multiple insecticides and fungicides together in a single knapsack sprayer creates phytotoxicity that burns rice leaves. The planner automatically renders:
> *"সতর্কতা: একাধিক কীটনাশক ও ছত্রাকনাশক একসাথে মিশিয়ে ককটেল স্প্রে করবেন না।"*

### 6.3 Pre-Harvest Interval (PHI) Enforcement
No chemical sprays may be scheduled within **14–21 days of the estimated harvest date** to prevent toxic residue accumulation in consumer rice grains.
