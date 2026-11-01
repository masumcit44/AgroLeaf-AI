"""Compare candidate models on identical samples with the app's full decision rule.

Input: the output folder of model/experiments/eval_unified (one sub-folder of
<src>__<split>.npz files per model, plus index.json).

Every model is calibrated the same way, on the SELECTION set only (raihan150146
external validation + non-rice validation rows):
- temperature: minimises NLL on the selection set;
- threshold: the smallest value in [0.30, 0.95] at which the app's named answers
  on selection-set rice photos are at least TARGET right.
The app rule (ml/app_decision.py) is then applied unchanged everywhere: Healthy
needs >= 0.90, leaf smut is always "not sure", and v1 keeps its leaf-colour gate.
v1 is also scored with its deployed calibration (the baseline as shipped).

Final test sets (Sylhet, Gujarat) are never read while calibrating or choosing.

Usage: python ml/tools/compare_models.py <eval_dir> <out.json>
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))
from app_decision import decide_from_calibration  # noqa: E402
from eval_app import evaluate_set, softmax_np  # noqa: E402

CLASSES = ["healthy", "blast", "brown_spot", "leaf_smut", "tungro", "sheath_blight", "other_rice", "not_rice"]
TARGET = 0.90
FINAL_TESTS = ("sylhet__heldout", "gujarat_in__heldout")
ROOT = Path(__file__).resolve().parents[2]
V1_CAL = json.loads((ROOT / "frontend" / "public" / "data" / "calibration.json").read_text())


def load(model_dir: Path, name: str):
    z = np.load(model_dir / f"{name}.npz")
    logits = z["logits"].astype(np.float64)
    if logits.shape[1] == 6:  # v1 has no reject outputs; they can never win
        logits = np.concatenate([logits, np.full((len(logits), 2), -1e4)], 1)
    return logits, z["y"], z["leaf_fraction"]


def selection_set(model_dir: Path, names):
    parts = [load(model_dir, n) for n in names if n.startswith("raihan_bd__extval")]
    for n in names:
        if n.endswith("__val") and not n.startswith(("gazipur", "savar", "paddy", "sethy", "vietnam")):
            parts.append(load(model_dir, n))  # non-rice validation rows
    L, y, lf = (np.concatenate(x) for x in zip(*parts))
    return L, y, lf


def fit_temperature(L, y):
    """NLL-optimal temperature over rows the model can actually output: v1's padded
    reject logits (-1e4) would otherwise give its non-rice rows probability 0 and
    swamp the fit."""
    ok = L[np.arange(len(y)), y] > -1e3
    L, y = L[ok], y[ok]
    return float(min(np.arange(0.3, 3.01, 0.02), key=lambda t: -np.mean(np.log(softmax_np(L, t)[np.arange(len(y)), y] + 1e-12))))


def fit(model_dir: Path, names, base_cal: dict):
    L, y, lf = selection_set(model_dir, names)
    temp = fit_temperature(L, y)
    rice = y < 7
    for thr in np.arange(0.30, 0.951, 0.01):
        cal = {**base_cal, "temperature": float(temp), "threshold": float(round(thr, 2))}
        p = softmax_np(L[rice], temp)
        named = right = 0
        for i in range(len(p)):
            d = decide_from_calibration(dict(zip(CLASSES, p[i].tolist())), cal, None if "leaf_check" not in cal else float(lf[rice][i]))
            if d["status"] == "confident":
                named += 1
                right += d["top"][0] == CLASSES[y[rice][i]]
        if named and right / named >= TARGET:
            return cal, True
    return {**base_cal, "temperature": float(temp), "threshold": 0.95}, False


def main():
    eval_dir, out = Path(sys.argv[1]), Path(sys.argv[2])
    index = json.loads((eval_dir / "index.json").read_text())
    names = sorted(index["sets"])
    report = {"target_selective_accuracy": TARGET, "models": {}}
    app_rules = {"healthy_threshold": 0.9, "suppress": ["leaf_smut"]}
    for model, info in index["models"].items():
        mdir = eval_dir / model
        variants = []
        if model.startswith("v1"):
            variants.append((f"{model} (deployed calibration)", V1_CAL, None))
            base = {**app_rules, "leaf_check": V1_CAL["leaf_check"]}
        else:
            base = dict(app_rules)
        cal, reached = fit(mdir, names, base)
        variants.append((f"{model} (calibrated on selection set)", cal, reached))
        for label, cal, reached in variants:
            sets = {}
            for n in names:
                L, y, lf = load(mdir, n)
                sets[n] = evaluate_set(L, y, CLASSES, cal, lf if "leaf_check" in cal else None)
            report["models"][label] = {"artifact": info, "calibration": cal, "threshold_target_reached": reached, "sets": sets}
            print(f"{label}: T={cal['temperature']:.2f} thr={cal['threshold']}", flush=True)
    out.write_text(json.dumps(report, indent=2))
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
