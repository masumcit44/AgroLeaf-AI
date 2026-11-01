# v1 test report — lead (Claude)

- **Build under test:** `main` @ `1e82944`. The app code is identical to `034dff1` (safety gate).
- **Setup:** production build served with `vite preview` (port 4174). Chrome 1xx headless via puppeteer-core, plus the Claude desktop built-in browser for visual checks.
- **Date:** 2026-11-01, about 17:30 BST.
- **Scripts (re-runnable):**
  - `documentation/qa/lead_scripts/qa_lead.mjs`
  - `documentation/qa/lead_scripts/qa_lead_followup.mjs`
- **Test inputs:** generated outside the repo. A PNG, a WebP, a 4000×3000 JPG, a 64×64 JPG, a GIF, a PDF, a text file renamed to .jpg, a blurred blast leaf, and a JPG with EXIF orientation 6.
- **Script false alarms.** Every script "FAIL" was rechecked by hand. Two were the script's fault, not the app's, and are marked PASS below:
  - B4: the "বাং" switch-back button was counted as leftover Bangla.
  - C4: the script looked for the wrong message text.

## Results

| ID | Result | Severity | What I saw |
|---|---|---|---|
| A1 | PASS | | `npm test`: 51/51 |
| A2 | PASS | | `npm run lint`: 0 errors |
| A3 | PASS | | build OK; check-dist-sizes: all < 25 MiB (largest: model 16.05 MiB) |
| A4 | PASS | | check:release: 7 PASS / 0 FAIL / 1 WARN (audio) |
| A5 | PASS | | `npm run smoke`: all pages × 360/390/1280 px, Sticker/Overflow/Console/Copy OK |
| A6 | PASS | | dev server (after `0f47931`): blast sample analysed, no overlay |
| B1 | PASS | | Home, Accuracy, About: no console errors or warnings |
| B2 | PASS | | sticker visible on all three pages |
| B3 | PASS | | header links and browser back/forward give `#/accuracy,#/about,#/accuracy,#/about` |
| B4 | PASS with note | cosmetic | EN mode: every string is English except the "বাং" switch-back button (intended). The lazy-page fallback shows "লোড হচ্ছে... / Loading..." in both languages (`App.jsx:16`). |
| B4-persist | PASS | | EN kept after reload (`localStorage.agroleaf_lang = "en"`) |
| B5 | PASS with note | minor | Production title "AgroLeaf AI — ধানের পাতার রোগ" stays Bangla in EN mode. `<html lang>` follows the language (correct). Favicon OK, robots.txt OK. **Dev server only:** `App.jsx:24-34` overwrites the title with `SW:<scrollWidth>_IW:<innerWidth>` (debug code left from `a8555d8`; this is the "SW:1524_IW:1536" tab title in the user's screenshot). |
| C1 | PASS | | tips card closes (✕ is keyboard-focusable) |
| C2 | N/A (needs human) | | camera input has `capture="environment"`; needs a real phone |
| C3 | PASS | | PNG and WebP → preview → Blast (same result as the JPG) |
| C4 | PASS | | GIF and PDF → "শুধু ছবি (JPG/PNG/WebP) দিন"; text-as-.jpg → "ছবিটি খোলা যাচ্ছে না, আরেকটি দিন". No crash. |
| C5 | PASS | | 4000×3000 → Blast; 64×64 → not sure (sensible) |
| C6 | PASS | | EXIF orientation 6 previews landscape (960×480), as it should |
| C7 | PASS | | all 5 sample buttons open the preview |
| D1 | PASS | | preview shows Analyse and Retake |
| D2 | PASS | | first analysis in a fresh context: about 130 ms after tap (model loads while the home page is open) |
| D3 | PASS | | healthy → Healthy (high); blast, brown spot, tungro and sheath blight → correct disease |
| D4 | PASS | | double-tapping Analyse: one result, no errors |
| D5 | PASS | | leaving mid-analysis and coming back: clean home screen, no errors |
| E1 | PASS | | confidence chip in words ("মাঝারি/উচ্চ আস্থা"), no percentages |
| E2 | PASS | | "What is it", symptoms, what to do and prevention all present; no dose found |
| E3 | **FAIL** | **major** | Tapping "▶ শুনুন" requests `/audio/blast-v1.mp3`. The file doesn't exist, so the server returns the SPA `index.html` (200 text/html), playback fails and **nothing happens on screen: no message, no error**. Generating the MP3s fixes it. The button also needs a visible fallback (e.g. "voice not available — show text") so a missing file never looks broken. The "AI voice" label is shown. |
| E4 | PASS | | "লেখা দেখুন" ↔ "লেখা লুকান" toggles |
| E5 | PASS | | BAMIS link opens in a new tab with `rel="noopener noreferrer"` |
| E6 | PASS | | `tel:16123`, and "কল চার্জ প্রযোজ্য হতে পারে" is visible |
| E7 | N/A (needs human) | | `navigator.share` exists, so the system share sheet opens; headless can't show it. Check on a phone. |
| E8 | PASS | | Retake → clean home screen |
| F1 | PASS | | too-close crop → not sure, with two candidates, 16123 and tips |
| F2 | PASS | | sticker PNG → "does not look like a rice leaf", no candidates |
| F3 | PASS | | blurred blast leaf → "may be healthy, not confident" (not sure); before the fix this showed "Healthy, medium confidence" |
| F4 | PASS | | in 25 probes, "Healthy" appeared only as "উচ্চ আস্থা" (high) |
| F5 | BLOCKED | | no leaf-smut photo on disk; suppression is covered by unit tests in `inference.test.js` |
| F6 | PASS | | not-sure card keeps 16123, retake tips and the disclaimer |
| G1 | PASS | | all 36 numbers on the page match `metrics-v1.json` (internal, external, per-class, safety gate) |
| G2 | PASS | | confusion matrix (1050×900) and reliability (900×750) load |
| G3 | PASS | | 0 px horizontal overflow at 360 |
| G4 | PASS | | "first" and "only" appear only in "first hint" and "only said at high confidence"; no 100%/first/only claims |
| H1 | PASS | | CC BY 4.0, DOIs, BAMIS and GitHub links (new tab) |
| H2 | PASS | | the only request during an analysis is a local GET; no upload of any kind |
| H3 | PASS | | "Built for Ostad Presents YUNet AIgnite Buildathon 2026" credit present |
| I1 | PASS with note | minor | no horizontal overflow at 360/390/768/1280 on any page or the result. **Small tap targets:** "লেখা দেখুন" is 51×18 px; header 📊/ℹ️/EN are 40×44 px (below 44 px wide) at ≤ 390 px. |
| I2 | N/A (human) | | real Android phone |
| I3 | Not re-run | | see `documentation/qa/performance_v1.md` (Y4) |
| J1 | PASS | | Tab order: logo → 📊 → ℹ️ → EN → ✕ → Camera → Gallery → samples, with a visible focus ring every time |
| J2 | PASS | | every image has alt text; every control has a name |
| J3 | PASS with note | minor (tooling) | mobile Lighthouse accessibility: Home 96, Accuracy 100, About 100. **`scripts/run-lighthouse.mjs` uses `#accuracy`/`#about`; the app routes are `#/accuracy`/`#/about`**, so those two runs may have audited the home page. Home: Performance 74, Best Practices 81. |
| K1 | PASS | | model request blocked → "মডেল লোড হতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ পরীক্ষা করুন।" with "আবার চেষ্টা করুন" |
| K2 | INFO | | going offline after the first load breaks the sample buttons (they fetch `/samples/*.jpg`), and a reload shows the browser's offline page. There's no offline support (no service worker); expected for v1. |
| K3 | PASS | | reload on the result screen → clean home screen, no errors |
| L1 | PASS | | no dose, brand or "free call" text found on screen (see E2 and E6) |
| L2 | PASS | | disclaimer "চূড়ান্ত রোগ নির্ণয় নয়" on home, result and not-sure screens |
| L3 | PASS | | sticker image identical in `assets/brand` and the header |

## Failures and notes to fix (in priority order)

1. **E3 (major): the audio button silently does nothing while MP3s are missing.**
   - Steps: open any result, tap "▶ শুনুন".
   - Expected: audio plays, or a visible fallback.
   - Actual: no sound, no message. The request for `/audio/<class>-v1.mp3` gets `index.html` back with status 200.
   - Fix: generate the MP3s (Azure key) **and** make the button show a fallback when playback fails.
2. **I1 (minor): small tap targets.**
   - "লেখা দেখুন" is 51×18 px.
   - The header icon buttons are 40 px wide on phones.
3. **J3 (minor, tooling): the Lighthouse script audits the wrong routes** (`#accuracy` instead of `#/accuracy`). The recorded Accuracy and About scores are unreliable.
4. **B5 (minor):**
   - Remove the dev-only debug title (`SW:…_IW:…`) in `App.jsx`. A demo recorded from `npm run dev` would show it.
   - The production title doesn't follow the selected language.
5. **B4 (cosmetic):** the lazy-page loading text is shown in both languages at once.

## Not covered by me
- C2, E7, I2 (camera, share sheet, real phone): the human tester.
- F5 (no leaf-smut photo available).
