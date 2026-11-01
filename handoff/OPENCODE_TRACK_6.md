# OpenCode Track 6 — independent v1 test pass

You are tester **opencode**. Two other testers (lead, Antigravity) run the same plan separately. **Do not read** their reports until yours is committed.

## Rules
- **Report only. Change no app, ML, data or content file.**
- First merge `origin/main` into `track/opencode` (fast-forward or a merge commit; resolve nothing by hand). If there is a conflict, abort and write the error in your report.
- You have no visual browser, so test with scripts. puppeteer-core is in `frontend/node_modules`; Chrome is at `C:/Program Files/Google/Chrome/Application/chrome.exe`.
  - Read page text and DOM.
  - Upload files to `input[type=file]:not([capture])`.
  - Click buttons by their text.
  - Check `document.documentElement.scrollWidth <= innerWidth` at 360/390/768/1280 px.
- Put helper scripts in `documentation/qa/opencode_scripts/`. Never put them in `frontend/src`.

## What to do
1. Run every check in `documentation/qa/TEST_PLAN_v1.md`, sections A to L, against `npx vite preview --port 4176`. Mark checks that need human eyes or a phone as `N/A (needs human)`, with a one-line reason.
2. Also do a code review for defects. Report findings only; don't fix them.
   - `frontend/src/ml/` (decide, leafCheck, predict, preprocess)
   - `frontend/src/state/useScanFlow.js`
   - `frontend/src/components/ResultScreen.jsx` and `NotSureCard.jsx`
   - `frontend/src/pages/AccuracyPage.jsx`

   Look for unhandled promise errors, races on double click, memory leaks (object URLs, canvases), and wrong i18n keys.
3. Write `documentation/qa/test_report_opencode.md` in the plan's format.
4. Commit with this message:
   ```
   test(qa): independent v1 test pass (opencode)
   ```
   Push `track/opencode`. Print `TRACK6_DONE`.
