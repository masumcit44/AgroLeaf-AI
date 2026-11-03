# Feature architecture research — F8, F9, F10, F13, F14, F16, F20, F21, F22, F23

**Prepared:** 3 Nov 2026 by Claude (lead architect).
**Status:** research and plan only; no production code was changed.

**Tags**
- **[V]** verified in our code or on a primary source page
- **[R]** research finding from secondary sources
- **[E]** estimate / recommendation
- **UNRESOLVED** needs information we do not have

Feature IDs follow the owner's list. F14 appeared twice and is treated as one feature.

---

## 1. What exists today (verified in the repo, 3 Nov 2026)

| Area | Verified state | Evidence |
|---|---|---|
| Frontend | React 19 + Vite 8 + Tailwind 4, single-page app. Hash routing (`frontend/src/routes/useHashRoute.js`); pages: Home, Accuracy, About, DevParity; state in `frontend/src/state/useScanFlow.js` | [V] `package.json`, `App.jsx` |
| Backend / API | **None.** `documentation/backend_fallback_spec.md` describes an unbuilt FastAPI fallback | [V] |
| Database / auth | **None.** No accounts, no login, no server storage | [V] |
| Model and inference | v10 EfficientNet-B0, 8 outputs, input 320, ONNX (15.3 MB). **Runs in the browser** with `onnxruntime-web` 1.31.1 wasm. Temperature 0.66, threshold 0.30, Healthy ≥ 0.90, leaf smut suppressed, `not_rice` / `other_rice` reject outputs (`ml/decide.js`, `public/data/calibration.json`) | [V] |
| Upload flow | `validateImageFile` → `decodeImage` (EXIF, ≤ 1024 px) → `checkImageQuality` (hint only, provisional thresholds) → `predict` → `decide` → ResultCard / NotSureCard | [V] |
| Content | Bangla/English disease JSON (`disease_knowledge/`), 10 voice clips, 16123 call, Share (text), official-guidance accordion, F7 pesticide card | [V] |
| Deployment | Cloudflare Pages: `main` → production https://agroleaf-ai.pages.dev; branch `deploy/candidate-ready` → preview. `_headers` caching rules. **Pages project settings (root directory, build command) are in the Cloudflare dashboard: UNVERIFIED** | [V] / UNRESOLVED |
| Secrets / env | No `.env` used by the frontend; the Azure TTS script reads a key from env but is not used (clips came from edge-tts). Nothing secret is in the bundle | [V] |
| Tests | 93 vitest unit tests; decode-path parity (25 fixtures); build size check (25 MiB per file); live puppeteer checks (`ml/tools/e2e_upload_live.mjs`, `e2e_audio_live.mjs`, `e2e_f7_card_live.mjs`) | [V] |
| Offline | Model, wasm and audio are HTTP-cached (`immutable`); **no service worker**. An earlier QA run found "second analysis offline fails" (OpenCode Track 7, branch `fix/offline-reanalysis`, **not merged**) | [V] |
| Accuracy reality | Unseen Sylhet district: 56% of answers right, macro-F1 0.57; brown spot / tungro recall ≈ 0.33. Confidence is calibrated in-domain (validation ECE 0.009) but **not** on unseen districts | [V] `metrics-v10.json` |

**Main limitations relevant to these features**
1. No server: features that must share data between people (F20 feedback review, F22 expert help, F23 maps) need a small backend.
2. Real-world accuracy is the binding constraint. F13 and F14 come before features that act on a prediction (F10, F16, F23).
3. Hard Cloudflare limit of 25 MiB per static file.

---

## 2. Architecture choice

### 2.1 Recommendation: keep the static app; add a thin serverless API on the same Cloudflare account

```
Phone browser (PWA, installable, works offline)
 ├─ in-browser ONNX inference (unchanged)
 ├─ IndexedDB: profile, history, outbox queue (local-first; works offline)
 └─ Service worker (vite-plugin-pwa / Workbox): app shell, model, wasm, data, audio
          │  HTTPS, only when online and only with the farmer's consent
          ▼
Cloudflare Pages Functions  /api/v1/*   (same project, same deploy)
 ├─ D1 (SQLite): devices, feedback, help requests, area reports, model versions
 ├─ R2: photos the farmer chose to share (feedback / help), private bucket
 ├─ Turnstile: bot protection on write endpoints
 └─ Cloudflare Access (officer / reviewer pages only) — UNVERIFIED for our plan
External, read-only: Open-Meteo forecast API (weather, no key)
```

### 2.2 Options compared

| Layer | Recommended | Alternatives considered | Why |
|---|---|---|---|
| Frontend | **Keep React + Vite** | Next.js; native Android | Works, tested, deployed. A rewrite gains nothing for these features |
| Backend / API | **Cloudflare Pages Functions** (Workers runtime) | FastAPI on HF Spaces / Render (cold starts, second provider); Supabase Edge Functions | Same account and deploy pipeline as the site, no cold-start server. One-file-per-route fits parallel work |
| Database | **Cloudflare D1** | Supabase Postgres (500 MB free, **paused after 1 week inactive**) [R]; Firebase | D1 free tier [V official pricing page]: 5M rows read/day, 100k rows written/day, 5 GB storage; queries stop for the day if exceeded. Ample for a pilot. No pause risk before judging |
| Authentication | **No passwords, no SMS.** Anonymous device key (random ID + secret in IndexedDB, server stores a hash). Officers/reviewers behind **Cloudflare Access** | Phone OTP (SMS costs money; OTP delivery problems reported in team research [T]); Supabase Auth | Farmers keep using the app without signing up. Collects no personal identifiers. Access for staff only. Its free-seat limit is **UNVERIFIED** |
| Image storage | **Local by default (IndexedDB thumbnails).** R2 only for photos the farmer explicitly shares | Upload every photo | Privacy promise on the site: "the photo stays on your phone" [V]. R2 free: 10 GB-month, 1M class-A ops [R, partly official] |
| Weather | **Open-Meteo forecast API**, client-side, cached | OpenWeatherMap (key, tier changes); BMD/BAMIS (no public API found) | Free for non-commercial use, no key, < 10,000 calls/day, CC BY 4.0 attribution [V terms page]. **Commercial use needs a paid plan** |
| Maps | **Leaflet + upazila polygons (no tile server)**, a choropleth of counts | Google Maps (paid / key); OSM tiles (policy forbids heavy use without permission; attribution required [R]) | Drawing admin polygons avoids tile-policy risk and works offline. Boundaries from OCHA/HDX COD-AB (BBS source). **Licence UNVERIFIED; check before shipping** |
| Notifications | **In-app alerts when the app opens** (MVP); Web Push later | Web Push now; SMS (paid) | iOS allows Web Push only for Home-Screen web apps, after a user gesture (iOS 16.4+) [R, WebKit blog]. In-app is enough for a demo |
| Background jobs | **Cloudflare Cron Trigger** (daily area-report aggregation), only if needed | Queues | Aggregation can run at read time while the data is small [E] |
| PWA / offline | **vite-plugin-pwa** (MIT, Workbox) [R] + IndexedDB outbox | Hand-written service worker | Less code and well tested. Needs the precache size to be planned (≈ 31 MB) |
| AI inference | **Keep in-browser ONNX** | Server inference | Already works offline. A server would break the privacy and offline promises |
| Training | **Kaggle GPU (free quota), scripts in `model/experiments/`** | Colab | Existing, reproducible pipeline with protocols and gates [V] |
| Monitoring | **Workers logs + Cloudflare Web Analytics** (cookieless) | Sentry | Cloudflare Web Analytics features and limits **UNVERIFIED**; Sentry free-tier terms **UNVERIFIED** |

**Main risks of this choice**
- Cloudflare dependency (vendor lock-in). Mitigated by plain SQL and a REST contract.
- Whether the Pages project picks up `functions/` depends on the dashboard root-directory setting (UNRESOLVED; verify first, task T0.2).
- The D1 daily write limit stops writes until 00:00 UTC if abused. Turnstile and rate limits mitigate this.

---

## 3. Feature-by-feature design

### F14 — Confidence score and prediction reliability (do first; others depend on it)
- **Problem:** a farmer cannot tell a sure answer from a guess. Raw softmax percentages look like accuracy, but they are not.
- **Findings:**
  - The model is temperature-scaled (T = 0.66). In-domain validation ECE is 0.009 [V], so confidence is **calibrated in-domain**.
  - It is **not** calibrated on unseen districts: on Sylhet, answered photos were right only 56% of the time [V].
  - This matches published evidence that post-hoc calibration fails under dataset shift (Ovadia et al., NeurIPS 2019, https://arxiv.org/abs/1906.02530) [R].
- **Design:**
  1. Show **reliability bands, not percentages**: "High / Medium / Not sure".
  2. For each band, show the **measured** share of correct answers on the independent test sets, e.g. "On photos from a district the app never saw, answers like this were right X% of the time".
  3. Keep the existing reject outputs and add the calibrated quality gate (R11).
  4. Band thresholds are fitted on validation only and **reported** on the frozen R10 test set.
  5. Optional research item: an out-of-distribution score (energy / max-logit) evaluated on the non-rice sets. Adopt it only if it beats the `not_rice` output on validation.
- **Backend:** none. **Data:** a `reliability` block in `calibration.json` (band edges plus measured accuracy per band and test set).
- **Acceptance:** bands match measured accuracy within the bootstrap CI on the frozen test; no raw percentage is shown anywhere; unit test for band mapping; live check.

### F9 — Offline PWA
- **Offline-capable:**
  - app shell, pages, disease text and audio;
  - **AI inference** — it already runs in the browser, so once the model is cached, analysis works with no network [V architecture];
  - profile, history, and queuing feedback / help / area reports.
- **Not offline:** weather (show last fetched value with its time), the map's fresh counts, sending reports. These are queued.
- **Design:**
  - `vite-plugin-pwa` with:
    - precache of the app shell + data + audio;
    - **runtime cache-first for `/models/*` and `/ort/*`** (≈ 30 MB). Precache vs runtime cache is decided in T9.1 after testing first-load cost.
  - Call `navigator.storage.persist()`.
  - An "install app" prompt.
  - **Outbox** in IndexedDB, flushed on the `online` event and at app start.
  - Do not rely on the Background Sync API: it is not available in every browser (Safari support **UNVERIFIED**; treat it as absent).
- **Prerequisite:** fix the known bug where a second analysis fails offline (OpenCode Track 7). That is a must before claiming offline.
- **Sync conflicts:** none by design. Outbox items are append-only, with a client-generated UUID as an idempotency key; the server ignores duplicates.
- **Limits:**
  - Storage can be evicted unless persistent.
  - iOS Safari storage and Web Push limits apply.
  - The first visit must be online to download about 31 MB.
- **Acceptance:** airplane-mode test on a real Android phone: open → analyse 3 photos → voice plays → reload still works. Update flow: a new model version replaces the old one. Outbox items survive a reload and send when back online.

### F8 — Seasonal disease and weather awareness
- **Problem:** farmers act after damage. Knowing that the coming days are *favourable* for a disease helps them scout.
- **Credible sources for conditions (no invented thresholds):**

  | Disease | Favourable conditions | Source |
  |---|---|---|
  | Blast | Night 16–20 °C, day 25–30 °C, RH > 90%, cloudy | BAMIS Boro crop-weather calendar (Faridpur), https://bamis.gov.bd/res/public/calendars/2019/08/23/5102.pdf [R: from search snippet; open the PDF before use] |
  | Blast (supporting) | Optimum 25–28 °C (77–82 °F), long leaf wetness, warm nights > 20 °C | UC IPM: https://ipm.ucanr.edu/agriculture/rice/rice-blast/ [R] |
  | Bacterial leaf blight, sheath blight | 28–32 °C, high humidity, cloudy | BAMIS Sylhet Boro calendar: https://www.bamis.gov.bd/res/public/calendars/2019/08/23/5108.pdf [R] |
  | Sheath blight (supporting) | 28–32 °C, canopy RH 85–100%, high N, dense planting | TNAU: https://agritech.tnau.ac.in/crop_protection/rice_diseases/rice_6.html [R] |
  | Tungro | Spread by green leafhopper; weather is not a direct trigger | — (no weather rule) |
  | Brown spot | Linked mainly to poor soil / nutrient stress; no BAMIS threshold found | — (no weather rule) |

- **Evidence limits:** a 2017 review of 52 blast forecasting models found few in operational use because their predictions are inaccurate (https://core.ac.uk/works/66879343) [R]. So F8 must say **"weather favourable for X: check your field"**, never "X will occur" or a risk percentage.
- **Design:**
  - Open-Meteo hourly forecast for the farmer's upazila centroid (from the profile; no GPS needed): temperature, relative humidity, precipitation, cloud cover, next 3 days.
  - A rule engine checks each BAMIS range; outcome "favourable / not favourable / no data".
  - Chips on the home page and result page, with a link to the BAMIS district bulletin.
  - Missing data → hide the chips and show "weather unavailable", never a guess.
  - Rules live in `disease_knowledge/weather_rules.json`, with a source per rule.
- **Backend:** none (client-side fetch, 3-hour cache). **Unresolved:** an agronomist must confirm the ranges, which come from 2019 calendars.
- **Acceptance:** unit tests on the rule engine with fixed weather series; offline shows the cached time; attribution "Weather data by Open-Meteo.com (CC BY 4.0)".

### F10 — Personalised farmer action plan
- **Approach: rule-based.**
  - It is assembled from expert-reviewed `disease_knowledge` text (what to do now, prevention, official guidance) plus: reliability band (F14), weather flags (F8), growth stage and season from the profile (F21).
  - **No LLM-generated advice:** LLMs can invent doses [T team blueprint]. An LLM could later rephrase approved text only, but it is not in scope.
- **Plan structure:**
  - **Today:** for example, check more leaves, isolate the field area, call the officer when confidence is low.
  - **This week:** scouting reminder if the weather is favourable.
  - **Prevention:** from the disease JSON.
  - **Always:** "no pesticide or dose without the agriculture officer", and the F7 card.
  - Low reliability → the plan becomes "confirm first": retake the photo, call 16123.
- **Unresolved:** growth-stage-specific advice needs approved BRRI/DAE packages; until then, stage only changes the wording.
- **Acceptance:** each step cites its source key; snapshot tests for each class × band × weather case; no dose units (reuse the F7 test rule).

### F13 — Data expansion and model retraining
- In progress: R10 / R10b / R10c (Antigravity), R11 preprocessing (Antigravity).
- **Pipeline (existing practice, kept):**
  - provenance catalogue and pHash dedup (≤ 8 bits) against the test sets;
  - label audit; frozen independent test **written before training**;
  - Kaggle training; pre-registered gate; one-time test read;
  - release record and rollback.
- **Additions:**
  1. `model/registry.json`: version, sha256, data-manifest hash, training script commit, test results, release decision, `active` flag.
  2. Feedback-derived data (F20) enters training **only** after expert review, with two-reviewer agreement for disputed labels, plus the dedup and test-leak check. It is never used automatically.
  3. **Retrain trigger:** human decision when ≥ N reviewed new images exist or a test shows regression. **No automatic retraining.**
- **Acceptance:** v11 beats v10 on the frozen R10 test under a written protocol; a registry entry exists; a one-line rollback is documented.

### F16 — Disease progress tracking history
- **Local-first:** each analysis can be saved on the phone: thumbnail (≤ 320 px JPEG), date, top result, reliability band, model version, optional field label ("Plot A"), optional note.
  - No server copy unless the farmer shares it (F20/F22).
  - Deleting the app data deletes the history.
- **Progression:**
  - Show a **timeline of photos side by side per field label**.
  - Do **not** compute "getting worse / better": two classifier outputs are not a severity measurement.
  - Severity estimation would need lesion-area labels (RiceLeafDiseaseBD boxes); it is postponed.
- **Acceptance:** save / list / delete works offline; storage stays under a cap (oldest thumbnails pruned after 200 entries, with notice); no network calls.

### F20 — Smart feedback and misclassification reporting
- **Flow:** "Was this wrong?" on result and not-sure cards → pick the correct class or "don't know" → optional comment → **separate consent** checkbox to send the photo → outbox → `POST /api/v1/feedback`.
- **Storage:** D1 row (original prediction, probabilities, model version, reported label, consent flags); photo in a private R2 bucket only if consented.
- **Moderation:**
  - status `new → reviewed (expert label) → accepted_for_training | rejected`;
  - only reviewers (behind Access) can set labels.
- **Abuse protection:**
  - Turnstile token;
  - per-device rate limit (e.g. 20 per day) [E];
  - duplicate pHash per device collapses repeats;
  - feedback never changes the live model directly.
- **Acceptance:** works offline (queued); idempotent; reviewer page lists and labels; export of `accepted_for_training` items feeds F13 with the leak check.

### F21 — Farmer profile and personalised recommendations
- **Minimum profile (on device, all optional):**
  - district and upazila, chosen from a list (drives F8 weather and F23 area);
  - season (Boro / Aman / Aus);
  - variety (free text or list);
  - transplanting date (to estimate the stage);
  - language.
- **No name, phone or exact GPS required.**
- **If incomplete:** features fall back to general advice and say what is missing.
- **Server copy:** only the upazila code and season, sent with area reports (F23), never with the device ID in public outputs.
- **Acceptance:** works with an empty profile; edit and delete; no PII fields collected.

### F22 — Agricultural officer connect and expert help
- **Verified now:** only the national 16123 Krishi Call Centre (already in the app).
- **Unresolved:**
  - we have **no verified officers or experts** who agreed to answer requests;
  - an Upazila office contact directory is not verified.
- **v1 (safe):**
  - an "Ask for help" sheet → call 16123;
  - generate a **case summary** (photo thumbnail, result, band, date, area, the farmer's question) to show or share with any officer by WhatsApp or other share targets;
  - optional request saved to `help_requests` **only if** a verified expert panel exists (feature flag off by default).
- **v2 (after agreement with real reviewers):** reviewer inbox behind Access; status updates shown in the app when it opens.
- **Acceptance:** the summary contains no data the farmer did not see; sharing is user-initiated; the flag is off in production until reviewers are confirmed.

### F23 — Geo-tagged disease mapping and local outbreak alert
- **Location:** the farmer picks the upazila (profile), or consents to one coarse GPS read that is converted on the device to an upazila code. Exact coordinates are **never sent**.
- **Report:** a consented `area_report` (upazila code, week, class, band, model version, device hash) is sent only for **High**-band results, or for expert-verified feedback.
- **Aggregation:**
  - counts per upazila per 14 days of **distinct devices**;
  - shown as "reports", not "outbreak";
  - an "alert" label needs **≥ K distinct devices AND ≥ 1 expert-verified report** in that upazila and window.
  - K is **UNRESOLVED**: it needs DAE/agronomist input; demo value K = 5 [E], labelled as a demo setting.
- **Map:**
  - Leaflet with upazila polygons, simplified GeoJSON (≈ 1–2 MB; size to be verified);
  - no tile server; attribution of the boundary source;
  - suppress counts below 3 for privacy.
- **Denied location:** manual upazila picker; if neither, no reporting.
- **Acceptance:** one device cannot create an alert; duplicate reports per device and week are collapsed; the map renders offline from the cached GeoJSON plus the last fetched counts.

---

## 4. Ranking for the buildathon

| Feature | User value | Demo value | Difficulty | Integration risk | External services | Time to a working v1 [E] | Verdict |
|---|---|---|---|---|---|---|---|
| F9 Offline PWA | High | High | Medium | Low | None | 2–3 days | **MVP, batch 1** |
| F14 Reliability bands | High | High | Medium | Low | None | 2–3 days | **MVP, batch 1** |
| F21 Profile (local) | Medium | Medium | Easy | Low | None | 1 day | **MVP, batch 1** |
| F16 History (local) | Medium | High | Easy–Med | Low | None | 2 days | **MVP, batch 1** |
| F8 Weather awareness | Medium | High | Medium | Low | Open-Meteo | 2–3 days | **Batch 2** (needs F21) |
| F10 Action plan (rules) | High | High | Medium | Medium | None | 2–3 days | **Batch 2** (needs F14, F8, F21) |
| F13 Data + retrain | Very high | Medium | Hard | Medium | Kaggle | 2–4 weeks | **Running now** (Antigravity + lead) |
| F20 Feedback | Medium | Medium | Medium | Medium | D1, R2, Turnstile | 3–4 days | **Batch 2** (needs API foundation) |
| F22 Expert help v1 | High | Medium | Easy (v1) | Low | None | 1–2 days | **Batch 2** (v1 only) |
| F23 Area map + alerts | Medium | High | Hard | High | D1, boundaries | 4–6 days | **Batch 3 / postpone** if time is short |

**If time becomes short**
- Keep F9, F14, F16, F21, F8 and F22 v1.
- Postpone F23 alerts (show "reports" only).
- Postpone F22 v2 and F20 reviewer tooling (keep the local "report wrong" export only).

---

## 5. Sources (checked 3 Nov 2026)

| Topic | Source |
|---|---|
| Cloudflare D1 pricing / free limits | https://developers.cloudflare.com/d1/platform/pricing/ |
| Cloudflare R2 pricing | https://developers.cloudflare.com/r2/pricing |
| Cloudflare Turnstile plans | https://developers.cloudflare.com/turnstile/plans/ |
| Supabase pricing (alternative) | https://supabase.com/pricing |
| Open-Meteo terms (read directly) | https://open-meteo.com/en/terms |
| vite-plugin-pwa | https://github.com/vite-pwa/vite-plugin-pwa |
| Web Push on iOS (WebKit) | https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/ |
| OSM tile usage | https://wiki.openstreetmap.org/wiki/Blocked_tiles (policy: https://operations.osmfoundation.org/policies/tiles/ — open before use) |
| Bangladesh admin boundaries (COD-AB) | https://data.humdata.org/dataset/cod-ab-bgd (licence UNVERIFIED) |
| BAMIS crop-weather calendars | https://bamis.gov.bd/res/public/calendars/2019/08/23/5102.pdf ; https://www.bamis.gov.bd/res/public/calendars/2019/08/23/5108.pdf |
| UC IPM rice blast | https://ipm.ucanr.edu/agriculture/rice/rice-blast/ |
| TNAU sheath blight | https://agritech.tnau.ac.in/crop_protection/rice_diseases/rice_6.html |
| Blast forecasting review | https://core.ac.uk/works/66879343 |
| Calibration under shift | https://arxiv.org/abs/1906.02530 |
| Pesticides Act 2018 (F7, F10 safety) | https://leap.unep.org/en/countries/bd/national-legislation/pesticides-act-2018-no-24-2018-law |

## 6. Assumptions and unresolved requirements
1. **UNRESOLVED:** the Cloudflare Pages project root directory and whether `functions/` deploys with it (T0.2).
2. **UNRESOLVED:** the licence of the OCHA/HDX Bangladesh boundaries; the simplified GeoJSON size.
3. **UNRESOLVED:** the outbreak alert threshold K and the verification rule. They need DAE/agronomist input; the demo uses labelled placeholder values.
4. **UNRESOLVED:** real officers or experts for F22 v2 and F20 review. Until confirmed, team members act as **labelled demo reviewers**.
5. **UNRESOLVED:** agronomist confirmation of the BAMIS weather ranges and the action-plan wording.
6. **UNVERIFIED:** Cloudflare Access free-seat limit, Cloudflare Web Analytics, Background Sync on Safari.
7. **Assumption:** pilot scale (fewer than 1,000 devices). The free tiers above are far beyond this [E].
8. **Timing:** AIgnite Devpost is due 5 Nov 2026. Whether post-deadline production changes are allowed is **UNVERIFIED**. Recommendation: develop on branches and previews; change production only after checking the rules.
