# Data

**There is no image data in this workspace or in `D:\Desktop\ai_battle`.** Everything here describes public datasets that still have to be downloaded.

## What to download (in this order)
1. **RiceLeafDiseaseBD v3** — the training set.
   - Page: https://data.mendeley.com/datasets/86s4jzj2m4/3
   - DOI: 10.17632/86s4jzj2m4.3
   - 9,769 images at 1024×1024, 6 classes, CC BY 4.0.
2. **RiceLeafDisease-BD5** — external test from Savar: https://data.mendeley.com/datasets/sjkptpgv79/2
3. **RiceLeafBD (Sylhet–Dhaka)** — external test, and a test of the "not sure" path: https://data.mendeley.com/datasets/kx9rx8p2mz/1

## Where to put the data (outside this folder)
Keep datasets **outside** the workspace, so the repo stays small and the originals stay untouched:
```
D:\Desktop\AIgnite 2026\datasets_raw\RiceLeafDiseaseBD_v3\     (unzipped, read-only from here on)
D:\Desktop\AIgnite 2026\datasets_raw\RiceLeafDisease_BD5_v2\
D:\Desktop\AIgnite 2026\datasets_raw\RiceLeafBD_kx9rx8p2mz_v1\
```
For each one, record the download date and version in `dataset_inventory.csv`.

## Files in this folder
| File | Contents |
|---|---|
| `dataset_inventory.csv` | Every dataset found in the research, checked online where possible (status column) |
| `disease_classes.md` | MVP class list, and how classes map between datasets |
| `data_quality_report.md` | What is known, plus TODO cells to fill in from `ml/audit_dataset.py` |
| `dataset_preparation_plan.md` | Deduplication, leakage-safe splitting, preprocessing, augmentation |

## Run the audit after downloading
```bash
pip install pillow imagehash
python ml/audit_dataset.py "D:/Desktop/AIgnite 2026/datasets_raw/RiceLeafDiseaseBD_v3" --out data/audit_output
```
The script only reads the images. It writes CSV and Markdown reports to `--out`.

## Attribution (CC BY 4.0 requires it)
Credit each dataset by title, authors and DOI on the app's "About / Accuracy" page and in the deck.
