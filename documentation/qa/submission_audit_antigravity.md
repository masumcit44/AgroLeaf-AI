# AgroLeaf AI — Submission Package Read-Only Audit

**Auditor:** Antigravity (Independent ML/QA Engineer)  
**Lead:** Claude  
**Date:** 2026-11-01  
**Branch:** `qa/submission-audit` (branched from `origin/main` at commit `f06bd62`)  
**Audit Scope:** Read-only audit of all public-facing submission materials, claims, numbers, placeholders, and banned terminology.  

---

## 1. Ground Truth Source Files Consulted

The following authoritative ground-truth sources were read directly in this task:
1. `frontend/public/data/metrics-v1.json` (deployed v1 metrics and safety gate evaluations)
2. `frontend/public/data/calibration.json` (temperature, thresholds, suppression rules)
3. `documentation/research/dataset_verification_2026-11-01.md` (authoritative dataset audit across 45,258 files)
4. `model/EXPERIMENT_LOG.md`: **File does not exist** on this branch (verified with filesystem check). The model experiments are logged in `model/experiments/2026-11-01_mnv3_large.md`, `model/experiments/2026-11-01_safety_gate.json`, and `model/MODEL_CARD.md`.
5. Live endpoints inspected:
   - `https://agroleaf-ai.pages.dev/data/metrics-v1.json` (verified via curl)
   - `frontend/src/pages/AccuracyPage.jsx` and `frontend/src/pages/AboutPage.jsx` (local frontend source)

---

## 2. Claim-by-Claim Verification Table

| # | Exact Text Quoted | File & Line (or Page) | Source to Match | Status | Details / Correct Value from Source |
|---|---|---|---|---|---|
| 1 | "MobileNetV3-Large, fine-tuned in PyTorch, exported to float32 ONNX" | `documentation/submission/devpost_story.md:26` | `frontend/public/data/metrics-v1.json:3` | **MATCH** | Source lists `model.arch = "mnv3_large"`, `onnx_mb = 16.05`. |
| 2 | "Internal test (1,499 photos): macro-F1 84.3%, accuracy 86.9%, the app answers 94.7% of the time, and 88.7% of those answers are right." | `documentation/submission/devpost_story.md:54` | `frontend/public/data/metrics-v1.json:14-18` | **MATCH** | Source has `n = 1499`, `accuracy = 0.8686` (86.9%), `macro_f1 = 0.8427` (84.3%), `coverage = 0.9466` (94.7%), `selective_accuracy = 0.8872` (88.7%). |
| 3 | "Outside districts: Sylhet (1,560 photos): answers 78.9% of the time, 56.0% of those correct." | `documentation/submission/devpost_story.md:55` | `frontend/public/data/metrics-v1.json:68-72` | **MATCH** | Source has Sylhet `n = 1560`, `coverage = 0.7891` (78.9%), `selective_accuracy = 0.5601` (56.0%). |
| 4 | "Savar is much weaker: 33.6% accuracy." | `documentation/submission/devpost_story.md:55` | `frontend/public/data/metrics-v1.json:105` | **MATCH** | Source has Savar `accuracy_mapped = 0.3358` (33.6% rounded). |
| 5 | "the app now rejects 95.7% of everyday photos (previously 50.6%)" | `documentation/submission/devpost_story.md:47` | `frontend/public/data/metrics-v1.json:185-186` | **MATCH** | Source has `before = 0.5065` (50.6%), `after = 0.9565` (95.7%). |
| 6 | "On the internal test, diseased leaves called 'Healthy' fell from 13 to 2." | `documentation/submission/devpost_story.md:47` | `model/experiments/2026-11-01_safety_gate.json` | **MATCH** | Internal diseased samples falsely called healthy dropped from 13 to 2 under $0.90$ healthy threshold. |
| 7 | "Today's colour check still lets through about 4% of everyday photos and 14% of other-crop leaves." | `documentation/submission/devpost_story.md:71` | `frontend/public/data/metrics-v1.json:144, 183-193` | **MATCH** | Rejection is 95.7% (leaves 4.3% through) and 85.7% (leaves 14.3% through). |
| 8 | "On 1,499 held-out test photos, macro-F1 is 84.3 percent. On 1,560 photos from Sylhet, another district, the app chose to answer 78.9 percent of the time, and 56 percent of those answers were right. On Savar photos it is much weaker, and the page says so. The safety gate now rejects 95.7 percent of everyday photos that are not plants." | `documentation/submission/demo_script_en.md:45` | `frontend/public/data/metrics-v1.json:14-18, 68-72, 105, 185-186` | **MATCH** | Exact match with all corresponding numbers in `metrics-v1.json`. |
| 9 | "Rural internet gap: 43.6% vs 75.7% [[add source]]" | `documentation/submission/deck_outline.md:18` | None | **NO SOURCE** | No source provided for this statistic; marked with `[[add source]]`. |
| 10 | "Internal macro-F1: 0.843 · coverage: 0.947 (n=1,499) · External (Sylhet) macro-F1: 0.533 · coverage: 0.789 (n=1,560)" | `documentation/submission/deck_outline.md:67` | `frontend/public/data/metrics-v1.json:14-17, 68-71` | **MATCH** | Source has internal `macro_f1 = 0.8427` (0.843), `coverage = 0.9466` (0.947), `n = 1499`; Sylhet `macro_f1_mapped = 0.5333` (0.533), `coverage = 0.7891` (0.789), `n = 1560`. |
| 11 | "path = repo / 'frontend/public/data/metrics-v1.json'" | `documentation/submission/deck_build.py:218` | `frontend/public/data/metrics-v1.json` | **MATCH** | Deck generator dynamically loads metrics from `metrics-v1.json` without hardcoding. |
| 12 | "Measured results: see the in-app accuracy page (evaluation in progress)." | `README.md:59` | `frontend/public/data/metrics-v1.json` | **MISMATCH** | Evaluation is NOT in progress; v1 evaluation is complete and published in `metrics-v1.json`. |
| 13 | "Today, running npm run check:release is expected to fail (exit 1) on items 1, 2, 3, 5, and 6 until the Kaggle-trained model run (run1_for_app.zip) is bundled..." | `README.md:173-175` | `frontend/scripts/check-release.mjs` | **MISMATCH** | Actually ran `npm run check:release`: exited 0 with all 8/8 release guards passing. Note is outdated from milestone M06. |
| 14 | "Strict CPU WebAssembly build (14.16 MiB), avoiding 29.5 MiB JSEP overhead to stay under Cloudflare 25 MiB ceiling" | `README.md:78` | `frontend/public/ort-wasm-simd-threaded.wasm` | **MATCH** | File size is approximately 14.16 MiB on disk. |
| 15 | "RiceLeafDiseaseBD v3 (Munna, M.M.H. et al., 2026, DOI: 10.17632/86s4jzj2m4.3)" | `README.md:189`, `frontend/src/i18n/en.js:134`, `frontend/public/data/metrics-v1.json:5` | `frontend/public/data/metrics-v1.json:5` | **MATCH** | Matches DOI and dataset citation. |
| 16 | "RiceLeafDisease-BD5 Savar (Kaggle copy sohagdewan/riceleafdisease-bd5, 3,150 imgs; provenance not verified vs Mendeley v2)" | `frontend/public/data/metrics-v1.json:96`, `documentation/submission/deck_outline.md:65` | `frontend/public/data/metrics-v1.json:96` | **MATCH** | Savar dataset copy accurately identified as 3,150 images. |
| 17 | "The Kaggle copy of Dhan-Shomadhan names its sheath blight folder 'Rice___bacterial_blight': all 219 files there are sb_wb_*.jpg... 769 of 1,106" | `documentation/research/dataset_verification_2026-11-01.md:22-32` | `documentation/research/dataset_verification_2026-11-01.md` | **MATCH** | Exact match with Kaggle data audit findings. |

---

## 3. Banned Claims & Forbidden Terminology Audit

Every submission document was scanned for forbidden claims:
- `"first"`
- `"only"`
- `"100%"`
- `"partnership"` / organizational endorsement
- `"pesticide doses"`
- `"free call"`
- `"diagnosis"` (when not properly negated as a disclaimer)

### Findings:

| Location | Flagged Text | Context / Analysis | Verdict |
|---|---|---|---|
| `README.md:49` | `- **100% Private & Offline-Ready:**` | Promotional claim using "100%". | **BANNED TERM:** Replace with "Private & Offline-Ready" or "Fully client-side". |
| `README.md:80` | `100% static hosting` | Technical claim using "100%". | **FLAGGED:** Recommend rephrasing to "Fully static hosting". |
| `README.md:65` | `Preliminary Screening, Not Final Diagnosis` | Properly negated disclaimer. | **ACCEPTABLE (Negated).** |
| `documentation/submission/devpost_story.md:13` | `It is not a diagnosis.` | Explicit negative disclaimer. | **ACCEPTABLE (Negated).** |
| `documentation/submission/devpost_story.md:19` | `The app does not claim the call is free; charges may apply.` | Explicit clarification avoiding "free call" trap. | **ACCEPTABLE.** |
| `documentation/submission/devpost_story.md:66` | `No pesticide doses, only verified text` | Explicit negative safeguard. | **ACCEPTABLE.** |
| `documentation/submission/demo_script_en.md:29` | `The app does not say the call is free; charges may apply.` | Explicit clarification. | **ACCEPTABLE.** |
| `documentation/submission/demo_script_en.md:31` | `Preliminary screening — not a diagnosis.` | On-screen disclaimer. | **ACCEPTABLE (Negated).** |
| `documentation/submission/deck_outline.md:51` | `This is preliminary screening, not a diagnosis.` | Speaker note disclaimer. | **ACCEPTABLE (Negated).** |
| `documentation/submission/deck_outline.md:101` | `Do not claim a partnership with BRRI, DAE, AIS or any other organisation.` | Explicit instruction to speaker. | **ACCEPTABLE.** |
| `documentation/submission/deck_outline.md:111` | `No AI-written pesticide doses` | On-slide bullet. | **ACCEPTABLE.** |
| `documentation/submission/deck_outline.md:112` | `16123 hand-off — charges may apply` | On-slide bullet. | **ACCEPTABLE.** |
| `documentation/submission/deck_build.py:77` | `Do not imply endorsement by BRRI, DAE, AIS or any other organisation.` | Speaker note instruction. | **ACCEPTABLE.** |
| `documentation/submission/deck_build.py:78` | `Safety is a design constraint, not a disclaimer. The app never generates a dose.` | Speaker note instruction. | **ACCEPTABLE.** |
| `frontend/src/i18n/en.js:101` | `This is a preliminary screening, not a final diagnosis.` | Footer disclaimer string. | **ACCEPTABLE (Negated).** |
| `frontend/src/i18n/bn.js:101` | `এটি প্রাথমিক ধারণা, চূড়ান্ত রোগ নির্ণয় নয়।` | Bangla footer disclaimer string. | **ACCEPTABLE (Negated).** |

---

## 4. Model-Version Claims Audit

- **Rule:** Model v1 (`MobileNetV3-Large`, 6 classes, trained on Gazipur `RiceLeafDiseaseBD`) is the deployed production model. A v4 training decision is pending. Any submission text claiming or implying that v3 or v4 is deployed is a mismatch.
- **Audit Result:**
  - `devpost_story.md:26`: Mentions "The model is MobileNetV3-Large... exported to float32 ONNX". (Accurate for v1).
  - `devpost_story.md:3` & `53-55`: Quotes numbers from `metrics-v1.json` (Internal macro-F1 84.3%, Sylhet 56.0%, Savar 33.6%). (Accurate for v1).
  - `devpost_story.md:70-71`: Under "What's next", explicitly describes a learned negative class as future work: *"A learned 'not a rice leaf' check trained on negative examples. Today's colour check still lets through about 4%..."* (Accurate: confirms v4's reject classes are not deployed).
  - `demo_script_en.md:4` & `45`: Cites model v1 plus safety gate from `metrics-v1.json`. (Accurate).
  - `deck_outline.md:61-67` & `deck_build.py`: Cites MobileNetV3 and `metrics-v1.json`. (Accurate).
  - `frontend/public/models/`: Contains `rice-mnv3l-v1.onnx` (16.05 MiB). (Accurate).
- **Verdict:** **NO MISMATCHES.** All submission materials accurately describe the deployed model as v1.

---

## 5. Leftover Placeholders Audit (`[[...]]`)

The following unreplaced placeholders were found in the submission package:

### 1. `documentation/submission/devpost_story.md`
- Line 82: `[[live URL]]` (Needs replacement with final production URL: `https://agroleaf-ai.pages.dev`)
- Line 84: `[[YouTube URL, English]]` (Needs replacement with actual YouTube unlisted demo link)

### 2. `documentation/submission/deck_outline.md`
- Line 18: `[[add source]]` (In Slide 1: "Rural internet gap: 43.6% vs 75.7% `[[add source]]`")
- Line 86: `[[name, university, skills]]` (In Slide 4: About me title)
- Line 93: `[[one personal line]]` (In Slide 4: "Why this problem: `[[one personal line]]`")
- Line 98: `[[name]]`, `[[year]]`, `[[university]]`, `[[skills]]` (In Slide 4 speaker notes)

### 3. `documentation/submission/deck_build.py`
- Line 330: `{"text": "[[TBD]]", "size": 16, "bold": True, "color": GREEN}` (Slide 1: Rural internet gap value)
- Line 506: `{"text": "[[Your name]]", "size": 31, "bold": True, "color": GREEN}` (Slide 4: Name)
- Line 520: `{"text": "[[University]]", "size": 19, "bold": True, "color": INK}` (Slide 4: University)
- Line 530: `{"runs": [{"text": "[[Skills]]", "size": 17, "color": MUTED}]}` (Slide 4: Skills)
- Line 570: `{"text": "Why this problem: [[one personal line]]", ...}` (Slide 4: Personal line)
- Line 71: `NOTES[3]` speaker notes contain `[[Your name]]`, `[[Year]]`, `[[University]]`, `[[Skills]]`

---

## 6. Audit Summary & Action Items for Lead Claude

1. **Fix `README.md` Outdated Text:**
   - Update line 59 from *"evaluation in progress"* to refer directly to the verified v1 metrics.
   - Remove lines 173–175 stating `npm run check:release` is expected to fail (it now passes 8/8).
   - Rephrase line 49 from `100% Private & Offline-Ready` to remove the banned term `100%`.
2. **Fill Required Placeholders Before Submission:**
   - Devpost story: Insert live URL and YouTube video link.
   - Pitch deck: Insert author name, university, skills, and rural internet gap citation into `deck_build.py` before generating final PPTX.
3. **No Metric Discrepancies Found:**
   - All published accuracy, coverage, macro-F1, and rejection figures in `devpost_story.md`, `demo_script_en.md`, and `deck_outline.md` match `frontend/public/data/metrics-v1.json` exactly.
