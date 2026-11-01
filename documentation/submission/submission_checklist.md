# AIgnite 2026 — submission checklist (draft)

Built from `documentation/competition_compliance.md`. Tick each box only when it is true on the live submission, not just in the repo.

**Key dates:** deadline **5 Nov 2026, 11:59 PM Bangladesh time (UTC+6)**. Internal target **5 Nov, 6 PM**. Final Round **27 Nov 2026** (Top 20); keep the judged app live at least until then.

**Official links to re-check daily:** [rules](https://yunet-aignite26.devpost.com/rules) · [Devpost overview](https://yunet-aignite26.devpost.com/) · [Facebook event](https://www.facebook.com/events/1105605668859713/) · your email. The rules may change.

---

## A. Mandatory items (failing these can disqualify)

- [ ] **Official sticker** is visible in the **navbar** on every page and every state (home, preview, result, not-sure, accuracy, about), on mobile and desktop.
  - [ ] It is **not** footer-only, not inside a collapsed menu, and not covered by a banner, modal or chat widget.
  - [ ] The official file is used unchanged in design; only proportional resizing is allowed.
  - [ ] Display height 44–52 px on mobile, up to 64 px on desktop; aspect ratio kept.
  - [ ] `alt="Built For Ostad Presents YUNet AIgnite Buildathon 2026"`.
  - [ ] Source: Google Drive folder "Built for AIgnite 2026 Sticker" → `Built for AIgnite 2026.png`; original kept as `frontend/public/brand/aignite-sticker-original.png`.
  - [ ] Sticker also on the deck's title slide and in the video's opening app shot (not required, but recommended).
- [ ] **Live, functional web app**, publicly accessible on a phone, with no login for judges.
  - [ ] Primary URL: `[[Cloudflare Pages URL]]`
  - [ ] Mirror: `[[Vercel URL]]`
  - [ ] Tested on a real low-end Android phone, fresh load and cached load.
  - [ ] Tested with Wi-Fi off after the first load (on-device inference).
  - [ ] Keep it live until at least **27 Nov 2026**.
- [ ] **Deck: maximum 5 slides**, covering Problem, Solution, How it works, **Participant introduction**, and other info.
  - [ ] Built from `documentation/submission/deck_outline.md`.
  - [ ] Slide 4 has `[[name, university, skills]]` filled in.
  - [ ] No sixth slide. Sources are in the speaker notes.
  - [ ] Every number is measured or says "evaluation in progress"; no estimates.

---

## B. Rules and status (from the compliance table)

| # | Rule | Action | Owner | Done |
|---|---|---|---|---|
| 1 | Official sticker in navbar/prominent top area | See section A | You | [ ] |
| 2 | Functional public web app; judges can test it | Cloudflare + Vercel; keep live | You | [ ] |
| 3 | AI plays a meaningful role | CNN does the core task; calibrated abstention | — | [x] by design |
| 4 | Strictly individual; one project only | Solo entry; one Devpost project | You | [ ] |
| 5 | Student in Bangladesh; proof may be requested | Keep student ID / enrolment proof ready | You | [ ] |
| 6 | Existing projects need meaningful AIgnite improvements | All app code is new; if asked, state the idea/research began earlier and this app was built for AIgnite | You | [ ] |
| 7 | Rights to third-party content, software, datasets | CC BY 4.0 datasets with DOIs; Google Fonts OFL; onnxruntime-web MIT; BAMIS quoted with link; app credits page | You | [ ] |
| 7a | Earlier research was made with others | Get their agreement before submitting; credit them in the repo/About | You | [ ] |
| 8 | Comply with third-party terms | Azure voice: confirm output may be used in a public app **or** record the clips yourself; Cloudflare/Vercel personal non-commercial use | You | [ ] |
| 9 | Deck ≤ 5 slides incl. participant intro | See section A | You | [ ] |
| 10 | Demo video optional; if submitted, **English**, on YouTube | ~2-min script in `documentation/submission/demo_script_en.md` | You | [ ] |
| 11 | GitHub link optional; source may be requested | Public repo: https://github.com/masumcit44/AgroLeaf-AI | — | [x] |
| 12 | Submission only on Devpost; links accurate and accessible | Do not break the judged URL; deploy production from a `release` branch | You | [ ] |
| 13 | Judging: Problem · Solution · AI/Tech · UX & Readiness · Presentation & Pitch | Deck + video + live demo flow | You | [ ] |
| 14 | Deadline 5 Nov, 11:59 PM Bangladesh time | Internal target 6 PM | All | [ ] |
| 15 | Mandatory: live app, deck, sticker | Section A | All | [ ] |

---

## C. Devpost project page

- [ ] Title: **AgroLeaf AI**
- [ ] Tagline: "Tells you what's wrong in Bangla — and tells you when it doesn't know."
- [ ] Story pasted from `documentation/submission/devpost_story.md`; all `[[...]]` replaced.
- [ ] Solo builder: text uses "I", not "we".
- [ ] Inspiration section is transparent about the earlier team research and the individual app build.
- [ ] Every accuracy/coverage/latency number is `[[TBD after training]]` replaced by a value from `metrics-v1.json`, with the sample size nearby.
- [ ] Chosen track/category selected on Devpost.
- [ ] Thumbnail and gallery images uploaded (show the app + sticker).
- [ ] "Built with" list matches the draft.
- [ ] Live app URL, GitHub URL, video URL all open in a private browser window.
- [ ] No broken links, no local `localhost` links, no private Drive links.
- [ ] Demo video is **English**, on YouTube, and linked.
- [ ] Devpost project is **submitted** (not just saved as a draft).
- [ ] Submission confirmation email/screenshot saved.

---

## D. Content and safety checks

- [ ] No **pesticide or fertiliser dose** appears anywhere in the app, deck, video or story.
- [ ] Disease text comes only from `disease_knowledge/*.json`; placeholder `official_guidance` sections are hidden.
- [ ] Official BAMIS guidance, if shown, is quoted verbatim with a source link and "confirm with your officer / 16123".
- [ ] The app never says "diagnosis", "first", "only", "free call", "100% accurate", "works everywhere in Bangladesh", or claims a BRRI/DAE/AIS partnership.
- [ ] It says **preliminary screening / প্রাথমিক ধারণা**, not a diagnosis.
- [ ] `16123` is described as a hand-off; the app does not say the call is free.
- [ ] "Not sure" shows top-2 possibilities, retake tips and 16123; it does not force a class.
- [ ] Accuracy page shows external-district results, coverage, sample sizes, dataset credits (CC BY, DOIs) and the Leaf Smut external-test gap.
- [ ] No accuracy, F1, latency or user number appears until it is measured; otherwise "মূল্যায়ন চলছে / Evaluation in progress".
- [ ] Leaf Smut is routed to "not sure" if its validation recall is poor.
- [ ] Voice is pre-recorded, plays only on user tap, has a transcript beside it and is labelled "AI voice".
- [ ] No analytics, error-tracking SDK or third-party script that could capture images; only Google Fonts (CSS).

---

## E. Privacy and technical verification

- [ ] The photo is **never uploaded**: verify the browser Network tab shows no image request during a prediction.
- [ ] Inference uses `onnxruntime-web/wasm`, not the default import; `.wasm` is served from `/ort/` and not rewritten to `index.html`.
- [ ] ONNX file is under the Cloudflare per-file limit; `export_onnx.py` size check passed.
- [ ] PyTorch vs ONNX parity < 1e-3 (`parity_test.py`).
- [ ] Class order is identical in the model, `class_index.json` and the disease JSON.
- [ ] The threshold and temperature in the app come from `calibration.json` (validation data), not a hard-coded value.
- [ ] Every async action has a loading state, a Bangla error message and a retry.
- [ ] App builds (`npm run build`) and the live page has no console errors.
- [ ] The sticker is not covered when a modal, toast or the audio player is open.
- [ ] Tested on a small screen (360 px wide) and a desktop browser.

---

## F. Submission order (do this on 5 Nov, before 6 PM)

1. [ ] Freeze app content; run the full smoke flow on the live URL on a phone.
2. [ ] Merge production to the `release` branch; deploy; confirm the judged URL.
3. [ ] Fill every `[[TBD after training]]` from `metrics-v1.json` (app, deck, story, video, model card).
4. [ ] Record/re-record the video if numbers changed; upload to YouTube (English).
5. [ ] Final sticker check on every route and state, including modals.
6. [ ] Paste the story into Devpost; add video, links and images.
7. [ ] Submit on Devpost; save the confirmation.
8. [ ] **Do not touch `main` in a way that can break the judged URL**; later work stays off the release branch.
9. [ ] After submitting, re-check the Devpost page in a private window and on a phone.

---

## G. Open items / unknowns

- [ ] Live URLs: `[[Cloudflare Pages URL]]`, `[[Vercel URL]]`.
- [ ] Azure voice output terms, or switch to human-recorded clips.
- [ ] Agreement from the earlier research collaborators.
- [ ] Participant introduction: `[[name, university, skills]]`.
- [ ] Trained model and all metrics: `[[TBD after training]]`.
- [ ] Real-phone latency: `[[TBD after measurement]]`.
- [ ] Official rules re-checked on the submission day.
