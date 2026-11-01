# Agro AI: multi-AI deep research prompt package

**Prepared:** 1 Nov 2026 · **Submission deadline it must serve:** 5 Nov 2026, 11:59 PM Bangladesh time.

---

## A. Project understanding (in simple words)
Agro AI (working name AgroLeaf AI) is a **public web app** for Bangladeshi rice farmers:
1. Upload or take a photo of a rice leaf.
2. A trained image model names one of 6 classes, **or says "not sure"**.
3. The farmer sees the disease name in Bangla and English, a simple Bangla explanation and the next steps.
4. The farmer can listen to it in Bangla with play/pause.

It is being built **by one student in about 4 days** for the Ostad YUNet AIgnite Buildathon. Judging:
- Problem: 12
- Innovation: 12
- AI/Technical: 10
- **UX & Product Readiness: 16** (the largest share)

So "reliable, simple and finished" beats "advanced".

**What we already know (checked online on 1 Nov 2026; research AIs should re-verify):**
- The main dataset is **RiceLeafDiseaseBD v3** (Mendeley Data, DOI 10.17632/86s4jzj2m4.3, published 1 Sep 2026, CC BY 4.0).
  - 9,769 smartphone images at 1024×1024, from Gazipur, Summer 2025.
  - 6 classes: Healthy, Blast, Brown Spot, Leaf Smut, Rice Tungro, Sheath Blight.
  - Class folders + YOLO boxes.
  - Per-class counts are not published.
- Three more Bangladeshi field datasets from other districts exist and can be used as an external test:
  - RiceLeafDisease-BD5 (Savar, 2,545 images)
  - RiceLeafBD (Sylhet–Dhaka, 1,555 images)
  - RiceyLeafDisease (Sirajganj–Pabna, 1,701 originals)
- Image-based rice diagnosis apps already exist in Bangladesh: BRRI Rice Solution, Dr. Chashi, BAMIS, Plantix.
- Government guidance in Bangla (BAMIS/DAE) and the **16123** Krishi Call Centre exist.
- Azure Speech lists bn-BD neural voices (Nabanita, Pradeep). Browser Bangla TTS on Android is **not guaranteed**.

## B. Research strategy
**Why these 9 prompts:** each covers one decision that could sink the build if it is wrong. Sorted by risk:
1. **R4 (model and data)** — the core AI and the main innovation (calibrated "not sure"). Highest risk.
2. **R5 (Bangla voice)** — a headline feature that can silently fail on phones.
3. **R6 (hosting)** — free tiers, cold starts and model-size limits decide whether the demo works for judges.
4. **R1 / R2 / R7 (frontend, backend, whole stack)** — includes the key open question: **run the model in the browser, or on a server?**
5. **R3 (database)** — very likely "no database for the MVP". Low priority.
6. **R8 (competitors)** — we already have team research. Use it to check that claim is defensible.
7. **R9** — compares all the answers and decides, by evidence, not by votes.

**How the findings will be used:**
- Every prompt ends with the same **Decision Summary table**, so the outputs can be pasted side by side into the template (section E) and compared with R9 and the framework (section F).

**Time budget (important):**
- Deep-research runs take time, and the build must start by 2 Nov.
- Run the critical prompts **today**.
- **Lock decisions by 2 Nov at noon.** Anything not decided by then uses the default in the workspace docs (`documentation/system_architecture.md`).

---

## C. The nine prompts
> Copy one whole block (from `=== BEGIN` to `=== END`) into ChatGPT Deep Research, Gemini Deep Research, DeepSeek or another tool. Each block is self-contained.

---

### R1 — Frontend technology and farmer-centred UI/UX
```
=== BEGIN R1 ===
ROLE: You are an independent senior frontend engineer and UX researcher specialising in low-literacy, mobile-first products in South Asia. Challenge my assumptions where evidence disagrees.

PROJECT CONTEXT (self-contained):
- Product: "Agro AI" (AgroLeaf AI), a public web app for Bangladeshi rice farmers. Flow: upload/take a rice-leaf photo → AI classifies into 6 classes (Healthy, Blast, Brown Spot, Leaf Smut, Tungro, Sheath Blight) or answers "not sure" → result card in Bangla + English with simple steps → Bangla audio with play/pause → one-tap call to the 16123 Krishi Call Centre.
- Built by ONE undergraduate in ~4 days (deadline 5 Nov 2026) for a buildathon scored on Problem 12, Innovation 12, AI/Tech 10, UX & Product Readiness 16. A required sticker must be visible in the navbar.
- Users: shared and low-end Android phones (assume 2–3 GB RAM, Chrome), weak 3G/4G in fields, limited reading comfort, Bangla first.
- Open architecture question that affects the frontend: the image model (~5–20 MB ONNX) may run IN THE BROWSER (onnxruntime-web/WASM) or on a server.
- Out of scope: accounts, chatbot, weather, marketplace.

RESEARCH QUESTIONS:
1. Which frontend option fits best: plain HTML/JS + Tailwind, React (Vite), Next.js, Vue, Svelte, or others? Judge on developer speed for one person, bundle size, performance on low-end Android, and ease of running onnxruntime-web and audio. Do not pick by popularity.
2. PWA vs a normal responsive site: what do service workers or offline caching really add here (caching a 5–20 MB model and MP3s)? What does it cost in a 4-day build?
3. Evidence-based UI patterns for low-literacy users: icons with text, voice-first, large touch targets (cite WCAG 2.2 and research), few steps, and showing confidence in words instead of percentages. Include research on agricultural apps or audio for farmers where available.
4. Bangla typography: font choice (e.g. Noto Sans Bengali, Hind Siliguri), rendering issues, line height, font size for readability, and loading cost.
5. Image capture and upload UX: <input capture>, preview, client-side resize/compression, blur/darkness checks, file-type and size validation, error messages.
6. How to present the result and "not sure" states so users don't over-trust them. Include the design of the audio player.
7. Performance budget: first load on slow 3G, lazy-loading the model, Lighthouse targets.

CHALLENGE: Tell me if the "not sure" screen or the Bangla audio could confuse users, and how to test that cheaply (5-person hallway test).

RULES: Prefer official docs (MDN, web.dev, WCAG), peer-reviewed HCI/ICTD research, and reputable benchmarks. Give direct URLs, dates and DOIs. Never invent statistics or citations. Label each statement as [Evidence] or [Recommendation]. If something cannot be verified, say so.

OUTPUT (use exactly these headings):
1 Executive Summary · 2 Project-Specific Requirements · 3 Research Methodology · 4 Technology/Approach Comparison (table: option | advantages | disadvantages | performance | dev complexity | deploy complexity | cost | suitability 1–5 | sources) · 5 Evidence-Based Findings · 6 Performance and Cost Analysis · 7 Advantages and Disadvantages · 8 Risks and Technical Limitations · 9 Bangladesh-Specific Considerations · 10 Recommended Approach (include a page list + user journey + mini design system: colours, font, sizes) · 11 Alternative Approach · 12 Implementation Roadmap (fit to 4 days) · 13 Source References and Direct Links · 14 Uncertainties and Unverified Information.
END WITH this table:
| Decision | Recommended choice | Confidence (H/M/L) | Key evidence (URL) | Main risk | Fallback |
=== END R1 ===
```

---

### R2 — Backend architecture and API design
```
=== BEGIN R2 ===
ROLE: You are an independent senior backend/ML-serving engineer. Your first job is to decide whether this MVP needs a backend at all.

PROJECT CONTEXT (self-contained):
- Product: "Agro AI" (AgroLeaf AI), a public web app for Bangladeshi rice farmers: rice-leaf photo → 6-class CNN prediction (Healthy, Blast, Brown Spot, Leaf Smut, Tungro, Sheath Blight) or "not sure" (calibrated confidence threshold) → Bangla/English disease card (fixed text from a JSON file) → pre-recorded Bangla audio.
- Model: a fine-tuned MobileNetV3-Large or EfficientNet-B0, exported to ONNX, about 5–20 MB, 224×224 input.
- Built by ONE student in ~4 days (deadline 5 Nov 2026). Judges will test the live URL at unpredictable times. A cold start or a crash is very costly. Budget: free tiers only.
- Privacy goal: ideally photos are not stored.

RESEARCH QUESTIONS:
1. Compare (a) NO backend: inference in the browser with onnxruntime-web, (b) FastAPI + onnxruntime on CPU, (c) Gradio/Hugging Face Spaces, (d) Node/Express + Python worker, (e) Django, (f) serverless functions. Criteria: reliability during judging, latency on Bangladeshi mobile networks, cold starts, effort for one person, security, privacy, future growth.
2. If a backend is used: endpoint design (POST /predict), multipart limits, MIME/magic-byte checks, Pillow decode safety (decompression bombs), rate limiting, CORS, the error codes and JSON response schema (include model_version and calibrated probabilities), and logging without storing images.
3. Concurrency: expected load from judges (tens of users, not thousands). CPU inference time for MobileNetV3/EfficientNet-B0 with onnxruntime. Give benchmarks with sources, or say they are unavailable.
4. How to keep the browser and the server sharing exactly the same preprocessing and class mapping (single source of truth files).
5. Upload safety: OWASP file-upload guidance, applied minimally.

CHALLENGE: If browser-only inference is clearly better for this MVP, say so and explain what would later force a move to a backend (accounts, history, large models).

RULES: Official docs (FastAPI, ONNX Runtime, OWASP, Hugging Face), real benchmarks, URLs, dates. No invented numbers. Label [Evidence] vs [Recommendation].

OUTPUT (exact headings): 1 Executive Summary · 2 Project-Specific Requirements · 3 Research Methodology · 4 Technology/Approach Comparison (table: option | advantages | disadvantages | performance | dev complexity | deploy complexity | cost | suitability 1–5 | sources) · 5 Evidence-Based Findings · 6 Performance and Cost Analysis · 7 Advantages and Disadvantages · 8 Risks and Technical Limitations · 9 Bangladesh-Specific Considerations · 10 Recommended Approach (include the API contract if a backend is recommended) · 11 Alternative Approach · 12 Implementation Roadmap (4 days) · 13 Source References and Direct Links · 14 Uncertainties and Unverified Information.
END WITH: | Decision | Recommended choice | Confidence (H/M/L) | Key evidence (URL) | Main risk | Fallback |
=== END R2 ===
```

---

### R3 — Database and data management
```
=== BEGIN R3 ===
ROLE: You are an independent data architect. Start from the question "Is a database needed for the first MVP at all?"

PROJECT CONTEXT (self-contained):
- Product: "Agro AI" (AgroLeaf AI), a web app: rice-leaf photo → 6-class prediction or "not sure" → fixed Bangla/English disease card → Bangla audio. About 7 cards in total (6 classes + "not sure"), each about 1 KB of text, plus 7 MP3 files.
- No user accounts or history in the MVP. Photos should not be stored (privacy). One developer, ~4 days, deadline 5 Nov 2026, free tiers only.
- Future (NOT now): accounts, prediction history, more crops and diseases, expert feedback, model version tracking.

RESEARCH QUESTIONS:
1. Compare: static versioned JSON in the repo; SQLite; Supabase (Postgres); Firebase/Firestore; PostgreSQL (Neon, Render); MongoDB Atlas. Criteria: need now, setup time, cost, free-tier limits (current, with URLs), Bangla UTF-8 handling, backups, security, and the effort to migrate later.
2. A schema for the disease knowledge base that works as JSON now and maps cleanly to SQL later: crop, class_id, names, symptoms, prevention, official_guidance (verbatim + source URL + retrieved date), verification_status, audio_file, version.
3. What, if anything, should be logged in the MVP without personal data (anonymous counts? model version?), and whether that needs a database or just an analytics tool.
4. Data-protection considerations for farmer photos and phone numbers under Bangladeshi law (check the current status of Bangladesh's personal data protection law, with sources), plus general good practice.

CHALLENGE: If adding a database adds risk without adding judging value, recommend against it.

RULES: Current pricing and limits from official pages, with URLs and dates. No invented numbers. Label [Evidence] vs [Recommendation].

OUTPUT (exact headings): 1 Executive Summary · 2 Project-Specific Requirements · 3 Research Methodology · 4 Technology/Approach Comparison (table: option | advantages | disadvantages | performance | dev complexity | deploy complexity | cost | suitability 1–5 | sources) · 5 Evidence-Based Findings · 6 Performance and Cost Analysis · 7 Advantages and Disadvantages · 8 Risks and Technical Limitations · 9 Bangladesh-Specific Considerations · 10 Recommended Approach (include the knowledge-base schema) · 11 Alternative Approach · 12 Implementation Roadmap · 13 Source References and Direct Links · 14 Uncertainties and Unverified Information.
END WITH: | Decision | Recommended choice | Confidence (H/M/L) | Key evidence (URL) | Main risk | Fallback |
=== END R3 ===
```

---

### R4 — ML/DL model research and dataset strategy (most important)
```
=== BEGIN R4 ===
ROLE: You are an independent senior computer-vision researcher with plant-disease experience. Be sceptical of high benchmark accuracies, and prioritise real-field generalisation and honest uncertainty.

PROJECT CONTEXT (self-contained):
- Product: "Agro AI" (AgroLeaf AI), a web app for Bangladeshi rice farmers. A single rice-leaf photo → predict one of 6 classes, or say "not sure" when confidence is low or the image is unsuitable or unsupported (other plants, blur, an unseen disease). The model will probably run in the browser (ONNX, onnxruntime-web WASM), so model size and CPU latency matter (target: under ~20 MB, under ~1 s on a mid/low Android phone; challenge these targets if unrealistic).
- Training data (verified 1 Nov 2026; please re-check): RiceLeafDiseaseBD v3, Mendeley Data, DOI 10.17632/86s4jzj2m4.3, CC BY 4.0. 9,769 smartphone images at 1024×1024, Gazipur, Bangladesh, Summer 2025, two phones (CMF Phone 2 Pro, Pixel 5). Classes: Healthy, Blast, Brown Spot, Leaf Smut, Rice Tungro, Sheath Blight. Class folders + 21,460 YOLO boxes. Per-class counts not published.
- Candidate external test sets (other districts): RiceLeafDisease-BD5 (DOI 10.17632/sjkptpgv79.2; Savar; Blast 339, Narrow Brown Spot 329, Sheath Blight 454, Tungro 500, Normal 923); RiceLeafBD (DOI 10.17632/kx9rx8p2mz.1; Sylhet+Dhaka; Healthy 252, Bacterial Leaf Blight 417, Brown Spot 356, Tungro 530); RiceyLeafDisease (DOI 10.17632/t46kkgh2yw.1; Sirajganj+Pabna; 1,701 originals + 5,188 augmented).
- Constraints: one developer, free Kaggle/Colab GPU, about 1 day for data preparation and training, deadline 5 Nov 2026.

RESEARCH QUESTIONS:
1. Architecture comparison for this exact setting (about 10k field images, 6 classes, browser CPU inference): custom CNN, MobileNetV2/V3 (Small/Large), EfficientNet-B0/Lite0/V2-S, ResNet-18/50, DenseNet-121, ConvNeXt-Tiny/Atto, EfficientFormer/MobileViT, others. Report params, ONNX size, CPU/WASM latency (with sources), and published results on rice/plant field datasets, separating lab results (PlantVillage) from field results.
2. Published rice-leaf-disease results on Bangladeshi datasets (including BRRI-based work such as Rahman et al. 2020, Biosystems Engineering, DOI 10.1016/j.biosystemseng.2020.03.020, and any paper using RiceLeafDiseaseBD). Give the reported metrics AND whether the splits could leak.
3. Data strategy: duplicate and near-duplicate detection (perceptual hashing thresholds), group-aware stratified splitting, handling burst photos, class imbalance (weights vs sampling vs focal loss), and augmentations that simulate cheap phones and field conditions. Should the YOLO boxes be used (crop-to-lesion training, or detection instead of classification)? Is that worth it in 1 day?
4. Label issues: Brown Spot vs Narrow Brown Spot; Sheath Blight being a sheath symptom; multiple diseases in one image; Leaf Smut being rare in other datasets. Advise on class mapping for external testing.
5. Uncertainty: temperature scaling, threshold selection for a target precision (selective classification / coverage–risk curves), and out-of-distribution detection options (max softmax, energy score, Mahalanobis, an "other" class trained on non-rice images). Which are realistic in 1 day, and how to evaluate them (rejection rate on unseen diseases and on non-rice images)?
6. Evaluation protocol: metrics (macro-F1, per-class P/R/F1, confusion matrix, ECE, coverage at threshold), internal vs external test, and reporting rules.
7. Export: PyTorch→ONNX pitfalls (opset, ops supported by onnxruntime-web WASM/WebGPU), float16/INT8 quantisation effects on accuracy, and matching preprocessing between Python and JS.

CHALLENGE: If 6 classes are too many for reliable performance, or if training on one district cannot support any field claim, say what claim IS defensible.

RULES: Peer-reviewed papers with DOIs, official framework docs, reproducible benchmarks. Separate lab-image from field-image evidence. Never invent accuracies or latencies. If unknown, say "not found". Label [Evidence] vs [Recommendation].

OUTPUT (exact headings): 1 Executive Summary · 2 Project-Specific Requirements · 3 Research Methodology · 4 Technology/Approach Comparison (table: model | params | ONNX MB | CPU/WASM latency + source | field-data results + source | advantages | disadvantages | suitability 1–5) · 5 Evidence-Based Findings · 6 Performance and Cost Analysis · 7 Advantages and Disadvantages · 8 Risks and Technical Limitations · 9 Bangladesh-Specific Considerations · 10 Recommended Approach (model + data split + augmentation + calibration + OOD + exact training recipe) · 11 Alternative Approach · 12 Implementation Roadmap (1 training day) · 13 Source References and Direct Links (DOIs) · 14 Uncertainties and Unverified Information.
END WITH: | Decision | Recommended choice | Confidence (H/M/L) | Key evidence (URL/DOI) | Main risk | Fallback |
=== END R4 ===
```

---

### R5 — Bengali text-to-speech and voice
```
=== BEGIN R5 ===
ROLE: You are an independent speech-technology engineer. Verify Bangla support from CURRENT official documentation. Do not assume it.

PROJECT CONTEXT (self-contained):
- Product: "Agro AI" (AgroLeaf AI), a web app for Bangladeshi rice farmers, many with limited reading comfort. After the photo is classified, a FIXED Bangla script (one per class: 6 diseases/healthy + "not sure", each 20–40 seconds) is played with play/pause. The text is known in advance and changes rarely.
- One developer, ~4 days, deadline 5 Nov 2026, free tiers preferred. Low-end Android phones, weak networks. The audio must not fail during judging.
- Current plan to test: pre-generate MP3s once (for example with Azure bn-BD neural voices) and serve them as static files. Use browser speechSynthesis only as a fallback.

RESEARCH QUESTIONS:
1. Verify current Bangla (bn-BD and bn-IN) support, voices, and quality tier for: Microsoft Azure Speech (check Nabanita/Pradeep bn-BD), Google Cloud Text-to-Speech, Amazon Polly, ElevenLabs, OpenAI TTS, Meta MMS-TTS (facebook/mms-tts-ben; check the licence), Coqui/other open-source Bangla models, gTTS (note it uses an unofficial endpoint), and the browser Web Speech API on Android Chrome, iOS Safari and desktop Chrome. Link the official voice-list page for each.
2. For each: pronunciation quality for Bangladeshi Bangla (vs West Bengal accent), handling of numbers like "16123" and English loanwords, SSML support, free tier and price (current, with URL and date), API key needs, licence limits on commercial or redistributed audio, and internet dependency.
3. Pre-generated static audio vs runtime TTS for fixed text: reliability, file size (MP3/Opus bitrate for speech), caching, offline use.
4. If runtime TTS is ever needed (future dynamic text), what is the cheapest reliable option?
5. Is human-recorded Bangla better for trust and comprehension among farmers? Cite any ICTD/agricultural-extension research on audio advisories (for example voice-based advisory services in South Asia).

CHALLENGE: If the plan is wrong (e.g. a licence forbids redistributing generated audio), say so.

RULES: Official docs and pricing pages only for capability and price claims, with URLs and access dates. No invented prices. Label [Evidence] vs [Recommendation].

OUTPUT (exact headings): 1 Executive Summary · 2 Project-Specific Requirements · 3 Research Methodology · 4 Technology/Approach Comparison (table: option | bn-BD voices | quality notes | free tier | price | licence | offline? | integration effort | suitability 1–5 | sources) · 5 Evidence-Based Findings · 6 Performance and Cost Analysis · 7 Advantages and Disadvantages · 8 Risks and Technical Limitations · 9 Bangladesh-Specific Considerations · 10 Recommended Approach (step by step) · 11 Alternative Approach · 12 Implementation Roadmap · 13 Source References and Direct Links · 14 Uncertainties and Unverified Information.
END WITH: | Decision | Recommended choice | Confidence (H/M/L) | Key evidence (URL) | Main risk | Fallback |
=== END R5 ===
```

---

### R6 — Deployment, hosting and infrastructure
```
=== BEGIN R6 ===
ROLE: You are an independent DevOps/cloud engineer optimising for "works every time a judge opens the link" on a zero budget.

PROJECT CONTEXT (self-contained):
- Product: "Agro AI" (AgroLeaf AI), a public web app for Bangladeshi rice farmers. Assets: a static frontend, a ~5–20 MB ONNX image model, ~7 MP3 files (~0.3 MB each), JSON knowledge files. Option A: everything static, with inference in the browser. Option B: static frontend + a Python inference API (FastAPI/onnxruntime CPU).
- Users and judges are mostly in Bangladesh; there may also be international judges. One developer, ~4 days, deadline 5 Nov 2026, free tiers only. HTTPS is required (camera capture).

RESEARCH QUESTIONS:
1. Static hosting: Vercel, Netlify, Cloudflare Pages, GitHub Pages, Firebase Hosting. Current free-tier limits (bandwidth, file-size limits for a 20 MB model file, build minutes), CDN presence near Bangladesh (points of presence in Dhaka or the region), and correct caching headers for .onnx/.wasm/.mp3. Give official URLs and dates.
2. Inference hosting (for Option B): Hugging Face Spaces (CPU basic), Render, Railway, Fly.io, Google Cloud Run, AWS Lambda (container), Modal. Free-tier status today, RAM/CPU, sleep/cold-start behaviour and typical cold-start time (sourced), image/model size limits, regions.
3. Measured or documented latency from Bangladesh to the main regions (Singapore, Mumbai, Frankfurt, US). If no measurement exists, say so.
4. Monitoring on a zero budget: uptime ping, error logging (e.g. Sentry free tier), and keeping the site warm (and whether that breaks any terms of service).
5. A pre-demo checklist: custom domain (optional), HTTPS, testing on real Bangladeshi mobile networks.

CHALLENGE: If Option A makes most of this unnecessary, say so plainly, and list what still needs care (model file size, WASM MIME types, caching).

RULES: Current official pricing and limits pages with URLs and access dates. No invented limits. Label [Evidence] vs [Recommendation].

OUTPUT (exact headings): 1 Executive Summary · 2 Project-Specific Requirements · 3 Research Methodology · 4 Technology/Approach Comparison (table: provider | free-tier limits | cold start | max file/model size | region/CDN | dev complexity | cost | suitability 1–5 | sources) · 5 Evidence-Based Findings · 6 Performance and Cost Analysis · 7 Advantages and Disadvantages · 8 Risks and Technical Limitations · 9 Bangladesh-Specific Considerations · 10 Recommended Approach · 11 Alternative Approach · 12 Implementation Roadmap · 13 Source References and Direct Links · 14 Uncertainties and Unverified Information.
END WITH: | Decision | Recommended choice | Confidence (H/M/L) | Key evidence (URL) | Main risk | Fallback |
=== END R6 ===
```

---

### R7 — Complete system architecture and technology stack
```
=== BEGIN R7 ===
ROLE: You are an independent solutions architect. Evaluate WHOLE stacks end to end, not single tools.

PROJECT CONTEXT (self-contained):
- Product: "Agro AI" (AgroLeaf AI), a public web app for Bangladeshi rice farmers. MVP: (1) rice-leaf photo upload, (2) 6-class CNN prediction or calibrated "not sure", (3) fixed Bangla/English disease card from JSON, (4) Bangla audio play/pause, (5) one-tap 16123 call. Model: MobileNetV3/EfficientNet-B0 → ONNX (~5–20 MB). Text and audio are fixed per class.
- Team: ONE undergraduate who knows Python/ML well and web development moderately, using AI coding agents. ~4 days, deadline 5 Nov 2026, free tiers. Judging weights UX & Product Readiness highest (16/50).
- Future (do not build now; only keep the door open): more crops, accounts and history, an expert feedback loop, weather, a chatbot.

RESEARCH QUESTIONS:
1. Compare at least these complete stacks, including any better ones you find:
   S1 static HTML/JS + onnxruntime-web + static JSON + static MP3 (no backend)
   S2 React/Vite + onnxruntime-web, on Vercel/Netlify
   S3 Next.js + API route calling a Python inference service
   S4 React + FastAPI/onnxruntime on HF Spaces/Render + static JSON
   S5 Gradio/Streamlit app on HF Spaces (all-in-one)
   S6 React + FastAPI + PostgreSQL/Supabase
   For each: integration complexity, build time for one person, first-load and inference latency on low-end Android with weak networks, demo reliability (cold starts), cost, privacy, maintainability, and the cost of adding the future features.
2. Decide: (a) best overall, (b) lowest cost, (c) fastest to build, (d) lightest deployment. Explain the trade-offs.
3. Can a Gradio/Streamlit UI meet a "farmer-friendly Bangla mobile UX + custom navbar sticker" requirement? Give evidence about customisation limits.
4. The integration risks that most often break such projects (preprocessing mismatch, class-order mismatch, CORS, WASM loading, audio autoplay rules), and how to prevent each.

CHALLENGE: Do not default to a "standard" React+FastAPI+Postgres stack if a simpler one scores better on reliability and readiness.

RULES: Official docs and real benchmarks with URLs and dates. No invented numbers. Label [Evidence] vs [Recommendation].

OUTPUT (exact headings): 1 Executive Summary · 2 Project-Specific Requirements · 3 Research Methodology · 4 Technology/Approach Comparison (table: stack | advantages | disadvantages | performance | dev complexity | deploy complexity | cost | future-proofing | suitability 1–5 | sources) · 5 Evidence-Based Findings · 6 Performance and Cost Analysis · 7 Advantages and Disadvantages · 8 Risks and Technical Limitations · 9 Bangladesh-Specific Considerations · 10 Recommended Approach (diagram in text + folder structure) · 11 Alternative Approach · 12 Implementation Roadmap (day by day to 5 Nov) · 13 Source References and Direct Links · 14 Uncertainties and Unverified Information.
END WITH: | Decision | Recommended choice | Confidence (H/M/L) | Key evidence (URL) | Main risk | Fallback |
=== END R7 ===
```

---

### R8 — Competitor analysis and innovation opportunities
```
=== BEGIN R8 ===
ROLE: You are an independent agri-tech market researcher. Report only what is publicly verifiable. Never claim a competitor LACKS a feature unless a source shows it. Otherwise write "not found in public sources".

PROJECT CONTEXT (self-contained):
- Product: "Agro AI" (AgroLeaf AI), a free public web app for Bangladeshi rice farmers: rice-leaf photo → 6-class AI screening (Healthy, Blast, Brown Spot, Leaf Smut, Tungro, Sheath Blight) with a calibrated "not sure" → simple Bangla explanation + Bangla audio → one-tap 16123 Krishi Call Centre. The photo is processed on the phone (in the browser). We plan to publish accuracy measured on photos from districts NOT used in training.
- Proposed differentiators to TEST (not to assume): (1) an explicit calibrated "not sure"; (2) Bangla audio for every result; (3) published external-district accuracy; (4) no install, photo stays on device; (5) no AI-written pesticide doses, referral to official guidance.

RESEARCH QUESTIONS:
1. For each relevant app or service, report core features, crops and diseases covered, image-AI or not, languages and voice, offline use, published accuracy (and on what data), privacy policy points, install counts, ratings, last update, and owner. Cover at least: BRRI "Rice Solution" (and check whether "Dhan Surokkha"/"ধান সুরক্ষা" is the same or a different app), Dr. Chashi, BAMIS (DAE), Plantix, Krishoker Janala, iFarmer Folon/Sofol, Khamari (BARC), 16123/AIS services, Krishi Batayon. Include international rice-disease apps or tools that support Bangla.
2. For each proposed differentiator, check whether any competitor already offers it (source required). Rate each differentiator: unique / partly done / already common.
3. Review themes from Google Play reviews: quote short real snippets with dates, or say you could not access them. Do not invent percentages.
4. The innovation opportunities that are realistic for a 4-day student build and that judges would see as genuinely new.
5. Claims we must NOT make (e.g. "first", unverified accuracy, partnerships).

RULES: Use Play Store/App Store pages, official sites, and reputable news, with URLs and access dates. Label [Evidence] vs [Recommendation]. List anything you could not verify.

OUTPUT (exact headings): 1 Executive Summary · 2 Project-Specific Requirements · 3 Research Methodology · 4 Technology/Approach Comparison (table: app | owner | crops | image AI | Bangla voice | offline | published accuracy | privacy notes | installs/rating | last update | sources) · 5 Evidence-Based Findings · 6 Performance and Cost Analysis (pricing/free?) · 7 Advantages and Disadvantages (theirs vs ours) · 8 Risks and Technical Limitations · 9 Bangladesh-Specific Considerations · 10 Recommended Approach (positioning statement) · 11 Alternative Approach · 12 Implementation Roadmap (which differentiators to build in 4 days) · 13 Source References and Direct Links · 14 Uncertainties and Unverified Information.
END WITH: | Differentiator | Status (unique/partial/common) | Evidence URL | Confidence (H/M/L) | Safe wording for the pitch |
=== END R8 ===
```

---

### R9 — Cross-AI comparison and final decision (run last; paste all outputs in)
```
=== BEGIN R9 ===
ROLE: You are an independent technical reviewer and fact-checker. You will receive research reports on the same questions from several AI systems (ChatGPT, Gemini, DeepSeek, others). Decide by EVIDENCE QUALITY and FEASIBILITY, never by majority vote. A single well-sourced, feasible recommendation beats three unsourced ones.

PROJECT CONTEXT (self-contained):
- Product: "Agro AI" (AgroLeaf AI), a public web app for Bangladeshi rice farmers: rice-leaf photo → 6-class CNN (trained on RiceLeafDiseaseBD v3, DOI 10.17632/86s4jzj2m4.3) or calibrated "not sure" → Bangla/English card → Bangla audio → 16123 call. One student, deadline 5 Nov 2026, free tiers. Judging: Problem 12, Innovation 12, AI/Tech 10, UX & Readiness 16.
- Domains: R1 frontend/UX, R2 backend, R3 database, R4 model/data, R5 Bangla TTS, R6 hosting, R7 full stack, R8 competitors.

INPUT: [PASTE THE REPORTS HERE, each labelled with platform + domain]

TASKS:
1. For each domain, list where the AIs agree, where they conflict, and what each one missed.
2. Check the 10 most decision-critical claims against their cited sources (open the links). Mark each: Verified / Source does not support it / Source unreachable / No source. Highlight any fabricated-looking citations, prices or benchmarks.
3. Separate strong evidence (official docs, peer-reviewed work, reproducible benchmarks) from weak (blogs, uncited claims, model guesses).
4. Score each candidate option with the decision framework below. Show the scores.
5. Give ONE final decision per domain, plus a fallback, plus the trigger that would switch to the fallback.
6. List the research that is still missing and whether it blocks the build (yes/no).
7. Produce a consolidated 4-day build plan that follows from the decisions.

DECISION FRAMEWORK (score 1–5, weights in brackets): Feasibility in 4 days by one person (25%) · Demo reliability (20%) · Farmer usability (15%) · Performance on low-end phones and weak networks (10%) · Cost on free tiers (10%) · Evidence strength (10%) · Maintainability (5%) · Future scalability (5%). Any option scoring 1 on Feasibility or Reliability is rejected regardless of total.

OUTPUT: 1 Executive Summary of final decisions · 2 Agreement/Conflict matrix per domain · 3 Claim verification table (claim | AI | source | status) · 4 Scored option tables per domain · 5 Final decisions (domain | choice | fallback | switch trigger | confidence) · 6 Missing research and blockers · 7 Consolidated build plan · 8 Uncertainties.
=== END R9 ===
```

---

## D. Research execution guide
| Order | Prompts | When | Why |
|---|---|---|---|
| **Wave 1 (now, in parallel)** | **R4, R5, R6** on 2 platforms each (e.g. ChatGPT DR + Gemini DR) | 1 Nov evening | Critical path: model, voice, hosting. Wrong choices here break the demo |
| **Wave 2 (in parallel)** | **R7** (plus R1 and R2 if time allows) | 1–2 Nov, while the dataset downloads | Settles in-browser vs backend and the UI plan |
| **Wave 3 (optional)** | R8, R3 | Only if Waves 1–2 finish early | R8 checks pitch claims; R3 will most likely say "no database" |
| **Final** | **R9**, pasting all outputs | 2 Nov, before noon | Lock decisions; then build |

**Tips:**
- Use **at least two different platforms** for R4 and R5. These are where hallucinated benchmarks and voice support are most likely.
- DeepSeek has no live web access in some modes. Use it for reasoning and critique, and weight its citations lower unless you can check them.
- **Do not wait for research to start building.** The dataset download, audit script and deployed skeleton with the sticker can all go ahead now.
- Save each output as `research/deep_research_results/<R#>_<platform>.md`.

## E. Cross-AI result collection template
Copy one row per (platform × prompt):

| AI platform | Domain (R#) | Main recommendation | Supporting evidence (best 1–3 URLs) | Cost (as cited) | Performance (as cited) | Risks | Uncertainties / unverified | Source links valid? (Y/N/partly) | My notes |
|---|---|---|---|---|---|---|---|---|---|
| ChatGPT DR | R4 | | | | | | | | |
| Gemini DR | R4 | | | | | | | | |
| DeepSeek | R4 | | | | | | | | |

## F. Final decision framework
Score each option 1–5 per criterion and multiply by the weight:

| Criterion | Weight | 5 means… | 1 means… |
|---|---|---|---|
| Feasibility (4 days, one person) | 25% | Done in under 4 hours with known tools | Needs skills or time we don't have |
| Demo reliability | 20% | No cold start; no runtime external dependency | Can fail or stall when a judge opens it |
| Farmer usability | 15% | Bangla, voice, 1–2 taps, works on low-end phones | Text-heavy, many steps |
| Performance (low-end phone, weak network) | 10% | First result < 5 s on 3G after load | > 15 s or crashes |
| Cost (free tier) | 10% | Free with comfortable margin | Needs payment or is near limits |
| Evidence strength | 10% | Official docs/peer review, checked by us | Uncited or contradicted |
| Maintainability | 5% | Few moving parts, one language | Many services |
| Future scalability | 5% | Clear path to crops/accounts | Dead end |

**Rules:**
1. Any option scoring **1 on Feasibility or Reliability is rejected**.
2. Ties go to the option with fewer moving parts.
3. Without sufficient evidence, the **workspace default** in `documentation/system_architecture.md` stands:
   - static frontend + in-browser ONNX
   - static JSON
   - pre-recorded Bangla MP3
   - Vercel or Netlify hosting
