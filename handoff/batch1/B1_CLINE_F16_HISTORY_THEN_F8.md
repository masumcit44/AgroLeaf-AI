# Cline — T16: F16 local history, then T8: F8 weather (Batch 1)

Read `B1_COMMON_RULES.md` (same folder) first.

**Open the folder `D:\Desktop\AIgnite 2026\AgroLeaf_cline_wt` in its own VS Code window.** Do not work in `AgroLeaf_AI_AIgnite_2026`: that is Antigravity's folder.

That worktree is ready on branch `feat/f16-history`; first run `cd frontend && npm ci`.

---

## Task 1 — F16 Disease progress history (local only)

### Files you own
- `frontend/src/features/history/**` (code, `i18n.js`, `__tests__/`)

### Do
1. **`SaveToHistory({ scan })`** on the result screen: a "Save to my history" button.
   - Optional field label: free text, e.g. "Plot A", with the last-used labels offered.
   - On save, store in `STORES.HISTORY` (`lib/store/db.js`):
     `{ id: newId(), created_at, field_label, thumb_jpeg (Blob, longest side ≤ 320 px, made from scan.canvas), top_class: scan.classKey, status: scan.decision.status, reason: scan.decision.reason ?? null, probs: Array.from(scan.probs), model_version: 'v10', band: null, note: '' }`.
   - `band` stays `null`; F14 fills it later.
   - Show "Saved" afterwards; do not save twice for one result.
2. **`HistoryLink`** (home): "My saved results (N)", shown only when N > 0; it links to `#/history`.
3. **`HistoryPage`** (`#/history`):
   - list grouped by field label, newest first;
   - each item shows the thumbnail, date (Bangla digits when the language is Bangla), the result **name** (from the disease texts, not a key) or "not sure";
   - a "compare" view: the photos of one field side by side by date;
   - delete one, delete all (with confirm).
   - **No "getting worse / better" text** and no percentages.
4. **Limit:** keep the newest 200 entries; when a save would exceed that, delete the oldest and tell the user.
5. Texts in `features/history/i18n.js` (`history.*`).

### Acceptance
- Unit tests with `fake-indexeddb/auto`: save, list, group, delete one/all, prune at 200.
  - **A test spies on `fetch` and proves the feature makes no network calls.**
- Works offline.
- Screenshots (390 px, BN and EN) on your branch preview with `?features=history`.
- `npm test`, `npm run lint`, `npm run build` pass.

---

## Task 2 — F8 Seasonal disease and weather awareness (start after Task 1 is reported)

Create a new branch in the same folder:

```
git fetch origin
git switch -c feat/f8-weather origin/deploy/candidate-ready
```

### Files you own
- `frontend/src/features/weather/**`
- `disease_knowledge/weather_rules.json` (new; **the lead must approve every source** before merge)

### Do
1. **Location:** read the farmer's district from the profile helper that Kilo builds (`features/profile/profileStore.js` → `getProfile()`; until it is merged, write a tiny local fallback that returns `null`).
   - **No profile → show "Set your area to see weather"**, linking to `#/profile`. **Never** ask for GPS here.
2. **Weather:** Open-Meteo forecast API (free for non-commercial use, no key, under 10,000 calls a day, CC BY 4.0 attribution).
   - Hourly `temperature_2m`, `relative_humidity_2m`, `precipitation`, `cloud_cover` for 3 days, at the district centroid.
   - Cache it in `STORES.WEATHER` for 3 hours.
   - Offline → show the cached data with its time, or "weather unavailable".
3. **Rules** in `weather_rules.json`, **only** with a cited source per rule. Starting points the lead found (open each PDF/page yourself and quote the exact line; if a line does not say it, leave the rule out):

   | Disease | Condition | Source |
   |---|---|---|
   | Blast | night 16–20 °C, day 25–30 °C, RH > 90%, cloudy | BAMIS Boro calendar, Faridpur: https://bamis.gov.bd/res/public/calendars/2019/08/23/5102.pdf |
   | Bacterial leaf blight, sheath blight | 28–32 °C, high humidity, cloudy | BAMIS Boro calendar, Sylhet: https://www.bamis.gov.bd/res/public/calendars/2019/08/23/5108.pdf |
   | Tungro, brown spot, leaf smut | **No weather rule** (not supported by these sources) | — |

4. **`WeatherChips`:**
   - home: the next 3 days, with chips like "Weather favourable for blast — check your field";
   - result screen: only the chip for the shown disease, if any.
   - Wording must be **"favourable conditions — check your field"**, never a risk %, never "will occur".
   - Attribution line: "Weather data by Open-Meteo.com (CC BY 4.0)". A link to the BAMIS district bulletin page: https://www.bamis.gov.bd/
5. Texts in `features/weather/i18n.js` (`weather.*`).

### Acceptance
- Rule-engine unit tests with fixed hourly series: favourable / not favourable / missing data.
- Fetch is mocked in tests; cache tested.
- No chip when data is missing.
- Screenshots; the full test, lint and build pass.
