# AgroLeaf AI — Release Notes (candidate 8f2fa1b, 4 Nov 2026)

Status: **candidate only** (`deploy/candidate-ready`). Production unchanged until the owner
approves promotion to `main`.

## Changes in this candidate
- **Voice:** Bengali answers are no longer read with an English voice. The app waits for the
  phone's voices, uses only a real Bengali voice, and otherwise shows a Bangla message with
  install steps instead of speaking. Long answers are read fully; links and source lines are skipped.
- **Simpler result screen:** essentials first; deferred analysis removed from the first view (about half the scrolling).
- Developer feature IDs removed from on-screen labels.
- **Focused product:** yield impact, disease severity, AI heatmap and the extra confidence card
  are deferred (switched off, code kept); the voice assistant lives only in its own tab;
  5 tabs (profile opens from Home). Result screen ~3.8 phone screens at 360 px.

## Known limitations
- Bengali voice for free-form Copilot answers depends on the device having a Bengali voice
  (usually Android with Google TTS; usually not Windows desktop or iPhone).
- Not yet re-audited: live camera, reminders, yield risk, copilot answer quality, outbreak warning,
  security of new endpoints (see AGROLEAF_FINAL_PRODUCT_AUDIT.md).

## Promote to production (owner approval required)
From the integration worktree: `git push origin deploy/candidate-ready:main` after the manual
checklist passes; then confirm https://agroleaf-ai.pages.dev serves the new `assets/index-*.js`.
