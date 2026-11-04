# F30 Bangla Response Language Policy
**AgroLeaf AI — Language Lock, Bilingual Integrity & Multilingual Farmer UX**
**Date:** 2026-11-04  
**Status:** COMPLETE & VERIFIED  
**Author:** Lead Localization Architect & Mobile UX Designer

---

## 1. Executive Summary

A critical user testing failure reported that the assistant sometimes displayed responses in English even when the farmer asked questions in spoken Bangla. This occurred because fallback handlers or system messages lacked strict language binding, allowing default English template literals to leak into the UI.

This policy mandates an **unbreakable Bangla Language Lock** whenever the application is operating in Bengali mode.

---

## 2. Unbreakable Language Lock Specifications

### 2.1 Default Response Language
1. When `lang === 'bn'` (the default state for all Bangladeshi users), **100% of user-facing text and voice output MUST be in natural, understandable Bangla**.
2. Under zero circumstances may the assistant output English fallback sentences such as:
   - *"I don't understand your question."*
   - *"Please try again."*
   - *"No information found."*
   - *"Out of domain query."*
3. The presence of English loanwords or Banglish in the transcribed text (e.g. `"amar dhane blast hoise ekhon ki korbo"`) **must never cause the assistant to switch to English**. The answer must remain in Bangla.
4. English responses are strictly permitted ONLY when the user explicitly toggles the entire application language to English via the language switcher (`lang === 'en'`).

### 2.2 Standard Fallback Responses in Bangla

| Condition / State | Prohibited English Leaks | Mandatory Approved Bangla Text | Spoken Bangla Audio (`voiceBn`) |
|---|---|---|---|
| **Ambiguous / Unclear Audio** | "Could not understand audio. Please repeat." | "আপনার প্রশ্নটি ঠিকভাবে বুঝতে পারিনি। আরেকবার একটু স্পষ্ট করে বলবেন?" | "আপনার প্রশ্নটি বুঝতে পারিনি। আরেকবার স্পষ্ট করে বলুন।" |
| **Out-of-Domain Non-Rice Query** | "We only support rice diseases." | "এগ্রোলিফ এআই বর্তমানে শুধুমাত্র বাংলাদেশের ধানের রোগ ও পরিচর্যা সম্পর্কে তথ্য দিতে পারে।" | "এগ্রোলিফ এআই বর্তমানে শুধু ধানের রোগ ও পরামর্শ দিতে পারে।" |
| **Missing Knowledge / No Grounded Fact** | "No verified information found." | "এই বিষয়ে আমার কাছে বাংলাদেশ ধান গবেষণা ইনস্টিটিউট (BRRI)-এর যাচাই করা তথ্য নেই। ভুল পরামর্শ এড়াতে স্থানীয় উপসহকারী কৃষি কর্মকর্তার পরামর্শ নিন।" | "এই বিষয়ে আমার কাছে যাচাই করা তথ্য নেই। স্থানীয় কৃষি কর্মকর্তার পরামর্শ নিন।" |
| **Microphone Permission Denied** | "Microphone permission denied." | "মাইক্রোফোনের অনুমতি বন্ধ আছে। ব্রাউজার সেটিংসে অনুমতি চালু করুন অথবা নিচে লিখে প্রশ্ন করুন।" | (Text display only) |
| **Audio Playback Unavailable** | "Bengali speech synthesis unavailable." | "আপনার ডিভাইসে বাংলা ভয়েস প্লেব্যাক সুবিধা নেই। উত্তরটি উপরে পড়ে নিন।" | (Text display only) |

---

## 3. Answer Language Validation Layer

Prior to setting state in `FarmerCopilotCard.jsx` or invoking speech synthesis, the response object passes through an automated validation guard:

```javascript
export function validateResponseLanguage(response, targetLang = 'bn') {
  if (targetLang === 'bn') {
    // Assert response contains valid Bengali text
    if (!response.textBn || !/[\u0980-\u09FF]/.test(response.textBn)) {
      console.warn('[F30 Language Lock] English leak detected! Fallback applied.');
      return {
        ...response,
        titleBn: 'উত্তর প্রস্তুত করা সম্ভব হয়নি',
        textBn: 'এই প্রশ্নের নির্ভরযোগ্য বাংলা উত্তর এখন দিতে পারছি না। প্রশ্নটি আবার বলুন অথবা অন্যভাবে জিজ্ঞাসা করুন।',
        voiceBn: 'এই প্রশ্নের বাংলা উত্তর এখন দেওয়া সম্ভব হচ্ছে না। প্রশ্নটি আবার বলুন।',
      };
    }
  }
  return response;
}
```

This structural guarantee prevents any English text from being displayed on screen or spoken aloud to a Bangladeshi farmer.
