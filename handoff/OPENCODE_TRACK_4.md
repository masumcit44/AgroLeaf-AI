# OPENCODE TRACK 4 — deck generator (run headless by the lead)

All boundaries in `handoff/OPENCODE_TRACK.md` apply: this folder only; branch `track/opencode`; new files only; Conventional Commits with "Why:"; push; add a "Track 4" section to `handoff/OPENCODE_PROGRESS.md`; stop by 15:30 BST.

## O12 — `documentation/submission/deck_build.py` (python-pptx) → `documentation/submission/AgroLeaf_AI_deck_v1.pptx`
- 16:9, exactly **5 slides**, following `documentation/submission/deck_outline.md` and `documentation/buildathon_presentation_notes.md`:
  1. Problem
  2. Solution
  3. How it works
  4. About me (participant introduction)
  5. Impact, safety and next steps
- **Official sticker:** `assets/brand/aignite-sticker-original.png` in the top-right of slide 1, about 2.4 inches wide, keeping its aspect ratio. Do not alter the image.
- **Clean, professional design:**
  - leaf-green `#1f6b3a`, paper `#fbfaf6`, ink `#1c1c1c`
  - large text, few words per slide (≤ 30 words of body text per slide)
  - English text, with key Bangla terms only where the outline uses them
  - speaker notes from the outline
- **Placeholders:**
  - every number is `[[TBD]]`
  - every screenshot is a grey box labelled with the path it will come from (e.g. `documentation/screenshots/m08b/03_blast_390w.png`); if that file exists, insert the real image instead
  - slide 4 uses `[[Your name]]`, `[[University]]`, `[[Skills]]`
- Read metrics from `frontend/public/data/metrics-v1.json` **if it exists** (it won't exist yet). Use `internal_test.macro_f1`, `coverage`, and the external values, labelled "measured". Otherwise `[[TBD]]`.
- **CLI:** `python documentation/submission/deck_build.py --out documentation/submission/AgroLeaf_AI_deck_v1.pptx`. Install `python-pptx` if it is missing (`pip install python-pptx`).
- **Test:** run it; open the result with python-pptx; assert there are 5 slides and that the sticker picture is on slide 1. Commit the script, plus the generated `.pptx` (it is small).
- Never write "diagnosis" (except "not a diagnosis"), "first/only", "free call", "100%", or a partnership claim.

## Done
Push. Add a "Track 4 summary" at the top of OPENCODE_PROGRESS.md. Print `TRACK4_DONE` as the very last line.

## Restart note (lead, 10:50)
- The first attempt timed out after 90 min, looping on Windows console encoding errors ("charmap codec can't encode character '\u2713'"). **Do not print non-ASCII characters to the console.** Python runs with `PYTHONUTF8=1` now, but keep console output ASCII anyway.
- `deck_build.py` and `AgroLeaf_AI_deck_v1.pptx` already exist (uncommitted) from the first attempt. **Review and finish them; don't start over.** Text-fit polishing: at most 2 passes. Then commit, push and finish.
- **Time box:** 30 minutes.
