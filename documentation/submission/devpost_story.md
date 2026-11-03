# AgroLeaf AI — Devpost story

> Paste this into the Devpost project page. Replace every `[[...]]` before submitting.
> Every number here is copied from `frontend/public/data/metrics-v10.json` (live model v10, 3 Nov 2026) and `model/experiments/run10_v10/`. Do not add one that is not there.

## Inspiration

I am a student in Bangladesh, and I kept hearing the same story: a farmer sees spots on a rice leaf, asks whoever is selling pesticide, and sprays whatever is recommended. If the problem is not what the seller thought, the money is wasted and the crop can still be lost.

I wanted to build something a farmer can open on an ordinary phone, in Bangla, without an account and without sending a photo to a server. The idea and the early research began in a team idea competition; this **web app is my own individual build for AIgnite 2026**. The research is credited in the repo; the code, models, design and deployment here are mine. `[[Confirm your teammates agreed to this solo entry before submitting.]]`

## What it does

AgroLeaf AI is a mobile-first web app for a **preliminary screening** of a rice leaf photo. It is not a diagnosis and does not replace an agriculture officer.

1. The farmer takes or uploads a photo of a rice leaf.
2. An image model runs **inside the browser**. The photo is never uploaded.
3. The app answers with one of: **Healthy, Blast, Brown Spot, Rice Tungro, Sheath Blight**. Otherwise it says **"নিশ্চিত নই / not sure"**, and explains why:
   - "this does not look like a rice leaf";
   - "a rice problem this app does not cover" (e.g. bacterial blight, hispa);
   - "may be healthy, but not sure enough" (Healthy is only named at ≥ 0.90 confidence);
   - plain low confidence.

   Leaf smut is never named: there is too little outside data to trust it.
4. Bangla and English explanation, practical next steps, and **Bangla voice read-out for every result screen**, with each "not sure" reason having its own clip. The voice is pre-generated and labelled "AI-generated voice".
5. **"Check before you buy a pesticide":** a short card on disease results. Buy from a registered dealer and keep the receipt; check the Bangla label and registration number; refuse open or expired packs; report a suspected fake (the Pesticides Act 2018 lets buyers ask for a test). The app never names a pesticide or a dose.
6. A `tel:16123` button to the national agricultural helpline, and a share button.
7. A **"কতটা নির্ভুল? / How accurate is it?"** page with measured results, sample sizes, dataset credits and known limits. Nothing on it is estimated.

The official **"Built For Ostad Presents YUNet AIgnite Buildathon 2026"** sticker is in the navbar on every page and in every state.

## How I built it

- **Frontend:** React + Vite + Tailwind CSS, Bangla-first with an English toggle. No backend, no database, no accounts, no analytics. Hosted on **Cloudflare Pages** (free plan).
- **Model:** **EfficientNet-B0**, 8 outputs, including "not a rice leaf" and "other rice problem"; input 320 × 320; 15.3 MB float32 ONNX, run with `onnxruntime-web` (WASM).
  - Trained on free Kaggle GPUs with Bangladeshi field photos (Gazipur, Savar, Sirajganj-Pabna, Dhan-Shomadhan, and one half of the DIU dataset), Indian and Taiwanese rice photos, and non-rice photos.
  - Temperature (0.66) and the answer threshold (0.30) are fitted on validation data only.
- **Same preprocessing in browser and training:** EXIF-upright, resize 366, centre-crop 320, ImageNet normalisation. A decode-path test checks that the browser's numbers match Python's on 25 fixture images.
- **Evaluation discipline:**
  - near-duplicate photos are grouped before splitting;
  - outside test sets are checked by perceptual hash so no test photo or near-copy is in training;
  - every release rule is written down **before** the test set is read, and each test set is read once.
- **Testing:**
  - 93+ unit tests;
  - live end-to-end checks on the real site that upload 20 photos, check that the right voice clip plays on every result screen, and check the pesticide card.

## Challenges

- **Photos from new districts.** This is the hardest problem, and the accuracy page says so.
  - On **Sylhet-Dhaka** (1,446 photos, a district never used in training), the app answers 74.8% of the time, and **56.4% of those answers are right** (macro-F1 0.570).
  - Brown spot and tungro are found only about a third of the time there.
- **Many model experiments failed, and I did not ship them.**
  - Mixup / CutMix, domain-adversarial training, a larger ConvNeXt model, model blends and test-time augmentation all ranked photos better in raw scores.
  - But none gave more right answers at the same answer rate, so none was released.
- **What helped was real field data.** Adding one half of the DIU Bangladeshi field dataset (v10) cut wrong answers on the other half from 20.9% to 7.6%, and gave **fewer wrong answers than the previous model on all three independent test sets**.
- **An honest release decision.** v10 did not pass two of my own pre-written release conditions:
  - Aman macro-F1 −2.25 points, against a −2 point limit;
  - a tie on Sylhet.

  I released it because it makes fewer wrong answers everywhere, and the accuracy page says this in plain words.
- **Rice problems the app does not cover** are still sometimes named as a covered disease (on Sylhet, only 35.6% are correctly kept unnamed).
- **Disease text** is preliminary and has not been reviewed by an agronomist; the app says so.

## Accomplishments

- A working phone app that runs the AI on the phone and never uploads the photo.
- Bangla voice for every result, a calibrated "not sure" with a reason, and 16123 referral.
- Measured results on the accuracy page (live model v10):

  | Test set | Photos | Accuracy | Macro-F1 | Answered | Right among answered |
  |---|---|---|---|---|---|
  | Gazipur internal test | 1,467 | 86.7% | 84.4% | 88.6% | 89.1% |
  | Aman 2025 (no near-copies of other datasets) | 422 | 86.2% | 89.6% | 93.7% | 91.3% |
  | DIU half B (other half used in training) | 1,375 | 80.1% | 78.4% | 84.1% | 88.8% |
  | Sylhet-Dhaka (district never seen) | 1,446 | 44.4% | 57.0% | 74.8% | 56.4% |

- Release records, model cards and dataset credits with DOIs in the repo.

## What I learned

- **Uncertainty is a feature.** "Not sure, and here is why" helps more than a confident wrong answer.
- **Write the rule before reading the test.** It stopped me from shipping models that only looked better.
- **Data beats tricks.** A small amount of new Bangladeshi field data did more than every training trick I tried.
- **Agricultural safety is a design rule.** No pesticide names or doses; hand-off to official channels.

## What's next

- A larger, de-duplicated set of Bangladeshi field photos (being collected and audited now), with a new frozen test set before retraining.
- Better handling of messy photos (leaf isolation), tested against the current pipeline before release.
- Offline install (PWA), clearer reliability levels, saved history on the phone, and weather awareness from official BAMIS crop-weather calendars.
- Agronomist review of all disease text.

## Built with

React · Vite · Tailwind CSS · JavaScript · ONNX Runtime Web (WASM) · PyTorch · timm (EfficientNet-B0) · Python · Kaggle (free GPU) · Cloudflare Pages · Google Fonts · pre-generated Bangla audio (edge-tts, bn-BD-NabanitaNeural AI voice) · GitHub

**Links**

- Live app: https://agroleaf-ai.pages.dev
- GitHub: https://github.com/masumcit44/AgroLeaf-AI
- Demo video: `[[YouTube URL, English — optional]]`
