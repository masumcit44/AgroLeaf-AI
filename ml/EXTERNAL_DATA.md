# External test sets

External sets are **never used for training**. They measure how the model behaves
on other districts, phones and seasons, which is the headline number on the
in-app "How accurate is it?" page (`model/evaluation_plan.md`).

`ml/evaluate.py` expects each external set to look like:

```
<root>/<ClassFolder>/<images>
```

and the folder names must match the keys in the matching
`ml/external_maps/*.json` file. `ml/prepare_external.py` converts the download
into that layout, resizes every image to 320 px, and writes
`<out>/PROVENANCE.md`.

## Sets and maps

| Set | Role | Download | DOI | Map | Source layout |
|---|---|---|---|---|---|
| RiceLeafDisease-BD5 (Savar) | External test | https://data.mendeley.com/datasets/sjkptpgv79/2 | 10.17632/sjkptpgv79.2 | `ml/external_maps/riceleafdisease_bd5.json` | class folders |
| RiceLeafBD (Sylhet–Dhaka) | External test | https://data.mendeley.com/datasets/kx9rx8p2mz/1 | 10.17632/kx9rx8p2mz.1 | `ml/external_maps/riceleafbd_sylhet.json` | images + CSV labels |
| RiceyLeafDisease | Optional external test | https://data.mendeley.com/datasets/t46kkgh2yw/1 | 10.17632/t46kkgh2yw.1 | **none yet** | not stated |

All three are CC BY 4.0. Credit the DOI in the app, deck and README.
For RiceyLeafDisease use the **original** images only; the 5,188 augmented
copies must never enter a test set. Do not use it until a class map exists.
Dhan-Shomadhan is listed in `data/dataset_inventory.csv` as an optional extra
and has no map yet either.

Important label rules (`data/disease_classes.md`):

- Narrow Brown Spot is **not** Brown Spot. Its map value is `__unseen__`.
- Bacterial Leaf Blight is not a training class. Its map value is `__unseen__`.
- Leaf Smut has no external test data. Say so on the Accuracy page.

## Prepare: RiceLeafDisease-BD5 (class folders)

```bash
python ml/prepare_external.py \
  --layout folders \
  --raw "D:\Desktop\AIgnite 2026\datasets_raw\RiceLeafDisease-BD5" \
  --out "D:\Desktop\AIgnite 2026\datasets_work\external\RiceLeafDisease-BD5_320" \
  --map ml/external_maps/riceleafdisease_bd5.json
```

If the class folders are nested, the script searches up to 3 levels below
`--raw` for the folder that directly contains them.

## Prepare: RiceLeafBD (images + CSV)

Open the downloaded CSV and use its **actual column names** for `--image-col`
and `--label-col`:

```bash
python ml/prepare_external.py \
  --layout csv \
  --csv "D:\Desktop\AIgnite 2026\datasets_raw\RiceLeafBD\labels.csv" \
  --image-col "<image-column>" \
  --label-col "<label-column>" \
  --raw "D:\Desktop\AIgnite 2026\datasets_raw\RiceLeafBD" \
  --out "D:\Desktop\AIgnite 2026\datasets_work\external\RiceLeafBD_320" \
  --map ml/external_maps/riceleafbd_sylhet.json
```

`--raw` is optional in CSV mode; it is the base folder for relative image paths
(defaults to the CSV's folder). Images are copied and resized, never moved.

Both commands print counts per label and warn about labels that are not in the
map. Unmapped labels are skipped so that `evaluate.py` never sees an unknown
class folder. Check `PROVENANCE.md` before uploading.

## Run evaluation on Kaggle

1. Zip each prepared output folder and upload it as a **private** Kaggle Dataset,
   e.g. `external-riceleafdisease-bd5-320` and `external-riceleafbd-320`.
   Keep the top-level class folders inside the zip.
2. Attach both datasets to the training notebook (the O3 notebook reads the
   `EXTERNAL` list in its config cell).
3. Pass one `--external` spec per set. Format:
   `name=<external root>:<map file>`. The map path is relative to the cloned
   repo, and `rsplit(":", 1)` is used so Windows paths also work.

```bash
python ml/evaluate.py \
  --run /kaggle/working/run1 \
  --data-root "$DATA_ROOT" \
  --splits "$SPLITS_CSV" \
  --external "RiceLeafDisease-BD5 (Savar)=/kaggle/input/external-riceleafdisease-bd5-320/RiceLeafDisease-BD5_320:ml/external_maps/riceleafdisease_bd5.json" \
  --external "RiceLeafBD (Sylhet-Dhaka)=/kaggle/input/external-riceleafbd-320/RiceLeafBD_320:ml/external_maps/riceleafbd_sylhet.json"
```

In the O3 notebook set:

```python
EXTERNAL = [
    "RiceLeafDisease-BD5 (Savar)=/kaggle/input/external-riceleafdisease-bd5-320/RiceLeafDisease-BD5_320:ml/external_maps/riceleafdisease_bd5.json",
    "RiceLeafBD (Sylhet-Dhaka)=/kaggle/input/external-riceleafbd-320/RiceLeafBD_320:ml/external_maps/riceleafbd_sylhet.json",
]
```

Use the exact dataset/folder names shown in `/kaggle/input/`; Kaggle sometimes
keeps the zip's top folder. An empty `EXTERNAL = []` is valid for the first run.

## What the numbers mean

- `accuracy_mapped` / `macro_f1_mapped`: only the classes the model was trained
  on and that this set contains.
- `coverage` and `selective_accuracy`: images answered at the validation-chosen
  threshold, and accuracy among those answers.
- `unseen_rejection_rate`: share of `__unseen__` images that correctly fell
  below the threshold and became "not sure". This is the number that shows the
  abstention behaviour.
- `null` means the set contained zero images of that kind; it is **not** a zero
  score. Never turn it into a number on the Accuracy page.
