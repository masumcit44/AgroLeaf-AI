# AgroLeaf AI — Final Product Audit (Claude Code, 4 Nov 2026)

**Status: CONDITIONALLY READY — SPECIFIC ISSUES REMAIN**
1. Bengali voice in the voice assistant is fixed in code and unit-tested, but **not yet heard on a
   real phone** (the test browser here has no speech voices).
2. Not re-audited in this budget-limited pass: live camera (F1), reminder persistence (F24),
   copilot answer quality (F30).

Candidate: `deploy/candidate-ready` @ **8f2fa1b**, live at https://deploy-candidate-ready.agroleaf-ai.pages.dev
(bundle `index-HtsqcEUX.js`, confirmed). Production `main` @ 698e1ec is **not changed**.

## Feature decision register
| Feature | Decision | Why |
|---|---|---|
| Leaf scan + v10 classifier + not-sure rules | KEEP | Core; validated; unchanged |
| Bangla result card + pre-recorded Bengali voice (▶ শুনুন) | KEEP | Core; genuine Bengali MP3s |
| F14 reliability ("১০০ টির মধ্যে ৮০ টি") | KEEP | Honest measured confidence |
| F10 this-week plan, F22 help/16123, F7 safety card | KEEP | What to do, when to get help |
| F16 history, F24 reminders, F9 offline | KEEP | Core journey |
| F21 profile + GPS | SIMPLIFY | No tab; opened from Home ("এডিট করুন" + 📍 GPS) |
| F8 weather + report | KEEP | Tab; BAMIS-cited disease-weather risk |
| F30 voice assistant (copilot) | SIMPLIFY | Own tab only; removed duplicate card from the result screen |
| Confidence score card | DEFER | Duplicated F14 reliability |
| F31 disease severity | DEFER | Estimate not validated across classes |
| F26 yield impact | DEFER | Loss estimates not validated for farmer decisions |
| F11 explainable-AI heatmap | DEFER | Technical; not needed to act |
| F32 outbreak warning, F23 map | DEFER (already off) | Need real report volume + secrets |
| F20 feedback | DEFER (already off) | Not finished |
Deferred = flag off in `frontend/src/features/flags.js`; all code kept; re-enable by flipping the flag.

## UI/UX changes (measured on the candidate)
- Tabs 6 → 5: হোম, ভয়েস সহকারী, স্মরণবার্তা, ইতিহাস, আবহাওয়া.
- Result screen (blast sample): 7.0 → **3.8 screens at 360 px**; order: result → voice →
  reliability → this-week plan → reminder → save → weather → help.
- No horizontal scroll at 360 px (home, result) or 390 px (result). 0 JS errors during the flow.
- Developer IDs ("F30:", "F31:") removed from visible text.

## Bengali voice
- Root cause (fixed in bd582cc): the voice assistant spoke before the browser's voice list
  loaded, with no voice set, so the browser used its default English voice for Bangla text.
- Now: waits for voices; speaks only with a bn-BD / bn-IN / bn voice; otherwise stays silent
  and shows a Bangla message with Android install steps; long answers split; URLs and source
  lines not read; stop and no-overlap handled. 8 unit tests.
- Evidence level: **automated only**. Real-device listening: NOT DONE (owner's checklist §1).
- Result-screen voice uses pre-recorded Bengali MP3s (verified on production earlier).

## Test evidence (this pass)
- Unit/integration: `npx vitest run` → **64 files, 479 passed, 0 failed**.
- Lint: exit 0. Build: OK, all files < 25 MiB (main JS 942 kB / 260 kB gzip: deferred features
  are still bundled because they are flag-off, not deleted).
- Candidate browser run (360 px): flow above, 0 errors.
- Offline e2e on the candidate: 9 PASS, 1 FAIL. FAIL = "model/wasm did not reach the runtime
  cache" (the test waits for a cache entry); offline analysis of 3 photos and offline voice
  PASSED, so the model is available offline. The test or cache naming needs a look.
- Not run: iPhone/Android hardware, camera, reminders notification timing, copilot QA set.

## Known limitations
Bengali speech for free-form voice-assistant answers depends on the device having a Bengali
voice (typically Android with Google TTS; typically not Windows desktop or iPhone). F14 bands
are in-sample (DIU half A). Bundle size not reduced (deferred code still bundled).
