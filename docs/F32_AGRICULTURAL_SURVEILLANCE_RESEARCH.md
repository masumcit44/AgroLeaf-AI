# AGROLEAF AI — F32 AGRICULTURAL SURVEILLANCE RESEARCH
## Epidemiological Principles, Bangladesh Rice Disease Dynamics & Authoritative Early Warning Protocols

**Document ID:** `F32-RES-003`  
**Feature:** F32 Outbreak Early Warning & Neighbor Risk Alert  
**Date:** November 2026  
**Status:** SCIENTIFICALLY VALIDATED  
**Target Worktree:** `D:\Desktop\AIgnite 2026\AgroLeaf_deploy_wt`  
**Branch:** `feat/f32-outbreak-early-warning`  

---

## 1. Authoritative Framework & Scientific Grounding

This research synthesizes disease surveillance methodologies, transmission dynamics, and preventive protocols established by:
- **Bangladesh Rice Research Institute (BRRI):** Plant Pathology Division, *"আধুনিক ধানের চাষ"* (Modern Rice Cultivation, 24th Ed.), and BRRI Rice Solution technical documentation.
- **Department of Agricultural Extension (DAE):** Bangladesh Agrometeorological Information System (BAMIS) Rice Disease Forecasting Bulletins.
- **Food and Agriculture Organization (FAO):** International Standards for Phytosanitary Measures (ISPM 6: Surveillance).
- **International Rice Research Institute (IRRI):** Rice Knowledge Bank — Disease Surveillance & Epidemic Management.

---

## 2. Epidemiology of Rice Diseases in Bangladesh

Rice diseases exhibit distinct pathogen biologies, environmental triggers, and spatial transmission patterns across the three primary rice seasons (Boro, Aman, Aus).

### 2.1 Rice Blast (*Magnaporthe oryzae* / *Pyricularia oryzae*)
- **Etiology & Spread:** Airborne conidia capable of traveling several kilometers on wind currents. Microconidia germinate within 4–8 hours under leaf moisture.
- **Critical Environmental Triggers:**
  - Night temperature between $18^\circ\text{C}$ and $24^\circ\text{C}$ coupled with daytime temperatures around $28\text{--}30^\circ\text{C}$.
  - Relative humidity $\ge 90\%$ for more than 10–12 consecutive hours (heavy dew, morning fog, overcast skies).
  - Excessive vegetative nitrogen (Urea over-application).
- **Seasonal Peaks:**
  - **Boro Season:** February to April (Seedling blast in seedbeds; Leaf blast during tillering; Neck/Panicle blast during heading).
  - **Aman Season:** September to October (Leaf and neck blast during reproductive stages).
- **Early Warning Relevance:** **Critical.** Blast is polycyclic with exponential spore production, making rapid community alert dissemination vital to protect surrounding fields before spore showers establish.

### 2.2 Brown Spot (*Bipolaris oryzae*)
- **Etiology & Spread:** Semi-seedborne and airborne conidia; chronic saprophytic survival on crop residues and wild grasses.
- **Critical Triggers:** Soil nutrient stress (potassium, silicon, or zinc deficiency), drought stress, light soils, and unseasonal dry spells.
- **Seasonal Peaks:** Boro and Aman late seasons.
- **Early Warning Relevance:** Moderate. Indicates localized soil and water management deficits rather than explosive airborne epidemics. Alerts focus on balanced fertilization (potash/zinc) rather than emergency chemical eradication.

### 2.3 Sheath Blight (*Rhizoctonia solani*)
- **Etiology & Spread:** Soil-borne and water-borne sclerotia that float on irrigation water and attach to rice tillers at the water line.
- **Critical Triggers:** High temperature ($28\text{--}32^\circ\text{C}$), high humidity ($>85\%$), close hill spacing, dense canopy, and excessive nitrogen.
- **Seasonal Peaks:** July to September (Aman season) and March to May (late Boro season).
- **Early Warning Relevance:** High. Spreads rapidly through contiguous flooded paddies sharing common irrigation canals. Neighbor alerts prompt farmers to lower ponding depth and clear bunds.

### 2.4 Tungro Virus (RTBV / RTSV)
- **Etiology & Spread:** Semi-persistent transmission by Green Leafhopper (*Nephotettix virescens*).
- **Critical Triggers:** High vector populations in weeded borders; staggered planting across neighboring plots.
- **Seasonal Peaks:** Late Aus and early Aman seasons.
- **Early Warning Relevance:** High. Clustered transmission along vector flight corridors. Alerts advise light-trap monitoring and vector containment.

---

## 3. Core Epidemiological Invariant: Scan Reports vs. Outbreak

A crowd-sourced mobile diagnostic application differs fundamentally from an official epidemiological census:
1. **Self-Selection Bias:** Farmers scan leaves primarily when they observe symptoms. A cluster of 15 scans in one district might reflect 3 farmers actively diagnosing their crop, not a regional calamity.
2. **Scan-Volume Confounding:** Higher smartphone penetration or local training workshops in Gazipur will generate more scans than in rural Kurigram, irrespective of actual disease incidence.
3. **Classification Uncertainty:** Even with calibrated models ($\ge 0.70$ confidence), field imagery can contain ambiguous lesions.

### Formal Representation
Let $C_{d,w,k}$ be the number of distinct positive contributors for disease $k$ in district $d$ during week $w$, and $N_{d,w}$ be the total active contributors in district $d$.
- **The Metric of Interest** is the *relative reporting rate*:
  $$R_{d,w,k} = \frac{C_{d,w,k}}{N_{d,w}}$$
- A genuine early warning signal occurs when $R_{d,w,k}$ exceeds the historical baseline rate $\bar{R}_{d,k}$ by a statistically significant margin, supported by at least $C_{d,w,k} \ge 3$ independent farmers.
- **Communication Invariant:** AgroLeaf alerts inform farmers of *"রোগের রিপোর্ট বৃদ্ধি"* (Increased Reporting Activity), strictly avoiding unverified declarations of *"মহামারী"* (Epidemic/Outbreak).

---

## 4. BRRI & DAE Approved Preventive Action Matrix

When an early warning alert is triggered, the system provides practical, evidence-backed actions:

| Disease | Immediate Agronomic Action | Fertilizer Adjustment | Chemical / Bio-Control Protocol |
| :--- | :--- | :--- | :--- |
| **Blast** (*ব্লাস্ট*) | Maintain 2–3 cm standing water in the paddy (inhibits blast infection). Inspect lower leaves in early morning. | **Freeze all Urea/Nitrogen applications immediately.** Postpone top-dressing until no new spindle lesions appear. | If spindle spots with grey centers are verified, consult SAAO (উপসহকারী কৃষি কর্মকর্তা) or apply Tricyclazole (Trooper 75 WP @ 0.8 g/L) or Azoxystrobin + Difenoconazole (Amistar Top @ 1 ml/L). |
| **Brown Spot** (*বাদামী দাগ*) | Check soil moisture; avoid prolonged drying of the field. | Apply recommended Muriate of Potash (MoP) split ($15\text{ kg/bigha}$) and Zinc Sulphate if deficient. | Seed treatment for next crop; foliar spray of Mancozeb or Propiconazole only if economic injury threshold exceeded. |
| **Sheath Blight** (*শীথ ব্লাইট*) | Drain stagnant water for 2–3 days if soil conditions permit. Remove weed hosts from field bunds. | Do not apply excessive Urea. Ensure balanced Potash application. | Apply Validamycin (Validacin 3L @ 2 ml/L) or Hexaconazole (Contaf 5EC @ 1 ml/L) aimed specifically at leaf sheaths at water level. |
| **Tungro** (*টুংরো*) | Rogue and bury infected yellow-orange stunted hills. Set up nocturnal light traps for leafhoppers. | Ensure adequate potassium to enhance crop vigor. | Target Green Leafhopper vector with approved systemic insecticides (MIPC / Imidacloprid) only when vector threshold is reached. |

---

## 5. Summary

Agricultural early warning is an exercise in actionable prevention, not fear-mongering. Grounding F32 in BRRI and DAE epidemiological protocols ensures that every generated alert promotes sound agronomic interventions while maintaining scientific integrity.
