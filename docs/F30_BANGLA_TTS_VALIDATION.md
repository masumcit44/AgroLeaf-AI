# F30 Bangla Text-to-Speech (TTS) Validation Report
**AgroLeaf AI — Speech Synthesis Dialects, Audio Feedback & Fallback Protocol**
**Date:** 2026-11-04  
**Status:** COMPLETE & VERIFIED  
**Author:** Senior Audio Software Engineer & Accessibility Lead

---

## 1. Executive Summary

Voice-first applications for rural Bangladeshi farmers must ensure that spoken audio matches displayed text and speaks in natural Bengali. When mobile devices lack an installed Bengali TTS voice pack, the system must not attempt to speak Bengali text using an English speech engine (which sounds like unintelligible gibberish) nor silently crash.

This report documents the validation of AgroLeaf AI's speech synthesis engine, voice selection algorithm, and audio fallback mechanisms.

---

## 2. Bengali Voice Discovery & Selection Algorithm

Browsers populate `window.speechSynthesis.getVoices()` asynchronously via the `voiceschanged` event. AgroLeaf AI's voice selector discovers Bengali voices using a multi-tiered priority heuristic:

```javascript
export function selectBestBengaliVoice(voices) {
  if (!voices || voices.length === 0) return null;
  
  // Tier 1: Exact Bangladeshi Bengali match (bn-BD)
  const bnBd = voices.find(v => v.lang === 'bn-BD' || v.lang === 'bn_BD');
  if (bnBd) return bnBd;
  
  // Tier 2: Indian Bengali match (bn-IN) - phonetically identical for agricultural terms
  const bnIn = voices.find(v => v.lang === 'bn-IN' || v.lang === 'bn_IN');
  if (bnIn) return bnIn;
  
  // Tier 3: General Bengali prefix match (starts with 'bn')
  const bnGeneral = voices.find(v => v.lang.toLowerCase().startsWith('bn'));
  if (bnGeneral) return bnGeneral;
  
  // No Bengali voice found; DO NOT fall back to English! Return null.
  return null;
}
```

### 2.1 The Anti-Gibberish Rule
If `selectBestBengaliVoice()` returns `null`:
- **Speech synthesis is suppressed.**
- The assistant displays a clean, reassuring Bengali message:
  > **"আপনার ফোনে বাংলা কণ্ঠস্বর পাওয়া যায়নি। উত্তরটি উপরে পড়ে নিন।"**
- It **never** invokes an English synthesizer (`en-US`), preventing the device from pronouncing Bengali Unicode characters as garbled English phonemes.

---

## 3. Audio Lifecycle Management & Interruption Safety

1. **Clean Playback Termination:**
   When a user clicks "থামান" (Stop), starts a new recording, or navigates away, `window.speechSynthesis.cancel()` is immediately called.
2. **Speed & Pitch Calibration:**
   - Speech rate is calibrated to **0.90** (slightly slower than standard desktop speed) to maximize comprehension for elderly or hearing-impaired farmers.
   - Pitch is set to **1.0** (neutral natural cadence).
3. **Word-by-Word Parity:**
   The text spoken aloud (`voiceBn`) matches the essential agronomic meaning of the displayed text (`textBn`), condensed slightly to omit dense chemical formula brackets that sound confusing when read by automated screen readers.
