# AgroLeaf AI — Your Manual Test Checklist (candidate)

Open https://deploy-candidate-ready.agroleaf-ai.pages.dev on each phone. If an old version
shows, tap "রিলোড করুন" or clear site data. Tick ✅ / ❌ and note the phone + browser.

## 1. Bengali voice (release blocker) — Android Chrome, desktop Chrome, iPhone Safari
- [ ] Voice tab (🎙️ ভয়েস সহকারী): ask "ধানে ব্লাস্ট হলে কী করব?" → tap speaker.
      Expected: **Bengali** pronunciation, OR a Bangla message "এই ফোন/ব্রাউজারে বাংলা কণ্ঠ নেই…".
      ❌ if you hear English sounds reading Bangla.
- [ ] A long answer is read to the end (not cut after ~15 s).
- [ ] Links / "উৎস:" lines are not read aloud.
- [ ] Stop works; asking again does not overlap two voices.
- [ ] Android without Bengali voice: follow the on-screen steps (Settings → Language & input →
      Text-to-speech → Google → install Bengali) → retry → Bengali.
- [ ] Result screen ▶ শুনুন plays Bengali (pre-recorded).

## 2. Main farmer journey (390 px phone)
- [ ] Scan a real leaf with the camera → result in a few seconds.
- [ ] Result shows: disease name, reliability (e.g. "১০০ টির মধ্যে ৮০ টি"), this-week plan,
      help button; extra details only after tapping "🔍 আরও বিশ্লেষণ".
- [ ] No English words like "F30:" or "Max/Min" in Bangla mode.
- [ ] Save to history → appears in 🗂️ ইতিহাস.
- [ ] Set a reminder → it appears in the reminders tab after closing and reopening the app.
- [ ] 📍 GPS on Home → your district shows with "(GPS)"; Weather tab shows your area.
- [ ] Help → 16123 call link works; summary image downloads/shares.

## 3. Offline
- [ ] Open once online, turn on airplane mode, reload → app opens, a sample scan works, voice plays.

## 4. Safety
- [ ] Nowhere a pesticide brand, dose (ml/গ্রাম/লিটার) or mixing ratio; chemical steps say ask
      the officer / call 16123.
- [ ] Copilot never states your land size, variety or planting date unless you entered it.
