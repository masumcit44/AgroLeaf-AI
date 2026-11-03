# Overnight report — 2 Nov 2026 (for the user, 5:00 AM)

Status labels: **DONE** = verified with evidence below; **RUNNING** = job active; **PENDING** = not yet measured. No number below is estimated.

## 1. What was researched
- **Research subagent (Claude):** a search for a fresh, independent Bangladeshi test set.
  - **Found:** DIU "Rice Leaf Disease and Pest Dataset". Mendeley 10.17632/vwv3nry3wr.1; Hugging Face `Project-AgML/rice_disease_classification_bangladesh`; CC BY 4.0; Hasan et al. 2025, *Data in Brief* 111977. Classes: Healthy, Insect, Leaf Scald, Rice, Rice Blast, Rice Leaffolder, Rice Stripes, Rice Tungro. **No brown spot, sheath blight or leaf smut.**
  - **Rejected:** many Kaggle "Bangladesh" sets turned out to be mirrors or mixes of sets we already use; details in `handoff/ROADMAP.md` V5.
- **Earlier research** (literature, free tiers): see `handoff/ROADMAP.md` §2–3.
- **Antigravity:** its research brief R1 (`handoff/TASK_R1_RESEARCH_ANTIGRAVITY.md`) is ready but **not started**. It needs the user to paste its prompt; nobody could while the user was asleep.
- **OpenCode:** unavailable (user report, 2 Nov).

## 2. Root causes of the internet-image failures (`documentation/qa/internet_image_failures.md`)
1. **Domain shift (main cause).** v1 was trained on one district. On photos from districts it never saw, the share of its answers that are right is 53.7% (Sylhet), 9.8% (raihan) and 5% (Gujarat).
2. **Weak classes:** brown spot is mostly called blast outside Gazipur (Sylhet recall 0.07); leaf smut has no outside data.
3. **Integration mismatch:** the browser resize differed from the evaluated pipeline, flipping borderline answers. **Fixed and live:** `bf72231`.
4. **Non-rice rejection was only a colour check:** the app screenshot and the podcast poster were named as diseases. **Fixed and live:** G1, `6d76992`.

Checked and **not** the cause: class mapping, model runtime, colour order, normalisation, EXIF, transparency.

## 3. Changes made live tonight (verified on https://agroleaf-ai.pages.dev)
| Commit | Change | Evidence |
|---|---|---|
| `bf72231` (I9) | Live preprocessing = evaluated pipeline (Pillow-exact resize) | unit tests 74/74; decode-path 25/25; live bundle equals the build; borderline WEBP now Blast live |
| `6d76992` (G1) | Non-rice gate: v4-B's not_rice output in front of v1 (it never names a disease) | Pre-registered gates passed: real rice wrongly rejected 0.6% raihan / 0% Gazipur / 0% Savar; non-rice rejected 100% on all 10 sets (v1 alone 82–98%). Live: screenshot, poster and sticker → "not a rice leaf"; 29/29 rice photos unaffected; voice plays; 0 POST/PUT requests |

## 4. v5 experiment
- **Protocol fixed before training:** `model/experiments/run5_v5/PROTOCOL.md` (`d464f78`).
- **Hypothesis:** Bangladesh-only training (Gazipur + Savar + raihan) + not_rice class + strong augmentation beats the live system (v1 + G1) on fresh DIU photos.
- **Kaggle job `agroleaf-train-v5`:**
  - version 1 stopped before training (the HF `datasets` loader failed on Kaggle);
  - fixed in `3fe3149` (direct parquet download, exact DIU class names);
  - **version 2: COMPLETE** (~07:40 BST). Log checks:
    - DIU mapping as in the protocol: 2,706 images used, "Rice" (16) excluded.
    - Leakage guard dropped 8 Savar rows.
    - 15 identical images with conflicting labels were dropped, and 1,548 near-identical duplicates.
    - Every raihan EXIF turn was corrected.
    - ONNX parity: 6e-6.
    - In-domain tests: Gazipur 93.9% answered / 87.7% right (v1: 94.7% / 88.7%). These share sources with training, so they are not evidence of generalization.
  - **Disclosure:** the training kernel also printed v5's own score on the *whole* DIU set (kernel preprocessing): 74.2% answered, 55.6% of answers right, macro-F1 0.38. It was read at ~07:45, before v6 finished.
    - No v1 number was printed beside it.
    - No setting was changed after reading it.
    - The half-A selection and half-B decision remain the mechanical rules in `PROTOCOL_AMENDMENT_1.md`.
- **v6 (data-expanded) `agroleaf-train-v6`: COMPLETE** (~07:55 BST). Its DIU lines have **not** been read.
  - The leakage guard dropped **185 Vietnam rows** within 4 pHash bits of DIU or the Dhan-Shomadhan report set. The Vietnam set (`minhhuy2810`, "found online") contains copies of Bangladeshi photos.
  - Before half A is read, a CPU job (`run6_v6/leak_check/`) measures how close the remaining Vietnam images are to DIU. If looser copies remain, v6's DIU score is not trustworthy.
- **Decision on DIU** (local, live-app preprocessing, `ml/tools/eval_diu_app_path.py`, `5781b03`): **PENDING**.

## 4b. Data inventory (file-level audit; images per class)
| Source | Role | healthy | blast | brown spot | leaf smut | tungro | sheath blight | other |
|---|---|---|---|---|---|---|---|---|
| Gazipur | train (BD) | 1575 | 1326 | 2178 | 724 | 2244 | 1722 | 0 |
| Savar | train (BD) | 834 | 720 | 0 | 0 | 494 | 626 | 476 |
| raihan (Sirajganj/Pabna) | train from v5 (BD) | 187 | 310 | 274 | 0 | 0 | 288 | 827 |
| Dhan-Shomadhan | report-only (BD, white paper) | 0 | 198 | 90 | 0 | 119 | 219 | 143 |
| Sylhet | final test (BD) | 252 | 0 | 356 | 0 | 530 | 0 | 422 |
| Gujarat | final test (IN) | 0 | 0 | 40 | 40 | 0 | 0 | 40 |
| Paddy Doctor | v6 train (IN) | 1764 | 1738 | 965 | 0 | 1088 | 0 | 4852 |
| Sethy | v6 train (IN) | 0 | 1440 | 1600 | 0 | 1308 | 0 | 1584 |
| Vietnam | v6 train (VN) | 1488 | 779 | 523 | 0 | 0 | 0 | 565 |
| **BD training total (v5)** | | 2596 | 2356 | 2452 | 724 | 2738 | 2636 | 1303 |

**Finding:** file counts are not the bottleneck; **Bangladeshi source diversity is.**
- Each class comes from 1–3 Bangladeshi places: leaf smut from one (Gazipur), brown spot and tungro from two.
- Burst shots mean far fewer independent scenes than files.
- Legally usable, verified Bangladeshi field data beyond these barely exists publicly:
  - `under167` has an unknown licence;
  - DIU set 2 is from the same lab as the DIU test, so it would leak;
  - Philippines (AGPL) is web-scraped with unreliable labels.
- **v6 tests the "more diverse data" hypothesis directly:** Bangladesh + India + Vietnam + Karnataka, same recipe as v5. The protocol amendment `0a90df1` splits DIU into A (choose v5 or v6) and B (one final test).
- **Real leverage:** consented Bangladeshi field photos, especially leaf smut, brown spot and tungro, collected across districts and labelled by an agronomist.

## 5. Still unreliable (true today)
- Disease answers on photos from new districts and on internet photos (see §2).
- Brown spot and leaf smut outside Gazipur; DIU cannot test them either.
- The disease text is preliminary, not reviewed by an agronomist (user decision, 2 Nov).

## 6. Next steps
PENDING (filled in after the v5 result).
