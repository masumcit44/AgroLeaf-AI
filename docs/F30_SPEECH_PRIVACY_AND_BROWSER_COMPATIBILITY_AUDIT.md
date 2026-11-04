# F30 Speech Privacy & Browser Compatibility Audit
**AgroLeaf AI — Audio Stream Handling, Permissions & Hardware Compatibility**
**Date:** 2026-11-04  
**Status:** COMPLETE & VERIFIED  
**Author:** Lead Privacy Engineer & Mobile UX Architect

---

## 1. Executive Summary

Voice interfaces handling natural speech from farmers must respect privacy rights and account for mobile browser constraints. Unlike text typing, microphone access requires explicit hardware permissions, and Web Speech API implementations differ substantially between Google Chrome (Android/Desktop), Apple Safari (iOS/macOS), and standalone PWA environments.

This audit establishes AgroLeaf AI's voice privacy architecture, data retention policies, and cross-browser execution rules.

---

## 2. Privacy Policy & Audio Data Lifecycles

### 2.1 The Zero-Audio-Retention Rule
1. **No Cloud Audio Storage:** AgroLeaf AI does NOT record, upload, save, or transmit raw audio bytes to any cloud server, database, or analytics bucket.
2. **Ephemeral Memory Execution:** Audio streams captured by `navigator.mediaDevices.getUserMedia` or the browser's speech recognition engine are processed strictly in volatile memory. When recognition ends, the audio stream tracks are immediately stopped:
   ```javascript
   stream.getTracks().forEach(track => track.stop());
   ```
3. **No Training on Farmer Voice Data:** Farmer speech is never scraped, harvested, or repurposed for machine learning model training without explicit written consent.

### 2.2 Transparency Regarding Web Speech API Processing
Standard W3C `webkitSpeechRecognition` implementations:
- In **Google Chrome (Android / Desktop):** Audio fragments are processed via Google's free client-integrated speech service with `lang = 'bn-BD'`. No API keys or credit card billing is involved.
- In **Safari (iOS 14.5+):** Audio is processed via Apple's on-device/integrated dictation service.
- **Privacy Notice:** AgroLeaf AI explicitly displays a privacy disclaimer:
  > *"আপনার কণ্ঠস্বর শুধুমাত্র তাত্ক্ষণিক প্রশ্ন বোঝার জন্য ব্যবহৃত হয়। কোনো অডিও রেকর্ডিং সার্ভারে সংরক্ষণ করা হয় না।"* (Your voice is used solely for real-time question understanding. No audio recording is stored on servers.)

---

## 3. Cross-Browser & Mobile Hardware Compatibility Matrix

| Operating System | Browser / Environment | Speech Recognition (STT) | Speech Synthesis (TTS) | Supported Bengali Voices | Fallback Strategy |
|---|---|---|---|---|---|
| **Android 10+** | Google Chrome Mobile | **Full Native Support** (`webkitSpeechRecognition`) | **Full Native Support** (`SpeechSynthesis`) | Google বাংলা (`bn-BD` / `bn-IN`) | Direct voice-in / voice-out |
| **Android 10+** | Samsung Internet / Edge | Supported (Chromium engine) | Supported | Samsung / Google TTS | Direct voice-in / voice-out |
| **Android 10+** | Firefox Mobile | Limited / Disabled by default | Supported | System TTS | Auto-opens Bangla text input fallback with microphone prompt |
| **iOS 15+ / iPhone** | Safari Mobile | Supported (`webkitSpeechRecognition`) | Supported (`SpeechSynthesis`) | Apple Bengali (Siri Voice) | Direct voice-in / voice-out |
| **Desktop** | Chrome / Brave / Edge | **Full Native Support** | **Full Native Support** | High-definition Google TTS | Direct voice-in / voice-out |
| **Offline PWA** | Installed Web App | Native cache fallback | Native cached voices | Device local voice | Text input fallback if offline speech pack uninstalled |

---

## 4. Microphone Permission & Error Handling Protocol

When microphone access fails, AgroLeaf AI provides polite, actionable guidance in natural Bangla rather than generic English error codes:

| Browser Error Code | User-Facing Bangla Message | Action Triggered |
|---|---|---|
| `not-allowed` / `service-not-allowed` | "মাইক্রোফোনের অনুমতি বন্ধ আছে। ব্রাউজার সেটিংসে অনুমতি চালু করুন অথবা নিচে লিখে প্রশ্ন করুন।" | Highlights typing input drawer |
| `no-speech` | "কোনো কথা শোনা যায়নি। বাটনে চাপ দিয়ে আবার স্পষ্ট করে বলুন।" | Resets microphone to idle ready state |
| `network` | "ইন্টারনেট সংযোগে সমস্যা হচ্ছে। সংযোগ পরীক্ষা করুন অথবা লিখে প্রশ্ন করুন।" | Offers typed submission |
| `audio-capture` | "মাইক্রোফোন পাওয়া যায়নি। অনুগ্রহ করে অডিও ডিভাইস চেক করুন।" | Prompts text input |
| `unsupported` | "আপনার ব্রাউজারে ভয়েস সাপোর্ট নেই। দয়া করে লিখে প্রশ্ন করুন।" | Auto-reveals text input field |
