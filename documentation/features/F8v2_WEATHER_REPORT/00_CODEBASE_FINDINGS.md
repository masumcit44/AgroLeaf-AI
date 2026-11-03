# F8 v2 Weather & Crop Analysis: Codebase Inspection & Verification Findings

**Date:** 2026-11-03  
**Branch:** `feat/f8-weather-report`  
**Worktree:** `D:\Desktop\AIgnite 2026\AgroLeaf_antigravity_weather2`  
**Inspector:** Antigravity (ML + Frontend Engineer)

---

## 1. Architecture & Stack Verification

| Component | Verified Specification | Source File / Evidence |
|---|---|---|
| **Framework & Core** | React `19.3.1`, React DOM `19.3.1` | `frontend/package.json` |
| **Bundler & Tooling** | Vite `8.3.5`, `@vitejs/plugin-react` `6.1.2`, Vitest `5.0.5`, Oxlint `1.89.0` | `frontend/package.json` |
| **Styling** | Tailwind CSS `4.3.3` with `@tailwindcss/vite` `4.3.3` (leaf-* color palette) | `frontend/package.json`, `frontend/src/index.css` |
| **Routing** | Client-side Hash routing (`#/`, `#/accuracy`, `#/about`, `#/dev/parity`, `#/history`, `#/profile`, `#/map`, `#/weather`) | `frontend/src/routes/useHashRoute.js` |
| **Navigation & Tabs** | 4 primary tabs: Home (`#/`), History (`#/history`), Weather (`#/weather`), Profile (`#/profile`). Rendered dynamically via `visibleTabs()` filter against `isFeatureOn(tab.feature)` | `frontend/src/components/tabs.js`, `frontend/src/components/TabBar.jsx` |
| **Feature Flags** | Central flag registry in `FEATURES`. Preview query overrides supported via `?features=...` (persisted in `localStorage`), explicitly disabled when hostname equals `agroleaf-ai.pages.dev` | `frontend/src/features/flags.js` |
| **On-Device Storage** | IndexedDB database `agroleaf` (v1) via `idb` `8.0.4`. Dedicated stores: `device`, `profile`, `history`, `outbox`, `weather_cache` | `frontend/src/lib/store/db.js` |
| **PWA & Offline** | `vite-plugin-pwa` `2.0.0` with ServiceWorker caching and graceful offline degradation | `frontend/package.json`, `frontend/vite.config.js` |
| **i18n System** | Bangla first (`bn`), English second (`en`). Hook: `useT()`. Namespace isolation: feature keys must strictly prefix with feature name (e.g. `weather.*`) | `frontend/src/i18n/useT.js`, `frontend/src/features/__tests__/foundation.test.jsx` |

---

## 2. Weather Subsystem Today (`src/features/weather/`)

1. **Store & API Client (`weatherStore.js`):**
   - Fetches Open-Meteo `/v1/forecast`:
     `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&hourly=temperature_2m,relative_humidity_2m,precipitation,cloud_cover&forecast_days=3&timezone=auto`
   - Cache store: IndexedDB `weather_cache` under key `latest_weather`.
   - TTL: 3 hours (`CACHE_TTL_MS = 3 * 60 * 60 * 1000`).
   - Location input: Currently reads profile centroid via `getProfileLocation()` (from `profileStore.js`).
   - Cache hit condition: `< 3 hours old` AND coordinates within $\Delta < 0.1^\circ$ (~11 km).
   - Offline fallback: If network request fails, returns cached entry with flag `isOffline: true, fromCache: true`.

2. **Rules Engine (`weatherRules.js` & `disease_knowledge/weather_rules.json`):**
   - Applies peer-reviewed / official government advisory thresholds quoted from BAMIS Boro Crop Calendars (Faridpur: `5102.pdf`, Sylhet: `5108.pdf`).
   - Rules implemented:
     - `blast`: Night temp 16–20°C for $\ge 7$ hours, Day temp 25–30°C for $\ge 7$ hours, diurnal range $\Delta T > 10^\circ\text{C}$, $\text{RH} \ge 90\%$, cloud cover $\ge 50\%$.
     - `sheath_blight`: Day temp 28–32°C, night min $\ge 22^\circ\text{C}$, $\text{RH} \ge 80\%$, cloud cover $\ge 50\%$.
     - `bacterial_leaf_blight`: Day temp 28–30°C, night min $\ge 22^\circ\text{C}$, $\text{RH} \in [80\%, 90\%]$, 24h rainfall $\ge 30\text{ mm}$, cloud cover $\ge 50\%$.
   - Explicit assumptions: Cloud cover $\ge 50\%$ represents "cloudy weather"; rainfall evaluated over 24-hour sum.
   - Wording constraint: Must always state *"favourable conditions — check your field"*, never a probability/risk percentage, never *"disease will occur"*.
   - Unsupported diseases explicitly noted in JSON: `tungro` (insect vector GLH), `brown_spot` (nutritional/soil physiological factor), `leaf_smut` (minor disease).

3. **Existing UI Components:**
   - `index.jsx` (`WeatherChips`): Compact banner on Home screen and Result screen. If no profile set, prompts "Set your area to see weather".
   - `WeatherPage.jsx`: Current thin route `#/weather` displaying page intro and `WeatherChips`.

4. **i18n Constraints (`i18n.js`):**
   - All keys strictly begin with `weather.` (verified by `foundation.test.jsx`).
   - Symmetrical keys in `bn` and `en`.

---

## 3. Location Infrastructure Today

- **Current Implementation:** No browser geolocation (`navigator.geolocation`) exists anywhere in the codebase.
- **District Picker:** Located in `src/features/profile/` using `districts.json` (64 Bangladesh district administrative centroids derived from OCHA/HDX COD-AB & geoBoundaries ADM3).
- **Districts Data Source:** Documented in `frontend/src/features/profile/DISTRICTS_SOURCE.md` (CC BY-IGO 3.0 / CC BY 4.0).

---

## 4. Backend & Database State

- **Cloudflare Pages Functions:** Located under `frontend/functions/api/v1/` (`health.js`, `devices/`, `_middleware.js`).
- **Database:** Cloudflare D1 bound as `DB`. Schema in `frontend/migrations/0001_init.sql` (6 tables: `devices`, `model_versions`, `images`, `feedback`, `help_requests`, `area_reports`).
- **Weather State:** ZERO server-side weather tables or endpoints exist. The weather feature is 100% client-side with local IndexedDB caching.

---

## 5. Model Classes in Scope

- Deployed Model: `rice-effb0-v10-320.onnx` (EfficientNet-B0, $320\times 320$).
- Deployed classes reported:
  - Diagnosable: `blast`, `brown_spot`, `sheath_blight`, `tungro`, `healthy`.
  - Rejection / out-of-scope: `other_rice` (includes `leaf scald`, `insect`, `stem rot`, `bacterial leaf blight`), `not_rice` (non-rice weeds/objects).
  - Suppressed: `leaf_smut` (suppressed in `decide.js` due to high error rate).
- Weather report scope: Focus strictly on in-scope rice leaf diseases (`blast`, `brown_spot`, `sheath_blight`, `tungro`, and `bacterial_leaf_blight` rule).

---

## 6. Verification Status Summary

All 7 initial premises confirmed against live source code. No architectural discrepancies found.
