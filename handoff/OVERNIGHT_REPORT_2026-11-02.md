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
  - **version 2: RUNNING.**
- **Decision on DIU** (local, live-app preprocessing, `ml/tools/eval_diu_app_path.py`, `5781b03`): **PENDING**.

## 5. Still unreliable (true today)
- Disease answers on photos from new districts and on internet photos (see §2).
- Brown spot and leaf smut outside Gazipur; DIU cannot test them either.
- The disease text is preliminary, not reviewed by an agronomist (user decision, 2 Nov).

## 6. Next steps
PENDING (filled in after the v5 result).
