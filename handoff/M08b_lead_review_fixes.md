# M08b — Fixes from the lead's review of M02–M08 (do before anything else)

**Why:** the autonomous run delivered M02–M06 and part of M08 quickly. The lead's review on 1 Nov (about 08:25) found five defects. Two would visibly fail with judges (fake samples, mobile overflow), and one breaks rule §4.1 (an unsupported claim).
**Branch:** `fix/m08b-lead-review` · **Tag:** `m08b` · **User gate:** none.

## 1. REQUIRED: remove the fake sample images (rule §4.1 + honesty)
- **The problem:**
  - `frontend/public/samples/sample_*.jpg` are **random noise** (from the toy dataset), not rice leaves.
  - The UI credits them as "নমুনা: RiceLeafDiseaseBD (CC BY 4.0)". That is false attribution.
  - M08 item 5 was supposed to be **skipped** until M07.
- **The fix:**
  - `git rm` the 4 JPGs.
  - Make `SampleImagesStrip` load `/samples/manifest.json` (`[{id, labelBn, labelEn, src, credit}]`). If it is missing or empty, **render nothing**, with no empty heading.
  - Remove the hard-coded `SAMPLES` array.
  - M07 will add real images from the dataset, plus the manifest.
  - Keep the `sampleCredit` string, but show it only when the manifest has entries.
- Add a Vitest test: missing manifest → the component renders null.

## 2. REQUIRED: no horizontal overflow at phone width
- **The problem:** in `documentation/screenshots/m05/*.png` (about 390 px wide), the navbar's right side (Accuracy link, language toggle), the confidence chip and the body text are **cut off at the right edge**. M02 acceptance requires no horizontal scroll at 360×740.
- **Fix the root causes, not just the symptoms** (no blanket `overflow-x:hidden` on `body`):
  - **Navbar:**
    - Allow it to shrink: `min-w-0` on the text block; truncate the subtitle.
    - Below 400 px, show the nav links as **icon + very short label** or move them into a second row under the sticker.
    - **The sticker must stay fully visible and never shrink below 40 px height.**
  - **Cards:** add `min-w-0` to flex children; `break-words`/`overflow-wrap:anywhere` for long Bangla runs; wrap chips (`flex-wrap`); the container should be `w-full max-w-xl mx-auto px-4`.
- **Verify with headless Chrome at 360×740 and 390×844**, on Home, Preview, all 7 result states, Accuracy and About:
  - assert `document.documentElement.scrollWidth <= window.innerWidth`, saving the numbers in the commit body;
  - **re-take all screenshots** into `documentation/screenshots/m08b/` (360 px).

## 3. REQUIRED: the English name under the Bangla title shows the class key
- The result card shows `blast` (the key) instead of `name_en` from `disease_information_en.json` ("Rice blast").
- Fix it for every class, including `not_sure`.
- Add a test: for each key, the rendered secondary title equals `en.classes[key].name_en`.

## 4. REQUIRED: the threshold-tuning claim has no evidence behind it
- Commit `1b1ab8c` says the blur/dark thresholds were tuned "to prevent false positives on valid field leaf photos", but no real leaf photos exist in the repo yet.
- **Don't rewrite history.** Instead:
  - put back the `// TODO(M07): tune on real sample photos` comment in `imageQuality.js`, noting that the current values (DARK_MAX=40, BRIGHT_MIN=230, BLUR_MIN=50) are **provisional**;
  - add a line in PROGRESS.md "Assumptions made": "Quality thresholds are provisional; to be tuned in M07 on real dataset images."

## 5. REQUIRED: two overclaims in the About text (rule §4)
In `src/i18n/en.js` **and the Bangla equivalents in `bn.js`**:
- `aboutDescription`: replace "functioning reliably even with slow or intermittent connectivity" with "After the first load, it keeps working on a slow or broken connection." Bangla: "প্রথমবার লোড হওয়ার পর ধীর বা বিচ্ছিন্ন সংযোগেও কাজ করে।"
- `aboutPrivacyDesc`: replace "Processing is 100% on-device." with "All image processing happens on your device." Bangla: "ছবির সব বিশ্লেষণ আপনার ফোনেই হয়।"
- Search all i18n strings for "100%", "reliably", "always", "guarantee" and soften any absolute claims the same way.

## 6. Cloudflare settings: make the docs consistent
README and PROGRESS currently say "build command `cd frontend && npm run build`, output `frontend/dist`", while M02 says "root directory `frontend`". **Use the M02 version everywhere:**
- Root directory: `frontend`
- Build command: `npm run build`
- Output: `dist`
- Env: `NODE_VERSION=22`

Make sure `sync-content.mjs` resolves `../disease_knowledge` relative to its own file location (`import.meta.url`), not the process cwd, so it works in both setups.

## Acceptance checks
- [ ] No `frontend/public/samples/*.jpg` remain. Home shows no sample strip. The tests pass.
- [ ] The overflow assertion passes on all listed screens at 360 and 390 px. The new screenshots show the sticker, the nav and the full cards with nothing cut off.
- [ ] Each result card's English subtitle comes from `name_en`.
- [ ] `npm test`, `npm run lint` and `npm run build` pass. `git status` is clean 60 s after the push.
- [ ] Commits (examples):
  - `fix(ux): remove placeholder noise images from sample strip`
  - `fix(layout): prevent horizontal overflow at 360px`
  - `fix(result): show English disease name from content JSON`
  - `fix(quality): mark blur and darkness thresholds as provisional`
  - `fix(copy): soften absolute claims in About text`
  - `docs(deploy): align Cloudflare settings with M02`
