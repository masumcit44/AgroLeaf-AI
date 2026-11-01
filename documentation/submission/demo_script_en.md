# AgroLeaf AI — 2-minute demo video script (English)

**Format:** English voiceover, phone-screen footage with light text overlays. Total 2:30 (under 3:00 ceiling).
**Rule:** every number below is copied from `frontend/public/data/metrics-v1.json` (model v1 plus the safety gate, 2 Nov 2026). If that file changes, update this script before recording. Never read an estimate aloud.

---

## Script

### 0:00–0:15 — Problem

**Visual:** A rice field at dawn. Cut to a hand holding a phone over a spotted leaf. The official AIgnite sticker is visible in the phone's navbar from the initial app shot.

**Voiceover:**
> "A farmer sees spots on a rice leaf and has to decide what to do. Ask the wrong person, and the spray is wrong too — wasted money, and a crop still at risk. I built AgroLeaf AI to give a farmer a preliminary screening, in Bangla, on their own phone."

### 0:15–0:30 — Sample photo

**Visual:** Home screen. Tap a sample leaf image. Preview screen shows the photo, a quality hint, and the buttons "পরীক্ষা করুন" (Check) and "আবার তুলুন" (Retake).

**Voiceover:**
> "I choose a sample leaf. The app checks the photo, then runs a small model right here in the browser. The photo never leaves this phone."

### 0:30–0:55 — Bangla result and voice

**Visual:** Result card. Highlight the Bangla disease name, the English name, the confidence in words, the next steps, then tap ▶ on the Bangla audio. Show the transcript beside the player and the "AI voice" label. Show the `16123` button.

**Voiceover:**
> "Here is the result in Bangla, with the English name, a short explanation and what to do next. I can listen to it instead of reading. The audio is pre-generated using an AI voice, labelled clearly. If I want official help, the 16123 button is right here. The app does not say the call is free; charges may apply."

**On-screen text:** "Preliminary screening — not a diagnosis." · "Audio: AI-generated voice." · "Not reviewed by an agronomist."

### 0:55–1:15 — Blurry or non-rice photo → "not sure"

**Visual:** Upload a deliberately blurry leaf photo. The app shows "নিশ্চিত নই / not sure", the two closest possibilities, retake tips and 16123. Then upload a photo that is not a leaf (a hand, a wall, a screenshot). The app says "This does not look like a rice leaf" and shows **no** disease names.

**Voiceover:**
> "Now the harder case. This photo is blurry. Instead of guessing, the app says 'not sure', shows the two closest possibilities, tells me how to retake the photo, and still offers 16123. And this one is not a leaf at all. A colour check runs before the model, so the app flags non-leaves instead of inventing a disease. It requires high confidence for 'healthy', because wrongly telling a farmer to do nothing is the most harmful mistake."

### 1:15–1:40 — Accuracy page & outside-district limits

**Visual:** Open the accuracy page (📊). Show the plain-language summary, internal-test cards, the outside-district validation cards (Sylhet, Savar, Sirajganj/Pabna, Gujarat), the Safety Gate table, and the limitations list.

**Voiceover:**
> "I do not want a number I cannot check. On 1,499 internal test photos, macro-F1 is 84.3 percent and accuracy is 86.9 percent. But on outside districts it struggles: on 1,423 Sylhet photos the app answers 62.2 percent of the time with 53.7 percent right, on raihan phone photos 9.8 percent are right, and on Gujarat photos just 5 percent. The page states plainly that outside the training district answers are often wrong, brown spot is rarely recognised, and the disease information is preliminary and not reviewed by an agronomist. The safety gate rejects 95.7 percent of everyday photos."

### 1:40–1:55 — Privacy & offline inference

**Visual:** After the initial result, turn the phone's Wi-Fi and mobile data off. Tap Retake, choose a leaf photo **from the gallery** (not a sample button: samples are downloaded and need the network), and show the result. Cut to a simple diagram: photo → phone → result, with a crossed-out cloud.

**Voiceover:**
> "The model runs on the device. There is no upload, no account and no analytics that can capture the photo. Once the app has loaded, I can switch the internet off and still check a photo from my gallery."

### 1:55–2:15 — Close

**Visual:** Home screen. Sticker visible. Cut to the title card: AgroLeaf AI, the AIgnite sticker, and the line "Tells you what's wrong in Bangla — and tells you when it doesn't know."

**Voiceover:**
> "AgroLeaf AI is a preliminary screening tool, not a diagnosis. It explains the result in Bangla, reads it aloud with an AI voice, and says 'not sure' when it should. That is the honest tool I wanted to build for farmers here."

**On-screen text:** "Built for Ostad Presents YUNet AIgnite Buildathon 2026." · "Solo entry." · "No pesticide doses." · "Preliminary screening — not reviewed by an agronomist."

---

## Shot list

| # | Time | Shot | What to show | Notes |
|---|---|---|---|---|
| 1 | 0:00–0:04 | Field B-roll | Rice field, spotted leaf, hands | Natural light; no identifiable faces without consent |
| 2 | 0:04–0:10 | Phone home | Navbar with official sticker, Bangla headline, big photo button | Sticker must be visible, uncropped |
| 3 | 0:10–0:15 | Problem text | "Wrong spray = wasted money + crop at risk" | Short overlay |
| 4 | 0:15–0:20 | Home → sample | Tap a sample leaf image | Use a real sample from the app |
| 5 | 0:20–0:30 | Preview | Photo, quality hint, Check / Retake | Show the loading state briefly |
| 6 | 0:30–0:38 | Result top | Class name BN + EN, confidence in words | No raw percentage here |
| 7 | 0:38–0:46 | Result body | 3–5 next steps, official advice link, 16123 | Do not show a dose |
| 8 | 0:46–0:55 | Audio | Tap ▶, show transcript and "AI voice" label | Audio starts on tap |
| 9 | 0:55–1:05 | Blurry photo | "not sure", top-2 possibilities, retake tips | Make the blur obvious |
| 10 | 1:05–1:15 | Non-leaf photo | "does not look like a rice leaf", no disease names, 16123 | Show it does not force a class |
| 11 | 1:15–1:28 | Accuracy page top | Summary, internal cards, outside districts (Sylhet, raihan, Gujarat), Safety Gate | Numbers readable |
| 12 | 1:28–1:40 | Accuracy page limits | Limitations section with outside-district error rates, Leaf Smut gap, credits | Scroll slowly |
| 13 | 1:40–1:48 | Airplane/Wi-Fi off | Gallery photo after the initial result | Proves on-device inference; sample buttons need the network |
| 14 | 1:48–1:55 | Privacy diagram | Photo → phone → result; crossed-out cloud | Simple motion graphic |
| 15 | 1:55–2:05 | Closing app shot | Home, sticker, app name | Hold long enough to read |
| 16 | 2:05–2:15 | Title card | App name, sticker, tagline, "solo entry" | End card |

## Recording checklist

- Record the phone at 1080p or higher; keep the status bar clean.
- Use the **live** production URL, not a local build, so judges see what they will open.
- Re-check every number against `frontend/public/data/metrics-v1.json` on the day you record.
- Verify pre-generated Bangla MP3s are loaded from `/audio/*.mp3`.
- Keep the sticker in frame whenever the app is on screen.
- Do not claim a partnership, "first", "only", "100%", or "free call". Do not show a pesticide dose or claim diagnosis.
- Explicitly state disease information is preliminary and not reviewed by an agronomist.
- Upload to YouTube as **English**, unlisted or public, and put the link in Devpost.
