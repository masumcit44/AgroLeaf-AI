# AgroLeaf AI — Pending Tasks & Blockers
**Document ID:** `docs/AGROLEAF_PENDING_TASKS_AND_BLOCKERS.md`  
**Last Updated:** 2026-11-04T13:26:15+06:00  
**Project Lead:** Antigravity  

---

## 1. Pending Tasks Queue (Ranked by Priority & Dependency)

| Task ID | Feature / Component | Description | Dependencies | Blockers / Risks | Estimated Effort |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **TSK-01** | **Confidence Score UI** | Wire calibrated probability badge to `ResultScreen.jsx`, add tests, and verify mobile rendering. | Scan `decision.top.prob` available (Done) | None | 30 mins |
| **TSK-02** | **F1 Live Guided Camera** | Real-time browser camera frame analysis: blur, luminance, leaf centering, and directional guidance. | HTML5 MediaStreams, Canvas API | Mobile WebCam permissions in test environments | 2–3 hours |
| **TSK-03** | **F14 Photo History** | Verify chronological progression viewer for the same rice plant across multiple visits. | IndexedDB schema | Ensure no confusion with Confidence Score | 1–2 hours |
| **TSK-04** | **F31 Disease Severity** | Quantify lesion area coverage and map to IRRI 0–9 scale for Blast and Brown Spot. | F11 Heatmap infrastructure (Done) | Attention heatmap must not be used as segmentation mask | 3–4 hours |
| **TSK-05** | **F30 Farmer Copilot** | Large microphone button with local RAG question answering over verified BRRI/DAE knowledge base. | Knowledge base JSON | Strictly zero paid LLM APIs; must operate free | 3–4 hours |
| **TSK-06** | **F32 Community Outbreak** | Privacy-preserving community disease surveillance by administrative area rollup. | D1 / Cloudflare Worker (optional) | Must not leak individual farm coordinates | 3–4 hours |
| **TSK-07** | **Dataset Audit & Expansion**| Complete audit of Mendeley RiceLeafDiseaseBD and Harvard Dataverse archives for retraining feasibility. | Local archives in `data/` | Quota limitations on external downloads | Background |

---

## 2. Identified Blockers & Risk Mitigation

### Blocker 1: Antigravity Subagent 429 Quota Exhaustion
- **Issue:** Spawning background subagents via `invoke_subagent` encountered `RESOURCE_EXHAUSTED (code 429)`.
- **Impact:** Tasks cannot be delegated to parallel subagents.
- **Mitigation:** Execute all development, auditing, testing, and documentation sequentially within this primary session. Maintain compact state checkpoints in `docs/`.

### Blocker 2: External Paid API Restrictions
- **Issue:** Strict mandate against paid APIs (OpenAI, Gemini API, Claude API, paid STT/TTS, paid Cloud GPUs).
- **Mitigation:**
  - Disease classification: Existing on-device EfficientNet-B0 ONNX (`rice-effb0-v10-320.onnx`).
  - Q&A: Curated local agricultural knowledge base with deterministic fuzzy-matching RAG.
  - Speech synthesis: Web Speech API with fallback to readable Bangla text.
  - Speech recognition: Web Speech API (`SpeechRecognition`) with graceful Banglish/English typing fallback.

### Blocker 3: Cloudflare Turnstile & Production Secrets for D1
- **Issue:** Full live synchronization for `F12 Anonymous Device Registration` and `F23 Area Disease Map` requires production database migrations and secrets.
- **Mitigation:**
  - Core farmer features (F1, F11, F14, F24, F26, F30, F31, Confidence Score) are 100% local-first and function offline without backend secrets.
  - Server endpoints operate in mock mode in local test suites (`server/__tests__`).
