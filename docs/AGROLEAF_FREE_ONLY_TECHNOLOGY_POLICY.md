# AgroLeaf AI — Strict Free-Only Technology & Licensing Policy
**Document ID:** `docs/AGROLEAF_FREE_ONLY_TECHNOLOGY_POLICY.md`  
**Effective Date:** 2026-11-04  
**Policy Status:** MANDATORY & NON-NEGOTIABLE  
**Author:** Antigravity (Lead Software Architect & QA Lead)  

---

## 1. Absolute Prohibition on Paid Services

AgroLeaf AI is engineered to be permanently zero-cost to deploy, run, and scale for Bangladeshi farmers and community agricultural officers.

Under **no circumstances** may any of the following be introduced into the project:

- ❌ **Paid LLM / Chatbot APIs:** OpenAI, Gemini API, Anthropic Claude, Perplexity, Mistral paid endpoints, etc.
- ❌ **Paid Cloud Inference:** Replicate, Hugging Face Pro/Inference Endpoints, AWS SageMaker, Google Vertex AI, Azure AI.
- ❌ **Paid Speech Recognition (STT):** Google Cloud Speech-to-Text, AWS Transcribe, Whisper API (paid), Azure Speech.
- ❌ **Paid Text-to-Speech (TTS):** ElevenLabs, Google Cloud Text-to-Speech, Azure Neural Voice, Amazon Polly.
- ❌ **Paid Vector Databases:** Pinecone, Qdrant Cloud (paid tier), Milvus Zilliz, DataStax Astra.
- ❌ **Paid Geocoding / Mapping APIs:** Google Maps Platform, Mapbox (paid tiers), Here Technologies.
- ❌ **Paid Cloud Compute / GPUs:** RunPod, Lambda Labs, Paperspace (paid tier), Google Cloud Compute Engine, AWS EC2.
- ❌ **Commercial Datasets:** Any data with restrictive commercial pricing or unverified provenance.

---

## 2. Sanctioned Free & Open-Source Tech Stack

All features must be constructed using verified free and open-source assets:

| Capability | Approved Technology / Solution | Licensing & Terms | Cost |
| :--- | :--- | :--- | :---: |
| **Model Inference** | **ONNX Runtime Web** (WebAssembly + CPU SIMD) | MIT License | **$0.00** |
| **Disease Classifier** | **EfficientNet-B0 v10** (Trained on public research data) | Apache 2.0 / Academic open | **$0.00** |
| **Edge Hosting** | **Cloudflare Pages** (Free tier: unlimited bandwidth, 25 MiB file cap) | Cloudflare Free Plan | **$0.00** |
| **Offline Storage** | **Browser IndexedDB** (`agroleaf-db` v2 via Dexie/idb patterns) | W3C Standard | **$0.00** |
| **Weather Telemetry** | **Open-Meteo API** (Free for non-commercial/academic use, up to 10k calls/day) | Attribution Required | **$0.00** |
| **Voice Advisory** | **HTML5 Web Audio API** + Static pre-recorded MP3 voice clips | Project Owned / Open License | **$0.00** |
| **Speech Recognition**| **Browser Web Speech API** (`SpeechRecognition`) + Banglish text fallback | Standard Browser Feature | **$0.00** |
| **Farmer Copilot RAG**| **Deterministic Keyword & Fuzzy Matching** over curated BRRI/DAE JSON | Project Owned / CC BY-SA 4.0 | **$0.00** |
| **Camera Guidance** | **HTML5 MediaStreams** + Canvas-based Laplacian variance and histogram | W3C Standard | **$0.00** |
| **Model Training** | **Kaggle Notebooks Free GPU Quota** (30 hours/week T4/P100) | Kaggle Free Tier | **$0.00** |

---

## 3. Strict License Verification Rules

1. **Free to download does NOT imply free to distribute commercially:**
   - Datasets or model weights released under `CC BY-NC 4.0` (Non-Commercial) or research-only clauses cannot be used in a production commercial submission without explicit institutional exemptions.
   - Example: Models such as `facebook/mms-tts-ben` are published under `CC-BY-NC-4.0` and must be rejected for standard commercial deployment.
2. **Attribution Integrity:**
   - Any open dataset used (e.g. Mendeley RiceLeafDiseaseBD under CC BY 4.0) must preserve original provenance, license notes, and author citations in `docs/` and application credits.
3. **Audit Trail Requirement:**
   - Every model checkpoint, audio asset, and external script must have its license recorded in this document prior to deployment.

