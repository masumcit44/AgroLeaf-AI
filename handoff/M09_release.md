# M09 — QA, fallback deployment, release v1.0.0

**Goal:** prove the product works for real users on real phones, deploy a backup copy, and cut a clean release before **5 Nov 2026, 6 PM BST**.
**Branch:** `chore/m09-release` · **Tags:** `m09` and **`v1.0.0`**
**User gates:** real-phone testing, the hallway test, connecting Vercel, and the Devpost submission are done by the user. Antigravity prepares everything and records results.

**Feature freeze:** from the start of M09, only `fix:`/`docs:`/`chore:` commits are allowed.

## 1. QA checklist → `documentation/qa/qa_checklist_v1.md` (fill in with ✅/❌ + notes + device name)
**Devices:**
- one low-end Android phone (2–3 GB RAM) with Chrome
- one other phone or a desktop Chrome

**On each device:**
- [ ] Fresh load on mobile data. Note the time until Home and until the first result.
- [ ] Cached load (second visit).
- [ ] Airplane mode after the first prediction → predicts again.
- [ ] Each sample image → the correct card appears. Audio plays and pauses.
- [ ] A non-rice photo (hand, mango leaf, soil) → "not sure" or a low-confidence route. Record 10 tries.
- [ ] A blurry or dark photo → a hint appears.
- [ ] 16123 opens the dialer.
- [ ] The language toggle works everywhere.
- [ ] The Accuracy and About pages load.
- [ ] The sticker is visible at the top on every page.
- [ ] Release blockers 1–8 (`handoff/01_MODULE_PLAN.md`) are all ✅.

## 2. Hallway test → `documentation/qa/hallway_test_v1.md`
- 5 Bangla speakers, no coaching. Tasks and pass criteria from `research_files/Agro_AI_Deep_Research_Result.md` §13. Copy the task list into the file.
- Record success, wrong taps, quotes, and fixes made.
- Fix only small, safe issues (`fix:` commits).

## 3. Fallback deployment (Vercel Hobby, free)
- **User:** Vercel → Add New Project → import the repo
  - **Root Directory** `frontend`; framework Vite; build `npm run build`; output `dist`
  - check "Include files outside the root directory" (needed by sync-content)
- Verify the `/ort/*.wasm`, `/models/*.onnx` and `/audio/*.mp3` responses are real files (not HTML).
- Add both URLs to README "Live demo": Primary (Cloudflare), Mirror (Vercel).

## 4. Release
1. README final:
   - live URLs
   - 3 screenshots (result, not sure, accuracy) in `documentation/screenshots/release/`
   - a short "How it works" diagram (text)
   - measured headline numbers **copied from `metrics-v1.json`**, with sample sizes
   - limitations
   - demo video link (the user fills it in)
2. `CHANGELOG.md`: `## [1.0.0] - 2026-11-05`, listing modules M00–M09.
3. Tag `v1.0.0`. Create a GitHub Release (`gh release create v1.0.0 --notes-file …` if gh is logged in; otherwise list the steps for the user) with highlights + limitations.
4. Update PROGRESS.md: everything ✅, final URLs.

## 5. Submission pack (for the user) → `documentation/submission/`
- `devpost_checklist.md`:
  - live app URL (Cloudflare)
  - deck ≤ 5 slides
  - optional English video (YouTube, ~2 min)
  - optional GitHub link
  - sticker visible
  - submit **before 6 PM BST, 5 Nov**
- `demo_script_en.md`: a 2-minute English video script.
  1. problem
  2. take a sample photo → result + Bangla audio
  3. non-rice photo → "not sure"
  4. Accuracy page with real numbers
  5. privacy
  6. closing line

  Use only measured numbers.
- `deck_outline.md`: copy the 5 slides from `documentation/buildathon_presentation_notes.md`, filled with real numbers and screenshots paths.

## Acceptance checks
- [ ] QA checklist complete. No ❌ on release blockers.
- [ ] Both URLs work in incognito on mobile data.
- [ ] Tag `v1.0.0` and the release exist on GitHub.
- [ ] Commits (examples):
  - `docs(qa): add v1 QA checklist results`
  - `docs(qa): record hallway test findings`
  - `fix(ux): clarify not-sure retake tips after hallway test`
  - `docs(readme): finalise README with live URLs and measured results`
  - `chore(release): v1.0.0`
