# AgroLeaf AI — 5-slide deck outline

Rules: **maximum 5 slides**, 16:9, short on-slide text, official AIgnite sticker on slide 1 (not required, but it signals compliance). Put sources and detail in the speaker notes, not on the slide. Replace every `[[...]]` before presenting.

---

## Slide 1 — Problem

**On-slide text**

> # The wrong spray starts with a guess.
>
> A farmer sees a spotted rice leaf.
>
> The wrong advice means the wrong spray:
> wasted money, and a crop still at risk.
>
> Rural internet gap: 43.6% vs 75.7% `[[add source]]`
>
> `[official AIgnite sticker — top-right corner]`

**Visual:** one full-bleed photo of a farmer's hand holding a spotted rice leaf next to a phone. No stock photo of a smiling model.

**Speaker notes (about 30 s):**
- "A farmer sees spots on a leaf. They ask whoever is nearby — often the pesticide seller. If the problem is not what the seller thought, the spray is wrong, the money is gone, and the crop is still at risk."
- "This is a rice-first, Bangla-first problem. Many users have a shared phone, a weak connection and limited reading comfort."
- "The connectivity figure comes from the buildathon notes; add the exact source before presenting. Do not add review percentages or any other unverified number."

---

## Slide 2 — Solution

**On-slide text**

> # One photo. One honest answer.
>
> `[screenshot 1]` Take or upload a rice leaf photo
>
> `[screenshot 2]` Result in Bangla + ▶ audio
>
> `[screenshot 3]` "নিশ্চিত নই / not sure" + 16123
>
> **"Tells you what's wrong in Bangla, and tells you when it doesn't know."**

**Visual:** three phone screenshots in a row: upload/preview, a result card with the Bangla name, confidence in words and the audio player, and the "not sure" screen with the top-2 possibilities and retake tips. Keep the navbar sticker visible in every screenshot.

**Speaker notes (about 30 s):**
- "The flow is deliberately short: photo, check, result."
- "The result is in Bangla, with English available, and can be read aloud. Audio starts only when the user taps play; it is labelled as AI voice."
- "When the model is not confident, it says 'not sure' and shows the two closest possibilities, how to retake the photo, and the 16123 hand-off. It does not force an answer."
- "This is preliminary screening, not a diagnosis."

---

## Slide 3 — How it works

**On-slide text**

> # On the phone. Not in the cloud.
>
> Photo → MobileNetV3 (ONNX, WASM) → calibrated threshold → Bangla card + audio
>
> Training: RiceLeafDiseaseBD v3 · CC BY 4.0 · DOI 10.17632/86s4jzj2m4.3
>
> External tests: RiceLeafDisease-BD5 (Savar) · RiceLeafBD (Sylhet–Dhaka)
>
> **External macro-F1: `[[TBD after training]]` · Coverage: `[[TBD after training]]`**

**Visual:** a simple four-box pipeline with a phone outline around the first three boxes and a crossed-out cloud. A small "grouped split, no leakage" badge. Dataset logos/DOIs in small type at the bottom.

**Speaker notes (about 45 s):**
- "The model is MobileNetV3-Large, fine-tuned in PyTorch and exported to float32 ONNX. It runs in the browser with ONNX Runtime Web's CPU/WASM build. The photo never leaves the phone."
- "The confidence is calibrated on validation data with temperature scaling, and the threshold is chosen there to target a precision level. There is no hard-coded 0.60."
- "The split is grouped by perceptual hash, so burst photos cannot leak between train and test. I checked that zero groups are shared."
- "The headline number is external, not internal: photos from other districts. Leaf Smut has no external test, and the accuracy page says so."
- "Fill in the two numbers only from `metrics-v1.json`, with the sample sizes in the speaker notes. If training is not finished, say 'evaluation in progress' — do not estimate."

---

## Slide 4 — About me

**On-slide text**

> # About me
>
> `[[name, university, skills]]`
>
> Solo builder for AIgnite 2026.
>
> The research began in a team idea competition.
> This web app is my own individual build.
>
> Why this problem: `[[one personal line]]`

**Visual:** a clean portrait or a simple avatar, your university name, and three skill tags. No busy background.

**Speaker notes (about 30 s):**
- "I am `[[name]]`, a `[[year]]` student at `[[university]]`. My skills are `[[skills]]`."
- "Be transparent: the idea and early research began in a team idea competition. The web app, the ML pipeline, the design and the deployment are my own individual work for AIgnite. The team research is credited in the repo."
- "I built this because I want a farmer to get a useful second opinion without an account, without a upload and without a sales pitch."
- "Do not claim a partnership with BRRI, DAE, AIS or any other organisation."

---

## Slide 5 — Impact, safety and next steps

**On-slide text**

> # Useful, and honest about its limits.
>
> ✅ No AI-written pesticide doses
> ✅ 16123 hand-off — charges may apply
> ✅ Photo never leaves the phone
> ✅ "Not sure" when the model does not know
>
> **Next:** more crops · officer review · field testing

**Visual:** four short check rows, a small phone-with-lock icon, and a simple roadmap arrow with three stops. Keep the sticker visible in the corner or in the app screenshot.

**Speaker notes (about 30 s):**
- "Safety is a design constraint, not a disclaimer. The app never generates a dose. Official guidance is quoted verbatim with a link and a 'confirm with your officer / 16123' note."
- "Privacy is structural: inference is on-device, with no accounts and no analytics that capture images."
- "The limits are visible in the product: one district and one season in training, Leaf Smut has no external test, and sheath symptoms may be missed on a leaf-only photo."
- "Next: more districts and phones, a proper negative-example check, more crops, and a field review with an agriculture officer."
- "Close with the ask: try the live app, open the accuracy page, and tell me what a farmer would still find confusing."

---

## Build notes

- **Do not add a sixth slide.** Put sources, extra screenshots and caveats in the speaker notes or the appendix of the repo, not in the deck.
- The live demo is the pitch: sample photo → result + Bangla voice → blurry/non-rice photo → "not sure" → accuracy page → privacy. Rehearse the same order as the video script.
- Every screenshot must show the official sticker in the navbar.
- Replace all `[[...]]` placeholders before the Final Round. Never put an unmeasured number on a slide.
