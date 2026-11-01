# Dataset verification — 1 Nov 2026

Resolves the disagreement between the Antigravity dataset audit (commit `7cedb31`) and the lead audit.
Evidence comes from the Kaggle data-audit job `mdmasumakondha/agroleaf-data-audit`, which opened every file
(45,258 files across 8 datasets) and recorded path, MD5, perceptual hash (pHash), size and EXIF orientation.

## Results per dataset

| Dataset (Kaggle) | Path under `/kaggle/input/datasets/` | Files | Source / DOI |
|---|---|---|---|
| `raihan150146/rice-leaf-diseases-dataset` | `raihan150146/rice-leaf-diseases-dataset/Rice leaf disease/{Training,Validation,Testing} data/<class>/` | 1,886 | Bangladesh phone photos (Oct 2023 file dates). Kaggle lists CC0. Mendeley original reported by the research worker as `hx6f852hw4` — not verified here. |
| `vbookshelf/rice-leaf-diseases` | `vbookshelf/rice-leaf-diseases/rice_leaf_diseases/<class>/` | 120 | UCI Rice Leaf Diseases (Prajapati et al., Gujarat). |
| `nirmalsankalana/dhan-shomadhan` | `nirmalsankalana/dhan-shomadhan/Rice___<class>/` | 769 | Dhan-Shomadhan, Mendeley `10.17632/znsxdctwtt.1` (white-background subset, see below). Kaggle lists MIT. |

### Class counts (from the files)

- **raihan150146:**
  - healthy 187, leaf blast 310, brown spot 274, **sheath blight 288**;
  - not covered by the app: bacterial leaf blight 208, leaf scald 231, narrow brown leaf spot 163, rice hispa 225.
  - 1,734 files carry an EXIF rotation tag. 51 groups of exact duplicate files exist; one of them has conflicting labels.
- **vbookshelf:** bacterial leaf blight 40, brown spot 40, **leaf smut 40**. Files are named `DSC_*`; the most common size is 3081×897.
- **Dhan-Shomadhan (Kaggle copy):** the folder names do not match the files. Every filename starts with a class code and contains `_wb_`:

  | Kaggle folder | Files | Filename code | True class |
  |---|---|---|---|
  | `Rice___bacterial_blight` | 219 | `sb_wb_*` | **sheath blight** |
  | `Rice___blast` | 198 | `rb_wb_*` | rice blast |
  | `Rice___brown_spot` | 90 | `bs_wb_*` | brown spot |
  | `Rice___leaf_scald` | 143 | `ls_wb_*` | leaf scald |
  | `Rice___tungro` | 119 | `rt_wb_*` | rice tungro |

  The five codes match Dhan-Shomadhan's published classes (brown spot, leaf scald, rice blast, rice tungro, sheath blight; there is no bacterial blight class). So the uploader mislabelled the sheath blight folder. `_wb_` = white background; this copy is only that subset.

### Overlap (MD5 exact, pHash within 4 bits = duplicate)

| Pair | Exact MD5 | Nearest pHash distance (min / median) | Closest pair |
|---|---|---|---|
| raihan150146 vs vbookshelf | 0 | 14 / 22 bits | `Brown Spot/Brown_spot (217).jpg` ↔ `Bacterial leaf blight/DSC_0370.jpg` |
| Dhan-Shomadhan vs raihan150146 | 0 | 10 / 18 bits | `sb_wb_16.jpg` ↔ `Brown_spot (217).jpg` |
| Dhan-Shomadhan vs vbookshelf | 0 | 8 / 20 bits | `ls_wb_121.jpg` ↔ `Leaf smut/DSC_0338.JPG` |

No dataset overlaps Sylhet. Across all pairs of the 8 datasets there is exactly one near-duplicate: one image shared by Dhan-Shomadhan and Savar.

Representative non-matching names:
- raihan: `IMG_20231014_172819.jpg`, 1600×1200 phone photos;
- vbookshelf: `DSC_0365.JPG`, 3081×897;
- Dhan-Shomadhan: `sb_wb_0.jpg`, 1080×2301.

## Verdict on each claim

| Claim (Antigravity) | Verdict | Evidence |
|---|---|---|
| raihan150146 and vbookshelf are identical 120-image mirrors | **False** | 1,886 vs 120 files, 0 MD5 matches, nearest pair 14 pHash bits apart, different cameras, sizes and naming |
| vbookshelf has 40 leaf smut, not 120 | **True** | 40 / 40 / 40 |
| Dhan-Shomadhan has 1,106 images | **Not for the Kaggle copy** (769) | The 1,106 total matches the full Mendeley release (field + white background); the Kaggle copy is the white-background subset |
| Dhan-Shomadhan has 228 sheath blight | **Sheath blight exists, count differs** | 219 `sb_*` files, filed under the wrong folder name `Rice___bacterial_blight` |
| About 50% white background | **Superseded** | Every file in the Kaggle copy is `_wb_` |

**Why the two audits disagreed.** Antigravity's report states that its tool ran only on `ml/toy_data` and `frontend/public/samples` (`data/audit_output/audit_test_report.md`), so its dataset figures were not measured from these files. They match published descriptions of the original datasets (UCI, Mendeley). The lead audit initially read class names from the Kaggle folder names and so missed the mislabelled sheath blight folder. The filename codes, checked here, settle it.

## Effect on training (v4, committed in `model/experiments/run4_v4/`)

- Dhan-Shomadhan labels are taken from the filename code. It is reported as its own white-background set and never used for selection.
- raihan150146 is external validation (photos turned upright, verified per image). The one conflicting-label duplicate pair is dropped.
- vbookshelf is a final test set only, used for leaf smut.
