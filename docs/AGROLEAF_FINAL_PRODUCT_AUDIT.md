# AgroLeaf AI — Final Product Audit (Claude Code, 4 Nov 2026)

**Release decision: CONDITIONALLY READY — MANUAL VERIFICATION REQUIRED**
Reason: the Bengali-voice fix is verified by automated tests only; real-device listening
(Android Chrome, desktop Chrome, iOS Safari) has not been done (see "Bengali voice").

Candidate: branch `deploy/candidate-ready` @ `bd582cc` → https://deploy-candidate-ready.agroleaf-ai.pages.dev
(served bundle `index-C3IuX67b.js`, checked). Production (`main` @ 698e1ec) **not changed**.
Scope note: this pass had a hard usage budget; it covered the release blocker (voice) and the
main result screen. Items under "Not audited" were not reviewed in this pass.

## Fixed
| Issue | Root cause | Fix |
|---|---|---|
| Bengali Copilot answers read with English pronunciation | `speakUtterance` spoke at once when `speechSynthesis.getVoices()` was still empty (first call in Chrome, common on Android): `lang='bn-BD'` but **no voice**, so the browser used its default (English) voice | Waits for the voice list (`voiceschanged`, 2 s max); speaks **only** with a bn-BD → bn-IN → bn* voice; with no Bengali voice it does **not** speak and shows a Bangla message with Android steps to install Google's Bengali voice |
| Long answers cut off mid-way | Chrome stops one utterance after ~15 s | Split at sentence ends (। ? ! . newline), ≤ 180 chars per piece, queued |
| URLs, markdown, "উৎস:" lines read aloud | Raw answer text spoken | `cleanTextForSpeech` (screen text unchanged) |
| Stop pressed before voices load still spoke later | No cancel flag | `stopped` flag; stop always ends cleanly; `cancel()` before every answer (no overlap) |
| Developer IDs shown to farmers ("F30:", "F31:") | Badge texts | Removed from 3 feature text files |

## Simplified
- Result screen (390 px, blast sample): **7.0 → 3.6 phone screens**. Confidence score, severity,
  AI heatmap, yield risk and the copilot card now sit in one collapsed
  "🔍 আরও বিশ্লেষণ" section (`RESULT_SECONDARY` in `features/slotLayout.js`).
  Visible first: result card, voice, reliability (F14), this-week plan, reminder, save to
  history, weather, help. Rationale: two confidence cards were shown (F14 + confidenceScore);
  the copilot also has its own tab.

## Preserved (unchanged)
ML model v10 + preprocessing + decision rules; the pre-generated result-screen voice clips
(edge-tts bn-BD Nabanita MP3s, genuine Bengali, offline-cached); all feature code and data.
No feature removed; nothing deleted.

## Bengali voice — status
- Result screen voice (▶ শুনুন): pre-recorded Bengali MP3 → genuinely Bengali on every device
  that plays audio (verified earlier on production).
- Copilot voice (browser speech): **fixed in code, NOT verified by ear**. This audit browser had
  0 speech voices. Expected per device: Android Chrome with Google Bengali TTS installed → Bengali;
  desktop Chrome on Windows usually has **no** Bengali voice → message, no English; iOS Safari has
  no Bengali voice → message, no English.
- Not done: a free, reliable server/offline Bengali TTS for free-form answers (would need a new
  dependency or model); out of scope for this pass.

## Tests
- `npx vitest run`: **64 files, 479 passed, 0 failed** (includes 8 new voice tests).
- `npm run lint`: exit 0. `npm run build`: OK, all files < 25 MiB (main JS 941 kB, 259 kB gzip).
- Live candidate check (390 px): no horizontal overflow; "more analysis" present and closed;
  no feature IDs in text.
- Not run in this pass: e2e suites, offline retest, camera, real devices.

## Not audited in this pass (recommend before production)
F1 live camera, F24 reminders persistence, F26 yield risk wording, F30 copilot answer correctness
(Banglish intents, no fabricated farm data, dosage safety), F32 outbreak warning, API/security
review of new endpoints, dependency vulnerabilities, bundle size (941 kB JS doubled since 3 Nov).
Uncommitted doc edits by another agent in `docs/` were left untouched.
