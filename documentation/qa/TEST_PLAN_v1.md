# AgroLeaf AI — v1 release test plan (three independent testers)

**Goal:** find every defect before release. Three testers (lead / Claude, OpenCode, Antigravity) run this plan **separately**. Don't read each other's reports until your own is finished. **Report only. Do not fix anything.** The lead merges the three reports and fixes the findings one by one.

**Build under test:** the `main` commit named in your brief. Write the commit hash at the top of your report.

**Run the production build** (the dev server is only for development):
```bash
cd frontend
npm ci
npm run build
npx vite preview --port 4173
```
App: http://localhost:4173

## Report format
File: `documentation/qa/test_report_<tester>.md`. Write one line per check:

| ID | Result (PASS / FAIL / BLOCKED / N/A) | Severity if FAIL (blocker / major / minor / cosmetic) | What you saw (exact text or screenshot path) |

Afterwards, list every FAIL again with: steps to reproduce, expected, actual.
Screenshots: `documentation/qa/shots_<tester>/`.

## A. Build and automated checks
- A1 `npm test`: all tests pass.
- A2 `npm run lint`: no errors.
- A3 `npm run build`: succeeds, and `check-dist-sizes` passes (every file < 25 MiB).
- A4 `npm run check:release`: 0 FAIL. The only allowed WARN is audio.
- A5 `npm run smoke` against the preview: passes.
- A6 `npm run dev`, then analyse a sample: works, with no Vite error overlay.

## B. First load and app shell
- B1 The first load shows the home screen with no console errors. Write down any warnings.
- B2 The AIgnite sticker is visible in the header on every page.
- B3 The header links (📊 accuracy, ℹ️ about, logo/home) navigate correctly. Browser back and forward work.
- B4 The BN/EN toggle switches every visible string, with no mixed-language leftovers. The choice survives a reload.
- B5 The page title, favicon and `robots.txt` are correct.

## C. Home and photo input
- C1 The tips card can be closed.
- C2 "Camera" opens the camera on a phone, and a file picker on desktop.
- C3 "Gallery": a JPG, a PNG and a WEBP each reach the preview screen.
- C4 Unsupported files (GIF, PDF, a .txt renamed to .jpg) show a clear message and never crash.
- C5 A very large photo (≥ 12 MP) and a tiny one (≤ 100 px) both work, or show a clear message.
- C6 A phone photo with EXIF rotation previews the right way up.
- C7 Each of the 5 sample photos opens the preview screen.

## D. Analysis
- D1 The preview shows the photo with "Analyse" (পরীক্ষা করুন) and "Retake".
- D2 The first analysis shows model-download progress, then a result. Write down the time.
- D3 Samples: healthy → Healthy; blast → Blast; brown spot → Brown spot; tungro → Tungro; sheath blight → Sheath blight.
- D4 Pressing Analyse twice quickly gives one result, with no error.
- D5 Navigating away mid-analysis, then back, causes no crash or stale screen.

## E. Result card (confident result)
- E1 The Bangla name, the English name and the confidence chip (high/medium) are correct. **No percentages are shown.**
- E2 "What is it", symptoms, "what to do now" and prevention texts all appear. **No pesticide dose appears anywhere.**
- E3 The audio button: with no MP3s present, it must not crash and must give a sensible fallback. The "AI voice" label is shown.
- E4 "Show text" toggles the transcript.
- E5 The official advice (BAMIS/DAE) panel expands. Each link opens the correct source in a new tab.
- E6 The 16123 button is a `tel:16123` link, and "charges may apply" is visible.
- E7 Share / copy works, or falls back to clipboard with a confirmation. The shared text has no dose and no overclaim.
- E8 "Retake" returns to a clean home or preview.

## F. "Not sure" and the safety gate
- F1 Too-close crop of a leaf (`documentation/screenshots/release/inputs/not_sure_closeup.jpg`) → "not sure", with two possible conditions.
- F2 A non-leaf image (the sticker PNG, a screenshot, a selfie, a wall) → "not sure" with the message "does not look like a rice leaf". **No disease candidates are shown.**
- F3 A heavily blurred leaf photo → "not sure" or the correct disease. **Never a medium-confidence "Healthy".**
- F4 Any healthy result shows only at high confidence. A borderline healthy leaf gives the "may be healthy, but not confident" message.
- F5 A photo the model calls leaf smut → "not sure" (the class is suppressed), with leaf smut listed as possible.
- F6 The not-sure card keeps the 16123 button and the retake tips.

## G. Accuracy page
- G1 Every number matches `frontend/public/data/metrics-v1.json` exactly: internal, Sylhet, Savar, and the safety-gate numbers if shown.
- G2 The confusion-matrix and reliability images load, and are readable at 360 px.
- G3 Tables don't overflow at 360 px (no horizontal page scroll).
- G4 The limitations text is present and honest. There is no "100%", "first" or "only" claim.

## H. About page
- H1 Dataset credits and licences (CC BY 4.0, DOIs) are present. The links work.
- H2 The privacy line ("photo stays on your phone") is shown. DevTools Network shows **no image upload** during an analysis.
- H3 The team/solo statement and competition credit are correct.

## I. Layout and devices
- I1 At 360×740, 390×844, 768×1024 and 1280×800, check every page: no horizontal scroll, no clipped text, and tap targets ≥ 44 px.
- I2 Real Android phone in Chrome (Antigravity cannot do this; the human tester does): the whole flow works over mobile data.
- I3 Slow 4G throttling: the first analysis finishes and the progress indicator moves.

## J. Accessibility
- J1 The full flow works with keyboard only, and focus is always visible.
- J2 Every image has alt text, and every icon button has an accessible name.
- J3 Lighthouse accessibility ≥ 90 on Home, Accuracy and About.

## K. Failure handling
- K1 Block `/models/rice-mnv3l-v1.onnx` in DevTools, then analyse → a clear error with a retry option, and no blank screen.
- K2 Offline after the first load: write down what happens.
- K3 Reload on the result screen → no crash.

## L. Content and compliance
- L1 There is no dose, brand recommendation or "free call" claim in any text, Bangla or English.
- L2 The disclaimer ("preliminary idea, not a diagnosis") appears on the home, result and not-sure screens.
- L3 The sticker on the home page matches `assets/brand/aignite-sticker-original.png`.
