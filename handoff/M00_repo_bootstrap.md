# M00 — Repository bootstrap and first push

**Goal:** turn this folder into a clean, professional Git repository and push it to GitHub. **No app code in this module.**
**Branch:** work directly on `main` (this is the very first commit). **Tag:** `m00`.
**User gate:** the first `git push` opens a browser sign-in (Git Credential Manager). The user completes it.

## Steps
1. In `D:\Desktop\AIgnite 2026\AgroLeaf_AI_AIgnite_2026`, run `git init -b main`. Check `git config user.name` and `user.email` (they are already set globally; do not change them).
2. Create **`.gitignore`**:
```
# private / not for the public repo
research_files/
reports/
documentation/workspace_guide.md
.env
*.env.local

# data and model artefacts (datasets live OUTSIDE the repo)
datasets_raw/
**/datasets/
*.zip
*.pt
*.pth
*.ckpt
ml/outputs/
ml/toy_data/

# python
__pycache__/
*.pyc
.venv/
.ipynb_checkpoints/

# node
node_modules/
frontend/dist/
frontend/public/ort/
.vite/

# OS / editor
.DS_Store
Thumbs.db
.vscode/
.idea/
```
3. Create **`.gitattributes`**:
```
* text=auto eol=lf
*.onnx binary
*.mp3 binary
*.png binary
*.jpg binary
*.jpeg binary
*.webp binary
```
   **Do not use Git LFS.** The model is under 25 MiB, and Cloudflare must be able to read it from a normal clone.
4. Create **`LICENSE`**: MIT, copyright `2026 Md. Masum Akondha`. Add a section at the end of `README.md` named "Data & content licences":
   - dataset credits (CC BY 4.0; see `research/research_references.md`)
   - "Disease guidance text is adapted from public Bangladesh government sources (BAMIS/DAE) and is not covered by the MIT licence"
5. Create the public **`README.md`**. It is product-facing and professional. **No metrics; no claims from rule §4.** Sections:
   1. Title "AgroLeaf AI — এগ্রোলিফ এআই" + one-line description + badges placeholder line (no fake badges)
   2. "Live demo": `_coming soon_`
   3. Problem (3 bullets, no unverified statistics)
   4. What it does (the 5-step flow from `00_READ_FIRST` §1)
   5. Key ideas: honest "not sure"; on-device privacy; Bangla text + voice; measured accuracy page
   6. Tech stack table (from `research/final_decisions.md` §1)
   7. Repository structure (tree of top-level folders with one-line purposes)
   8. Getting started (dev): `cd frontend && npm install && npm run dev`; ML: see `ml/README.md`
   9. Project status: link `handoff/PROGRESS.md`
   10. Responsible AI: screening, not diagnosis; no AI-written doses; 16123 referral; limitations
   11. Built for: "Ostad Presents YUNet AIgnite Buildathon 2026"
   12. Data & content licences
   13. License
6. Create **`CHANGELOG.md`** (Keep a Changelog format) with `## [Unreleased]` and an entry for M00.
7. Create **`.github/pull_request_template.md`** with the sections **What / Why / How tested / Screenshots / Known limitations / Next module**.
8. Commit in two commits:
   - `chore(repo): initialise repository with gitignore, attributes and licence`
   - `docs: add public README, changelog and PR template`

   Each commit body explains why (for example: private research excluded from the public repo; datasets kept outside Git).
9. `git remote add origin https://github.com/masumcit44/AgroLeaf-AI.git`, then `git push -u origin main`, then the tag: `git tag -a m00 -m "Module M00 complete: repository bootstrap" && git push origin m00`.

## Acceptance checks
- [ ] `git status` is clean.
- [ ] `git ls-files | grep -E "research_files|reports/|workspace_guide|\.env"` returns **nothing**.
- [ ] GitHub shows README, LICENSE, CHANGELOG, `.github/`, `handoff/`, `documentation/`, `research/` (without `research_files/`), `data/`, `disease_knowledge/`, `model/`, `ml/`.
- [ ] Tag `m00` is visible on GitHub.
- [ ] PROGRESS.md updated (M00 ✅).
