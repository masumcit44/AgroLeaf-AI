# M08 — Product readiness polish (the 16-mark criterion)

**Goal:** make the app feel complete, fast and trustworthy on a cheap Android phone with weak network. **No new features** beyond this list.
**Branch:** `feat/m08-polish` · **Tag:** `m08` · **User gate:** none.

## Checklist (do in this order; commit in small pieces)
1. **First-visit onboarding:**
   - a dismissible 3-step strip on Home: photo of one leaf → wait → listen to advice
   - remember the dismissal in localStorage (try/catch)
2. **Loading states:**
   - model download progress bar with % and "প্রথমবার একটু সময় লাগে" ("it takes a little time the first time")
   - skeleton for the result card
   - disable double taps on "পরীক্ষা করুন" (Check)
3. **Error boundary** around the app: a friendly Bangla screen + "আবার শুরু করুন" (Start again) reload button. **No stack traces to the user.**
4. **Offline / slow network:**
   - if `navigator.onLine` is false before the model is cached, show "ইন্টারনেট সংযোগ দরকার (প্রথমবার)" ("an internet connection is needed the first time")
   - after the model is cached (HTTP cache), the app still predicts
   - do **not** add a service worker (out of scope)
5. **Sample images (S2):**
   - a "নমুনা ছবি দিয়ে দেখুন" ("Try with a sample photo") row of 4–6 thumbnails from `public/samples/`
   - tapping one runs the normal flow
   - caption credit "নমুনা: RiceLeafDiseaseBD (CC BY 4.0)" ("Sample: …")
6. **Share (S3):**
   - Web Share API with text "এগ্রোলিফ এআই: সম্ভাব্য সমস্যা — {name_bn}। {what_to_do_now_bn} ১৬১২৩" ("AgroLeaf AI: possible problem — …") plus the site URL
   - fallback: copy to the clipboard with a "কপি হয়েছে" ("Copied") toast
   - **Never share the photo.**
7. **Quality-hint tuning:** run 10 sample and 5 deliberately blurry or dark photos. Adjust `DARK_MAX`/`BLUR_MIN` so good samples get no hint. Record the values and the reasoning in the commit body.
8. **Accessibility pass:**
   - all buttons ≥ 48 px; focus outlines visible; icon buttons have `aria-label`
   - contrast ≥ 4.5:1 (check with Lighthouse)
   - `lang` attribute correct; headings in order
9. **Performance pass:**
   - `npm run build` + Lighthouse mobile on the Cloudflare URL
   - targets (report actual numbers, don't fake them): Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95
   - check `_headers` caching with DevTools: `/ort/*`, `/models/*`, `/audio/*` are immutable; `index.html` is no-cache
10. **About page (final):**
    - what the app is and isn't
    - privacy (photo stays on the phone; no account; no tracking)
    - dataset credits with DOIs
    - content sources (BAMIS/DAE link)
    - the competition line
    - "AI-generated voice" note
    - contact = GitHub repo link
11. **Meta:** page title, description, Open Graph tags (title, description, an image you make from a screenshot), `theme-color`, favicon.
12. **Copy review:** read every Bangla UI string once. Keep sentences short. **Disease JSON text is not yours to edit.**

## Acceptance checks
- [ ] A fresh visit on a throttled "Slow 4G" DevTools profile: the home screen appears < 3 s; the first prediction completes with visible progress.
- [ ] Lighthouse scores recorded in PROGRESS.md (actual values) and the screenshot saved to `documentation/screenshots/m08/`.
- [ ] Kill the network after the first prediction → a second prediction still works.
- [ ] No console errors. Tests, lint and build pass.
- [ ] Commits (examples):
  - `feat(ux): add first-visit onboarding strip`
  - `feat(ux): add model download progress and result skeleton`
  - `feat(ux): add sample images for quick evaluation`
  - `feat(share): share result text via Web Share API with fallback`
  - `fix(quality): tune blur and darkness thresholds on sample photos`
  - `perf(build): verify caching headers and asset sizes`
  - `docs(about): add privacy, credits and sources page`
