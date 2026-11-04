# F30: Audio Handling & Data Privacy Protocol
**Document ID:** `docs/F30_PRIVACY_AND_AUDIO_HANDLING.md`  
**Feature:** F30 AI-Powered Disease Q&A (Voice-First Farmer Copilot)  
**Author:** AgroLeaf AI Security & Privacy Lead  
**Date:** 2026-11-04  
**Status:** Approved for Production  

---

## 1. Privacy Mandate

In agricultural digital services, user privacy is often treated as an afterthought. AgroLeaf AI rejects this practice. Rural farmers have an equal right to personal privacy, data minimization, and protection against unauthorized voice recording and surveillance.

The Voice Copilot is architected under **Privacy-by-Design** principles.

---

## 2. Audio Processing Lifecycle

```
[Farmer taps Mic Button]
          │
          ▼
[Browser MediaStream / Web Speech API activates]
          │
          ▼
[Streaming Audio processed in memory (Ephemeral)]
          │
          ▼
[Speech Recognition returns text transcript string]
          │
          ▼
[Microphone Audio Stream immediately CLOSED & TERMINATED]
          │
          ▼
[copilotEngine matches transcript against local KB JSON]
          │
          ▼
[Answer returned & spoken via client-side SpeechSynthesis]
```

### 2.1 Key Security Guarantees
1. **Zero Server Audio Transmission:** AgroLeaf AI does NOT transmit raw audio packets, WAV files, or MP3 recordings to any remote server or cloud bucket.
2. **Zero Audio Persistence:** Raw audio is never stored in IndexedDB, LocalStorage, CacheStorage, or cookies. Only the resolved text transcript is transiently held in React component state.
3. **No Biometric Voiceprints:** No acoustic fingerprinting, voice biometrics, pitch profiling, or identity tracking is performed.
4. **Explicit Consent & User-Initiated Capture:** The microphone is NEVER opened passively or in the background. It only activates when the user taps the mic button, and automatically shuts off as soon as speech ends.

---

## 3. Permissions & Device Access Transparency

When a farmer opens the Copilot for the first time:
- The browser prompts for standard microphone permission (`getUserMedia`).
- If permission is denied, the application:
  - Does NOT lock or freeze.
  - Displays a clear Bengali message explaining why microphone access was requested.
  - Offers immediate fallback to text input and one-tap suggestion chips.
- Farmers can revoke microphone permissions at any time directly through their browser site settings without affecting photo scanning or crop calendar features.

