# Parallel implementation plan (for approval; nothing starts until the owner approves)

Companion to `FEATURE_ARCHITECTURE_RESEARCH.md`, `DATABASE_API_DESIGN.md` and `IMPLEMENTATION_BACKLOG.md`.

## 1. Agents and what each can actually do (checked 3 Nov 2026)

| Agent | Verified availability | Working copy (each gets its own) | Best suited for |
|---|---|---|---|
| **Claude (this session)** | Repo access, Kaggle CLI, browser, live tests | `AgroLeaf_lead_worktree` (ML, docs) and `AgroLeaf_deploy_wt` (integration, deploy) | Shared foundation, contracts, F14, F10, F13 training, review, integration, deploy |
| **Antigravity** | Working in `AgroLeaf_AI_AIgnite_2026`, branch `feat/r10-dataset-expansion` | Keep that folder for R10/R11. A **new worktree** for F23 | Long independent tasks: data (R10c), preprocessing (R11), F23 map UI |
| **OpenCode** | CLI installed (`opencode`); worktree `AgroLeaf_OpenCode_worktree` (branch `fix/offline-reanalysis`, Track 7 not merged) | Same worktree, new branch per task | Well-defined frontend tasks: F9 (continues Track 7), F20 |
| **Cline** | VS Code extension, a free model configured (from the owner's screenshot) | **New worktree** `AgroLeaf_cline_wt`, opened in its own VS Code window | Small isolated UI tasks: F16, F8 |
| **Kilo Code** | VS Code extension installed, **"No providers": not usable until a model provider is set** | **New worktree** `AgroLeaf_kilo_wt`, its own VS Code window | Small isolated tasks: F21, F22 v1 |

**Important:** Cline and Kilo are currently open in `AgroLeaf_AI_AIgnite_2026`, which is Antigravity's working folder and branch. If they edit there, they will collide with Antigravity. Open each in its own worktree (commands in §6).

## 2. Ground rules for every agent
1. Work only on your own branch in your own worktree. Never push to `main` or `deploy/candidate-ready`; never merge; never `reset --hard`, force-push or delete others' files.
2. Edit **only** the files you own (§4). If you need a change elsewhere, write it in your report; the lead makes it.
3. No secrets in files. `.dev.vars` is git-ignored; ask the owner to set Cloudflare variables.
4. Every report lists:
   - files changed;
   - tests run (`npm test`, `npm run lint`, `npm run build`, plus feature tests);
   - screenshots for UI work;
   - unresolved issues.
5. A task with an unmet dependency does not start.
6. Do not touch: `frontend/src/ml/**`, `frontend/public/models/**`, `public/data/calibration.json` (lead only), model or disease-knowledge wording (lead + agronomist), `D:\Desktop\ai_battle`.

## 3. Shared foundation first (Batch 0, lead only, about 1 day)
Nothing parallel starts until T0.1–T0.4 are merged into `deploy/candidate-ready`.
- **T0.1** Freeze contracts: this plan, the IndexedDB schema and the API v1 (`DATABASE_API_DESIGN.md`), owner approval.
- **T0.2** Prove Pages Functions deploy on the preview: `frontend/functions/api/v1/health.js` returns `{ok:true}`. Verify the root-directory setting. If it fails, stop and re-plan (fallback: a separate Worker).
- **T0.3** Frontend foundation PR:
  - dependencies added once by the lead (avoids lockfile conflicts): `vite-plugin-pwa`, `idb`, `leaflet` (licences: MIT / ISC / BSD-2; to be verified at install);
  - `frontend/src/lib/store/` (IndexedDB wrapper + outbox with idempotency keys);
  - **feature folders with stub components** `frontend/src/features/<f>/index.jsx` that return `null`, already **mounted** at fixed slots in `ResultCard`, `NotSureCard`, `ResultScreen`, `HomePage`, plus new routes `#/history`, `#/profile`, `#/map`;
  - per-feature i18n files `frontend/src/i18n/features/<f>.{bn,en}.js`, merged by the provider.

  Agents then fill their own folders without touching shared files.
- **T0.4** API foundation: `frontend/functions/api/v1/_middleware.js` (errors, device auth, rate limit, Turnstile verify), `migrations/0001_init.sql`, `wrangler.toml` bindings (no secrets), test harness (vitest + Miniflare or plain unit tests of handlers).

## 4. File ownership (no two agents share a file)

| Owner | Files and folders |
|---|---|
| Lead (Claude) | `App.jsx`, `routes/**`, `components/ResultCard.jsx`, `NotSureCard.jsx`, `ResultScreen.jsx`, `pages/HomePage.jsx`, `i18n/I18nProvider.jsx`, `i18n/bn.js`, `i18n/en.js`, `lib/store/**`, `frontend/functions/api/v1/_middleware.js`, `migrations/**`, `wrangler.toml`, `package.json` / lockfile, `public/data/calibration.json`, `frontend/src/features/reliability/**` (F14), `frontend/src/features/actionPlan/**` (F10), `frontend/functions/api/v1/area-*.js` and `model/**` |
| OpenCode | `vite.config.js` (PWA block only, as marked by the lead), `frontend/src/features/pwa/**`, `public/manifest.webmanifest`, `public/icons/**` (F9); then `frontend/src/features/feedback/**`, `frontend/functions/api/v1/feedback*.js`, `frontend/functions/api/v1/images.js`, `frontend/functions/api/v1/review/feedback*.js` (F20) |
| Cline | `frontend/src/features/history/**`, `frontend/src/pages/HistoryPage.jsx` (F16); then `frontend/src/features/weather/**`, `disease_knowledge/weather_rules.json` (draft; lead reviews sources) (F8) |
| Kilo | `frontend/src/features/profile/**`, `frontend/src/pages/ProfilePage.jsx`, `frontend/src/data/upazilas.json` (F21); then `frontend/src/features/help/**` (F22 v1) |
| Antigravity | `data/expansion_r10/**`, `ml/preprocessing/**`, R11 docs (F13 data, R11); later `frontend/src/features/areaMap/**`, `frontend/src/pages/MapPage.jsx`, `frontend/public/geo/**` (F23 UI) |
| Shared (lead edits only) | i18n `features/<f>.*.js` files are owned by the feature's agent; the lead owns the merge point |

## 5. Task allocation matrix

| Task ID | Feature | Agent | Exact scope | Files owned | Depends on | Expected output | Acceptance criteria |
|---|---|---|---|---|---|---|---|
| T0.1–T0.4 | Foundation | Claude | Contracts, Functions proof, store/outbox, stubs, i18n split, API middleware, migration | see §3 | Owner approval | Merged foundation on preview | Tests, lint, build green; `/api/v1/health` live on preview; stubs render nothing; existing E2E (upload, voice, F7) pass |
| T13.a | F13 data | Antigravity | R10c checks → download → dedup → label audit → `dedup_keep.csv`, `SUMMARY.md` | `data/expansion_r10/**` | none (running) | Clean data manifest | 0 test-set near-copies; counts per class/country; UNVERIFIED marked |
| T13.b | F13 train | Claude | v11 protocol → Kaggle training → frozen-test gate → registry | `model/**` | T13.a | v11 + release decision | Beats v10 on the frozen test under the written gate; rollback documented |
| R11 | Preprocessing | Antigravity | Per `handoff/R11_*.md` | `ml/preprocessing/**`, docs | none | Pipeline + report | Its own gate (R11 §4) |
| T9 | F9 PWA | OpenCode | Fix Track 7 offline bug; vite-plugin-pwa; model/wasm caching; install prompt; persist(); update flow | §4 OpenCode (F9) | T0.3 | PWA on a branch | Airplane-mode script passes (3 analyses + voice + reload); Lighthouse PWA installable; update replaces the model |
| T14 | F14 bands | Claude | Band edges fitted on val; measured accuracy per band on tests; UI band + explanation | `features/reliability/**`, `calibration.json` | T0.3 | Reliability UI | No raw % shown; bands within CI on the frozen test; unit tests |
| T16 | F16 history | Cline | Save / list / delete local history, field labels, side-by-side timeline, prune at 200 | §4 Cline (F16) | T0.3 | History page | Works offline; no network calls (test spies `fetch`); no "worse/better" claim |
| T21 | F21 profile | Kilo | Optional profile form (upazila picker, season, variety, transplant date); delete | §4 Kilo (F21) | T0.3; Kilo provider configured | Profile page | Empty profile works; no name/phone fields; unit tests |
| T8 | F8 weather | Cline | Open-Meteo fetch + 3 h cache; rule engine from `weather_rules.json`; chips + BAMIS link; attribution | §4 Cline (F8) | T0.3, T21 (profile shape fixed in T0.3, so it can start in parallel) | Weather chips | Rule tests with fixed series; offline shows cached time; no risk percentages; lead verifies every source |
| T20 | F20 feedback | OpenCode | "Was this wrong?" UI, consent, outbox; feedback / images / review endpoints | §4 OpenCode (F20) | T0.4, T9 | Feedback flow + reviewer page | Idempotent; rate limit; Turnstile; reviewer only via Access; offline queue works |
| T22 | F22 v1 | Kilo | Help sheet: 16123, case summary (image + result + band), share; v2 flag off | §4 Kilo (F22) | T0.3, T14 (band) | Help sheet | Summary shows only what the farmer saw; share is user-initiated |
| T10 | F10 plan | Claude | Rule-based plan from disease JSON + band + weather + profile | `features/actionPlan/**` | T14, T8, T21 | Plan card | Every step cites a source key; no dose units; snapshot tests |
| T23.a | F23 API | Claude | `area-reports`, `area-summary` (distinct devices, k-anon, alert rule) | `frontend/functions/api/v1/area-*.js` | T0.4 | Endpoints | One device cannot create an alert; duplicates collapsed; counts < 3 hidden |
| T23.b | F23 UI | Antigravity | Leaflet + upazila polygons; consented reporting; offline cached GeoJSON | §4 Antigravity (F23) | T23.a, T21, licence check | Map page | Renders offline; no exact coordinates sent; "reports" vs "alert" labels |
| T-INT | Integration | Claude | Merge order, conflict checks, full regression, live E2E, deploy | — | each feature | Release | All E2E scripts pass on preview; production only after the AIgnite rules check |

## 6. Setting up separate working copies (owner runs once)

```bash
cd "D:/Desktop/AIgnite 2026/AgroLeaf_deploy_wt" && git fetch origin
```

```bash
git -C "D:/Desktop/AIgnite 2026/AgroLeaf_deploy_wt" worktree add "D:/Desktop/AIgnite 2026/AgroLeaf_cline_wt" -b feat/cline-f16 origin/deploy/candidate-ready
```

```bash
git -C "D:/Desktop/AIgnite 2026/AgroLeaf_deploy_wt" worktree add "D:/Desktop/AIgnite 2026/AgroLeaf_kilo_wt" -b feat/kilo-f21 origin/deploy/candidate-ready
```

Then open each folder in its **own** VS Code window and run `npm ci` in `frontend/`.
**Run these only after T0.3 is merged**, so every branch starts from the foundation.

## 7. Execution batches

| Batch | Runs in parallel | Must finish before |
|---|---|---|
| **0** (≈ 1 day) | Lead: T0.1–T0.4. Antigravity continues T13.a and R11 (independent) | Batch 1 |
| **1** (≈ 3–4 days) | OpenCode T9 · Claude T14 · Cline T16 → T8 · Kilo T21 (once a provider is set) · Antigravity T13.a / R11 | Batch 2 |
| **2** (≈ 3–4 days) | OpenCode T20 · Kilo T22 · Claude T10 + T23.a · Claude T13.b (when data is ready) | Batch 3 |
| **3** (≈ 4–5 days) | Antigravity T23.b · Claude T-INT, full regression, deploy | Release |

Estimated total: **2–3 weeks** of calendar time [E], within the AI Battle build phase (to 20 Dec).

## 8. Integration plan
1. **Merge order:**
   - foundation;
   - then features in dependency order: F9, F14, F21, F16, F8, F22, F20, F10, F23 API, F23 UI;
   - F13 v11 only after its gate.
2. **Per merge, the lead:**
   - reviews the diff for owned-file violations, secrets and dose text;
   - rebases;
   - runs `npm test`, `npm run lint`, `npm run build`, `npm run test:decode`;
   - pushes to the preview;
   - runs the live checks `e2e_upload_live`, `e2e_audio_live`, `e2e_f7_card_live` and the feature's own E2E.
3. **Production:** one release after the batch passes on the preview, **only after** confirming that AIgnite allows post-deadline changes. Keep the previous build for rollback.
4. **Failures:** a failing feature stays behind its stub (renders nothing). The release goes ahead without it.

## 9. Batch 0 result (3 Nov 2026)
- Done and merged into `deploy/candidate-ready` @ `ec855c4`:
  - **T0.2:** Pages Functions verified on a branch preview. The Pages root directory is `frontend`, so API code lives in `frontend/functions/`.
  - **T0.3:** store, outbox, flags, slots, routes, per-feature i18n.
  - **T0.4:** API middleware, device auth, Turnstile, D1 migration.
- Tests 119/119, lint clean, build OK. Live upload, voice and F7 checks on the preview are identical to production.
- Paths changed from this plan:
  - API under `frontend/functions/`, helpers in `frontend/server/`, migrations in `frontend/migrations/`;
  - feature pages live inside their feature folder (e.g. `features/history/index.jsx` exports `HistoryPage`).
- No `wrangler.toml` (it would override the Pages dashboard settings). The D1/R2/Turnstile bindings are set by the owner in the dashboard.
- Batch 1 briefs: `handoff/batch1/`.
