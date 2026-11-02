# v9 design inputs (2 Nov 2026)

The user asked for precision, recall and F1 of at least 90%, and to learn from two champion pipelines and from research on image EDA and augmentation.

This file records what each source says, and what we take or reject.

## A. Dhaka PM2.5 "taken apart" notebook (Rafiur Rahman, Kaggle)
Read as text only; not executed. It is a time-series forecast, so only its **method** transfers.

| Practice in the notebook | Our use |
|---|---|
| First states what a test row actually knows; validation copies deployment (frozen features, blocked windows with a gap) | **Leave-source-out validation.** Our random-split validation scored ~0.91 while new sources scored 0.3–0.5. |
| Signal decomposed into parts, each checked against the data | Errors broken down by source, class, background and scale. Scale was already confirmed (224 → 320). |
| Keep a change only if it improves both held and clean CV | Keep a change only if it improves several held-out sources |
| Oracle / irreducible-error analysis | Label-noise estimate (EDA probe) as the ceiling |
| "What didn't work" table | Kept per run (`run*/HALF_A_RESULT.md`) |
| **Rejected:** final shifts tuned on public leaderboard scores | That is test-set tuning; forbidden here |

## B. PhysioNet ECG digitisation, 2nd place (Takashi Someya, Jan 2026)
Writeup read in the browser.

| Practice | Their evidence | Our use |
|---|---|---|
| Strategy from the metric and OOF errors: focus where gains are largest | metric averages linear SNR | Target the biggest v8 losses: blast → brown spot, tungro → healthy, unsupported answered |
| Measure the representation's ceiling (round-trip SNR of masks) | dense masks capped it; sparse masks fixed it | Resolution ceiling; label-noise ceiling |
| Return to original high-fidelity data (500 Hz PTB-XL) | single fold 21.67 → 22.49 dB | Prefer original images over recompressed mirrors; cache at higher resolution |
| Structure-aware model (2.5D lead fusion) | recovers masked regions | Multi-scale views (whole + zoomed) **in training** |
| Hard cases added each epoch ("0015" wrinkled) | private-set risk | Oversample white-background close-ups and early symptoms |
| Mild realistic augmentation | brightness/contrast ±0.1, RandomShadow, blur, CoarseDropout, ToGray 0.25, h-flip | Add RandomShadow. **No grayscale** (tungro is a colour cue). |
| Ensemble of different encoders + flip TTA | 6 models: private 23.27 | 2–3 model logit average if the browser budget allows |

## C. Research on image EDA and augmentation (web search, 2 Nov 2026)
- **EDA:**
  - embedding-space analysis: 2-D maps, near-duplicates, outliers, label disagreement with neighbours;
  - leakage across splits;
  - drift between training and deployment.

  Sources: t-SimCNE (arXiv 2210.09879), fastdup, DataEval.
- **Cross-dataset plant disease:**
  - Bangladeshi rice: in-domain macro-F1 0.72 vs cross-domain 0.44; strong augmentation +0.070 (arXiv 2609.31709);
  - background-removed training gave the best cross-dataset corn result, 82.93% (Sci. Rep. s41598-026-45464-7);
  - shared images across datasets inflate transfer results (arXiv 2608.20608).

  Our manifest confirms this: Aman contains copies.
- **Augmentation:**
  - TrivialAugment beats RandAugment and AugMix in in-distribution comparisons, with no tuning (arXiv 2103.10158);
  - no head-to-head domain-generalization benchmark was found;
  - Mixup / CutMix are often layered on top.

## C2. CIFAR-100 notebook (lakhindarpal, Kaggle; source read, not executed)
**What it is:** a plain transfer-learning baseline.
- ResNet-50 with ImageNet `IMAGENET1K_V2` weights; the 32 px images are upscaled to 224.
- RandAugment(num_ops=2, magnitude=9).
- Normalisation with mean / std computed on the training set.
- AdamW lr 3e-4, weight decay 1e-4, OneCycle, 10 epochs, plain cross-entropy.
- Predictions by argmax.

**What it does not have:** a validation split (only running training accuracy is shown), label smoothing, TTA, ensembling, checkpoint selection or calibration. No score is shown in the notebook.

| Idea | Our use |
|---|---|
| RandAugment(2, 9) as a no-tuning automatic policy | Agrees with the research (RandAugment / TrivialAugment). Candidate replacement for our hand-made "strong" pipeline. |
| Upscale small inputs to the backbone's native resolution | The same lesson as our 224 → 320 result: detail must survive to the network |
| Stronger pretrained weights (V2 recipe) | Use the best available ImageNet weights for the chosen timm backbone |
| Dataset mean / std normalisation | **Not adopted.** With pretrained backbones we keep the backbone's ImageNet statistics, which the app already uses. |
| No validation, training accuracy only | **Not adopted:** our selection uses leave-source-out validation |

## C3. Recursion Cellular "NewFinalRunBest" (rohanmalhotracodes, Kaggle; source read, not executed)
**What it is:**
- EfficientNet-B0 (torchvision ImageNet) with a 6-channel first convolution: the RGB weights are copied twice and scaled by 0.5.
- 384 px input, both microscope sites per sample, AdamW 3e-4, cosine LR, AMP, 10 epochs.
- **GroupKFold by experiment**; the checkpoint with the best validation accuracy is kept.
- Validation and test probabilities are **averaged over the two sites of the same sample**.
- TTA: identity, h-flip, v-flip, rot90.
- Metrics: accuracy, top-5, macro / weighted / micro F1.
- No scores are shown in the notebook.

| Idea | Our use |
|---|---|
| **Validation grouped by experiment** (the batch effect is the domain shift) | The same as our leave-source-out plan. Each source / district plays the role of an "experiment". |
| **Average several views of the same specimen** (two sites) | Product option: let the farmer take 2 photos of the same leaf and average them. Within one photo, flip / rot90 TTA is cheap. Leaves have no fixed orientation, so dihedral TTA matches how the data varies. |
| Dihedral augmentation (flips, rot90) | Already in our "strong" pipeline |
| 384 px input | Supports trying 384 after our 224 → 320 gain, subject to browser speed |
| Checkpoint chosen on grouped validation | Choose the epoch on leave-source-out macro-F1, not random-split validation |
| **Pitfall:** missing files silently replaced by black images | Not adopted: our pipeline drops unreadable files and prints the count |

## D. Our own EDA
`model/experiments/eda_v9/`, Kaggle `agroleaf-eda-v9`. Results are added below when the job finishes.
