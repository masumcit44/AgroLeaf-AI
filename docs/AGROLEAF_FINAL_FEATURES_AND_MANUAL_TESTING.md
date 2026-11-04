# AgroLeaf AI — Final Features & Manual Testing

**USER MANUAL ACCEPTANCE: PASS** — T1–T11 checked and passed by the owner (5 Nov 2026).

Candidate: https://deploy-candidate-ready.agroleaf-ai.pages.dev (branch `deploy/candidate-ready`)
Production (unchanged until you approve): https://agroleaf-ai.pages.dev
Repo: https://github.com/masumcit44/AgroLeaf-AI

Status labels: **AUTO** = automated tests · **BROWSER** = checked by Claude in a desktop browser
on the candidate · **DEVICE** = needs a real phone · **USER** = needs your judgement.

## A. Final features
| Feature | What it does / why it helps | Where | Status |
|---|---|---|---|
| Leaf scan (v10 model, on device) | Photo → likely disease in seconds; photo never leaves the phone | Home → ক্যামেরা / গ্যালারি | AUTO, BROWSER; camera = DEVICE |
| "Not sure" | Says when it doesn't know instead of guessing | Result | AUTO |
| Bangla result + recorded voice ▶ শুনুন | Explains the disease in simple Bangla, read aloud | Result | AUTO, BROWSER; sound = DEVICE |
| Reliability level | "Results like this were right 80 of 100 times in testing" | Result | AUTO, BROWSER |
| This-week plan + 16123 help | What to do now, and when to call the officer | Result | AUTO, BROWSER |
| Fake-pesticide warning | How to buy safely; never names a pesticide or dose | Result | AUTO |
| Voice assistant (ভয়েস সহকারী) | Ask by voice/text; 122 fixed answers with recorded Bengali voice | Tab 🎙️ | AUTO, BROWSER (clip plays); sound/mic = DEVICE |
| Pesticide safety filter | No brand names or doses in any answer | Voice assistant | AUTO (all recorded answers) |
| Reminders | Follow-up field check reminders on the phone | Tab ⏰ | AUTO; real notifications = DEVICE |
| History | Saved scans to compare over time | Tab 🗂️ | AUTO, BROWSER |
| Weather + disease risk | 7-day forecast for your GPS area, BAMIS rules | Tab 🌤️ | AUTO, BROWSER |
| Profile + GPS | District / location for weather | Home "এডিট করুন", 📍 | AUTO, BROWSER; real GPS = DEVICE |
| Offline | Works without internet after first visit | Whole app | AUTO + e2e (scan + voice offline) |
Deferred (switched off, code kept): yield-loss estimate, disease severity, AI heatmap, extra
confidence card, outbreak map, feedback.

## B. Your tests (only what automation cannot cover)
Mark ✅/❌, note phone + browser, attach a screenshot for ❌. Before starting: open the candidate,
tap "রিলোড করুন" if shown (or clear site data).

| ID | Feature | Steps | Expected | ✅/❌ | Notes |
|---|---|---|---|---|---|
| T1 | Voice assistant audio (Android Chrome) | 🎙️ tab → type **টুংরো হলে কী করব?** → পাঠান | Bengali woman's voice reads exactly the on-screen answer to the end; no English sounds | | |
| T2 | Stop / replay | During T1 tap ⏹️ থামান, then 🔊 শুনুন | Stops at once; replays from start; never two voices | | |
| T3 | More answers | Ask **আমার ধানে ব্লাস্ট হয়েছে, এখন কী করব?** and **আম সম্পর্কে জানতে চাই।** | Rice answer for the first (no brand/dose), "only rice" answer for the second; both spoken in Bengali | | |
| T4 | Voice input | Tap the mic, say **আমার ধানে ব্লাস্ট হয়েছে** | Text shows "আমার ধানে…" (or a confirm prompt), never a mango answer | | |
| T5 | Planner (dynamic) | Type **বোরো ধানের সম্পূর্ণ পরিকল্পনা দিন** | A plan appears; audio = Bengali if the phone has a Bengali voice, otherwise a Bangla "voice unavailable" message, never English | | |
| T6 | iPhone Safari | Repeat T1 on an iPhone | Bengali recorded voice plays | | |
| T7 | Camera scan | Home → ক্যামেরা → photo of a real rice leaf | Clear framing; result in a few seconds; ▶ শুনুন plays Bengali | | |
| T8 | Readability | Read one full result screen at arm's length | Bangla is clear; nothing confusing or English-cluttered | | |
| T9 | Reminder | Result → set a reminder → close and reopen the app | Reminder listed in ⏰; due reminder shows on Home | | |
| T10 | Offline | Use the app once online, then airplane mode → reload → scan a gallery photo → replay a voice answer heard before | App opens, scan works, cached audio plays | | |
| T11 | GPS | Home → 📍 GPS (allow) | Your district with "(GPS)"; weather tab shows your area | | |

Send only the ❌ rows. Production is promoted only after you approve.
