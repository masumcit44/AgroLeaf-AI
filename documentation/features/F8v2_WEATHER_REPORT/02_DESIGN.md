# F8 v2 Weather & Crop Analysis: Architecture & Technical Design

**Date:** 2026-11-03  
**Status:** Approved for Implementation  
**Author:** Antigravity (ML + Frontend Engineer)  

---

## 1. System Architecture

```mermaid
flowchart TD
    User([Farmer / Agronomist]) --> UI[#/weather Tab]
    UI --> LocBar[1. Location Bar]
    LocBar -- "📍 Use my location" --> GeoLoc[navigator.geolocation]
    GeoLoc -- Round to 2 decimals (~1km) --> LocState[Active Location State]
    LocBar -- "Search Box (BN/EN)" --> GeocodeProxy[/api/v1/geocode Proxy]
    GeocodeProxy -- "OSM Nominatim (1 req/s, UA)" --> LocState
    LocBar -- "Fallback" --> LocalDistricts[Local 64 Districts JSON]
    
    LocState --> Fetcher[weatherReportStore.js]
    Fetcher --> CacheCheck{Fresh in IndexedDB?}
    CacheCheck -- "< 60 min & same location" --> UseCache[Return Cached Data]
    CacheCheck -- "Expired or Stale or Manual Refresh" --> OpenMeteo[Open-Meteo API GET]
    OpenMeteo --> Parse[Transform & Store in IndexedDB]
    Parse --> Report[WeatherReportView.jsx]
    
    Report --> SecNow[3. Now Current Conditions]
    Report --> SecNext7[4. Next 7 Days Forecast]
    Report --> SecPast7[5. Last 7 Days Reanalysis]
    Report --> SecSeason[6. Season & Crop Stage Context]
    Report --> SecDiseases[7. Disease Weather Concerns & Rule Engine]
    Report --> SecAdvice[8. What To Do: Non-chemical Monitoring]
    Report --> SecSources[9. Sources & Attribution]
    Report --> SecLimits[10. Limitations & Honesty]
```

---

## 2. Privacy & Coordinate Handling

- **Strict Rounding Rule:** `roundCoord(lat, lon)` converts coordinates to at most 2 decimal places before making any external request or storing in IndexedDB:
  $$\text{lat}_{\text{rounded}} = \text{round}(\text{lat} \times 100) / 100$$
  $$\text{lon}_{\text{rounded}} = \text{round}(\text{lon} \times 100) / 100$$
  At $23.8^\circ\text{N}$, $0.01^\circ$ corresponds to $\approx 1.1\text{ km}$ latitude and $\approx 1.0\text{ km}$ longitude.
- **Server Privacy:** No user location, coordinates, or search queries are stored in Cloudflare D1 or on any server.
- **Client Storage:** The active location choice (label + rounded coordinates) is persisted in IndexedDB `weather_cache`.

---

## 3. Geocoding Architecture

- **Endpoint:** `frontend/functions/api/v1/geocode.js`
  - Acts as a lightweight Cloudflare Pages Function proxy to OpenStreetMap Nominatim.
  - Injects compliant headers: `User-Agent: AgroLeaf-AI/1.0 (contact: masumcit44@gmail.com)` and enforces rate-limiting / server-side Cloudflare edge cache headers (`s-maxage=86400`).
  - Restricts searches to Bangladesh (`countrycodes=bd`).
- **Client Search Interaction:**
  - Debounced input ($\ge 500\text{ ms}$).
  - Fallback: Instant client-side substring matching on the 64 districts in `districts.json` if offline or if Nominatim returns an error.
  - Clears / closes dropdown on selection, outside click, or `Escape` key.

---

## 4. Weather Data Pipeline & Cache Strategy

- **Open-Meteo URL Structure:**
  ```
  https://api.open-meteo.com/v1/forecast?
    latitude=${lat}&longitude=${lon}
    &current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,cloud_cover
    &hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,cloud_cover,wind_speed_10m,wind_direction_10m
    &daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant,sunshine_duration
    &past_days=7&forecast_days=7&timezone=auto
  ```
- **IndexedDB Schema (`weather_cache`):**
  - Key: `report_${lat}_${lon}`
  - Record: `{ lat, lon, label, fetched_at, expires_at, current, daily, hourly, pastSummary }`
  - Cache Freshness Window: 60 minutes (`FRESH_TTL_MS = 60 * 60 * 1000`).
  - Stale Window: 3 hours (`STALE_THRESHOLD_MS = 3 * 60 * 60 * 1000`).
  - Manual Refresh: User can click the "Refresh" button at any time to bypass fresh cache.

---

## 5. Report Text Generation & Honesty Rules

- **Zero Generative AI / LLM Prose:** All texts are deterministic templates in `i18n.js` populated with verified numeric readings and rule matches.
- **Attribution & Transparency Labels:**
  - Current readings $\rightarrow$ `OBSERVED / পর্যবেক্ষন`
  - Next 7 days $\rightarrow$ `FORECAST / পূর্বাভাস`
  - Past 7 days $\rightarrow$ `REANALYSIS / পুনর্বিশ্লেষণ (ERA5)`
  - Disease conditions $\rightarrow$ `RESEARCH RULE / গবেষণাভিত্তিক নিয়ম`
- **Strict Chemical Prohibition:**
  - Under no circumstances shall pesticide, insecticide, or fungicide trade names, chemical doses, or mixing ratios (e.g. `ml/L`, `g/L`) be displayed.
  - Any required treatment recommendation directs the farmer to:
    *"আপনার উপসহকারী কৃষি কর্মকর্তা (SAAO)-এর সাথে যোগাযোগ করুন অথবা ১৬১২৩ নম্বরে কৃষি কল সেন্টারে ফোন করুন।"* / *"Contact your local Upazila Agriculture Officer or call the 16123 Krishi Call Centre."*

---

## 6. Backward Compatibility & Flag Isolation

- Home screen `WeatherChips` and Result screen chips continue to function seamlessly via existing `weatherRules.js` and `weatherStore.js`.
- Feature Flag: Sub-flag `weatherReport` is introduced into `flags.js` defaulting to `false`.
- When `weatherReport` is disabled: `#/weather` renders the existing lightweight `WeatherChips` page.
- When `weatherReport` is enabled (e.g., via `?features=weatherReport` in preview): `#/weather` renders the comprehensive 10-section Weather & Crop Analysis page.
