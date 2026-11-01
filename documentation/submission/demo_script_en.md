# AgroLeaf AI — 2-minute demo video script (English)

**Format:** English voiceover, phone-screen footage with light text overlays. Total 2:00.
**Rule:** every on-screen metric stays `[[TBD after training]]` until it is in `metrics-v1.json`. Do not read an estimate aloud.

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

**Visual:** Upload a deliberately blurry leaf photo, then a photo of a non-rice leaf or a hand. The app shows "নিশ্চিত নই / not sure", the top two possibilities, retake tips and 16123.

**Voiceover:**
> "Now the harder case. This photo is blurry, and this one is not a rice leaf. Instead of guessing, the app says 'not sure'. It shows the two closest possibilities, tells me how to retake the photo, and still offers 16123. A confident wrong answer would be worse than this."

### 1:10–1:30 — Accuracy page

**Visual:** Open "কতটা নির্ভুল? / How accurate is it?". Show the external-district results, coverage, sample sizes, the Leaf Smut gap, dataset credits and the limitations. Blur or hold on the measured numbers.

**Voiceover:**
> "I do not want a number I cannot check. This page shows the measured results on photos from other districts, how often the app chooses to answer, and the cases it cannot test. The external macro-F1 is `[[TBD after training]]`, at coverage `[[TBD after training]]`. Leaf Smut has no external test, and the page says so."

### 1:30–1:45 — Privacy

**Visual:** Turn the phone's Wi-Fi off after the app has loaded; run another sample. Show the result. Cut to a simple diagram: photo → phone → result, with a crossed-out cloud.

**Voiceover:**
> "The model runs on the device. There is no upload, no account and no analytics that can capture the photo. The page and the model are cached after the first load, so a weak connection is not a blocker for the next check."

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
| 10 | 1:02–1:10 | Non-rice photo | "not sure" again, 16123 | Show it does not force a class |
| 11 | 1:10–1:20 | Accuracy page top | External results, coverage, sample sizes | Numbers readable; placeholders removed only after training |
| 12 | 1:20–1:30 | Accuracy page bottom | Leaf Smut gap, credits, limitations, privacy line | Scroll slowly |
| 13 | 1:30–1:38 | Airplane/Wi-Fi off | Run another sample after load | Proves on-device inference |
| 14 | 1:38–1:45 | Privacy diagram | Photo → phone → result; crossed-out cloud | Simple motion graphic |
| 15 | 1:45–1:52 | Closing app shot | Home, sticker, app name | Hold long enough to read |
| 16 | 1:52–2:00 | Title card | App name, sticker, tagline, "solo entry" | End card |

## Recording checklist

- Record the phone at 1080p or higher; keep the status bar clean.
- Use the **live** production URL, not a local build, so judges see what they will open.
- Replace all `[[TBD after training]]` values before recording. If training is not finished, record the flow and add the numbers in a second pass.
- Keep the sticker in frame whenever the app is on screen.
- Do not say "accurate", "first", "only", "free call" or any partnership. Do not show a pesticide dose.
- Upload to YouTube as **English**, unlisted or public, and put the link in Devpost.
