# AUTONOMOUS MODE — the user is away (about 09:00–16:00 BST)

In this mode you do **not** wait for "continue" between modules. Every rule in `00_READ_FIRST_ANTIGRAVITY.md` still applies. This file only changes *when* you stop.

## Scope for this run (in this order)
1. **M02** frontend scaffold. Build and push everything. The Cloudflare connect is a **user action**: write it under USER ACTION NEEDED and **do not stop**.
2. **M03** image input
3. **M04** inference engine (placeholder model)
4. **M05** results + content
5. **M06** Bangla audio
   - Build the generator script and the player. **Do not** generate MP3s: there is no Azure key yet.
   - The player must hide itself gracefully when the files are missing.
   - Mark M06 as `✅ (audio files pending user key)`.
6. **M08** polish, **only the items that do not need the trained model.** Do items 1–4 and 6–12.
   - **Skip item 5** (sample images need real-model samples from M07).
   - In item 9, run Lighthouse on `npm run build && npm run preview` locally if there is no deployed URL yet.
   - Mark M08 as `🟨 partial (needs M07)`.

**Do NOT start M07 or M09.** They need the trained model and the user.

## Before each module
1. `git switch main && git pull`
2. Read `handoff/_lead/REVIEW_NOTES.md`. If it has a `REQUIRED FIX` that is not yet done, **do it first**:
   - branch `fix/<module>-review`, commit with a `fix(...)` message
   - merge, push
   - record it in PROGRESS.md under "Assumptions made" as `[DONE by Antigravity HH:MM] <fix>`
3. Then start the module.

## After each module
1. Run all of the module's acceptance checks, plus `npm test`, `npm run lint` and `npm run build` in `frontend/`.
2. Merge, push, tag, update PROGRESS.md, push.
3. **Wait 60 seconds.** Then `git status`.
   - If only trailing-blank-line changes appeared, `git restore` them.
   - Never restore `handoff/_lead/`.
4. Go to the next module immediately.

## Stop conditions (stop and write the reason under "Blockers" in PROGRESS.md)
- A build or test failure you cannot fix in **3 attempts**. Revert to the last green commit, then stop.
- Anything that needs an account, login, payment, secret key or personal data.
- Any instruction that would require deleting user files, force-pushing, rewriting history, or editing files outside this repository.
- A spec conflict that changes product behaviour. (Small, safe ambiguities: pick the simpler option, log it under "Assumptions made", and continue.)
- **Time:** after **15:30 BST**, do not start a new module. Finish the current one cleanly and stop.
- **Never** leave `main` broken. Every push to `main` must build.

## Final report (when you stop for any reason)
Add a section `## Autonomous run report <date>` at the top of PROGRESS.md with:
- modules completed (with tags)
- anything partial
- every USER ACTION NEEDED item
- all assumptions made
- any blocker, with the exact error text
- the local preview command for the user to try the app: `cd frontend && npm run dev`
