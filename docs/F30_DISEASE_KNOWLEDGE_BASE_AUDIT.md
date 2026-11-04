# F30: Disease Knowledge Base Audit & Agronomic Evidence Verification
**Document ID:** `docs/F30_DISEASE_KNOWLEDGE_BASE_AUDIT.md`  
**Feature:** F30 AI-Powered Disease Q&A (Voice-First Farmer Copilot)  
**Author:** AgroLeaf AI Agronomy & Engineering Teams  
**Date:** 2026-11-04  
**Status:** Approved for Production  

---

## 1. Grounding Mandate

Agricultural advice directly impacts the livelihood, food security, and financial solvency of smallholder farmers. Hallucinations or inaccurate chemical recommendations can destroy a harvest or endanger human health.

Therefore, the AgroLeaf AI Voice Copilot operates on **Strict Deterministic Retrieval** over an audited, versioned agronomic knowledge base. Generative free-form LLM hallucination is completely eliminated by design. Every answer returned by the engine is mapped to validated guidelines from:

1. **Bangladesh Rice Research Institute (BRRI):** *Modern Rice Cultivation Handbook (আধুনিক ধানের চাষ, ২১তম সংস্করণ)*, Plant Pathology Division.
2. **Department of Agricultural Extension (DAE):** Bangladesh Agricultural Meteorological Information System (BAMIS) Advisory Protocols.
3. **International Rice Research Institute (IRRI):** Rice Knowledge Bank & Standard Evaluation System (SES).
4. **Ministry of Agriculture, Bangladesh:** Approved Pesticide Register & Restricted Chemical List.

---

## 2. Comprehensive Agronomic Class Matrix

### 2.1 Rice Blast (*Magnaporthe oryzae* / ব্লাস্ট রোগ)
- **Pathogen Type:** Fungal (Ascomycete).
- **Key Symptoms:** Eye/spindle-shaped lesions with ash-colored centers and dark brown margins on leaves; rotting at nodal joints or panicle neck (Neck Blast).
- **Approved Chemical Treatments:**
  - Tricyclazole 75 WP (e.g. Trooper / Beam) @ 0.75 - 1.0 g / liter water.
  - Azoxystrobin + Difenoconazole (e.g. Amistar Top) @ 1.0 ml / liter water.
  - Kasugamycin (e.g. Kasumin) @ 2.0 ml / liter water.
- **Cultural & Preventive Control:**
  - Balanced fertilizer application: Avoid excessive Urea (nitrogen); apply split doses of Muriate of Potash (MOP).
  - Maintain continuous standing water (2-3 cm) in the field to inhibit spore colonization.
  - Seed treatment with Carbendazim (Autostin) @ 2-3 g/kg seed before sowing.
- **Critical Weather Alert:** High humidity (>90%), dew persistence, and night temperatures between 18°C - 24°C heavily accelerate infection.

### 2.2 Brown Spot (*Bipolaris oryzae* / বাদামী দাগ রোগ)
- **Pathogen Type:** Fungal.
- **Key Symptoms:** Round to oval brown spots with yellow halos across leaf blades, resembling sesame seeds. Often associated with soil nutrient deficiency.
- **Approved Chemical Treatments:**
  - Mancozeb 75 WP (e.g. Indofil / Dithane M-45) @ 2.0 g / liter water.
  - Iprodione (e.g. Rovral 50 WP) @ 2.0 g / liter water.
  - Propiconazole 25 EC (e.g. Tilt) @ 1.0 ml / liter water.
- **Cultural & Soil Health Management:**
  - Top-dress with MOP (Potash) and Zinc Sulfate (Zinconil / Monozinc).
  - Brown spot is often a "poor man's disease," signaling unfertilized, potassium-deficient, or sandy soils.
  - Proper irrigation to prevent drought stress.

### 2.3 Leaf Smut / Narrow Brown Leaf Spot (*Entyloma oryzae* / ন্যারো ব্রাউন লিফ স্পট)
- **Pathogen Type:** Fungal.
- **Key Symptoms:** Small, linear, angular dark spots or narrow reddish-brown stripes parallel to leaf veins.
- **Agronomic Action:**
  - Usually appears near maturity (heading to ripening stage); rarely causes severe economic yield loss if plants are well-nourished.
  - Spray Propiconazole 25 EC (Tilt) @ 1.0 ml/L only if infection aggressively invades upper flag leaves before grain fill.
  - Ensure balanced potassium nutrition.

### 2.4 Rice Tungro Disease (*RTBV & RTSV* / টুংরো রোগ)
- **Pathogen Type:** Viral complex transmitted solely by the Green Leafhopper (সবুজ পাতা ফড়িং - *Nephotettix virescens*).
- **Key Symptoms:** Yellowish-orange leaf discoloration starting from leaf tips, accompanied by severe stunting and reduced tillering.
- **Crucial Warning to Farmers:**
  - ⚠️ **Viruses cannot be cured with fungicides.** Fungicides have ZERO effect on Tungro. Spraying fungicides is a waste of farmer money!
  - Management must target the **vector insect** (Green Leafhopper):
    - Light traps at night to monitor leafhopper population.
    - MIPC (Mipsin 75 WP) @ 2.0 g/L or Imidacloprid (Admire / Imitaf) @ 0.5 ml/L.
  - Severely stunted, infected clumps should be uprooted and buried to prevent further transmission.

### 2.5 Sheath Blight (*Rhizoctonia solani* / খোল পোড়া রোগ)
- **Pathogen Type:** Soil-borne Fungal.
- **Key Symptoms:** Snake-skin or water-soaked greenish-gray oval lesions with dark brown borders on leaf sheaths near the water waterline.
- **Approved Treatments:**
  - Hexaconazole 5 EC (e.g. Contaf) @ 1.0 ml / liter water.
  - Validamycin 3L (e.g. Sheathmar) @ 2.0 ml / liter water.
  - Thifluzamide 24 SC (e.g. Pulsor) @ 1.0 ml / liter water.
- **Cultural Practices:**
  - Drain standing water and allow soil surface aeration for 3-5 days.
  - Remove weeds and keep plant spacing airy. Avoid high planting density.

### 2.6 Bacterial Leaf Blight (*Xanthomonas oryzae* / ব্যাকটেরিয়াল পাতা পোড়া)
- **Pathogen Type:** Bacterial.
- **Key Symptoms:** Water-soaked lesions starting at leaf margins and wavy yellow-to-white drying progressing downwards; "Kresek" wilt phase in young tillers.
- **Critical Action:**
  - ⚠️ **Stop all Nitrogen (Urea) application immediately.** Urea accelerates bacterial multiplication.
  - Apply additional Potash (MOP) @ 5 kg per bigha (33 decimals) as top-dressing.
  - Drain field water for 2-4 days.
  - Spray Copper Oxychloride or Copper Hydroxide (e.g. Champion) @ 2 g/L or Bismerthiazol @ 1 g/L.

### 2.7 Healthy Crop (*সুস্থ ধান*)
- **Advice:** Congratulate the farmer; recommend proactive preventative hygiene, balanced fertilization according to the crop growth stage, and routine scouting once a week.

---

## 3. Knowledge Base Structure

The knowledge base is structured as hierarchical JSON in `frontend/src/features/copilot/data/agricultural_kb.js` and `frontend/public/data/agricultural_kb.json`, indexed by:
1. `disease_specific`: Class key mapped to standard farmer questions (`treatment`, `fertilizer`, `water`, `organic`, `spread`, `safety`).
2. `general_faq`: Stage timing, seed treatment, weather advisory rules, PPE protocols, emergency contacts.
3. `helpline`: Direct dial 16123 integration.

