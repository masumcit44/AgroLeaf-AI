# MVP requirements: what to build first, what wins, what is primary and secondary

*Updated 1 Nov 2026 after the cross-AI research review (`research/final_decisions.md`).*

**Constraint:** one person, about 4 days (to 5 Nov 2026), one **public web app**, **free tools only**.
**Judging:** Problem 12 · Innovation 12 · AI/Tech 10 · **UX & Readiness 16**.

---

## 1. The winning feature: "Honest AI you can check"
Research showed that **Bangla audio is not unique** (Dr. Chashi reads instructions aloud), and that **non-rice rejection exists** (Rice Solution). Our winning angle is therefore the combination below. Each part can be demonstrated live:

1. **Calibrated "not sure"**
   - The model answers only above a threshold chosen on validation data.
   - Otherwise it shows "আমি নিশ্চিত নই" ("I'm not sure"), the two *possible* diseases, how to retake the photo, and 16123.
2. **Published, measured accuracy on photos from other districts**
   - An in-app "কতটা নির্ভুল?" / "How accurate is it?" page.
   - It shows external-district results (Savar, Sylhet/Dhaka), coverage, and known limits (no Leaf Smut external test).
   - No competitor publishes this, per the public sources found. Don't claim "only"; just show it.
3. **Private by design**
   - The photo is analysed on the phone and never uploaded.
   - No install: one web link.

**Pitch line:**
> **"AgroLeaf AI checks your rice leaf on your own phone, explains it in Bangla text and voice, and honestly says 'not sure' when it can't tell — and we show you exactly how accurate it is."**

Bangla voice stays a **primary feature** (it matters for the user), but it is not presented as unique.

---

## 2. PRIMARY features, in build order
| # | Feature | Done when | Day |
|---|---|---|---|
| P1 | Deployed React+Vite skeleton + **sticker** in the navbar | Public Cloudflare URL opens on a phone | 1–2 Nov |
| P2 | Image upload (camera + gallery), preview, validation | JPEG/PNG/WebP ≤ 10 MB; friendly Bangla errors | 2 Nov |
| P3 | Model in the browser (`onnxruntime-web/wasm`) | Class + calibrated confidence on a real phone | 2–3 Nov |
| P4 | **"Not sure" (★)** | Threshold from validation; top-2 shown as "possible"; retake tips; `tel:16123` | 3 Nov |
| P5 | Result card BN + EN | Name, meaning, 3–5 steps, "what to do now", official source link | 3 Nov |
| P6 | Bangla voice ▶/⏸ | 7 pre-generated MP3s; transcript; "AI voice" label | 3 Nov |
| P7 | **Accuracy page (★)** | Real numbers from `model/experiments/`, dataset credits (CC BY), limits, privacy line | 4 Nov |
| P8 | Readiness basics | Loading states (model loading / checking), error states, mobile layout, onboarding line, disclaimer | 4 Nov |

## 3. SECONDARY (only after all of P1–P8 work)
| # | Feature | Effort |
|---|---|---|
| S1 | Photo-quality hint (dark / blurry) before inference | 1–2 h |
| S2 | Sample leaf images for judges to tap | 30 min |
| S3 | Share the result as text (Web Share API) | 30 min |
| S4 | "সরকারি পরামর্শ দেখুন" ("See official advice"): BAMIS verbatim quote behind a tap | 30 min |
| S5 | Energy-score OOD check (evaluate on non-rice photos first) | 2–3 h, risky |
| S6 | Service worker for offline repeat use | 2 h, risky |

## 4. Not in this build (roadmap slide only)
- More crops, accounts and history, chatbot, weather/location
- Expert consultation, marketplace or prices, yield
- IVR, insect ID, quantised models
- **AI-written pesticide doses: never**

## 5. Rules
1. Never generate a pesticide dose. Only quote BAMIS verbatim, with a link and "confirm with your officer / 16123".
2. No accuracy number appears until it is measured; always show the sample size.
3. Never claim "first", "only", "diagnosis", "works across Bangladesh", a partnership, or that 16123 is free.
4. The photo never leaves the phone. Don't add analytics that could break this.
5. Every Bangla text is short and has audio.

## 6. Scorecard mapping
| Criterion | Carried by |
|---|---|
| Problem & User Value (12) | P5, P6 (actionable Bangla), P4 (prevents a wrong spray) |
| Solution & Innovation (12) | P4 + **P7 published external accuracy** + on-device privacy |
| AI & Technical (10) | Fine-tuned CNN, temperature scaling, validation-chosen threshold, external test, in-browser ONNX |
| UX & Readiness (16) | P1, P2, P6, P8, S1–S3; fast, mobile-first, never a blank screen |
