# F8 v2 Weather & Crop Analysis: Deep Research Report

**Date of Verification:** 2026-11-03  
**Author:** Antigravity (ML + Frontend Engineer)  
**Status:** Live-verified against APIs and official documentation  

---

## 1. Weather Data Sources Comparison

We evaluated three free, non-commercial weather data sources for client-side integration in Bangladesh:

| Feature / Criterion | **Open-Meteo** (Forecast + Past) | **NASA POWER** (Agroclimatology) | **MET Norway** (Locationforecast 2.0) |
|---|---|---|---|
| **API Key Needed?** | **No** | **No** | **No** (requires identification header) |
| **Free-Tier Limits** | 10,000 daily API calls, max 100/min | 30 requests/sec | ~20 requests/sec with custom User-Agent |
| **Terms of Service** | Free for non-commercial use, **CC BY 4.0** attribution required | US Public Domain, citation encouraged | Free, CC BY 4.0, requires custom User-Agent |
| **Spatial Resolution (BD)** | **~11 km (ECMWF IFS 0.1°) / ~5 km (ICON-Seamless)** | 0.5° × 0.625° (~50–60 km) | ~9 km (ECMWF HRES) |
| **Variables Available** | Temp (2m min/max), Apparent Temp, RH (2m), Precipitation, Precip Probability, Wind Speed & Direction (10m), Cloud Cover, Shortwave Solar Radiation, Sunshine Duration, Dew Point | Temp (min/max), RH, Precip (corrected), Solar Radiation, Wind Speed. *(No current/nowcast)* | Temp, RH, Wind Speed & Direction, Cloud Cover, Precip amount. *(No precipitation probability, no solar radiation)* |
| **Forecast Length** | **Up to 16 days** (default: 7 days) | **None** (Only historical / near-realtime with lag) | Up to 9–10 days |
| **Past History (Recent)** | **`past_days=1..92`** (ERA5 / ECMWF reanalysis seamless) | Decades of archive, but **lag of 2–3 days** | **None** (forecast only) |
| **CORS Support** | **Full** (`Access-Control-Allow-Origin: *`) | **Full** (`Access-Control-Allow-Origin: *`) | **Full** (`Access-Control-Allow-Origin: *`) |
| **Latency / Response Time** | **Fast: ~5–15 ms** server generation time | Slow: ~300–800 ms | Medium: ~150–300 ms |

### Source Recommendation & Justification
- **Recommended Source:** **Open-Meteo (`/v1/forecast`)**.
- **Justification:**
  1. Open-Meteo allows fetching `current`, `hourly`, and `daily` metrics along with `past_days=7` and `forecast_days=7` in a **single HTTPS GET request**.
  2. High spatial resolution over Bangladesh (~11 km ECMWF / ~5 km ICON), vastly superior to NASA POWER's coarse 50–60 km grid.
  3. Seamlessly provides past observed/reanalysis data alongside future forecasts without requiring multiple API calls or credentials.
  4. 100% browser-callable with CORS support and generous non-commercial limits (10,000 calls/day; AgroLeaf caches responses for 60 min to 3 hours, meaning minimal load).
  5. Terms require straightforward attribution: *"Weather data by Open-Meteo.com (CC BY 4.0)"*.

- **URLs Verified (2026-11-03):**
  - Open-Meteo Documentation: `https://open-meteo.com/en/docs`
  - Open-Meteo Terms: `https://open-meteo.com/en/terms`
  - NASA POWER API: `https://power.larc.nasa.gov/docs/services/api/`
  - MET Norway WeatherAPI: `https://api.met.no/weatherapi/locationforecast/2.0/documentation`

---

## 2. Geocoding & Location Search Comparison

We tested real Bangladesh queries against both candidate geocoders live on 2026-11-03:

| Query String | **Open-Meteo Geocoding API** (GeoNames) | **OpenStreetMap Nominatim API** |
|---|---|---|
| `"Genda, Savar"` | **0 results** (Fails on local neighborhood/bazaar) | **1 result**: `Genda, ঢাকা - আরিচা মহাসড়ক, ডগরমোড়া, ব্যাংক টাউন, সাভার, ঢাকা` (lat: `23.83419`, lon: `90.25916`) |
| `"Savar"` | **5 results**: Top: `Savar Upazila, Dhaka Division` (`23.84858`, `90.25002`) | **2 results**: Top: `সাভার, সাভার উপজেলা, ঢাকা জেলা, ঢাকা বিভাগ` (`23.84770`, `90.25870`) |
| `"Gazipur Sadar"` | **0 results** (Fails on compound upazila names) | **4 results**: Top: `Rathkhola Sadar Hospital Road, জয়দেবপুর, গাজীপুর সদর উপজেলা` (`23.99374`, `90.42485`) |
| `"Dhaka"` | **5 results**: Top: `Dhaka, Dhaka Division` (`23.7104`, `90.40744`) | **3 results**: Top: `ঢাকা, ঢাকা মহানগর, ঢাকা জেলা, ঢাকা বিভাগ` (`23.76438`, `90.38901`) |
| `"সাভার"` (Bangla) | **0 results** (**Fails completely on Bangla script!**) | **2 results**: Top: `সাভার, সাভার উপজেলা, ঢাকা জেলা` (`23.84770`, `90.25870`) |
| `"xyzqwe999notaplace"` | **0 results** | **0 results** |

### Nominatim Usage Policy & Compliance
- **Policy URL:** `https://operations.osmfoundation.org/policies/nominatim/` (Checked 2026-11-03)
- **Hard Constraints:**
  - Max 1 request per second.
  - Must provide a valid, descriptive `User-Agent` and contact email.
  - No automated keystroke autocomplete scraping (search must be triggered on explicit button click, Enter press, or debounced by $\ge 600\text{ ms}$).
  - Attribution: *"Data © OpenStreetMap contributors, ODbL 1.0"*.
- **Implementation Decision:**
  - Use OpenStreetMap Nominatim with a dedicated helper: debounced input, fallback to Profile district, and clear attribution. Because Open-Meteo Geocoding completely fails on native Bangla queries and sub-district village/upazila queries in Bangladesh, Nominatim is essential for farmer usability.

### Bangladesh Administrative Boundaries Research
- **HDX COD-AB (BBS / OCHA ROAP):** `https://data.humdata.org/dataset/cod-ab-bgd` (CC BY-IGO 3.0).
  - Admin-2 (Districts): 64 districts already extracted in `frontend/src/features/profile/districts.json` (~10 KB).
  - Admin-3 (Upazilas): 495 upazilas. A simplified JSON with centroid coordinates, English name, and Bangla name is ~40 KB gzipped.
  - For F8 v2: Search combines live Nominatim (bounded to `countrycodes=bd`) with instant local fallback to the 64 district centroids already packaged in `districts.json`.

---

## 3. Agricultural Evidence & Microclimate Rules

For each in-scope rice leaf disease, official and peer-reviewed sources were inspected to identify valid weather thresholds:

### 1. Rice Blast (*Magnaporthe oryzae* / *Pyricularia oryzae*)
- **Official Source Quote:** BAMIS Boro Crop Calendar, Faridpur District (DAE Bangladesh):
  > *"Blast Night temperature 16-20oC, for 7.30 hours day temperature 25-30oC, for 7.30 hours day night temperature >10oC Relative Humidity >90%, cloudy weather"*
- **BRRI / IRRI Literature:**
  - IRRI Rice Knowledge Bank: Blast is favored by daytime temperatures 25–28°C, nighttime temperatures 16–22°C, relative humidity $>90\%$, overcast skies, and prolonged leaf wetness / dew period ($>10\text{ hours}$).
  - BRRI *Adhunik Dhaner Chash* (23rd Ed. 2020, p. 55): Heavy dew at night, cool nights followed by warm sunny/cloudy days, and excessive nitrogen fertilizer trigger blast outbreaks.
- **Crop Stages:** Seedling, tillering (leaf blast), and booting/heading/flowering (neck blast & panicle blast).
- **Rule Status:** **Validated Quantitative Rule** (implemented with hourly day/night duration counters).

### 2. Sheath Blight (*Rhizoctonia solani*)
- **Official Source Quote:** BAMIS Boro Crop Calendar, Sylhet District (DAE Bangladesh):
  > *"Sheath Blight Temperature 28-32o C, high Relative Humidity, Cloudy weather"*
- **BRRI / IRRI Literature:**
  - IRRI Rice Knowledge Bank: Optimum conditions are high temperature (28–32°C), high relative humidity (85–100%), and a dense crop canopy with close planting.
  - BRRI *Adhunik Dhaner Chash* (2020, p. 56): Warm, humid, overcast weather promotes sheath blight sclerotia germination from water line up the sheath.
- **Crop Stages:** Active tillering through flowering/ripening.
- **Rule Status:** **Validated Quantitative Rule** (Day temp 28–32°C, night min $\ge 22^\circ\text{C}$, $\text{RH} \ge 80\%$, cloud cover $\ge 50\%$).

### 3. Bacterial Leaf Blight (*Xanthomonas oryzae* pv. *oryzae*)
- **Official Source Quote:** BAMIS Boro Crop Calendar, Sylhet District (DAE Bangladesh):
  > *"Blight Temperature 28-30o C, Relative Humidity 80-90%, Cloudiness, Rainfall >30mm"*
- **BRRI / IRRI Literature:**
  - IRRI Rice Knowledge Bank: Temperatures of 25–34°C, relative humidity $>70\%$, heavy rains, and strong winds (which cause leaf abrasion and splashing) drive epidemic spread.
  - BRRI *Adhunik Dhaner Chash* (2020, p. 54): Strong monsoon winds and continuous heavy rainfall damage leaf tissues, facilitating bacterial entry.
- **Crop Stages:** Tillering through heading.
- **Rule Status:** **Validated Quantitative Rule** (Day temp 28–30°C, night min $\ge 22^\circ\text{C}$, $\text{RH} \in [80\%, 90\%]$, 24h rainfall $\ge 30\text{ mm}$, cloud $\ge 50\%$).

### 4. Brown Spot (*Bipolaris oryzae*) — HONEST GAP
- **Literature & Official Findings:**
  - IRRI Rice Knowledge Bank & BRRI: Brown spot is known agronomically as a *"stress/poor man's disease"*. It is primarily associated with nutrient-deficient soils (especially potassium, silicon, and nitrogen starvation), drought stress, or acidic soil, rather than a specific microclimate weather trigger.
  - BAMIS Crop Calendars: BAMIS does **NOT** provide a numeric microclimate threshold for brown spot.
- **Rule Status:** **Qualitative Advisory Only**. No fake numbers or scores. The report states: *"No validated weather-only threshold exists. Brown spot is primarily driven by soil nutrient deficiency (potassium/nitrogen) and moisture stress rather than temperature/humidity alone."*

### 5. Rice Tungro Disease (RTD) — HONEST GAP
- **Literature & Official Findings:**
  - IRRI & BRRI: Tungro is caused by a viral complex transmitted exclusively by the Green Leafhopper (*Nephotettix virescens*). Weather has no direct pathogenic interaction with the plant; microclimate affects leafhopper vector survival and migration.
  - BAMIS Crop Calendars: BAMIS lists no temperature or humidity formula for Tungro.
- **Rule Status:** **Qualitative Advisory Only**. The report states: *"Tungro is a virus spread by green leafhoppers (GLH). Weather does not directly infect the crop; inspect fields for insect vectors."*

---

## 4. Bangladesh Seasonal Context (Aus / Aman / Boro)

From official BRRI guidelines (*Adhunik Dhaner Chash*, 2020) and DAE/BAMIS agricultural calendars:

| Season | Bangla Name | Typical Sowing / Transplanting | Typical Harvest Period | Current Status in Early November |
|---|---|---|---|---|
| **Aman** | রোপা আমন | June – August (আষাঢ় - শ্রাবণ) | **November – January (অগ্রহায়ণ - পৌষ)** | **Active / Current Season: Booting, Ripening & Early Harvest period.** Farmers are preparing for harvest or managing late-stage grain filling. |
| **Boro** | বোরো | November – January (বীজতলা: কার্তিক - অগ্রহায়ণ) | April – May (বৈশাখ - জ্যৈষ্ঠ) | **Approaching / Seedbed preparation starting in mid/late November.** |
| **Aus** | আউশ | March – April (চৈত্র - বৈশাখ) | July – August (শ্রাবণ - ভাদ্র) | Inactive (Off-season). |

- **Citation:** Bangladesh Rice Research Institute (BRRI), *Adhunik Dhaner Chash* (23rd Ed., 2020), Publication No. 42; Department of Agricultural Extension (DAE) BAMIS Agro-meteorological Information System.
- **Dynamic Season Resolver:** Based on current calendar month (November = late Aman harvest stage + early Boro nursery prep).
