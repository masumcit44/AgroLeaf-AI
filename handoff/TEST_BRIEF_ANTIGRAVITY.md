# Antigravity — independent v1 test pass

You are tester **antigravity**. Two other testers (lead, OpenCode) run the same plan separately. **Do not read** `documentation/qa/test_report_lead.md` or `test_report_opencode.md` until your own report is committed.

## Rules
- **Report only. Change no app, ML, data or content file.** Any finding is fixed later by the lead, one by one.
- Start clean:
  ```bash
  git restore .
  git pull --ff-only
  ```
  Write the commit hash at the top of your report.
- Test the **production preview**:
  ```bash
  cd frontend
  npm ci
  npm run build
  npx vite preview --port 4175
  ```
  App: http://localhost:4175
- Use your browser tool for every UI check. Take a screenshot of every FAIL.

## What to do
1. Run every check in `documentation/qa/TEST_PLAN_v1.md`, sections A to L. Skip only I2 (a real phone; the human does it). Mark it `N/A (human)`.
2. For F (safety gate), use:
   - `documentation/screenshots/release/inputs/not_sure_closeup.jpg`
   - `assets/brand/aignite-sticker-original.png`
   - a desktop screenshot you take yourself
   - a blurred copy of `frontend/public/samples/blast_1.jpg` (any blur tool, or Python Pillow `GaussianBlur(14)`; keep it outside the repo)
3. For C4/C5, create the test files outside the repo: a GIF, a PDF, a .txt renamed to .jpg, a 4000×3000 JPG and a 64×64 JPG.
4. Write `documentation/qa/test_report_antigravity.md` in the format the plan gives. Put screenshots in `documentation/qa/shots_antigravity/`.
5. Commit only those two paths. Use this commit message:
   ```
   test(qa): independent v1 test pass (antigravity)
   ```
   Then push to `main` with `git pull --rebase` first.

## Done
Stop after pushing. Do not fix anything.
