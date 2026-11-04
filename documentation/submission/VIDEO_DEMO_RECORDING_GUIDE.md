# AgroLeaf AI — Demo Video Recording Guide (for the recorder)

## Official rules (from the organisers' instructions)
- The demo video is **optional** but recommended.
- It is submitted as a **YouTube link**.
- It **must be in English** (international judges).
- **Not specified by the organisers:** length, resolution, file format, file size. Recommended: **2–3 minutes**, 1080p, MP4, uploaded to YouTube as *Unlisted* or *Public* (not Private, or judges cannot open it).

## A. Preparation
1. **URL:** https://agroleaf-ai.pages.dev (the live production site).
2. **Browser:** Google Chrome on a laptop.
3. **Clean session:**
   - Open an Incognito window (Ctrl+Shift+N), so there are no extensions, bookmarks bar or old data.
   - Close other tabs. Turn on Windows "Do not disturb" (Focus assist). Close WhatsApp, Messenger and email.
4. **Phone-sized view (recommended, the app is mobile-first):**
   - Press F12, then Ctrl+Shift+M (device toolbar).
   - Pick "iPhone 12 Pro" (390×844). Set zoom to 100%.
   - Undock DevTools so only the phone view is recorded, or crop to it later.
5. **Warm-up (avoids loading delays on camera):** before recording, open the site once and do one full scan, so the AI model (~15 MB) is downloaded and cached. Ask the voice assistant one question too, so its audio is cached.
6. **Sticker:** the "Built For … AIgnite Buildathon 2026" sticker is in the top-left header. Keep it in view in the first scenes.
7. **Leaf photo:**
   - **Easiest:** the built-in sample photos on the Home screen ("নমুনা ছবি দিয়ে দেখুন": blast, brown spot, tungro, sheath blight, healthy leaf).
   - **Optional:** a clear daylight photo of one real diseased rice leaf, copied to the laptop beforehand and uploaded with "গ্যালারি".
8. **Recorder:** OBS Studio (free) or Windows Xbox Game Bar (Win+G). 1920×1080, 30 fps.
9. **Microphone:** a headset or phone earphones, in a quiet room. Do a 10-second test and play it back first.

## B. Storyboard and English voiceover (≈ 2 min 30 s)
The app's interface is in **Bangla**. Explain it in English as you go. Never speak Bangla as the narration.

| # | Time | On screen / what to do | Narration (read exactly) |
|---|---|---|---|
| 1 | 0:00–0:15 | Home screen; sticker and app name visible. Do not click. | "Rice is Bangladesh's most important crop, but farmers often can't identify a leaf disease in time, and a wrong guess can mean buying the wrong pesticide. This is AgroLeaf AI, built for the AIgnite Buildathon 2026." |
| 2 | 0:15–0:30 | Slowly move the mouse over the tabs: Home, Voice assistant, Reminders, History, Weather. | "It is designed for Bangladeshi rice farmers, so the interface is in Bangla and works on an ordinary phone. Everything a farmer needs is in five simple tabs." |
| 3 | 0:30–0:50 | Tap the **blast** sample photo, then the check button ("পাতা পরীক্ষা করুন"). Wait for the result. | "The farmer takes one photo of a sick leaf. An EfficientNet-B0 model, which I trained on Bangladeshi rice-leaf photos, runs directly inside the phone's browser. The photo never leaves the phone." |
| 4 | 0:50–1:10 | Result screen: disease name "ব্লাস্ট রোগ" and the reliability badge. Scroll slowly. | "In a few seconds it names the likely disease, here rice blast, and tells the farmer how reliable this kind of result was in testing. If the model is unsure, it honestly says 'not sure' instead of guessing." |
| 5 | 1:10–1:30 | Tap **▶ শুনুন** and let 4–5 seconds of the Bengali voice play. | "The explanation is written in simple Bangla and can be played aloud in a natural Bangladeshi Bengali voice, which helps farmers who find reading difficult." |
| 6 | 1:30–1:45 | Scroll to the plan, the pesticide-safety card and the 16123 call button. | "It gives practical next steps for this week. For safety, it never names a pesticide or a dose. Instead it tells the farmer to ask the agriculture officer or call the national helpline, 16123." |
| 7 | 1:45–2:05 | Voice assistant tab: type **টুংরো হলে কী করব?**, press send, and let the answer play for a few seconds. | "Farmers can also ask questions by voice or text. Answers come from official Bangladeshi agricultural guidance, and common answers are pre-recorded in Bengali so they sound right on any phone." |
| 8 | 2:05–2:20 | Back on the result, tap save to history, then open the History tab and the Reminders tab. | "Results can be saved to history to compare a field over time, and the farmer can set a reminder to check the field again." |
| 9 | 2:20–2:35 | Back on Home, with the sticker visible. Optionally show the Weather tab briefly. | "After the first visit, AgroLeaf AI keeps working even with a weak connection. It's honest, safe, and made for the farmers who need it most. Thank you." |

**Offline:** demonstrate it **only** if it works on the first try:
1. Turn the laptop's Wi-Fi off.
2. Reload the page.
3. Scan a sample photo.

Otherwise, keep just the spoken sentence in scene 9. Never fake it.

## C. Recording instructions
- **Record:** in OBS, add "Display Capture" (or "Window Capture" for Chrome), then Start Recording; Stop when done. With Game Bar, Win+Alt+R starts and stops.
- **Voice:** record the voice together with the screen, or record the screen first and then read the script over it (often cleaner). Keep the same distance from the mic. Speak slowly, about 10% slower than normal.
- **Mouse:** move slowly, click deliberately, and don't wiggle the mouse while talking.
- **Editing (free: CapCut, Clipchamp or DaVinci Resolve):** cut out loading pauses and mistakes; use simple cuts or a short fade only; zoom into the result card if the text is small.
- **Subtitles:** optional. English captions help international judges; most editors can auto-caption, but check the spelling of "AgroLeaf", "16123" and "EfficientNet".
- **Export:** MP4 (H.264), 1080p, 30 fps.
- **Upload:** YouTube → Visibility **Unlisted**. Title: "AgroLeaf AI – Rice disease screening in Bangla (AIgnite Buildathon 2026)". Copy the link.

## D. Final quality checklist
- [ ] Narration is entirely in English and clearly audible, with no music louder than the voice.
- [ ] The sticker is visible near the start.
- [ ] The scan, the result, the Bengali voice playing, the safety guidance and the voice assistant are shown.
- [ ] No notifications, personal tabs or passwords appear on screen.
- [ ] Bangla text is readable (zoom in if needed).
- [ ] 2–3 minutes long, with no long silent pauses.
- [ ] The YouTube link opens in an Incognito window (it is not Private).

## E. Honesty rules
Show only what really happens in the app. Don't stage a result, edit the screen to show a feature that didn't work, or claim farmer numbers or accuracy figures that aren't in the app. If something fails during recording, record it again; don't fake it.
