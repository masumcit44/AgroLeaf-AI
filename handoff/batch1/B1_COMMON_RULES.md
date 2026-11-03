# Batch 1 — rules for every agent (read first)

Lead: Claude. Plan: `D:\Desktop\AIgnite 2026\AgroLeaf_lead_worktree\documentation\feature_plan\` (research, DB/API design, parallel plan, backlog).

## Foundation already merged (`deploy/candidate-ready` @ `ec855c4`)
- **Feature folders:** `frontend/src/features/<name>/index.jsx` already export your components with fixed names (stubs that return `null`). They are already mounted on the home page, the result screen, the app frame and the routes `#/history`, `#/profile` and `#/map`.
  - **Keep the export names and the `{ scan, context }` props.**
  - `scan` on result slots = `{ canvas, probs, decision, calibration, classKey, isConfident }`; it is `null` elsewhere.
- **Flags:** `frontend/src/features/flags.js`. Everything is OFF in production; do **not** edit this file.
  - To see your feature on a preview or dev server, open it with `?features=<name>` (e.g. `?features=history`); the browser remembers this.
  - On the production host the override is ignored.
- **Error boundary:** every feature runs inside one. A crash hides only your feature.
- **Texts:** put them in `frontend/src/features/<name>/i18n.js` only, as `{ bn: {...}, en: {...} }`.
  - Every key starts with `<name>.` (e.g. `history.title`).
  - Bangla first, plain words. A test enforces the prefix and that both languages have the same keys.
- **Local storage:** `frontend/src/lib/store/db.js` (`getDb()`, `STORES`), `device.js`, `outbox.js`. Use them; do not change them.
- **API:** `frontend/functions/api/v1/**` (Cloudflare Pages Functions) with helpers in `frontend/server/`. Tests run on `node:sqlite` as a D1 stand-in (`frontend/server/__tests__/d1Fake.js`).

## Rules
1. Work **only** in your own folder and branch (given in your brief). Never push to `main` or `deploy/candidate-ready`, never merge, never `reset --hard`, force-push or delete others' work.
2. Edit **only** the files your brief lists. Need a change elsewhere (e.g. `App.jsx`, `slots.jsx`, `ml/`, `package.json`)? Write it in your report; the lead does it.
3. No new npm packages without asking the lead. Available already: `idb`, `leaflet`, `vite-plugin-pwa`, `fake-indexeddb` (dev).
4. No secrets, keys or tokens in any file. Do not touch `D:\Desktop\ai_battle`.
5. Never show a raw confidence percentage, a pesticide name or a dose. Never claim a disease got worse or better.
6. Before reporting, run in `frontend/`:
   - `npm test`, `npm run lint`, `npm run build`;
   - your own new tests (they must pass);
   - for UI work, screenshots at 390 px width, in Bangla and English.
7. Commit on your branch, push your branch (`git push -u origin <branch>`), and report:
   - branch and last commit;
   - files changed;
   - test output summary;
   - screenshots;
   - anything unfinished or unsure.
8. A branch push builds a preview at `https://<branch-with-dashes>.agroleaf-ai.pages.dev` (e.g. `feat-f16-history`). Test your feature there with `?features=<name>`.
