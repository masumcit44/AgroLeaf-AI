# F30: Bengali Text-to-Speech (TTS) Validation & Synthesis Report
**Document ID:** `docs/F30_BENGALI_TTS_VALIDATION_REPORT.md`  
**Feature:** F30 AI-Powered Disease Q&A (Voice-First Farmer Copilot)  
**Author:** AgroLeaf AI Engineering Team  
**Date:** 2026-11-04  
**Status:** Approved for Production  

---

## 1. Executive Summary

Voice-first communication is a two-way street. After recognizing a farmer's spoken query, AgroLeaf AI must communicate the advice back verbally in clear, natural-sounding, pacing-appropriate Bengali.

Under our **Strict Free-Only Policy**, paid TTS cloud APIs (ElevenLabs, Google Cloud Text-to-Speech, Azure Neural Voice) are strictly barred. This document evaluates the client-side synthesis stack, mobile browser audio autoplay constraints, speech rates, and audio playback UX.

---

## 2. Technology Evaluation & Selection

| Solution | Technology | Cost | Bengali Voice Quality | Bundle Overhead | Recommendation |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Paid Neural TTS** | ElevenLabs / Google Cloud TTS | \$15 - \$30 / 1M chars | Human-like | 0 MB | ❌ **PROHIBITED** by Free Policy |
| **Pre-recorded Static MP3s** | Pre-recorded curated audio clips | \$0.00 | Studio human quality | ~1-3 MB for top clips | ✅ Used in AgroLeaf for static disease summaries (`public/audio/`) |
| **WASM-based Piper / Coqui TTS** | ONNX / WASM offline neural voice | \$0.00 | High | 40 - 80 MB | ❌ Exceeds 25 MiB Cloudflare Pages ceiling |
| **HTML5 Web Speech Synthesis API** | `window.speechSynthesis` | **\$0.00** | **Good (Native Android bn-BD Voice)** | **0 KB** | ✅ **RECOMMENDED FOR DYNAMIC COPILOT RESPONSES** |

---

## 3. Web Speech Synthesis API Architecture

Modern Android smartphones (including affordable models from Samsung, Xiaomi, Realme, and Symphony widely owned by farmers in Bangladesh) include pre-installed Google Speech Services with native Bengali voice synthesis (`bn-BD` and `bn-IN`).

### 3.1 Speech Synthesis Pipeline
```javascript
export function speakBengali(text, onEnd, onError) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  // Cancel any ongoing speech before starting new utterance
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'bn-BD'; // Preferred locale
  utterance.rate = 0.92;    // Slightly slower rate for elderly farmers / clarity
  utterance.pitch = 1.0;

  // Attempt to select dedicated Bengali voice if registered in browser
  const voices = window.speechSynthesis.getVoices();
  const bnVoice = voices.find((v) => v.lang === 'bn-BD' || v.lang === 'bn_BD' || v.lang.startsWith('bn'));
  if (bnVoice) {
    utterance.voice = bnVoice;
  }

  utterance.onend = () => { if (onEnd) onEnd(); };
  utterance.onerror = (e) => { if (onError) onError(e); };

  window.speechSynthesis.speak(utterance);
  return utterance;
}
```

### 3.2 Pacing and Phonetic Tone Optimization
1. **Pacing (`rate: 0.92`):** Normal default speech rate (1.0) can be too rapid when describing chemical dosages and active ingredients (e.g. ট্রাইসাইক্লাজোল, হেক্টর প্রতি গ্রাম). A calibrated pacing of 0.92 provides crisp consonant articulation.
2. **Text Chunking:** For lengthy multi-sentence guidance, utterances are split into logical clause segments separated by punctuation (।, commas) to avoid browser engine buffer timeouts.
3. **Number Formatting:** Digits are spelled out or passed as natural numbers to avoid robotic English numeral pronunciations.

---

## 4. Mobile Browser Autoplay & Audio Interaction Rules

Mobile browsers (Chrome Android, Safari iOS) implement strict autoplay policies requiring a user gesture (touch/click) before any audio context or `speechSynthesis.speak` can output sound.

### 4.1 Gesture Concurrency Strategy
In the farmer voice flow:
1. The farmer **explicitly taps the microphone button** to start asking a question.
2. That initial user interaction satisfies the user-gesture requirement.
3. Once the spoken query finishes and `copilotEngine` calculates the answer, `speakBengali()` is triggered directly from the user-initiated session.
4. Additionally, every copilot message card includes an explicit, accessible **"শুনুন" (Listen / Replay)** button and **"থামান" (Pause / Stop)** button. If the farmer missed a word due to field wind or tractor noise, one tap repeats the answer instantly.

---

## 5. Fallback & Silent Mode Behavior

- If the browser does not support `SpeechSynthesis` or the device is on mute:
  - The answer is rendered in large, readable typography with clean bullet points and emojis.
  - A subtle icon displays that audio is unmuted / unavailable without crashing or throwing errors.

