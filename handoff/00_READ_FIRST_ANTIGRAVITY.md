# 00 — READ FIRST: rules for the Antigravity agent

You are the **implementation engineer** for **AgroLeaf AI**. The project lead (Claude) has already done the research and locked every technical decision. Your job is to **build exactly what the module files say**, one module at a time, with clean professional Git history.

**Do not redesign, re-research, or add features.** If something in a module file seems wrong or impossible, **stop and write the problem in `handoff/PROGRESS.md` under "Blockers"**. Do not invent a workaround.

---

## 1. What we are building (30-second summary)
A **public, mobile-first web app** for Bangladeshi rice farmers:
1. The farmer takes or uploads a photo of a rice leaf.
2. A small image model (MobileNetV3, ONNX) runs **inside the browser**. The photo is **never uploaded**.
3. The app shows one of 6 classes (`healthy, blast, brown_spot, leaf_smut, tungro, sheath_blight`), **or "not sure"** when confidence is below a calibrated threshold.
4. It shows a short Bangla + English explanation and next steps, plays **pre-recorded Bangla audio** (play/pause), and offers a `tel:16123` call button.
5. A **"How accurate is it?"** page shows measured test results honestly.

**Competition:** Ostad Presents YUNet AIgnite Buildathon 2026. **Solo** entry.
- **Hard deadline:** 5 Nov 2026, 11:59 PM Bangladesh time (UTC+6). Our internal deadline is **5 Nov, 6 PM**.
- **Judging:** Problem 12 · Innovation 12 · AI/Tech 10 · **UX & Product Readiness 16**.
- **A working, polished, never-broken app beats extra features.**

## 2. The locked stack (do not change)
| Part | Decision |
|---|---|
| Frontend | **React + Vite + Tailwind CSS**, **JavaScript** (not TypeScript), in folder `frontend/` |
| ML runtime in browser | **`import * as ort from 'onnxruntime-web/wasm'`**. **NEVER** the default `import ... from 'onnxruntime-web'`: it loads a 29.5 MB `.jsep.wasm` file, which is bigger than Cloudflare's 25 MiB per-file limit and will break deployment |
| Model | MobileNetV3-Large, **float32 ONNX**, input `1×3×224×224`. No quantisation |
| Backend / database | **None.** All content is static JSON; all audio is static MP3 |
| Voice | Pre-generated MP3 files (Azure `bn-BD-NabanitaNeural`), played with an `<audio>` element on user tap only (no autoplay) |
| Hosting | **Cloudflare Pages** (build from GitHub), with a second copy on **Vercel** |
| ML training | Python scripts in `ml/`, run by the user on **Kaggle (free GPU)**. This PC has no usable GPU |
| Cost | **Everything must be free.** Never add a paid service, a paid API, or anything needing a credit card except what a module file explicitly names |

## 3. Sources of truth (read before coding; do not edit unless a module says so)
1. `research/final_decisions.md` — every locked decision, and the **release blockers** (§4).
2. `documentation/MVP_requirements.md` — features P1–P8 (primary), S1–S6 (secondary), rules.
3. `documentation/system_architecture.md` — data flow, folder layout, `_headers`.
4. `documentation/frontend_spec.md` — screens and UI rules.
5. `disease_knowledge/disease_information_bn.json` and `_en.json` — the **only** source of disease text.
6. `data/disease_classes.md`, `data/dataset_preparation_plan.md`, `model/training_plan.md`, `model/evaluation_plan.md` — ML rules.

If two documents disagree, **`research/final_decisions.md` wins**. Then report the conflict in PROGRESS.md.

## 4. Absolute rules (breaking any of these can disqualify or embarrass the project)
1. **No invented numbers.** Never write an accuracy, F1, latency or user count anywhere (UI, README, commits) unless it came from a real run whose output file is in the repo. Until then, show "মূল্যায়ন চলছে / Evaluation in progress".
2. **No pesticide or chemical dose is ever written by you.**
   - Disease text comes **only** from `disease_knowledge/*.json`. Do not rewrite, translate, "improve" or add medical or agricultural advice.
   - If an `official_guidance.text_bn_verbatim` value starts with `[`, it is a placeholder. **Hide that section** in the UI.
3. **The photo must never leave the device.**
   - No upload, no analytics SDK, no error-tracking SDK that captures images.
   - No third-party scripts except Google Fonts (CSS only).
4. **Never claim** "first", "only", "diagnosis", "100% accurate", "works everywhere in Bangladesh", "free call", or any partnership with BRRI/DAE/AIS. Use "screening / প্রাথমিক ধারণা" (preliminary idea), not "diagnosis".
5. **The official AIgnite sticker must be visible in the navbar on every page.** File: `frontend/public/brand/aignite-sticker.png` (the user provides it).
6. **Do not touch:**
   - `D:\Desktop\ai_battle\` (read-only archive)
   - `research_files/` and `reports/` (private; git-ignored)
   - any dataset folder outside the repo
7. **Never commit:**
   - secrets (Azure keys, tokens)
   - datasets or image folders
   - `.pt`/`.pth` checkpoints
   - `node_modules`, `dist`, `.env`

   Keys live only in environment variables or a local `.env` that is git-ignored.
8. **One module at a time**, in the order of `handoff/PROGRESS.md`. Never start module N+1 while module N's acceptance checks fail.
9. **No new features or libraries** beyond those named in the module file. If you believe one is truly needed, write it under "Proposals" in PROGRESS.md and continue without it.
10. **The app must build and run at the end of every module** (`npm run build` succeeds; `npm run dev` page loads with no console errors).

## 5. Git workflow (professional history)
- Repository: **https://github.com/masumcit44/AgroLeaf-AI** (public). Local root: `D:\Desktop\AIgnite 2026\AgroLeaf_AI_AIgnite_2026`. Default branch: `main`.
- **For each module:**
  1. `git switch main && git pull` (skip the pull if there is no remote yet)
  2. `git switch -c feat/mXX-short-name` (use `fix/`, `docs/`, `ml/`, `chore/` prefixes when they fit better)
  3. Make **small, logical commits** (2–6 per module, not one giant commit). Each commit must build.
  4. When the acceptance checks pass:
     - If `gh auth status` shows you are logged in: push the branch, then `gh pr create --base main --title "<type>(mXX): <summary>" --body-file <the PR body you wrote>`, then `gh pr merge --squash --delete-branch`.
     - **Otherwise:** `git switch main && git merge --no-ff feat/mXX-... -m "Merge module MXX: <summary>"`, then `git push origin main`, then `git branch -d feat/mXX-...`
  5. Tag the module: `git tag -a mXX -m "Module MXX complete: <summary>" && git push origin mXX`
- **Commit message format (Conventional Commits).** Subject ≤ 72 characters, imperative mood. The body explains **why**, not just what:
```
feat(inference): load ONNX model once with onnxruntime-web/wasm

Why: the default onnxruntime-web import pulls the 29.5 MB JSEP wasm,
which exceeds Cloudflare Pages' 25 MiB per-file limit. The /wasm entry
uses the 14.8 MB CPU-only build. A single cached InferenceSession avoids
re-initialising WASM on every prediction.

Refs: research/final_decisions.md §3, handoff/M04_inference_engine.md
```
- **Allowed types:** `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ml`, `perf`, `ci`, `style`.
- **The PR body** (or the merge commit body if there is no `gh`) must contain:
  - **What**
  - **Why**
  - **How it was tested** (commands + manual checks)
  - **Screenshots/notes**
  - **Known limitations**
  - **Next module**
- Never force-push `main`. Never rewrite published history.
- **Clean-tree rule (added after M00):**
  - Before every commit, run `git status` and `git diff --stat`.
  - After every push, run `git status` again. It must say "nothing to commit, working tree clean".
  - If files you did not intend to change show as modified (in M00, `LICENSE` was emptied on disk and 5 files gained a blank line after the push), restore them with `git restore <file>`. Never commit them.
  - Close editor tabs of files you are not editing.

## 6. Coding standards
- Small files, one job each. Folder layout as given in M02.
- Name things clearly (`predictLeaf`, `loadModel`, `computeBlurScore`). No dead code. No commented-out blocks.
- Comments explain *why* where it isn't obvious (for example, why `/wasm` is imported). Don't narrate obvious code.
- **Every user-visible string goes through the i18n dictionary** (`src/i18n/bn.js`, `src/i18n/en.js`). Bangla is the default language.
- **Accessibility:**
  - buttons ≥ 48×48 px
  - visible text labels next to icons
  - `aria-label` on icon buttons
  - colour is never the only signal
  - body text ≥ 18 px
- Every async action has a **loading state**, an **error state with a Bangla message**, and a **retry**.
- Python: standard library + the packages named in M01 only. Use `argparse` CLIs and a fixed seed of 42. Never modify raw dataset files.

## 7. How to report (after every module)
Update `handoff/PROGRESS.md`:
- tick the module
- add the date and time (BST)
- branch/PR/tag
- what you tested
- any blockers or proposals
- **"USER ACTION NEEDED"** items in bold

Then **stop** and print a 5-line summary for the user. Continue with the next module only when the user says "continue", **or** when the next module has no user-action gate. Each module file lists its gates.

## 8. When you are blocked
- **Missing file from the user** (sticker, dataset, Azure key, trained model): mark the module **BLOCKED (user action)**, then continue with the next module that does not depend on it (see the dependency table in `01_MODULE_PLAN.md`).
- **Build error you cannot fix in 3 attempts:** revert to the last green commit, write the exact error in Blockers, and stop.
- **Spec unclear:** choose the option that is simpler and safer for farmers, write your assumption in PROGRESS.md, and continue.
