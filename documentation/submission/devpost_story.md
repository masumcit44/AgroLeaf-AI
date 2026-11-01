# AgroLeaf AI — Devpost story

> Paste this into the Devpost project page. Replace every `[[...]]` before submitting. Every number here is copied from `frontend/public/data/metrics-v1.json` (2 Nov 2026) and `DECISION_RESULT.md`; do not add one that is not there.

## Inspiration

I am a student in Bangladesh, and I kept hearing the same story: a farmer sees spots on a rice leaf, asks whoever is selling pesticide, and sprays whatever is recommended. If the problem is not what the seller thought, the money is wasted and the crop can still be lost.

I wanted to build something a farmer can open on an ordinary phone, in Bangla, without an account and without sending a photo to a server. The idea and the early research began in a team idea competition; this **web app is my own individual build for AIgnite 2026**. The research is credited in the repo, and the code, design and deployment here are mine.

## What it does

AgroLeaf AI is a mobile-first web app for a **preliminary screening** of a rice leaf photo. It is not a diagnosis and does not replace laboratory or field pathology.

1. The farmer takes or uploads a photo of a rice leaf.
2. A small image model runs **inside the browser**. The photo is never uploaded.
3. The app screens for six classes — Healthy, Blast, Brown Spot, Leaf Smut, Rice Tungro or Sheath Blight — **or "নিশ্চিত নই / not sure"** when the calibrated confidence is below a threshold chosen on validation data. A **safety gate** runs before candidate selection: a leaf-colour check screens out photos that do not look like plant leaves, and "Healthy" is shown when confidence is high (>= 0.90).
4. It shows a short Bangla and English explanation, practical next steps, and a play/pause button for pre-generated Bangla audio (edge-tts bn-BD-NabanitaNeural, labelled AI voice).
5. A `tel:16123` button offers a referral link to the national agricultural helpline. The app does not claim a partnership with the helpline service and does not claim the call is free; operator charges may apply.
6. A **"কতটা নির্ভুল? / How accurate is it?"** page publishes the measured results, sample sizes, dataset credits and known limits. Nothing on that page is estimated.
7. The disease information is preliminary and has not been reviewed by an agronomist.

The official **"Built For Ostad Presents YUNet AIgnite Buildathon 2026"** sticker is visible in the navbar on every page and in every state, as required by the competition rules. It is not hidden in a footer or a menu.

## How I built it

The frontend is **React + Vite + Tailwind CSS in JavaScript**, built Bangla-first, with a Bangla/English toggle. The deployed model is **MobileNetV3-Large** (16.05 MiB float32 ONNX, opset 17), fine-tuned in PyTorch and loaded in the browser with `onnxruntime-web/wasm`. No backend, no database, no accounts and no analytics: all text, data and pre-generated audio files are static assets.

The ML pipeline is reproducible and honest about data:
- a read-only audit finds corrupt files, exact duplicates and near-duplicate groups;
- splits are grouped by perceptual hash so burst photos cannot leak between train and test;
- training uses class weighting and validation macro-F1 early stopping;
- temperature scaling (0.909) and the "not sure" threshold (0.48) are fitted on validation, not hard-coded;
- evaluation covers the internal test, external-district sets, and unseen diseases that should be rejected;
- PyTorch and ONNX outputs are checked for numerical parity before export;
- safety-gate thresholds are fitted on validation data and half of each outside set, and reported on the other half. The browser's colour arithmetic reproduces Python's exactly, so the app uses the same feature that was tuned.

The app is deployed on **Cloudflare Pages**, with a **Vercel** mirror. Everything uses free tools. There is no paid API and no credit card.

## Challenges

- **Leakage.** Field photos come in bursts, so near-duplicates would inflate a naive score. I grouped images before splitting and verified zero shared groups.
- **Outside-district degradation (Domain shift).** Training images come from one district (Gazipur) and one season. On photos from districts the model never saw, answers are often wrong:
  - on Sylhet photos (1,423 photos, upright EXIF re-evaluation), the app answers 62.2% of the time, and 53.7% of those answers are right (macro-F1 0.548);
  - on raihan phone photos from Sirajganj/Pabna (1,794 photos), the app answers 68.5% of the time, and 9.8% of those answers are right (macro-F1 0.414);
  - on Gujarat photos from India (120 photos), the app answers 50.0% of the time, and 5% of those answers are right (macro-F1 0.099);
  - on Savar photos (3,150 photos, cut leaves on white background), the app answers 85.7% of the time, and 37.6% of those answers are right (raw accuracy 33.6%).
  Brown spot is almost never recognised outside the training district (Sylhet recall 7%). Furthermore, rice problems the app does not cover (such as bacterial leaf blight, hispa, and leaf scald) are often misclassified as one of the covered diseases (Sylhet 67.6%, raihan 80.2%). Publishing these honest limits on the accuracy page matters much more than presenting an artificial single score.
- **The v4 negative result (Honest negative result).** I evaluated an experimental 8-class candidate (v4-B) that introduced explicit reject classes for "not a rice leaf" and "other rice problem". Under our pre-registered protocol (`DECISION_PROTOCOL.md`), a model had to maintain at least 30% coverage on raihan at target precision to be eligible for deployment. Under its calibrated settings, v4-B's coverage collapsed to 15.9% on raihan, and it answered 0% on internal validation. Following the locked protocol, this was a decisive NO-GO and v4-B was not shipped. Deployed model v1 remains in production. This negative result confirmed that training reject classes without representative field diversity restricts coverage unacceptably.
- **Honest abstention.** A confident wrong answer is worse than "not sure". The threshold comes from validation and targets a precision level; coverage is reported next to it.
- **Leaf Smut.** No external dataset contains it, so I acknowledge the gap openly, and the app conservatively suppresses Leaf Smut predictions into "not sure" as an advisory candidate (weak-class suppression).
- **Confident about non-leaves and false Healthy calls.** Testing showed that non-leaf photos and blurred diseased leaves could produce false "Healthy" results. Telling a farmer with a diseased crop that nothing is wrong is the costliest error. I implemented a leaf-colour gate and restricted "Healthy" to high confidence (>= 0.90). An initial tuning rejected 62% of outside rice leaves, so I re-tuned with outside photos as a constraint. On held-out data, the safety gate rejects 95.7% of everyday photos (previously 50.6%) and 85.7% of other-crop leaves (previously 39.6%). On the internal test, diseased leaves called "Healthy" dropped from 13 to 2.
- **Disease information disclaimer.** The disease information is preliminary and has not been reviewed by an agronomist.

## Accomplishments

- A working, mobile-first app that runs inference on the phone and never uploads the photo.
- A calibrated "not sure" path with candidate possibilities, retake tips, and referral to 16123.
- A published accuracy page with sample sizes and honest limitations:
  - **Internal test (1,499 photos):** macro-F1 84.3%, accuracy 86.9%, the app answers 94.7% of the time, and 88.7% of those answers are right.
  - **Outside districts:**
    - Sylhet-Dhaka (1,423 photos, 2 Nov re-evaluation): answers 62.2% of the time, 53.7% of those answers correct, macro-F1 0.548.
    - Sirajganj/Pabna (raihan, 1,794 photos): answers 68.5% of the time, 9.8% of those answers correct, macro-F1 0.414.
    - Gujarat, India (120 photos): answers 50.0% of the time, 5% of those answers correct, macro-F1 0.099.
    - Savar (3,150 photos): answers 85.7% of the time, 37.6% selective accuracy, 33.6% raw accuracy.
    - Clear documentation that brown spot is rarely recognised outside Gazipur (Sylhet recall 7%), and uncovered rice problems escape rejection 67.6% (Sylhet) and 80.2% (raihan) of the time.
- A leakage-safe, one-command data pipeline and Kaggle reproduction notebooks.
- A model card, data card and dataset credits with DOIs, so the limits and the licence trail are visible.
- The official AIgnite sticker in the navbar on every route, and a UI that stays usable on a small phone.

## What I learned

- **Uncertainty is a product feature.** Showing "not sure" and explaining why is more useful than forcing a guess.
- **Pre-registered protocols prevent bad deployments.** When our v4 experiment failed the pre-registered coverage threshold, the locked rule stopped us from shipping an over-cautious model.
- **The split is part of the model.** A number is meaningful when the evaluation is leakage-free and includes external data.
- **Write down what you do not know.** Stating limitations openly is better than presenting unverified numbers.
- **Agricultural safety is a design constraint.** No pesticide doses, preliminary screening, explicit acknowledgment that information is not reviewed by an agronomist, and a clear hand-off to official extension channels.

## What's next

- Consented Bangladeshi field-photo collection across districts, seasons, and smartphone models with agronomist labelling, followed by retraining (roadmap P1–P3). No speculative accuracy promises.
- More crops, starting with the datasets already catalogued in the repo.
- Optional offline repeat use after the live build is stable.
- Keep the accuracy page updated with future measured evaluations.

## Built with

React · Vite · Tailwind CSS · JavaScript · ONNX Runtime Web (WASM) · PyTorch · torchvision · scikit-learn · Python · MobileNetV3-Large · Kaggle (free GPU) · Cloudflare Pages · Vercel · Google Fonts · pre-generated Bangla audio (edge-tts bn-BD-NabanitaNeural AI voice) · GitHub

**Links**

- Live app: https://agroleaf-ai.pages.dev
- GitHub: https://github.com/masumcit44/AgroLeaf-AI
- Demo video: `[[YouTube URL, English]]`
- Model card: `model/MODEL_CARD.md` · Data card: `data/DATA_CARD.md`
