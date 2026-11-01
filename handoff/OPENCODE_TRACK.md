# OPENCODE TRACK — parallel helper tasks (the user is away until about 16:00 BST)

You are the **second implementation agent** on AgroLeaf AI. Another agent (Antigravity) is building the web app in a **different folder**. You work **only** in this folder:

```
D:\Desktop\AIgnite 2026\AgroLeaf_OpenCode_worktree      (git worktree, branch: track/opencode)
```

## Hard boundaries (breaking these breaks the other agent's work)
1. **Never `cd` into or edit** `D:\Desktop\AIgnite 2026\AgroLeaf_AI_AIgnite_2026` (the other agent's folder), `D:\Desktop\ai_battle`, or anything outside this worktree.
2. **Stay on branch `track/opencode`.**
   - Never switch branches. Never touch `main`. Never merge. Never rebase. Never force-push.
   - Push only your branch: `git push -u origin track/opencode`.
3. **Only create or edit the files listed in your tasks below.**
   - **Never edit:** `frontend/`, `handoff/PROGRESS.md`, `handoff/M*.md`, `handoff/00_*`, `handoff/01_*`, `disease_knowledge/`, `research/`.
   - **Never edit** these existing ML scripts: `ml/audit_dataset.py`, `make_splits.py`, `train.py`, `calibrate.py`, `evaluate.py`, `export_onnx.py`, `parity_test.py`, `common.py`, `resize_for_upload.py`. You may *call* them, not change them. If one has a bug, write it in your progress file instead.
4. **Read first, for context:** `handoff/00_READ_FIRST_ANTIGRAVITY.md` (§1–§4: the product and the absolute rules), `research/final_decisions.md`, `ml/README.md`, `ml/kaggle/KAGGLE_RUNBOOK.md`, `data/disease_classes.md`, `documentation/competition_compliance.md`.
5. **Absolute rules (same as the other agent):**
   - **no invented numbers**: use `[[TBD after training]]` placeholders
   - no pesticide doses
   - never write "diagnosis", "first/only", "free call", "100% accurate", or claim a partnership
   - no secrets in files
   - free tools only
6. **Commits:** Conventional Commits with a "Why:" body. Small commits. Push after each task.
7. Keep **`handoff/OPENCODE_PROGRESS.md`** (create it) updated after each task: status, files, how tested, problems. This is the only progress file you edit.
8. **Stop conditions:**
   - something needs a login, key or payment
   - a check fails 3 times
   - **15:30 BST** has passed: finish the current task and stop

   Then write a final summary at the top of OPENCODE_PROGRESS.md.

## Tasks (do them in order)

### O1 — One-command local data preparation: `ml/prepare_dataset.py`
**Why:** when the user comes home with the downloaded dataset, one command should produce everything needed for the Kaggle upload.

**What it does:**
- Args: `--raw "D:\Desktop\AIgnite 2026\datasets_raw\RiceLeafDiseaseBD_v3" --work "D:\Desktop\AIgnite 2026\datasets_work" --phash-dist 6`
- Steps, calling the existing scripts with `subprocess` and `sys.executable`. **Do not copy their code.**
  1. Find the folder that directly contains the 6 class folders: search up to 3 levels below `--raw` for a folder whose subfolder names match the keys in `ml/class_map.json["rice_leaf_disease_bd_v3"]`. If none is found, print the folder tree (2 levels) and the expected names, and exit 1.
  2. Run `ml/audit_dataset.py` → `data/audit_output/`.
  3. Run `ml/make_splits.py` → `data/splits.csv`, `data/split_summary.md`. If it fails on the group-size guard, print the exact advice: re-run with `--phash-dist 4`.
  4. Run `ml/resize_for_upload.py` → `<work>/RiceLeafDiseaseBD_v3_320/`.
  5. Copy `data/splits.csv` into `<work>/`. Make `<work>/kaggle_upload.zip` containing `RiceLeafDiseaseBD_v3_320/` + `splits.csv`.
  6. Print a summary: images per class, exclusions, largest group, zip size, and the exact next step ("upload kaggle_upload.zip as a private Kaggle Dataset named riceleafdiseasebd-v3-320").
- **Never modify `--raw`.** Refuse to run if `--work` is inside `--raw`.

**Test:**
- `python ml/tests/make_toy_dataset.py --out ml/toy_data/nested/extra/raw`, then run `prepare_dataset.py --raw ml/toy_data/nested --work ml/toy_data/work`. It must find the nested class folders and produce the zip.
- `ml/toy_data` is git-ignored. Write the test as `ml/tests/test_prepare_dataset.py` (plain asserts).

### O2 — External test-set preparation: `ml/prepare_external.py`
**Why:** the external datasets come in different layouts. RiceLeafBD (Sylhet/Dhaka, DOI 10.17632/kx9rx8p2mz.1) uses **images + a CSV label file**; others use class folders, sometimes nested. `ml/evaluate.py` needs `<root>/<ClassFolder>/<images>` with folder names matching `ml/external_maps/*.json`.

**What it does:**
- Modes:
  - `--layout folders` (find the folder that holds the class folders; same search as O1)
  - `--layout csv --csv <file> --image-col <name> --label-col <name>`
- Copies (never moves) the images into `<out>/<label>/` and resizes them to 320 px using the same function as `ml/resize_for_upload.py`. **Import it; don't copy it.**
- Prints counts per label, and warns about labels not present in the given `--map` JSON.
- Also writes `<out>/PROVENANCE.md`: source path, DOI (from the map's `__doi__`), date, counts.

**Test:** a toy CSV-layout dataset made in the test itself → correct folders. Add `ml/tests/test_prepare_external.py`.

**Docs:** add an "External test sets" section to a **new** file `ml/EXTERNAL_DATA.md` (download links from `data/dataset_inventory.csv`, the command for each set, how to pass `--external` to `evaluate.py` on Kaggle).

### O3 — Kaggle notebook: `ml/kaggle/agroleaf_train_kaggle.ipynb`
**Why:** the user should run training on Kaggle by clicking "Run All", not by typing commands.

**Cells, matching `KAGGLE_RUNBOOK.md` exactly:**
1. Markdown title + instructions (attach dataset `riceleafdiseasebd-v3-320`; GPU T4; Internet on).
2. `git clone https://github.com/masumcit44/AgroLeaf-AI.git`, `pip install -r` (skip torch/torchvision if already installed).
3. Config cell: `DATA_ROOT`, `SPLITS_CSV`, `RUN_DIR="/kaggle/working/run1"`, `ARCH="mnv3_large"`, `EPOCHS=20`, `EXTERNAL=[]`, with comments.
4. GPU check (`nvidia-smi`, `torch.cuda.is_available()`). Fail loudly if there is no GPU.
5. train → 6. calibrate → 7. evaluate (adds `--external` for each entry in `EXTERNAL`) → 8. export_onnx → 9. parity_test
10. Display `metrics-v1.json` and the PNGs inline.
11. Zip `RUN_DIR` without `best.pt` to `/kaggle/working/run1_for_app.zip`, and print the download instructions.

Write it as valid nbformat 4 JSON. Validate with `python -c "import json;json.load(open(...))"`, and with `nbformat.validate` if available. Don't execute it.

### O4 — Model card and data card (Responsible AI; judges value these)
- `model/MODEL_CARD.md`: intended use (preliminary screening for rice leaves; not diagnosis), users, out-of-scope uses, architecture, training data, evaluation protocol (internal / external / unseen-class rejection), **metrics = `[[TBD after training]]`**, calibration and "not sure" behaviour, known limitations (one district, one season; Leaf Smut has no external test; sheath symptoms), ethical considerations (no doses, 16123 referral, on-device privacy), and how to update it after training.
- `data/DATA_CARD.md`: every dataset in `data/dataset_inventory.csv` that is actually used (primary + external), with licence, DOI, location, class mapping, known issues, and the de-duplication/split method.

Use only facts present in the repo docs. Anything unknown → `[[TBD]]`.

### O5 — Submission drafts (English): `documentation/submission/`
- `devpost_story.md`: Devpost project page text, with the sections Inspiration · What it does · How we built it · Challenges · Accomplishments · What we learned · What's next · Built with. Mark every number `[[TBD after training]]`. Solo builder: write "I", not "we". Mention the official sticker in the UI.
- `demo_script_en.md`: a 2-minute English video script with timestamps. Flow: problem → sample photo → Bangla result + voice → blurry or non-rice photo → "not sure" → accuracy page → privacy → close. Include a shot list.
- `deck_outline.md`: 5 slides as in `documentation/buildathon_presentation_notes.md`, with exact on-slide text (short), speaker notes, and screenshot placeholders. Slide 4 = participant introduction (leave `[[name, university, skills]]`).
- `submission_checklist.md`: built from `documentation/competition_compliance.md`.

## Done
After O5 (or a stop condition):
- push `track/opencode`
- write the final summary at the top of `handoff/OPENCODE_PROGRESS.md`: tasks done, files, tests run, open questions
- **stop**

The lead will review and merge your branch into `main`.
