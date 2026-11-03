# OpenCode — T9: F9 Offline PWA (Batch 1)

Read `B1_COMMON_RULES.md` (same folder) first.

## Setup
In `D:\Desktop\AIgnite 2026\AgroLeaf_OpenCode_worktree`:

```
git fetch origin
git switch -c feat/f9-pwa origin/deploy/candidate-ready
cd frontend && npm ci
```

The uncommitted `handoff/OPENCODE_TRACK_*.md` files in that folder are notes; **do not commit them**. The old Track 7 branch has no commits, and this task replaces it.

## Files you own
- `frontend/src/features/pwa/**`
- `frontend/vite.config.js`: **only** the `VitePWA({...})` plugin entry you add
- `frontend/public/manifest.webmanifest` (or let the plugin generate it) and `frontend/public/icons/**`
- `frontend/scripts/e2e_pwa_offline.mjs` (new)
- tests under `frontend/src/features/pwa/__tests__/`

## Not yours
`frontend/src/ml/**`, `main.jsx`, `App.jsx`, `slots.jsx`, `flags.js`, `public/models`, `public/data`, `public/audio`.

## Do
1. **First, the known bug (Track 7):** after the model has loaded once, going offline and analysing a second gallery photo fails.
   - Reproduce it on `npm run build && npx vite preview`, using Chrome DevTools offline mode or puppeteer `page.setOfflineMode(true)`.
   - Find the cause; it may be in `frontend/src/ml/**` or `state/useScanFlow.js`.
   - If the fix touches files you don't own, **write the exact diff in your report**, and the lead applies it.
2. **vite-plugin-pwa** (2.0.0, already installed):
   - **`injectRegister: false`**, so nothing registers automatically. Register the service worker **only inside `PwaStatus` when the feature is on**, e.g. with `virtual:pwa-register/react` `useRegisterSW`. Production must not get a service worker until the lead turns the flag on.
   - Precache the app shell, JS, CSS, `data/*.json` and `audio/*` (≈ 1 MB).
   - Runtime **CacheFirst** for `/models/*.onnx` and `/ort/*` (≈ 30 MB; set `maximumFileSizeToCacheInBytes` accordingly). They are fetched when the model first loads, so they get cached then.
   - `registerType: 'prompt'`: show an "update available — reload" notice in `PwaStatus` when a new version (e.g. a new model) is ready.
3. **`PwaStatus`** (app frame): a small banner "offline — analysis still works" / back-online; the update notice; call `navigator.storage.persist()` once.
4. **`InstallPrompt`** (home): an "install app" button on `beforeinstallprompt` (Android Chrome); hide it when already installed.
5. **Texts** in `features/pwa/i18n.js` (`pwa.*`), Bangla first.

## Acceptance (the lead re-runs these)
- `e2e_pwa_offline.mjs <baseUrl>` (puppeteer), with `?features=pwa`:
  1. load online and analyse one sample;
  2. go offline (`setOfflineMode(true)`);
  3. **reload the page** — the app still opens;
  4. analyse 3 photos from `D:\Desktop\AIgnite 2026\AgroLeaf_manual_test_images` and get results;
  5. press the Listen button and confirm the voice plays (as in `ml/tools/e2e_audio_live.mjs` in the lead worktree).
- With the flag **off**, no service worker is registered (`navigator.serviceWorker.getRegistrations()` is empty).
- `npm test`, `npm run lint`, `npm run build` (size check) all pass.
- Report the cache sizes, the first-load size, and what does **not** work offline (e.g. weather).
