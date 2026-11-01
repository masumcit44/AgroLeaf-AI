# M06 — Bangla voice (pre-generated MP3 + player)

**Goal:** every result (6 classes + not sure) has a Bangla audio explanation with one big play/pause button. Audio files are generated **once**, offline, and served as static files.
**Branch:** `feat/m06-bangla-audio` · **Tag:** `m06`
**User gate:** Azure Speech key (free F0 tier). **The player must work gracefully without the MP3s**, so this module can be merged before the key arrives.

## Part A — generator script (Python, no SDK needed)
`ml/tools/generate_tts.py`:
- Reads `disease_knowledge/disease_information_bn.json` → for each class key + `not_sure`, takes `voice_script_bn`. Does not modify it.
- **Azure Speech REST API:** `POST https://{REGION}.tts.speech.microsoft.com/cognitiveservices/v1`
  - headers: `Ocp-Apim-Subscription-Key: {KEY}`, `Content-Type: application/ssml+xml`, `X-Microsoft-OutputFormat: audio-24khz-48kbitrate-mono-mp3`, `User-Agent: agroleaf-tts`
  - SSML: `<speak version="1.0" xml:lang="bn-BD"><voice name="bn-BD-NabanitaNeural"><prosody rate="-5%">{escaped text}</prosody></voice></speak>`
  - `--voice` flag allows `bn-BD-PradeepNeural`
- Key/region come **only** from the environment variables `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`. Optionally read a git-ignored `.env` in the repo root with a tiny parser (no extra dependency). **Never print the key.**
- Output: `frontend/public/audio/<key>-v1.mp3`.
- Flags:
  - `--dry-run` prints each key's character count and the total. It must be far below the 500,000 free characters, and the script refuses to call the API if the total is > 20,000.
  - `--only blast`
- Writes `frontend/public/audio/manifest.json`: `{key: {file, voice, chars, generated_at}}`.
- Use only the standard library (`urllib.request`, `json`, `xml.sax.saxutils.escape`).

**USER steps** (put them in `ml/README.md`):
1. Azure portal → create a **Speech** resource, pricing tier **Free F0**.
2. Copy Key 1 + region.
3. Create a `.env` file in the repo root:
```
AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=southeastasia
```
4. Run `python ml/tools/generate_tts.py --dry-run`, then run it without `--dry-run`.
5. Listen to all 7 files. Ask 2 native speakers about clarity.

If the voice is poor or the licence is uncertain, **record your own voice** (mono MP3, same file names) and update the manifest by hand (`"voice":"human"`).

## Part B — player
`src/components/AudioExplain.jsx`:
- One big round button (≥ 64 px), "▶ শুনুন" ↔ "⏸ থামান" ("Listen" ↔ "Pause"), a thin progress bar, and a "↺ আবার" (Again) replay. `aria-label`s in Bangla.
- **Plays only after a user tap** (no autoplay). Only one audio plays at a time. Pause it on navigation or retake.
- Under the button: small grey "এআই-তৈরি কণ্ঠ" / "AI-generated voice" (or "রেকর্ড করা কণ্ঠ" — "recorded voice" — if manifest voice = human). A "লেখা দেখুন" ("Show text") toggle reveals `voice_script_bn`.
- **If the manifest or the file is missing / 404 / errors:** hide the player silently (console.warn once). The card still works.
- `preload="none"`, so the file is only fetched when the user presses play.
- Add the player to ResultCard and NotSureCard, near the top (right after the title). Voice is the main channel for low-literacy users.

## Acceptance checks
- [ ] `generate_tts.py --dry-run` prints counts with **no network call**. With a key, it creates 7 MP3s plus the manifest.
- [ ] The player plays and pauses on Android Chrome, stops on retake, and never plays two at once.
- [ ] Delete one MP3 → that card hides the player, no crash.
- [ ] `.env` is **not** in `git ls-files`. No key appears in any committed file.
- [ ] The MP3s (small) **are** committed. Each is < 1 MB.
- [ ] Commits (examples):
  - `feat(tts): add Azure bn-BD batch generator with dry-run guard`
  - `feat(audio): add tap-to-play Bangla explanation player`
  - `chore(audio): add generated Bangla audio v1`
