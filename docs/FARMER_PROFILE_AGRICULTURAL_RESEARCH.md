# AgroLeaf AI — Farmer Profile: Agricultural Research & Crop Calendar Rules
**Document ID:** `docs/FARMER_PROFILE_AGRICULTURAL_RESEARCH.md`  
**Sources:** Bangladesh Rice Research Institute (BRRI) & Bangladesh Agro-Meteorological Information Service (BAMIS)  
**Lead Researcher:** Antigravity Agricultural Intelligence Team  
**Date:** 2026-11-04  

---

## 1. Authoritative Information Sources

### 1.1 Bangladesh Rice Research Institute (BRRI)
- **Official Rice Profile Portal:** `https://riceprofile.brri.gov.bd/`
- **Varieties Catalogue:** `https://riceprofile.brri.gov.bd/varieties`
- **Area-Based Varieties:** `https://riceprofile.brri.gov.bd/area-varieties`
- **Cultivation Manual:** `https://riceprofile.brri.gov.bd/cultivation`

### 1.2 Bangladesh Agro-Meteorological Information Service (BAMIS)
- **Official Crop-Weather Calendar:** `https://www.bamis.gov.bd/en/calendar`
- **Regional Agro-Met Advisory Bulletins:** Division and district level agro-meteorological guidance across Aus, Aman, and Boro seasons.

---

## 2. Seasonal Rice Ecologies in Bangladesh

### 2.1 Boro Rice (বোরো ধান)
- **Growing Period:** November/December to April/May (কার্তিক/অগ্রহায়ণ থেকে বৈশাখ/জ্যৈষ্ঠ).
- **Ecology:** Fully irrigated dry-season rice. Accounts for ~55% of Bangladesh's national rice production.
- **Key BRRI Varieties:**
  - `BRRI dhan28`: Early maturity (140 days). High yield, slender grains.
  - `BRRI dhan29`: Standard high-yield (160 days). The gold standard in Boro production.
  - `BRRI dhan50` (Banglamati): Premium long slender grain, aromatic (155 days).
  - `BRRI dhan58`: Modern upgrade to BRRI dhan28 with stronger blast tolerance (155 days).
  - `BRRI dhan89`: Ultra high-yielding variety (156 days), 8.5 t/ha yield potential.
  - `BRRI dhan92`: Low water requirement Boro variety (156 days).
  - `BRRI dhan96`: Short duration (143 days), cold-tolerant at seedling stage.

### 2.2 Aman Rice (আমন ধান)
- **Growing Period:** June/July to November/December (আষাঢ়/শ্রাবণ থেকে অগ্রহায়ণ/পৌষ).
- **Ecology:** Monsoon rainfed rice (supplementary irrigation during drought). Accounts for ~38% of national production.
- **Key BRRI Varieties:**
  - `BRRI dhan49`: Medium duration (135 days), excellent cooking quality ("Nizershail type").
  - `BRRI dhan51` / `BRRI dhan52`: Submergence-tolerant ("Jol-doba shohonshil") surviving 14–18 days flash floods (142–145 days).
  - `BRRI dhan71`: Drought-tolerant (117 days) for water-stressed barind and western regions.
  - `BRRI dhan75`: Short duration (115 days) allowing a 3rd winter crop (mustard/potato).
  - `BRRI dhan87`: High yield premium grain (127 days), replacement for BRRI dhan49.

### 2.3 Aus Rice (আউশ ধান)
- **Growing Period:** March/April to June/July (চৈত্র/বৈশাখ থেকে আষাঢ়/শ্রাবণ).
- **Ecology:** Pre-monsoon short-duration rice. High temperatures and erratic rainfall.
- **Key BRRI Varieties:**
  - `BRRI dhan48`: High yielding, drought tolerant (110 days).
  - `BRRI dhan82`: Early maturity (105 days).
  - `BRRI dhan85`: High yield Aus (106 days).
  - `BRRI dhan98`: High yield, disease tolerant (114 days).

---

## 3. Growth Stages & Physiological Windows

### 3.1 Transplanted Rice (চারা রোপণ)
| Stage ID | Bangla Name | English Name | Day Offset (from Transplanting) | Critical Physiological Activity |
| :--- | :--- | :--- | :--- | :--- |
| `stage_seedbed` | বীজতলা পর্যায় | Nursery Seedbed | Day -25 to -30 | Seed soaking, incubation, nursery watering |
| `stage_transplant` | চারা রোপণ পর্যায় | Transplanting | Day 0 to 5 | 2–3 seedlings per hill, 20x15 cm spacing |
| `stage_establishment`| প্রতিষ্ঠা ও আগাছা দমন | Establishment & Weeding | Day 10 to 15 | Rooting, first hand-weeding, thin water layer |
| `stage_tillering` | সক্রিয় কুশি গজানো | Active Tillering | Day 20 to 30 | 1st top-dressing of urea & MOP, tillering surge |
| `stage_max_tillering`| সর্বোচ্চ কুশি পর্যায় | Maximum Tillering | Day 35 to 45 | Mid-season aeration, pest scouting (Stem borer) |
| `stage_panicle_init` | কাইচথোড় / থোড় | Panicle Initiation / Booting | Day 55 to 65 | Final top-dressing, blast scouting, 5–7 cm water |
| `stage_flowering` | ফুল ফোটা ও পরাগায়ন | Flowering & Anthesis | Day 75 to 85 | Continuous standing water, avoid chemical sprays during morning pollination |
| `stage_milking` | দুধ ও দানা গঠন | Milk & Dough Stage | Day 90 to 110 | Grain filling, Brown Planthopper (BPH) scouting |
| `stage_maturity` | পরিপক্কতা ও পানি নিষ্কাশন | Ripening & Drainage | Day 120 to 135 | Drain all field water 10–12 days before harvest |
| `stage_harvest` | ধান কর্তন ও সংগ্রহ | Harvest & Post-Harvest | Day 135 to 155 | Harvest when 80% grains turn golden yellow |

### 3.2 Direct-Seeded Rice (সরাসরি বপন)
When directly seeded (dry seeded or drum-seeded wet rice), seedbed establishment is eliminated; initial tillering occurs earlier, shortening the cycle by approximately 10 to 14 days.

---

## 4. Evidence Grounding & Zero-Hallucination Policy
- Never calculate exact chemical concentrations or application dates for unverified soil types.
- Fertilizer guidance focuses on timely split applications (Urea in 3 splits, MOP in 2 splits) per BRRI standards.
- Water management follows Alternate Wetting and Drying (AWD) and critical stage inundation.

