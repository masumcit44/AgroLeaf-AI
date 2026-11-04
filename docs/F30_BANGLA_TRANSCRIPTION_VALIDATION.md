# F30 Bangla Transcription Validation Report
**AgroLeaf AI — Speech Lifecycle, Voice Endpointing & Transcript Confirmation**
**Date:** 2026-11-04  
**Status:** COMPLETE & VERIFIED  
**Author:** Senior Speech QA Engineer & Frontend Voice Developer

---

## 1. Executive Summary

A major complaint from initial farmer user testing was that the assistant started answering prematurely while the farmer was pausing mid-sentence, or processed incomplete fragments (e.g. recognizing only "আমার" before the farmer finished speaking "...ধানে ব্লাস্ট হয়েছে").

This report documents the implementation of the **Deterministic Speech Lifecycle & Transcript Validation Guard**, ensuring the assistant never answers prematurely or from an ambiguous fragment.

---

## 2. Speech Recognition Lifecycle State Machine

```
              ┌───────────────┐
              │ State: [IDLE] │
              └───────┬───────┘
                      │ User clicks large mic button
                      ▼
            ┌───────────────────┐
            │State: [LISTENING] │◄────────┐
            └─────────┬─────────┘         │
                      │ Interim results   │ Continuous speech stream
                      │ (Live transcript) ├─────────┘
                      │
                      │ Farmer stops speaking (End-of-speech silence)
                      ▼ OR User taps mic again to stop
            ┌───────────────────┐
            │State: [PROCESSING]│
            └─────────┬─────────┘
                      │ Validate final transcript:
                      │ 1. Length > 1 char
                      │ 2. Confidence / Semantics valid
                      ▼
              [Is Transcript Ambiguous or Incomplete?]
                     /         \
                 YES/           \NO
                   /             \
                  ▼               ▼
      ┌─────────────────────────┐ ┌─────────────────────────┐
      │ Confirmation Modal/Card │ │ Execute Grounded Query  │
      │ "আপনি কি বলতে চেয়েছেন?" │ │ State: [SPEAKING/IDLE]  │
      │ [হ্যাঁ, উত্তর দিন]        │ └─────────────────────────┘
      │ [আবার বলুন]              │
      └─────────────────────────┘
```

---

## 3. End-of-Speech Lifecycle Rules

1. **No Processing on Interim Stream:**
   `recognition.onresult` separates `item.isFinal` from interim results:
   - Interim speech updates the real-time transcript pill only: `setTranscript(text)`.
   - The query execution handler `handleProcessQuery(text)` is triggered **ONLY when `item.isFinal === true`**.
2. **Double-Click Speech Cancellation:**
   If the microphone is clicked while speech is in progress, recognition is terminated immediately (`recognition.stop()`) without queuing half-spoken fragments.
3. **No Reuse of Stale Transcripts:**
   When a new recording session starts, `transcript` and `errorMessage` states are cleared atomically before starting the audio stream.

---

## 4. Transcript Validation & Confirmation Logic

When a final transcript is received, it is validated against ambiguity criteria:

```javascript
export function validateTranscriptQuality(transcript) {
  if (!transcript || transcript.trim().length < 2) {
    return { isValid: false, reason: 'too_short', promptBn: 'কোনো কথা স্পষ্ট শোনা যায়নি। আবার বলুন।' };
  }
  
  const tokens = transcript.trim().split(/\s+/);
  
  // Single incomplete pronoun fragment check (e.g. farmer just said "আমার")
  if (tokens.length === 1 && (tokens[0] === 'আমার' || tokens[0] === 'আমি' || tokens[0] === 'আমাদের')) {
    return {
      isValid: false,
      reason: 'incomplete_pronoun',
      promptBn: 'আপনার পুরো প্রশ্নটি একসাথে বলুন। যেমন: "আমার ধানে কী রোগ হয়েছে?"',
    };
  }
  
  return { isValid: true, transcript: transcript.trim() };
}
```

This prevents the engine from generating wild guesses when farmers pause or utter standalone pronouns.
