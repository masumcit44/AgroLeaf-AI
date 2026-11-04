# AgroLeaf AI — Devpost Submission Checklist & Copy

Deadline: **5 Nov 2026, 11:59 PM Bangladesh time**, on https://yunet-aignite26.devpost.com/ (only channel).

| Requirement (official) | Status |
|---|---|
| Live web app, public | ✅ https://agroleaf-ai.pages.dev |
| Official "Built For … AIgnite" sticker near the top | ✅ in the header on every page |
| Deck, max 5 slides (problem, solution, how it works, introduction, other info) | ✅ `documentation/submission/AgroLeaf_AI_deck_final.pptx` / `.pdf` (5 slides) — owner: check the introduction slide text/photo |
| Demo video (optional, English) | ⬜ not made |
| GitHub link (optional) | ✅ https://github.com/masumcit44/AgroLeaf-AI |
| Solo, one project | owner |
| Devpost form submitted | ⬜ **owner must submit** (Claude has no Devpost access) |

## Copy-ready text

**Title:** AgroLeaf AI — এগ্রোলিফ এআই

**Tagline:** Photograph a rice leaf, get an honest answer in Bangla — and hear it in Bengali.

**What it does**
AgroLeaf AI helps Bangladeshi rice farmers check a sick rice leaf from their phone. The farmer takes
a photo; an AI model running inside the browser suggests the likely disease (blast, brown spot,
sheath blight, tungro, or healthy) or honestly says "not sure". The result is explained in simple
Bangla, read aloud in a Bangladeshi Bengali voice, and followed by a short this-week plan and a
one-tap call to the 16123 agriculture helpline. A voice assistant answers common rice questions
in Bangla or Banglish, with every fixed answer pre-recorded in Bengali. It works offline after the
first visit, and the photo never leaves the phone.

**Problem**
Rice diseases spread fast and farmers often cannot reach an agriculture officer in time. Many
advice apps are in English, need a good connection, or confidently guess. Wrong guesses can lead
to the wrong pesticide being bought and used.

**Solution / how it works**
1. Photo (camera or gallery), optional crop to the diseased part.
2. EfficientNet-B0 (v10, ONNX, WebAssembly) runs on the phone; calibrated thresholds decide
   "likely disease" vs "not sure" vs "not a rice leaf".
3. Bangla explanation from a curated knowledge base (BAMIS/DAE/BRRI), recorded Bengali voice,
   a reliability level measured in testing, a this-week plan, reminders, history and weather risk.
4. Safety: the app never names a pesticide or gives a dose; chemical decisions go to the Upazila
   officer or 16123.

**AI & technical**
On-device image classification (8 outputs incl. "not a rice leaf" / "other rice problem"),
temperature calibration and abstention; Bengali voice via pre-generated bn-BD neural TTS (122
answers); React 19 + Vite + Tailwind PWA on Cloudflare Pages (Functions + D1 for future
community features); 509 automated tests. Model accuracy and limitations are shown openly on the
in-app Accuracy page.

**Who it's for:** smallholder rice farmers in Bangladesh, and extension workers helping them.

**What's next:** agronomist review of the guidance, more crops, field testing with farmers.

**Links:** Live https://agroleaf-ai.pages.dev · Code https://github.com/masumcit44/AgroLeaf-AI ·
Deck: upload `AgroLeaf_AI_deck_final.pdf`.
Screenshots: `documentation/screenshots/release/01_home.png`, `02_result_blast.png`,
`04_voice_assistant.png`.
