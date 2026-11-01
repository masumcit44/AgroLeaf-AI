# Y-BACKLOG — while Kaggle trains (autonomous; same rules as AUTONOMOUS_MODE.md)

**Priority rule:** before each Y module, check for `D:\Desktop\AIgnite 2026\kaggle_runs\run1\run1_for_app.zip`. If it exists, finish the current module, then do **M07** (REVIEW_NOTES 09:25) before any remaining Y module.

## Y1 — M07 rehearsal with the toy run (throwaway branch, NEVER merged)
**Goal:** prove tonight's real M07 path works end to end before the real model arrives.
1. Branch `rehearsal/m07-toy` from `main`.
2. Zip `ml/outputs/toy` into the bundle format OpenCode's tool expects (check `ml/tools/make_release_bundle.py`). If `ml/outputs/toy` is missing, recreate it with the M01 smoke test.
3. Run `make_release_bundle.py --dry-run`, then the real run. Follow M07 steps 2–8 (config switch, parity page, accuracy page).
4. Run `npm test`, `npm run build`, `npm run smoke`, `npm run check:release`.
   - Record which release checks pass or fail, and any problem in the tools or the M07 instructions.
5. Write the findings to `handoff/M07_REHEARSAL_NOTES.md` **on `main`**: what worked; exact errors; any fixes needed in `make_release_bundle.py` or the app.
   - Fix real bugs in **app code** on `main` as `fix(...)` commits.
   - For bugs in OpenCode's tools, describe them in the notes. Don't edit those files; the lead will route the fix.
6. **Delete the rehearsal branch locally. Never push it. Never merge it.** The toy model's metrics are not real and must never reach `main`.

## Y2 — Professional README (product page for judges)
- Sections:
  - hero line
  - "Live demo" (placeholder until deploy)
  - **screenshots** from `documentation/screenshots/m08b/` (home, result, not-sure, accuracy; 390 px)
  - the problem
  - how it works: a mermaid diagram of photo → on-device ONNX → calibration → result/not-sure → Bangla card + audio → 16123
  - key features
  - Responsible AI: screening, not diagnosis; no AI doses; privacy
  - tech stack
  - repo structure
  - local development
  - release checklist (`npm run check:release`)
  - data and licences
  - built for AIgnite 2026
- **No numbers yet:** "Measured results: see the in-app accuracy page (evaluation in progress)."
- Keep it concise. Check the Bangla renders correctly on GitHub.

## Y3 — Lighthouse and accessibility evidence
- Run `npm run build && npm run preview`, then Lighthouse mobile (via puppeteer-core, or the Lighthouse CLI if installable with npx without a global install) on Home, Accuracy and About.
- Fix real issues: contrast, labels, tap targets, image sizes, font loading.
- Record the **actual** scores in `documentation/qa/lighthouse_v1.md`, with the date and settings.

## Y4 — Performance budget check
- Measure and record in `documentation/qa/performance_v1.md`:
  - JS bundle size (gzip)
  - first-load bytes excluding the model
  - placeholder model size
  - time to interactive on a throttled "Slow 4G" + 4× CPU profile (puppeteer)
- Apply only safe, low-risk improvements: lazy-load the Accuracy/About/dev-parity routes; `fetchpriority`; preconnect to the font host.

## Stop
At 15:30 BST, or when Y4 is done and no zip has appeared: write the autonomous report and stop.
