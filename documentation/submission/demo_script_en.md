# AgroLeaf AI — 2-minute demo video script (English)

**Format:** English voiceover, phone-screen footage with light text overlays. Total 2:00.
**Rule:** every number below is copied from `frontend/public/data/metrics-v1.json` (model v1 plus the safety gate, 1 Nov 2026). If that file changes, update this script before recording. Never read an estimate aloud.

---

## Script

### 0:00–0:15 — Problem

**Visual:** A rice field at dawn. Cut to a hand holding a phone over a spotted leaf. The official AIgnite sticker is visible in the phone's navbar from the first app shot.

**Voiceover:**
> "A farmer sees spots on a rice leaf and has to decide what to do. Ask the wrong person, and the spray is wrong too — wasted money, and a crop still at risk. I built AgroLeaf AI to give a farmer a second opinion, in Bangla, on their own phone."

### 0:15–0:30 — Sample photo

**Visual:** Home screen. Tap a sample leaf image. Preview screen shows the photo, a quality hint, and the buttons "পরীক্ষা করুন" (Check) and "আবার তুলুন" (Retake).

**Voiceover:**
> "I choose a sample leaf. The app checks the photo, then runs a small model right here in the browser. The photo never leaves this phone."

### 0:30–0:55 — Bangla result and voice

**Visual:** Result card. Highlight the Bangla disease name, the English name, the confidence in words, the next steps, then tap ▶ on the Bangla audio. Show the transcript beside the player and the "AI voice" label. Show the `16123` button.

**Voiceover:**
> "Here is the result in Bangla, with the English name, a short explanation and what to do next. I can listen to it instead of reading. If I want official help, the 16123 button is right here. The app does not say the call is free; charges may apply."

**On-screen text:** "Preliminary screening — not a diagnosis." · "Audio: AI-generated voice."

### 0:55–1:10 — Blurry or non-rice photo → "not sure"

**Visual:** Upload a deliberately blurry leaf photo. The app shows "নিশ্চিত নই / not sure", the two closest possibilities, retake tips and 16123. Then upload a photo that is not a leaf (a hand, a wall, a screenshot). The app says "This does not look like a rice leaf" and shows **no** disease names.

**Voiceover:**
> "Now the harder case. This photo is blurry. Instead of guessing, the app says 'not sure', shows the two closest possibilities, tells me how to retake the photo, and still offers 16123. And this one is not a leaf at all. A colour check runs before the model, so the app says so instead of inventing a disease. It only says 'healthy' when it is highly confident, because wrongly telling a farmer to do nothing is the most harmful mistake."

### 1:10–1:30 — Accuracy page

**Visual:** Open the accuracy page (📊). Hold on the plain-language summary, then the internal-test cards, the outside-district results, the Safety Gate table, the Leaf Smut gap, dataset credits and the limitations.

**Voiceover:**
> "I do not want a number I cannot check. On 1,499 held-out test photos, macro-F1 is 84.3 percent. On 1,560 photos from Sylhet, another district, the app chose to answer 78.9 percent of the time, and 56 percent of those answers were right. On Savar photos it is much weaker, and the page says so. The safety gate now rejects 95.7 percent of everyday photos that are not plants. Leaf Smut has no outside test, so the app always says 'not sure' for it."

### 1:30–1:45 — Privacy

**Visual:** After the first result, turn the phone's Wi-Fi and mobile data off. Tap Retake, choose a leaf photo **from the gallery** (not a sample button: samples are downloaded and need the network), and show the result. Cut to a simple diagram: photo → phone → result, with a crossed-out cloud.

**Voiceover:**
> "The model runs on the device. There is no upload, no account and no analytics that can capture the photo. Once the app has loaded, I can switch the internet off and still check a photo from my gallery."

### 1:45–2:00 — Close

**Visual:** Home screen. Sticker visible. Cut to the title card: AgroLeaf AI, the AIgnite sticker, and the line "Tells you what's wrong in Bangla — and tells you when it doesn't know."

**Voiceover:**
> "AgroLeaf AI is a preliminary screening tool, not a diagnosis. It explains the result in Bangla, reads it aloud, and says 'not sure' when it should. That is the app I wanted to build for farmers here."

**On-screen text:** "Built for Ostad Presents YUNet AIgnite Buildathon 2026." · "Solo entry." · "No pesticide doses."

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
| 8 | 0:46–0:55 | Audio | Tap ▶, show transcript and "AI voice" label | Audio starts only on tap |
| 9 | 0:55–1:02 | Blurry photo | "not sure", top-2 possibilities, retake tips | Make the blur obvious |
| 10 | 1:02–1:10 | Non-leaf photo | "does not look like a rice leaf", no disease names, 16123 | Show it does not force a class |
| 11 | 1:10–1:20 | Accuracy page top | Summary, internal cards, outside districts, Safety Gate table | Numbers readable |
| 12 | 1:20–1:30 | Accuracy page bottom | Leaf Smut gap, credits, limitations, privacy line | Scroll slowly |
| 13 | 1:30–1:38 | Airplane/Wi-Fi off | Gallery photo after the first result | Proves on-device inference; sample buttons need the network |
| 14 | 1:38–1:45 | Privacy diagram | Photo → phone → result; crossed-out cloud | Simple motion graphic |
| 15 | 1:45–1:52 | Closing app shot | Home, sticker, app name | Hold long enough to read |
| 16 | 1:52–2:00 | Title card | App name, sticker, tagline, "solo entry" | End card |

## Recording checklist

- Record the phone at 1080p or higher; keep the status bar clean.
- Use the **live** production URL, not a local build, so judges see what they will open.
- Re-check every number against `frontend/public/data/metrics-v1.json` on the day you record.
- Generate the Bangla MP3s before recording. Without them the ▶ button currently does nothing (QA finding E3).
- Keep the sticker in frame whenever the app is on screen.
- Do not say "accurate", "first", "only", "free call" or any partnership. Do not show a pesticide dose.
- Upload to YouTube as **English**, unlisted or public, and put the link in Devpost.
