# AgroLeaf AI — Final Release Notes (5 Nov 2026 release)

**USER MANUAL ACCEPTANCE: PASS** (owner ran T1–T11 in `docs/AGROLEAF_FINAL_FEATURES_AND_MANUAL_TESTING.md`)
Production: https://agroleaf-ai.pages.dev · Repo: https://github.com/masumcit44/AgroLeaf-AI
Release = fast-forward of `main` from `698e1ec` to the accepted candidate (`deploy/candidate-ready`).
Previous production is tagged `prod-before-final-2026-11-05` (rollback point).

## Retained (farmer journey)
Leaf scan (v10, on device) · "not sure" abstention · Bangla result + recorded Bengali voice ·
reliability level · this-week plan · 16123 help · fake-pesticide warning · Bengali voice
assistant (122 recorded answers) · pesticide-dose safety filter · history · reminders ·
weather + GPS · offline.

## Deferred (flag off, code kept)
Yield-loss estimate, disease severity, AI heatmap, extra confidence card, outbreak map, feedback.

## Main changes since the previous production
- Bengali voice assistant with pre-recorded bn-BD answers (no English voice ever reads Bangla).
- Spoken "আম/আমার" confusion and planner mis-routing fixed.
- Safety filter: no pesticide names or spray/seed-treatment doses in any answer.
- Simplified UI: 5 tabs; result screen about half as long.

## Verification
509/509 automated tests, lint clean, production build OK (all files < 25 MiB); candidate and
production checked in a browser; owner acceptance on phones: PASS.

## Known limitations
Planner-generated (dynamic) answers are spoken only where the phone has a Bengali voice;
F14 reliability bands are measured on the validation set (in-sample); model is v10 (accuracy
and limits on the in-app Accuracy page); disease text not yet reviewed by an agronomist.

## Rollback (never force-push)
- Fastest: Cloudflare dashboard → Pages → agroleaf-ai → Deployments → previous production
  deployment → "Rollback to this deployment".
- In git: on `main`, `git revert --no-edit prod-before-final-2026-11-05..HEAD`, then
  `git push origin main`; Cloudflare rebuilds the old version.
- Single feature: switch its flag off in `frontend/src/features/flags.js` and push.
