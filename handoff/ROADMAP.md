# AgroLeaf AI — remaining-work roadmap (single source of truth)

**Owner:** Claude (lead). Only the lead edits this file; agents report in their own files.
**Deadline:** Devpost, Wed 5 Nov 2026, 11:59 PM BST. Internal target: 6 PM that day.
**Statuses:** TODO · ASSIGNED · IN_PROGRESS · BLOCKED · IMPLEMENTED · TESTED · REVIEWED · INTEGRATED · DONE.

**State verified 1 Nov 2026, 23:50 BST:**
- `main` = `b9cb438` (model v1) is live at https://agroleaf-ai.pages.dev; Cloudflare auto-deploys on push to `main`.
- Model work is on branch `feat/model-v3`.
- The only Kaggle job running is `agroleaf-eval-unified` (CPU).

## Rules for every task
- **Branches:** each agent works on its own branch, in its own folder; never push to `main`. The lead reviews the diff and the tests, then integrates.
- **No file overlap:** two agents never edit the same files at the same time.
- **Done means:** code plus tests plus verification. A report alone does not count.
- **Honest reporting:** report only what you ran and saw. "Not checked" is acceptable; an invented result is not.

## Tasks

| ID | Objective | Agent | Depends on | Files | Acceptance | Status |
|---|---|---|---|---|---|---|
| R1 | v1 vs v4-B decision on raihan (`DECISION_PROTOCOL.md`) | Claude | eval job | `model/experiments/eval_unified/`, `ml/tools/coverage_compare.py` | all four protocol conditions computed from the job output; checksums and image list verified | IN_PROGRESS (Kaggle job running) |
| R2 | Score Sylhet and Gujarat once, after R1 is locked | Claude | R1 | `model/EXPERIMENT_LOG.md` | one run; results logged; nothing tuned on them | BLOCKED (R1) |
| R3 | If GO: integrate the new model and calibration, browser = Python check, build, deploy | Claude | R1 = GO | `frontend/public/models`, `frontend/public/data` | decode-parity 25/25, unit tests, live upload test | BLOCKED (R1) |
| R4 | Bangla voice clips with edge-tts (no Azure, nothing live) | Claude | – | scratch only | 14 clips (2 voices × 7); valid MP3, 10–21 s, not silent | IMPLEMENTED (technical checks pass) |
| R4a | Speech-recognition check of the clips' intelligibility, both voices | Antigravity | R4 | `documentation/qa/voice_asr_check.md` only | per clip: transcript, matched/missed key words; method stated | ASSIGNED (`handoff/TASK_VOICE_ASR_ANTIGRAVITY.md`) |
| R4b | Native-speaker listening; choose the voice or reject both | **User** | R4 | – | named voice, or the mispronounced words listed | TODO |
| R4c | Ship the chosen clips, manifest and generator; verify playback live | OpenCode (prepare) + Claude (merge) | R4b | `frontend/public/audio/`, `ml/tools/generate_tts_edge.py` | build passes; every clip plays after a click on the live site | BLOCKED (R4b) |
| R5 | Offline second analysis fails (QA check K2) | OpenCode | old track-4 loop gone | see `handoff/OPENCODE_TRACK_7.md` | K2 passes; tests, lint, build pass | ASSIGNED (start after 00:05, when the old loop has exited) |
| R6 | QA script false alarms (B4 checks) | OpenCode | – | `documentation/qa/lead_scripts/qa_lead.mjs` | B4 checks use localStorage / `<html lang>` | ASSIGNED (in track 7) |
| R7 | Submission package audit: every claim checked against its source | Antigravity | – | `documentation/qa/submission_audit_antigravity.md` only | table of claims with MATCH / MISMATCH / NO SOURCE | ASSIGNED (`handoff/TASK_SUBMISSION_AUDIT_ANTIGRAVITY.md`) |
| R8 | Fix the documents with final numbers (accuracy page, README, Devpost, demo script, deck) | OpenCode | R1, R2, R7 | `documentation/submission/*`, `README.md`, `metrics-v1.json` (only if R3) | every R7 mismatch resolved; no `[[...]]` left except personal fields | BLOCKED |
| R9 | Real Android phone test: camera, gallery, share, voice | **User** | R4c | – | checklist in `documentation/qa/TEST_PLAN_v1.md` (C2, E7, I2) | TODO |
| R10 | Deck personal fields and a source for the "rural internet gap" figure | **User** | – | – | values given to the lead | TODO |
| R11 | Disease text review: `disease_information_bn.json` is marked "DRAFT — must be reviewed by an agronomist" | **User** (agronomist, or decide to keep the disclaimer) | – | – | review done, or a decision recorded | TODO |
| R12 | Demo video (≤ 3 min, English) | **User** | R3/R4c | – | uploaded link | TODO |
| R13 | Final release check: QA script on the live site, privacy, secrets, GO/NO-GO | Claude | R3/R4c/R5/R8 | – | all checklist items PASS or documented | TODO |
| R14 | Devpost submission | **User** | R13 | – | submitted before the deadline | TODO |

## Done so far (verified)
- **Live site:** the QA script passes on https://agroleaf-ai.pages.dev; privacy verified (0 POST/PUT requests; the photo stays on the phone); no secrets in the bundle (`b9cb438`).
- **Tooling and data:**
  - evaluation tooling with decision parity checked against `decide.js`;
  - browser preprocessing exact to Pillow below the 1024 px cap;
  - file-level dataset verification.

  All on `feat/model-v3`; see `model/EXPERIMENT_LOG.md`.
