# AgroLeaf AI — master roadmap (the one authoritative plan and status)

**Owner:** Claude (lead). Only the lead edits this file. Workers report on their own branch and in their own progress files. Older files in `handoff/` (`PROGRESS.md`, `01_MODULE_PLAN.md`, `X_BACKLOG.md`, `Y_BACKLOG.md`, `M00`–`M09`) are **historical**; where they differ, this file wins.

**Deadline:** Devpost, Wed 5 Nov 2026, 11:59 PM BST. Internal target: 6 PM that day. **Last verified:** 2 Nov 2026, 00:00 BST.

## 0. Product goal (priority order)
1. **Core:** a farmer uploads a rice-leaf photo, and the app answers one of: a supported disease, Healthy, "this is not a rice leaf", or "not sure", with each answer justified by measured evidence.
2. Safe advice: no doses; refer to 16123 or the Upazila agriculture officer; Bangla first.
3. Privacy (the photo never leaves the phone), it works on low-end phones, and it's free.
4. Everything else (voice, polish, extra pages).

## 1. Diagnosis: what was wrong with the plan
- **Task list, not product increments.** Work was tracked as tasks, not as small user-visible improvements each proven end to end.
- **The model work fixed the wrong thing first.** It optimised in-distribution numbers before having an outside-district validation set. v3 scored 0.877 internally but stayed near v1 on Sylhet.
- **No minimum-coverage rule** until 1 Nov. A model that refuses almost everything could look "accurate".
- **No explicit backend/database decision** (made in §3 below).
- **Workers' reports were taken too literally.** Antigravity's dataset "verification" turned out to be fabricated; it has since retracted it (`240b176`). From now on nothing is accepted without checking the files or test output.
- **Old status files** were never retired, so several "plans" disagreed.

## 2. Disease detection: evidence and recommendations
Each point is labelled: **[R]** research finding, **[E]** our measured evidence, **[A]** assumption.

**What we know**
- **[R]** Cross-dataset results on Bangladeshi rice datasets fall sharply: macro-F1 0.72 within a dataset vs 0.44 across datasets. Strong augmentation was the only significant gain, about +0.07 F1; a frozen DINOv2 probe and pooled training did not close the gap (arXiv 2609.31709).
- **[R]** Open-set rejection of unknown inputs works with a trained "outlier" class and fails with softmax confidence alone (Jiang et al. 2022, Frontiers fpls.2022.989086; OpenOOD v1.5, arXiv 2306.09301).
- **[E]** Measured on our data (`model/EXPERIMENT_LOG.md`):
  - **Non-rice rejection: solved.** The trained `not_rice` class rejects 100% of held-out non-rice test sets and 103/105 local graphics, including the poster that fooled v1. Energy-based rejection rejected only 1–20%.
  - **Generalization: not solved.** On raihan (Bangladeshi field photos from another district), v4 variants reach 30–53% raw accuracy.
  - **Adding India/Vietnam data hurt.** Bangladesh-only training (v4-B) generalizes best.
  - **ConvNeXt-Tiny (106 MiB)** was only slightly better on Sylhet and cannot be served in the browser.
  - **Leaf smut:** precision 0.67 internally, 81% right even at ≥ 90% confidence, and no outside data. It stays "not sure".
  - **Preprocessing** in the browser matches PyTorch exactly below the 1,024 px cap (decode-parity test 25/25).

**Recommendations**
- **[Rec] The biggest lever is more Bangladeshi field photos, not a bigger model.** Collect consented field photos, label them with an agronomist, split by scene so burst shots can't leak, and retrain on Bangladeshi data with strong augmentation. This is post-competition work (§5, P3).
- **[Rec] Keep the 8-class design** (6 + `other_rice` + `not_rice`) and the app's abstention rules, evaluate with the **app's real rule**, and require at least **30% coverage** before comparing models.
- **[Rec] Not before the deadline:** no new training runs, ensembles or larger backbones. The evidence does not support them, and retraining risks the release.
- **[Rec] A future experiment worth one run:** train on lesion and leaf crops from the 74,836 YOLO boxes in RiceLeafDiseaseBD [R: dataset page], tested on raihan.

## 3. Architecture decision: backend and database
**Decision for the competition release: no backend, no database** (approved by the user, 2 Nov 2026). The app stays static on Cloudflare Pages with in-browser ONNX inference.

**Why** (free-tier facts checked on official pages, 1 Nov 2026):
- **No card-free host can run our model server-side.** Cloudflare Workers allow 10 ms CPU and 128 MB memory per request. Hugging Face Docker/Gradio Spaces now need PRO. Render free sleeps after 15 minutes, with about a minute to wake.
- **Firebase Storage needs Blaze (a card)** since 3 Feb 2026. **R2 likely needs a card** [U]. **Supabase** free projects pause after 7 days of inactivity.
- **Nothing in the current product needs to be stored.** No accounts, no history, no feedback.
- Static means $0 cost, no keys to leak, and photos never leave the phone. This was verified on the live site: 0 POST/PUT requests.

**What would trigger adding one** (all must be true):
1. A written consent flow and privacy notice.
2. A concrete retraining plan that needs field photos or labels.
3. Someone owns deletion requests, key rotation and quota monitoring.
4. Optionally, a partner such as an extension office or NGO to review submissions.

Separately, if measured phones are too slow for the 16 MB model, or a bigger model clearly wins on raihan, a paid inference host would be needed.

**Future design (P1/P2), when triggered:**
- **Feedback and labels, no photos:** Pages Functions/Worker + D1 (EU jurisdiction) + Turnstile. D1 is only reachable through the Worker; no secret ever reaches the browser.
- **Consented photos:**
  - Supabase Storage with row-level security: anonymous users may insert only, with no public read. Strip EXIF/GPS in the browser first.
  - If a card becomes available, use R2 instead (10 GB free, free egress).
- **Never:** service-role or admin keys in frontend code.

## 4. How every increment works (spiral)
Goal → research or decision → implement only that → test → review the evidence → integrate → update this file.

Each increment has an owner, its own branch, acceptance criteria, required tests, the evidence needed for DONE, and a rollback. **Rollback for anything on `main`:** revert the commit; Cloudflare redeploys automatically in about a minute.

**Statuses:** TODO · ASSIGNED · IN_PROGRESS · BLOCKED · IMPLEMENTED · TESTED · REVIEWED · INTEGRATED · DONE.

## 5. Increments

### Before the deadline (2–5 Nov)

#### I1 — Model release gate (v1 vs v4-B)
- **Owner:** Claude. **Branch:** `feat/model-v3`. **Status:** IN_PROGRESS (Kaggle `agroleaf-eval-unified` running).
- **User value:** the best available model, proven on photos it never saw.
- **Scope:** run `model/experiments/eval_unified/DECISION_PROTOCOL.md` (committed before results, `907a630`) with `ml/tools/coverage_compare.py`.
- **Non-goals:** no new training; no tuning on Sylhet or Gujarat.
- **Acceptance:** checksums and image list verified; all four protocol conditions computed; GO or NO-GO recorded with evidence.
- **Tests:** evaluator unit tests (`ml/tests/test_eval_app.py`, `test_app_decision.py`).
- **Risk:** the job fails again. **Rollback:** not needed; nothing is deployed by this step.

#### I2 — Final independent test
- **Owner:** Claude. **Depends on:** I1. **Status:** BLOCKED (I1).
- **Scope:** score Sylhet and Gujarat once, for the chosen model and v1; analyse the Sylhet failure (brown spot vs tungro confusion, image and background statistics); log the results.
- **Acceptance:** one run, logged in `model/EXPERIMENT_LOG.md`, nothing changed afterwards.

#### I3a — Integrate the new model (only if I1 = GO)
- **Owner:** Claude reviews; OpenCode prepares on `feat/model-swap`. **Status:** BLOCKED (I1).
- **Scope:**
  - 8-class model, calibration and class index;
  - regenerate the decode-parity fixtures for the new model;
  - update the release-check guards;
  - live test with the poster, samples, "not sure" and "other problem".
- **Acceptance:**
  - `npm run test:decode` 25/25;
  - unit tests, lint, build and release guards pass;
  - live QA script passes;
  - privacy unchanged.
- **Rollback:** revert the commit (v1 returns).

#### I3b — Document v1's limits (only if I1 = NO-GO)
- **Owner:** Claude. **Status:** BLOCKED (I1).
- **Scope:** the accuracy page and docs state the measured outside-district results and limits.

#### I4 — Offline second analysis and QA-script false alarms
- **Owner:** OpenCode. **Branch:** `fix/offline-reanalysis`. **Status:** IN_PROGRESS (branch created, uncommitted work, 2 Nov 00:27).
- **Acceptance:** the K2 check passes offline; B4 checks use localStorage / `<html lang>`; vitest, lint and build pass.
- **Review:** the lead re-runs the tests and K2 before merging.

#### I5 — Submission claim audit (read-only)
- **Owner:** Antigravity. **Branch:** `qa/submission-audit` (`b948dee`). **Status:** REVIEWED + INTEGRATED (report only).
- **Lead review (2 Nov, 00:35):** all 17 quoted claims found in the files; line numbers within ±1; 1 paraphrase marked as a quote (minor). **Findings to fix in I7:**
  - `README.md:59` says "evaluation in progress" (outdated);
  - `README.md:174` says the release check is "expected to fail" (it now passes 8/8);
  - the deck's "rural internet gap" figure has no source (U2).
- **Deliverable:** `documentation/qa/submission_audit_antigravity.md`, a table of every claim marked MATCH / MISMATCH / NO SOURCE, with exact quotes.
- **Review:** the lead spot-checks 10 claims against the files before using it.

#### I6 — Voice intelligibility evidence
- **Owner:** Antigravity. **Branch:** `qa/voice-asr`. **Status:** IN_PROGRESS (started 2 Nov, 00:27).
- **Note:** the voice is already live (`2779990`) and approved by the user's listening. This is extra evidence only.

#### I7 — Final numbers everywhere
- **Owner:** OpenCode writes; Claude reviews. **Branch:** `docs/final-numbers`. **Depends on:** I1, I2, I5. **Status:** BLOCKED.
- **Scope:** accuracy page (`metrics-v1.json` only if I3a), README, Devpost story, demo script, deck text.
- **Also in scope:**
  - remove the unsourced "rural internet gap 43.6% vs 75.7%" statistic from `deck_outline.md` / `deck_build.py`, with no replacement number (U2);
  - fix `README.md:59` ("evaluation in progress") and `README.md:174` ("release check expected to fail") (I5 findings).
- **Acceptance:**
  - every I5 mismatch fixed;
  - no `[[...]]` except personal fields;
  - banned-claims check passes;
  - `git grep -n -i "agronomist"` shows no claim that the content was reviewed or verified by an agronomist;
  - the preliminary-screening disclaimer is still present in the app and the docs.

#### I8 — Release check on the live site
- **Owner:** Claude. **Depends on:** I3, I4, I7. **Status:** TODO.
- **Scope:** QA script on the live URL, privacy capture, secret scan, Lighthouse.
- **Acceptance:** every item PASS or documented; GO/NO-GO for submission.

#### U1–U6 — the user's tasks
| ID | Task | Status |
|---|---|---|
| U1 | Real Android phone test (camera, gallery, voice, share) | TODO |
| U2 | Deck personal fields + a source for the "rural internet gap" figure | DECIDED 2 Nov: no reliable source, so **remove the 43.6% vs 75.7% statistic** with no replacement number (done in I7); personal fields still TODO |
| U3 | Decide on the disease text | DECIDED 2 Nov: **no agronomist review confirmed.** The text stays marked preliminary, the disclaimer stays, and nothing may claim agronomist verification (checked in I7) |
| U4 | Demo video (≤ 3 min) | TODO (after I8) |
| U5 | Devpost submission | TODO |
| U6 | Start the workers (paste prompts) and close the old OpenCode loop if it is still running | TODO |

### After the competition (not started before 5 Nov)
| ID | Increment | Trigger / dependency |
|---|---|---|
| P1 | In-app "was this right?" feedback, stored without photos (Worker + D1 + Turnstile) | consent text approved |
| P2 | Consented photo submission (Supabase Storage + RLS, or R2 with a card); EXIF/GPS stripped in the browser; deletion flow | the §3 triggers |
| P3 | Bangladeshi field data collection, agronomist labelling, scene-grouped splits, retraining with strong augmentation, Bangladesh-only vs pooled ablation | P2 + agronomist |
| P4 | Leaf-smut data (none exists outside Gazipur) | P3 |
| P5 | Model versioning: `model_version` in the app and feedback rows; staged rollout through a Pages preview | P1 |
| P6 | Server inference, only if phones are measured too slow or a larger model wins on raihan | paid host |

## 6. Parallel execution right now
| Lane | Now | Next |
|---|---|---|
| Claude | I1 gate (Kaggle running) → I2 | review I4/I5; I3a or I3b; I8 |
| OpenCode | I4 (`fix/offline-reanalysis`) | I3a prep (if GO) or I7 |
| Antigravity | I5 (submission audit) → I6 | re-verify I7 claims after OpenCode's edits |
| User | U3 decision, U2 fields, U1 phone test | U4 video, U5 submit |

**No two lanes touch the same files:**
- I4: `frontend/src` offline handling and `qa_lead.mjs`
- I5/I6: new QA documents only
- I1/I2: `model/`, `ml/tools/`

**Kaggle:** only the lead launches jobs, at most one at a time.

## 7. Decisions needing the user's approval
1. **No backend/database for the competition release** (§3). **APPROVED by the user, 2 Nov 2026.**
2. **No new model training before the deadline.** Ship v1 or v4-B according to I1.
3. ~~U3~~ decided: keep it preliminary, with the disclaimer.
4. **After the competition:** whether to pursue P1–P3 (consented data collection is the real path to better accuracy).

## 8. Key risks
- **I1 says NO-GO.** v1 then ships with its documented limits; outside-district accuracy stays weak, and the app answers "not sure" often. Mitigation: honest accuracy page; P3 plan in the Devpost "what's next".
- **Worker output is unreliable** (it happened before). Mitigation: no merge without lead review and re-run tests.
- **The disease text is unreviewed** (U3).
- **Free tiers change.** Re-check before P1/P2.

## Done and verified (evidence)
- **Live:** https://agroleaf-ai.pages.dev, auto-deploying from `main`.
  - QA script passes on the live site; privacy verified (0 POST/PUT; the photo stays on the phone); no secrets in the bundle (`b9cb438`).
  - Bangla voice (Nabanita, edge-tts) plays on all 6 reachable result cards (`2779990`).
- **Model tooling** (`feat/model-v3`):
  - app-decision evaluator, checked against `decide.js` on 3,000 cases;
  - Pillow-exact browser resize with the decode-parity test;
  - file-level dataset verification (`documentation/research/dataset_verification_2026-11-01.md`);
  - decision protocol committed before results.
