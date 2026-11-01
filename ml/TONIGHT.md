# Tonight — exact run sequence (Windows)

Run every command from the repo root in **Command Prompt** or **PowerShell**:

```
D:
cd "D:\Desktop\AIgnite 2026\AgroLeaf_OpenCode_worktree"
```

Stop at the first failure and fix it before moving on. No metric is reported anywhere until `metrics-v1.json` exists; never type a number by hand.

## 1. Prepare the dataset locally (one command)

```bat
python ml\prepare_dataset.py --raw "D:\Desktop\AIgnite 2026\datasets_raw\RiceLeafDiseaseBD_v3" --work "D:\Desktop\AIgnite 2026\datasets_work" --phash-dist 6
```

**Expected:** `Class root found at depth …`, then steps `1/5`–`5/5`, a per-class count table, `Zip: …\datasets_work\kaggle_upload.zip (… MB)`, and the line `Next step: upload kaggle_upload.zip as a private Kaggle Dataset named riceleafdiseasebd-v3-320`.

**If it fails:**
- `no folder … contains all expected class folders` → the listed folder tree is printed. Unzip the download so that one folder directly contains `Healthy`, `Blast`, `Brown Spot`, `Leaf Smut`, `Rice Tungro`, `Sheath Blight`; re-run.
- `more than one candidate class root found` → keep only one copy of the dataset under `--raw`; re-run.
- split guard / largest perceptual group → re-run the exact command the script prints with `--phash-dist 4`.
- `--work must be outside --raw` → choose a different `--work` folder.

This writes `data\audit_output\`, `data\splits.csv`, `data\split_summary.md`, `data\exclusions.csv` and `D:\Desktop\AIgnite 2026\datasets_work\RiceLeafDiseaseBD_v3_320\`. The raw download is never modified.

## 2. Upload the Kaggle dataset and run the notebook

1. kaggle.com → **Create → New Dataset** → upload `D:\Desktop\AIgnite 2026\datasets_work\kaggle_upload.zip`.
2. Title **`riceleafdiseasebd-v3-320`**, visibility **Private**, **Create**. Kaggle unzips it, so the dataset root has `RiceLeafDiseaseBD_v3_320\` + `splits.csv`.
3. **Create → New Notebook** (or import `ml\kaggle\agroleaf_train_kaggle.ipynb`).
4. Right sidebar: **Accelerator = GPU T4 x 1**, **Internet = On**; **Add Input** → your private dataset.
5. **Run All**.

**Expected:** every cell passes (the GPU cell prints the T4 name), `metrics-v1.json` and the PNGs are displayed, and the last cell prints `Created /kaggle/working/run1_for_app.zip (… MB)` plus download steps. If a cell fails, fix the input path / GPU / Internet setting and **Run All** again; do not continue with a partial run.

## 3. Download the run zip

Download **`run1_for_app.zip`** from the notebook's right sidebar → **Output** → `/kaggle/working`. Save it as:

```
D:\Desktop\AIgnite 2026\kaggle_runs\run1_for_app.zip
```

Do not download `best.pt`; it is not in the zip.

## 4. Validate, then copy the model into the app

```bat
python ml\tools\make_release_bundle.py --run-zip "D:\Desktop\AIgnite 2026\kaggle_runs\run1_for_app.zip" --dry-run
```

**Expected:** `Validation passed: …`, a `DRY RUN` list of source → destination paths, `MEASURED (from metrics-v1.json)` with the internal and every external set, then the two M07 instructions.

If it prints `VALIDATION FAILED … nothing was copied`, read every listed problem. The usual causes are a class-order mismatch, a demo `calibration.json` that still has `placeholder`, an ONNX file ≥ 24 MiB, or a missing `parity_samples.json`/PNG. Re-run the Kaggle notebook from the failing stage; do not edit the JSONs by hand.

When the dry run is clean, run it for real:

```bat
python ml\tools\make_release_bundle.py --run-zip "D:\Desktop\AIgnite 2026\kaggle_runs\run1_for_app.zip"
```

**Expected:** `Copied N file(s)` with sizes, the same `MEASURED (from metrics-v1.json)` block, and the next-step text. This copies (never moves) into `frontend\public\models\rice-mnv3l-v1.onnx`, `frontend\public\data\*.json`, `frontend\public\accuracy\*.png` and `model\experiments\run1\`. It does **not** edit `frontend\src\ml\config.js` or delete the placeholder model; those are Antigravity's M07 changes:

```
frontend\src\ml\config.js:
  export const MODEL_URL = '/models/rice-mnv3l-v1.onnx';
delete frontend\public\models\rice-placeholder.onnx
```

## 5. Pick real demo samples

```bat
python ml\tools\pick_samples.py --data-root "D:\Desktop\AIgnite 2026\datasets_work\RiceLeafDiseaseBD_v3_320" --splits data\splits.csv --per-class 1 --classes healthy,blast,brown_spot,tungro --seed 42
```

**Expected:** four `… -> …\frontend\public\samples\<key>_1.jpg` lines, then `Wrote 4 sample(s) and …\manifest.json`. The labels come from `disease_knowledge\`; the credit is the RiceLeafDiseaseBD v3 CC BY 4.0 DOI. The dataset is only read. If it says `no test-split images`, check that `--data-root` is the 320 run folder and `--splits` is the `splits.csv` produced in step 1.

## 6. Hand over to Antigravity

Tell Antigravity: **"continue M07"**. It will update `config.js`, remove the placeholder, run the parity page and build the Accuracy page from `metrics-v1.json`.

## Optional — Bangla voice clips (needs the Azure key)

Create `.env` in the repo root (already git-ignored):

```
AZURE_SPEECH_KEY=your_key_here
AZURE_SPEECH_REGION=southeastasia
```

Then:

```bat
python ml\tools\generate_tts.py --dry-run
python ml\tools\generate_tts.py
```

**Expected:** the dry run prints the character total without calling Azure; the real run writes `frontend\public\audio\*.mp3` + `manifest.json`. If the key is missing or rejected, skip this: the app falls back to text, and M06 can use human clips later.
