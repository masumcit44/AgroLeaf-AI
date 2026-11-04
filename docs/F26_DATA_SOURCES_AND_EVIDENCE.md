# AgroLeaf AI — Feature F26: Data Sources, Scientific Evidence & Knowledge Base
## Authoritative Literature, BAMIS Rules & Agricultural Calibration Reference

**Document:** `docs/F26_DATA_SOURCES_AND_EVIDENCE.md`  
**Author:** Antigravity (Project Lead & Technical Architect)  
**Date:** 4 November 2026  
**Status:** Approved & Grounded in Official Literature  

---

## 1. Regulatory & Institutional Authorities

All epidemiological parameters, growth stage sensitivities, and cultural management advice implemented in AgroLeaf AI F26 are grounded in official agricultural institutions and peer-reviewed literature:

1. **BRRI (Bangladesh Rice Research Institute):**
   - *Adhunik Dhaner Chash* (আধুনিক ধানের চাষ, ২৩তম সংস্করণ, ২০২০), BRRI Publication No. 44.
   - *Rice Knowledge Bank (BRKB)*: Disease Diagnostic Guides for Boro, Aman, and Aus seasons.
   - BRRI Plant Pathology Division: Annual Output and Epidemic Loss Assessment Reports.
2. **DAE (Department of Agricultural Extension, Ministry of Agriculture):**
   - *Krishi Projukti Hatboi* (কৃষি প্রযুক্তি হাতবই, ৮ম সংস্করণ).
   - *Krishi Diary* (কৃষি ডায়েরী, প্রতি বছর প্রকাশিত).
   - *Agrometeorological Early Warning Protocols*.
3. **BAMIS (Bangladesh Agrometeorological Information System, DAE / MoA):**
   - Official Rice Disease Forecast & Early Warning Calendars:
     - Faridpur District Boro Crop Calendar: `https://bamis.gov.bd/res/public/calendars/2019/08/23/5102.pdf`
     - Sylhet District Boro Crop Calendar: `https://bamis.gov.bd/res/public/calendars/2019/08/23/5108.pdf`
     - DAE Official Disease Threshold Reference: `https://bamis.gov.bd/diseases/1/all/76`
4. **IRRI (International Rice Research Institute):**
   - *Rice Knowledge Bank (IRRI RKB)*: Pathogen Biology, Epidemiology, and Non-Chemical Cultural Control.
   - *Compendium of Rice Diseases and Pests* (APS Press / IRRI).
5. **FAO (Food and Agriculture Organization):**
   - *Integrated Pest Management (IPM) in Rice: Farmer Field School Manual*.

---

## 2. Seven-Class Taxonomic and Epidemiological Knowledge Base

### 2.1 Rice Blast (`blast`)
- **Causal Organism:** *Pyricularia oryzae* Cavara (Teleomorph: *Magnaporthe oryzae* Couch & Kohn).
- **Target Plant Organs:** Leaf blade (Leaf blast), panicle neck collar (Neck blast), culm node (Node blast).
- **BAMIS Agromet Conditions (Faridpur 5102.pdf / Sylhet 5108.pdf):**
  - Night temperature: $16\text{--}20^\circ\text{C}$ for $\ge 7.5$ hours.
  - Day temperature: $25\text{--}30^\circ\text{C}$ for $\ge 7.5$ hours.
  - Diurnal temperature range: $\Delta T > 10^\circ\text{C}$.
  - Relative Humidity (RH): $> 90\%$ sustained.
  - Canopy state: Heavy morning dew or dense fog $\ge 10$ hours, overcast skies.
- **Vulnerability & Yield Loss Mechanism:**
  - *Vegetative (Seedbed to Tillering):* Spindle-shaped foliar lesions reduce leaf area index ($10\text{--}30\%$ loss if uncontrolled).
  - *Reproductive (Booting to Flowering / Heading):* Neck blast severs vascular flow to the rachis, causing total grain abortion (*চিটা* / $50\text{--}80\%$ loss on infected tillers).
  - *Ripening (Milking to Harvest):* Chalky grains and lodging ($5\text{--}15\%$ loss).
- **Cultural Management (Non-Chemical):**
  - Immediately suspend urea / nitrogen top-dressing; apply extra potassium (MOP at 5–6 kg per bigha).
  - Maintain $2\text{--}4$ cm standing water (never allow field soil to crack or dry out).
  - Gently shake or sweep cane/rope across canopy at dawn to shed heavy dew droplets.
  - Call **16123** (Krishi Call Centre) or consult SAAO for emergency guidance.

### 2.2 Sheath Blight (`sheath_blight`)
- **Causal Organism:** *Rhizoctonia solani* Kühn AG-1 IA (Teleomorph: *Thanatephorus cucumeris*).
- **Target Plant Organs:** Basal leaf sheaths near waterline, upward runner hyphae to upper sheaths and flag leaves.
- **BAMIS Agromet Conditions (Sylhet 5108.pdf):**
  - Temperature: $28\text{--}32^\circ\text{C}$ (warm, tropical humid weather).
  - Relative Humidity (RH): $\ge 80\text{--}90\%$ inside dense canopy.
  - Stand conditions: High tillering density ($< 15$ cm plant spacing), excess standing stagnant water.
- **Vulnerability & Yield Loss Mechanism:**
  - *Vegetative:* Waterline oval lesions with brown serpentine borders ("snakeskin pattern").
  - *Reproductive (Max Tillering to Heading):* Rapid vertical climb to flag leaf; culm tissue destruction causes severe lodging and poor grain fill ($20\text{--}45\%$ yield loss).
- **Cultural Management (Non-Chemical):**
  - Drain stagnant field water for $3\text{--}5$ days (Alternate Wetting and Drying / AWD) to aerate the base and expose lower sheaths to sunlight.
  - Maintain ventilation pathways (*বিলি / আইল ফাঁকা রাখা*): leave a 30 cm corridor every 10–12 rows.
  - Balance nitrogen top-dressing; avoid excessive single applications.
  - Skim off floating sclerotia during final land puddling.

### 2.3 Brown Spot (`brown_spot`)
- **Causal Organism:** *Bipolaris oryzae* (Breda de Haan) Shoemaker (syn. *Helminthosporium oryzae*).
- **Target Plant Organs:** Leaf blades, glumes (causing "dirty panicle" / কালো দাগযুক্ত চিটা ধান).
- **Agronomic Trigger Factors:**
  - Primarily a **nutritional deficiency indicator**: severe potassium ($K$) starvation, low nitrogen, or zinc deficiency.
  - Leached, sandy, low-organic-matter soils subjected to water deficit and soil cracking.
  - Secondary environmental trigger: $25\text{--}30^\circ\text{C}$ with high humidity and intermittent drizzling.
- **Vulnerability & Yield Loss Mechanism:**
  - Circular or oval brown spots with yellow halos. Causes premature flag leaf drying and discolored, unfillable grains ($10\text{--}25\%$ yield loss).
- **Cultural Management (Non-Chemical):**
  - Apply balanced potassium (MOP) and organic manure (*ধৈঞ্চা / গোবর সার*).
  - Maintain continuous shallow saturation; prevent extreme dry-wet cracking.
  - Hot water seed soaking ($52\text{--}54^\circ\text{C}$ for 15 minutes) before nursery sowing.

### 2.4 Rice Tungro Disease (`tungro`)
- **Causal Organism:** RTBV (dsDNA badnavirus) + RTSV (ssRNA waikavirus) complex.
- **Vector:** Green Leafhopper (*Nephotettix virescens* and *N. nigropictus*).
- **Transmission:** Semi-persistent (leafhoppers acquire virus in 30 minutes, transmit immediately).
- **Vulnerability & Yield Loss Mechanism:**
  - *Early Vegetative (< 35 DAT):* Severe irreversible stunting, orange-yellow leaf discoloration from tip downward, no productive tillering ($70\text{--}100\%$ loss in affected hills).
  - *Reproductive / Mature (> 55 DAT):* Ontogenic tolerance; minor cosmetic leaf yellowing with negligible yield impact ($< 5\text{--}10\%$).
- **Cultural Management (Non-Chemical):**
  - Community-synchronized transplanting within 2–3 weeks across neighboring fields.
  - Rogue and bury stunted orange-yellow hills during the first 4 weeks after transplanting.
  - Set up light traps (*আলোক ফাঁদ*) at night to monitor green leafhopper population.
  - Call **16123** for community-level vector surveillance.

### 2.5 Leaf Smut (`leaf_smut`)
- **Causal Organism:** *Entyloma oryzae* Syd. & P. Syd.
- **Target Plant Organs:** Mature leaf blades.
- **Agronomic Evaluation:**
  - Categorized by BRRI, IRRI, and FAO as a **minor, late-season foliar fungus**.
  - Small, angular, jet-black, vein-bounded streaks containing teliospores.
  - Appears near dough / ripening stage when grain filling is already $85\text{--}95\%$ complete.
  - **Does NOT cause severe yield loss ($< 2\text{--}5\%$).**
- **Cultural Management (Non-Chemical):**
  - Reassure the farmer that chemical fungicide application is economically wasteful.
  - Avoid late urea top-dressing after panicle emergence.
  - Clean field stubble after harvest.

### 2.6 Healthy Rice Leaf (`healthy`)
- **Visual Morphology:** Uniform green color, intact waxy cuticle, erect flag leaf angle.
- **Agronomic Practice:**
  - Leaf Colour Chart (LCC) calibrated nitrogen management.
  - Alternate Wetting and Drying (AWD) water management using perforated PVC pipes.
  - Proactive field scouting during high-risk regional weather windows.

### 2.7 Inconclusive / Ambiguous (`not_sure`)
- **Agronomic Safety Paradigm:**
  - Abstention prevents incorrect pesticide spraying or delayed response to severe mimics.
  - Instructs farmer to capture a clearer close-up photograph in bright indirect daylight.
  - Connects directly to Krishi Call Centre (16123) for extension assistance.

---

## 3. Bangladesh Crop Calendar Mapping (BRRI / DAE)

| Rice Crop Season | Sowing / Seedbed | Transplanting | Booting / Flowering | Harvesting | Typical Environmental Risks |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Boro (বোরো)** | Nov 15 – Dec 15 | Jan 01 – Jan 31 | Mar 15 – Apr 15 | Apr 25 – May 25 | Cool nights + warm days in Feb–Mar trigger Neck Blast; dense canopies in Apr trigger Sheath Blight. |
| **Aus (আউশ)** | Mar 15 – Apr 15 | Apr 15 – May 10 | Jun 01 – Jun 20 | Jul 15 – Aug 15 | High temperature and pre-monsoon showers promote early foliar fungal blights. |
| **Aman (আমন)** | Jun 15 – Jul 15 | Jul 15 – Aug 15 | Sep 20 – Oct 20 | Nov 15 – Dec 25 | Monsoon humidity favors Sheath Blight; stagnant floodwaters exacerbate bacterial and fungal spread. |

---

## 4. Citation and Traceability Matrix

| Feature Component | Source Citation | URL / Document Anchor |
| :--- | :--- | :--- |
| **Blast Weather Rules** | DAE BAMIS Boro Calendar Faridpur | `https://bamis.gov.bd/res/public/calendars/2019/08/23/5102.pdf` |
| **Sheath Blight Weather Rules** | DAE BAMIS Boro Calendar Sylhet | `https://bamis.gov.bd/res/public/calendars/2019/08/23/5108.pdf` |
| **Rice Pathology Manual** | BRRI *Adhunik Dhaner Chash* (23rd Ed. 2020) | `https://brri.portal.gov.bd` |
| **Vector & Cultural IPM** | IRRI Rice Knowledge Bank | `http://www.knowledgebank.irri.org/step-by-step-production/growth/pests-and-diseases/diseases` |
| **Weather Telemetry** | Open-Meteo API (CC BY 4.0) | `https://open-meteo.com/` |
| **Government Helpline** | Krishi Call Centre (DAE / AIS) | `16123` (`http://www.ais.gov.bd/`) |

---
*Verified and compiled for AgroLeaf AI Feature F26.*
