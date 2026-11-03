"""Score a model from saved logits: raw classifier AND the decision the app shows.

Input: one .npz per evaluation set with `logits` (N, K) and `y` (N,) as indices
into the model's class list, plus the model's calibration.json. Labels outside
the 6 diagnosable classes are allowed: other_rice (a rice disease the app does
not cover) and not_rice (not a rice leaf). An optional `leaf_fraction` (N,)
array enables the leaf-colour gate.

Per set it reports
- raw: accuracy and macro-F1 on the 6 diagnosable classes, per-class
  precision/recall/F1, confusion matrix, one-vs-rest ROC-AUC, ECE;
- app: coverage (share of photos that get a named answer), selective accuracy
  (share of named answers that are right), and the share of each "not sure"
  reason; for other_rice / not_rice rows, how often the app avoids naming a
  disease.

Usage:
  python ml/tools/eval_app.py --classes healthy,blast,... --calibration cal.json \
      --set internal_test=preds_internal_test.npz --set sylhet=preds_sylhet.npz --out report.json
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

import numpy as np
from sklearn.metrics import confusion_matrix, f1_score, precision_recall_fscore_support, roc_auc_score

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app_decision import decide_from_calibration  # noqa: E402

DIAGNOSABLE = ["healthy", "blast", "brown_spot", "leaf_smut", "tungro", "sheath_blight"]


def softmax_np(logits, temperature):
    z = logits / max(0.01, temperature)
    z = z - z.max(1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(1, keepdims=True)


def compute_ece(probs, labels, n_bins=15):
    """Expected calibration error, equal-width confidence bins (from Antigravity's eval_framework.py)."""
    conf = probs.max(1)
    correct = probs.argmax(1) == labels
    edges = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    for lo, hi in zip(edges[:-1], edges[1:]):
        m = (conf > lo) & (conf <= hi)
        if m.any():
            ece += abs(conf[m].mean() - correct[m].mean()) * m.mean()
    return float(ece)


def evaluate_set(logits, y, classes, cal, leaf_fraction=None):
    probs = softmax_np(logits, cal.get("temperature", 1.0))
    pred = probs.argmax(1)
    names = np.array(classes)
    true = names[y]
    out = {"n": int(len(y)), "label_counts": dict(Counter(true.tolist()))}

    known = np.isin(true, DIAGNOSABLE)
    if known.any():
        yk, pk = true[known], names[pred[known]]
        present = [c for c in DIAGNOSABLE if c in set(yk)]
        p, r, f, s = precision_recall_fscore_support(yk, pk, labels=present, zero_division=0)
        out["raw"] = {
            "accuracy": float(np.mean(yk == pk)),
            "macro_f1": float(f1_score(yk, pk, labels=present, average="macro", zero_division=0)),
            "per_class": {c: {"precision": float(p[i]), "recall": float(r[i]), "f1": float(f[i]), "support": int(s[i])}
                          for i, c in enumerate(present)},
            "confusion_matrix": {"labels": list(classes),
                                 "rows_true_cols_pred": confusion_matrix(true[known], names[pred[known]], labels=list(classes)).tolist()},
            "ece": compute_ece(probs[known], y[known]),
        }
        auc = {}
        for c in present:
            ci = classes.index(c)
            pos = y[known] == ci
            if 0 < pos.sum() < len(pos):
                auc[c] = float(roc_auc_score(pos, probs[known][:, ci]))
        out["raw"]["roc_auc_ovr"] = auc

    # App decisions, row by row (the same rule as decide.js)
    decisions = []
    for i in range(len(y)):
        lf = None if leaf_fraction is None else float(leaf_fraction[i])
        decisions.append(decide_from_calibration(dict(zip(classes, probs[i].tolist())), cal, lf))
    named = np.array([d["status"] == "confident" for d in decisions])
    named_key = np.array([d["top"][0] if d["status"] == "confident" else "" for d in decisions])
    reasons = Counter(d.get("reason", "named" if d["status"] == "confident" else "tie") for d in decisions)
    app = {"outcomes": {k: round(v / len(y), 4) for k, v in reasons.items()}}
    if known.any():
        app["coverage"] = float(named[known].mean())
        app["selective_accuracy"] = float(np.mean(named_key[known & named] == true[known & named])) if (known & named).any() else None
        app["per_class_named_and_correct"] = {
            c: float(np.mean(named_key[true == c] == c)) for c in DIAGNOSABLE if (true == c).any()}
        # the costliest error: a diseased leaf the app calls healthy
        diseased = known & (true != "healthy")
        app["diseased_called_healthy"] = float(np.mean(named_key[diseased] == "healthy")) if diseased.any() else None
    for special in ("other_rice", "not_rice"):
        m = true == special
        if m.any():
            app[f"{special}_no_disease_named"] = float(np.mean(~named[m] | (named_key[m] == "")))
            app[f"{special}_called_healthy"] = float(np.mean(named_key[m] == "healthy"))
    if "other_rice_no_disease_named" in app:
        # a rice disease the app does not cover, shown to the farmer as one of the 6 classes
        app["unsupported_disease_escape_rate"] = 1 - app["other_rice_no_disease_named"]
    out["app"] = app
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--classes", required=True, help="model output order, comma separated")
    ap.add_argument("--calibration", type=Path, required=True)
    ap.add_argument("--set", action="append", default=[], help="name=path.npz (logits, y[, leaf_fraction])")
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()
    classes = args.classes.split(",")
    cal = json.loads(args.calibration.read_text())
    report = {"classes": classes, "calibration": cal, "sets": {}}
    for spec in args.set:
        name, path = spec.split("=", 1)
        z = np.load(path)
        report["sets"][name] = evaluate_set(z["logits"], z["y"], classes, cal, z["leaf_fraction"] if "leaf_fraction" in z.files else None)
    args.out.write_text(json.dumps(report, indent=2))
    print(f"wrote {args.out}")


if __name__ == "__main__":
    main()
