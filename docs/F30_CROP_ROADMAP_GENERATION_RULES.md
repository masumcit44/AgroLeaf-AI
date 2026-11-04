# F30: Personalized Crop Roadmap Generation Rules
**Document ID:** `docs/F30_CROP_ROADMAP_GENERATION_RULES.md`  
**Feature:** F30 AI-Powered Agricultural Research & Personalized Farming Planner  
**Author:** Senior Agronomist & Software Architect  
**Date:** 2026-11-04  
**Branch:** `feat/f30-research-planner-upgrade`  
**Status:** CANONICAL RULE SPECIFICATION  

---

## 1. Mathematical Model for Stage Duration

Rice crop physiological development is governed by thermal time (Growing Degree Days, GDD) and photoperiod sensitivity. For modern high-yielding varieties developed by the Bangladesh Rice Research Institute (BRRI), growth stages scale proportionally with total variety maturity duration $D$ (in days):

$$\text{Stage Start Day} = \left\lfloor D \times \frac{P_{\min}}{100} \right\rfloor$$
$$\text{Stage End Day} = \left\lfloor D \times \frac{P_{\max}}{100} \right\rfloor$$

$$\text{Calendar Date}(\text{Day Offset}) = T_0 + \text{Day Offset}$$

where $T_0$ is the farmer's verified transplanting date (or sowing date for direct seeding).

---

## 2. Physiological Stage Partitioning Matrix

| Stage ID | Stage Name (Bengali) | Stage Name (English) | Duration Share ($P_{\min} - P_{\max}$) | Days Offset (BRRI dhan28, 140d) | Days Offset (BRRI dhan29, 160d) |
|---|---|---|---|---|---|
| `stage_establishment` | চারা প্রতিষ্ঠা ও প্রাথমিক যত্ন | Establishment & Rooting | 0% – 12% | 0 – 16 DAT | 0 – 19 DAT |
| `stage_tillering` | সক্রিয় কুশি গজানো | Active Tillering | 13% – 32% | 17 – 45 DAT | 20 – 51 DAT |
| `stage_max_tillering` | সর্বোচ্চ কুশি ও কান্ড বৃদ্ধি | Maximum Tillering | 33% – 48% | 46 – 67 DAT | 52 – 77 DAT |
| `stage_booting` | কাইচথোড় / থোড় পর্যায় | Panicle Initiation / Booting | 49% – 64% | 68 – 89 DAT | 78 – 102 DAT |
| `stage_flowering` | ফুল ফোটা ও পরাগায়ন | Flowering & Heading | 65% – 75% | 90 – 105 DAT | 103 – 120 DAT |
| `stage_grain_filling` | দানা গঠন (দুধ ও শক্ত চাল) | Grain Filling (Dough) | 76% – 88% | 106 – 123 DAT | 121 – 141 DAT |
| `stage_maturity` | ধান পাকা ও কর্তন প্রস্তুতি | Ripening & Harvest Prep | 89% – 100% | 124 – 140 DAT | 142 – 160 DAT |

---

## 3. Variety Catalogue Duration Database

```javascript
export const VARIETY_DURATION_REGISTRY = {
  // Boro (Winter Irrigated)
  brri_28: { duration: 140, type: 'Early', boro_suitable: true, blast_risk: 'High' },
  brri_29: { duration: 160, type: 'Late Mega HYV', boro_suitable: true, blast_risk: 'Medium' },
  brri_50: { duration: 155, type: 'Banglamati Premium', boro_suitable: true, blast_risk: 'Medium' },
  brri_58: { duration: 155, type: 'Improved BR28', boro_suitable: true, blast_risk: 'Low' },
  brri_89: { duration: 156, type: 'Mega Yielding', boro_suitable: true, blast_risk: 'Low' },
  brri_92: { duration: 156, type: 'Water Efficient', boro_suitable: true, blast_risk: 'Low' },
  brri_96: { duration: 143, type: 'Short Duration Boro', boro_suitable: true, blast_risk: 'Low' },
  bina_10: { duration: 130, type: 'Salinity Tolerant', boro_suitable: true, blast_risk: 'Low' },

  // Aman (Monsoon Rainfed)
  brri_49: { duration: 135, type: 'Nizershail Type', aman_suitable: true, blast_risk: 'Medium' },
  brri_51: { duration: 142, type: 'Submergence 2-wk', aman_suitable: true, blast_risk: 'Low' },
  brri_52: { duration: 145, type: 'Flash Flood Tolerant', aman_suitable: true, blast_risk: 'Low' },
  brri_71: { duration: 117, type: 'Drought Tolerant', aman_suitable: true, blast_risk: 'Low' },
  brri_75: { duration: 115, type: 'Early Harvest for Mustard', aman_suitable: true, blast_risk: 'Low' },
  brri_87: { duration: 127, type: 'High Yield Aman', aman_suitable: true, blast_risk: 'Low' },

  // Aus (Pre-Monsoon Summer)
  brri_48: { duration: 110, type: 'High Yield Aus', aus_suitable: true, blast_risk: 'Medium' },
  brri_82: { duration: 105, type: 'Drought Aus', aus_suitable: true, blast_risk: 'Low' },
  brri_98: { duration: 114, type: 'Disease Resistant Aus', aus_suitable: true, blast_risk: 'Low' },
};
```

---

## 4. Stage-Specific Action Generation Rules

### 4.1 Stage 1: Establishment (0 to ~16 DAT)
- **Water Management:** Maintain shallow standing water (2–3 cm / 1 inch) to cushion seedlings from wind and aid root establishment.
- **Dead Hill Gap Filling:** Refill dead seedlings within 7–10 DAT using spare nursery seedlings of the same age.
- **Weeding:** Conduct initial hand weeding or rotary hoe weeding at 12–15 DAT before fertilizer application.

### 4.2 Stage 2: Active Tillering (17 to ~45 DAT)
- **1st Urea Top-Dressing:** Apply 1/3 of total Urea between 15–20 DAT.
- **Alternate Wetting & Drying (AWD):** Introduce AWD perforated pipes (10 cm diameter, inserted 15 cm deep). Irrigate only when water disappears below 15 cm.
- **Pest Monitoring:** Inspect for Stem Borer (*Majra Poka*) deadhearts.

### 4.3 Stage 3: Maximum Tillering (46 to ~67 DAT)
- **2nd Urea Top-Dressing:** Apply 1/3 of total Urea between 30–35 DAT.
- **Weeding:** Complete second manual or mechanical weeding prior to fertilizer application.
- **Disease Alert:** Scout for Sheath Blight (*Khol Pora*) water-soaked lesions near the waterline.

### 4.4 Stage 4: Panicle Initiation / Booting (68 to ~89 DAT)
- **3rd Urea Top-Dressing:** Apply the final 1/3 split 5–7 days before panicle initiation. 
- *Caution:* If weather is overcast, foggy, or leaves are dark green, suspend or reduce Urea to prevent Blast outbreak.
- **Water Management:** Ensure uninterrupted standing water (3–5 cm) during panicle formation; water stress at this stage causes high spikelet sterility.

### 4.5 Stage 5: Flowering & Heading (90 to ~105 DAT)
- **Critical Water Security:** Strictly maintain 5 cm standing water. Never allow the soil to crack during flowering.
- **No Spraying During Peak Anthesis:** Do not spray chemical fungicides or insecticides between 9:00 AM and 12:00 PM to protect rice pollen and beneficial honeybee activity.

### 4.6 Stage 6: Grain Filling (106 to ~123 DAT)
- **Milky Stage Care:** Maintain moist soil.
- **Dough Stage Transition:** Allow field water to gradually recede.

### 4.7 Stage 7: Maturity & Harvesting (124 to ~140 DAT)
- **Final Field Drainage:** Drain all standing water 10–12 days prior to expected harvest date to hasten uniform ripening and firm the soil for harvesting machinery/labour.
- **Harvesting Threshold:** Harvest when **80–85% of grains on the panicle turn golden straw-yellow**, even if the lower stem remains greenish. Delay causes shattering and lodging losses.
- **Drying:** Sun-dry harvested paddy to **14% moisture content** for safe storage.

---

## 5. Execution Guarantee

These rules ensure that whenever a farmer asks *"আমি আজ ধানের চারা রোপণ করেছি। কী করতে হবে?"*, the planner builds an authentic, variety-tailored, date-synchronized roadmap grounded in BRRI agronomic science.
