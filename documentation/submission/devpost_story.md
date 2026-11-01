# AgroLeaf AI — Devpost story (draft)

> Paste this into the Devpost project page. Replace every `[[...]]` before submitting. Do not add a metric that is not in `run1/metrics-v1.json`.

## Inspiration

I am a student in Bangladesh, and I kept hearing the same story: a farmer sees spots on a rice leaf, asks whoever is selling pesticide, and sprays whatever is recommended. If the problem is not what the seller thought, the money is wasted and the crop can still be lost.

I wanted to build something a farmer can open on an ordinary phone, in Bangla, without an account and without sending a photo to a server. The idea and the early research began in a team idea competition; this **web app is my own individual build for AIgnite 2026**. The research is credited in the repo, and the code, design and deployment here are mine.

## What it does

AgroLeaf AI is a mobile-first web app for a **preliminary screening** of a rice leaf photo. It is not a diagnosis.

1. The farmer takes or uploads a photo of a rice leaf.
2. A small image model runs **inside the browser**. The photo is never uploaded.
3. The app shows one of six classes — Healthy, Blast, Brown Spot, Leaf Smut, Rice Tungro or Sheath Blight — **or "নিশ্চিত নই / not sure"** when the calibrated confidence is below a threshold chosen on validation data.
4. It shows a short Bangla and English explanation, practical next steps, and a play/pause button for pre-recorded Bangla audio.
5. A `tel:16123` button offers a hand-off to the official service. The app does not claim the call is free; charges may apply.
6. A **"কতটা নির্ভুল? / How accurate is it?"** page publishes the measured results, sample sizes, dataset credits and known limits. Nothing on that page is estimated.

The official **"Built For Ostad Presents YUNet AIgnite Buildathon 2026"** sticker is visible in the navbar on every page and in every state, as required by the competition rules. It is not hidden in a footer or a menu.

## How I built it

The frontend is **React + Vite + Tailwind CSS in JavaScript**, Bangla-first, with a Bangla/English toggle. The model is **MobileNetV3-Large**, fine-tuned in PyTorch, exported to **float32 ONNX**, and loaded once in the browser with `onnxruntime-web/wasm`. No backend, no database, no accounts and no analytics: all text and audio are static assets.

The ML pipeline is reproducible and honest about data:
- a read-only audit finds corrupt files, exact duplicates and near-duplicate groups;
- splits are grouped by perceptual hash so burst photos cannot leak between train and test;
- training uses class weighting and validation macro-F1 early stopping;
- temperature scaling and the "not sure" threshold are fitted on validation, not hard-coded;
- evaluation covers the internal test, external-district sets, and unseen diseases that should be rejected;
- PyTorch and ONNX outputs are checked for numerical parity before export.

The app is deployed on **Cloudflare Pages**, with a **Vercel** mirror. Everything uses free tools. There is no paid API and no credit card.

## Challenges

- **Leakage.** Field photos come in bursts, so near-duplicates would inflate a naive score. I grouped images before splitting and verified zero shared groups.
- **Domain shift.** Training images come from one district and one season. Publishing external-district results, including the weak parts, matters more than a high internal number.
- **Honest abstention.** A confident wrong answer is worse than "not sure". The threshold comes from validation and targets a precision level; coverage is reported next to it.
- **Browser limits.** The default ONNX Runtime Web build pulled a WASM file larger than the host's per-file limit, so I used the CPU-only `/wasm` entry and set one thread for predictable behaviour.
- **Bangla voice.** The clips are pre-generated and labelled as AI voice. A human recording is the zero-risk fallback if the service terms are unclear.
- **Leaf Smut.** No external dataset contains it, so I say so instead of hiding the gap.

## Accomplishments

- A working, mobile-first app that runs inference on the phone and never uploads the photo.
- A calibrated "not sure" path with the two possible classes, retake tips and the 16123 hand-off.
- A published accuracy page with external-district results, coverage, sample sizes and limitations: accuracy `[[TBD after training]]`, external macro-F1 `[[TBD after training]]`, coverage at threshold `[[TBD after training]]`.
- A leakage-safe, one-command data pipeline and a Kaggle notebook that runs training end to end.
- A model card, data card and dataset credits with DOIs, so the limits and the licence trail are visible.
- The official AIgnite sticker in the navbar on every route, and a UI that stays usable on a small phone.

## What I learned

- **Uncertainty is a product feature.** Showing "not sure" and explaining why is more useful than forcing an answer.
- **The split is part of the model.** A number is only meaningful if the evaluation is leakage-free and external.
- **Write down what you do not know.** `[[TBD]]` in the docs is better than a made-up number in a pitch.
- **Agricultural safety is a design constraint.** No pesticide doses, only verified text, and a clear hand-off to an official channel.

## What's next

- More districts, seasons and low-end phones in the test set; a field trial with an agriculture officer.
- A proper "not a rice leaf" check trained on negative examples, instead of relying only on the confidence threshold.
- More crops, starting with the datasets already listed in the repo.
- Optional offline repeat use after the live build is stable.
- Keep the accuracy page in sync with every new run.

## Built with

React · Vite · Tailwind CSS · JavaScript · ONNX Runtime Web (WASM) · PyTorch · torchvision · scikit-learn · Python · MobileNetV3 · Kaggle (free GPU) · Cloudflare Pages · Vercel · Google Fonts · pre-generated Bangla audio (Azure neural voice, with a human-recording fallback) · GitHub

**Links**

- Live app: `[[live URL]]`
- GitHub: https://github.com/masumcit44/AgroLeaf-AI
- Demo video: `[[YouTube URL, English]]`
- Model card: `model/MODEL_CARD.md` · Data card: `data/DATA_CARD.md`
