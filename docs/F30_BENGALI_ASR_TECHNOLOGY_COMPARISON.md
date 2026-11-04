# F30 Bengali ASR Technology Research & Comparison Report
**AgroLeaf AI — Architectural Evaluation of Speech Recognition Engines for Bangladeshi Farmers**
**Date:** 2026-11-04  
**Status:** COMPLETE & VERIFIED  
**Author:** Lead Bengali Speech AI Engineer & Systems Architect

---

## 1. Executive Summary

Selecting an appropriate Automatic Speech Recognition (ASR) architecture for rural Bangladeshi farmers requires balancing three competing constraints:
1. **Bengali Dialect & Agricultural Lexicon Accuracy:** Recognition of rural Bangladeshi accents, colloquial speech, and rice pathology terminology (e.g. "ব্লাস্ট", "টুংরো", "শীথ ব্লাইট").
2. **Mobile Hardware Feasibility:** Smooth execution on $80–$150 Android devices without causing thermal throttling or browser out-of-memory crashes.
3. **Strict Free-Only Policy:** Zero external paid APIs, zero recurring billing, zero credit card dependencies.

This report evaluates three primary architectural candidates:
- **Option A:** Native Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)
- **Option B:** On-Device Whisper.cpp / WASM (OpenAI Whisper tiny/base compiled to WebAssembly)
- **Option C:** Bengali Open-Source Pre-trained Models (Wav2Vec2 Bengali / Whisper-large Bengali hosted externally)

---

## 2. Comparative Technology Evaluation

| Evaluation Dimension | Option A: Native Web Speech API (`bn-BD`) | Option B: Whisper.cpp WebAssembly | Option C: Hosted Open-Source Model |
|---|---|---|---|
| **Operating Cost** | **$0.00** (Native browser service) | **$0.00** (Client-side WASM execution) | Requires GPU server hosting ($20–$50/mo minimum) |
| **Download Footprint** | **0 MB** (Zero initial download) | **75 MB (tiny) to 145 MB (base)** | 0 MB (Client-side) |
| **Initialization Time** | **< 50 ms** (Instant) | **8 – 15 seconds** (Loading WASM + binary weights) | ~200 ms |
| **Mobile RAM Overhead** | Negligible (< 10 MB) | **350 MB – 600 MB** (Risk of mobile tab crash) | Negligible |
| **Inference Latency** | **Real-time streaming (interim tokens)** | **4 – 9 seconds** per spoken phrase on mobile CPU | 800 ms – 1.5 s (network dependent) |
| **Bangla Dialect Support** | Good on standard Bangladeshi speech | Poor on `tiny`; moderate on `base` | Strong on large models |
| **Agricultural Terminology** | Moderate; requires phonetic normalization | Weak without domain fine-tuning | Strong if fine-tuned |
| **Free-Only Compliance** | **100% Compliant** | **100% Compliant** | **Violates Free-Only Policy** (Requires paid cloud GPU) |
| **Battery Impact** | Negligible (Hardware-accelerated) | High (Continuous CPU SIMD load) | Low |

---

## 3. Analysis of Research Speech Corpora

To evaluate vocabulary diversity and dialectal variation in Bangladesh:

### 3.1 SUBAK.KO Corpus (Hugging Face)
- **Size:** ~241 hours of Bangladeshi speech recorded across standard and rural speakers under CC BY 4.0 license.
- **Key Finding:** Natural farmer speech exhibits high frequency of grammatical particles (যেমন: "গো", "ভাই", "আহ", "এখন কি করমু") and phonetic shifts between aspirated stops (e.g. /pʰ/ $\leftrightarrow$ /f/, /tʃʰ/ $\leftrightarrow$ /s/).
- **Insight:** Any ASR output requires a robust phonetic/normalization post-processing layer to handle common transcript mutations.

### 3.2 BRADS & BRWDS (Regional Dialects Dataset — Data in Brief 2025)
- **Coverage:** Pronunciation variations across Dhaka, Rajshahi, Rangpur, Chattogram, Sylhet, Barishal, Khulna, and Mymensingh divisions.
- **Key Finding:** In northern rice-producing hubs (Rangpur/Dinajpur) and northeastern districts (Sylhet), words like "আমার" are occasionally uttered with lengthened vowels ("আমারে", "আমারো").
- **Insight:** Token segmentation must isolate the root pronoun rather than relying on exact word equality.

---

## 4. Final Technology Selection & Justification

### Selected Architecture: **Hybrid Native Web Speech API (`bn-BD`) + Resilient On-Device NLP & Normalization Layer**

### Rationale:
1. **Elimination of Mobile Tab Crashes:** Forcing an uneducated farmer in rural Kurigram on a low-end phone to download a 100MB WASM model over 3G network would guarantee application abandonment. Web Speech starts instantly with 0 MB download.
2. **Deterministic Post-Processing Superiority:** The observed errors in production were NOT primarily caused by speech recognition failure; they were caused by **crude substring matching in `copilotEngine.js`**!
   - Web Speech accurately transcribed `"আমার ধানে ব্লাস্ট হয়েছে"`.
   - The NLP engine mistakenly extracted `"আম"` because `"আমার"` contained the letters of `"আম"`!
3. **Graceful Degraded State:** When Web Speech is unsupported (e.g. non-Chromium browsers), the interface automatically unfolds a clean Bangla/Banglish typed drawer without breaking the page.

This delivers the lowest latency, zero operational cost, zero data bloat, and maximum reliability across all smartphones in Bangladesh.
