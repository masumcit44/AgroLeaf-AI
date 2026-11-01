"""Fit the app's safety gate (leaf-colour check + stricter "healthy" threshold).

Input: the Kaggle kernel outputs `ood_rows.csv` and `ood_scores.npz` (raw ONNX
logits and a 36x5x3 Pillow-HSV histogram of the 224x224 model crop per image).

Selection uses only:
  - internal_val (rice leaves),
  - the "fit" half of Sylhet and Savar (real outside-district rice photos, used
    only to keep the leaf check from rejecting real leaves), and
  - the "fit" half of the non-rice sets (deterministic split by file name hash).
Everything is then reported on held-out data: internal_test and the "report"
halves of Sylhet, Savar and the non-rice sets.

Usage:
    python ml/tools/fit_safety_gate.py --scores <dir> --calibration frontend/public/data/calibration.json \
        --out model/experiments/2026-11-01_safety_gate.json [--write-calibration]
"""
import argparse
import csv
import hashlib
import json
from pathlib import Path

import numpy as np

CLASSES = ["healthy", "blast", "brown_spot", "leaf_smut", "tungro", "sheath_blight"]
SAT_EDGES = [0, 26, 51, 77, 128]  # lower edges of the 5 saturation bins
VAL_EDGES = [0, 38, 77]  # lower edges of the 3 value bins
MAX_LEAF_REJECT = 0.005  # at most 0.5% of validation leaves may fail the leaf check
MAX_EXT_LEAF_REJECT = 0.01  # at most 1% of outside-district rice photos (fit half)
HEALTHY_PRECISION_TARGET = 0.97
# The app labels prob >= 0.90 as "high confidence" (frontend/src/lib/resultRules.js).
# "Healthy" is only ever shown at high confidence: the precision-target search
# gave 0.72, which still let "Healthy, medium confidence" through for blurred
# diseased leaves. The final value is the larger of the two.
HIGH_CONFIDENCE_BAND = 0.90


def softmax(logits, t):
    z = logits / t
    z = z - z.max(1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(1, keepdims=True)


def half(name):
    return "fit" if int(hashlib.md5(name.encode()).hexdigest(), 16) % 2 == 0 else "report"


def leaf_fraction(hist, hmin, hmax, sidx, vidx):
    return hist[:, hmin : hmax + 1, sidx:, vidx:].sum(axis=(1, 2, 3))


def decide(probs, frac, cal, gate):
    """Vectorised copy of frontend/src/ml/decide.js. Returns (accepted, pred, reason)."""
    pred = probs.argmax(1)
    top = probs.max(1)
    reason = np.full(len(pred), "confident", dtype=object)
    accepted = top >= cal["threshold"]
    reason[~accepted] = "low_confidence"
    if gate.get("healthy_threshold") is not None:
        h = (pred == 0) & (top < gate["healthy_threshold"])
        accepted &= ~h
        reason[h] = "healthy_needs_high_confidence"
    for k in cal.get("suppress", []):
        s = pred == CLASSES.index(k)
        accepted &= ~s
        reason[s] = "suppressed"
    if gate.get("min_fraction") is not None:
        nl = frac < gate["min_fraction"]
        accepted &= ~nl
        reason[nl] = "not_leaf"
    return accepted, pred, reason


def rice_metrics(labels, probs, frac, cal, gate):
    known = np.array([l in CLASSES for l in labels])
    y = np.array([CLASSES.index(l) if l in CLASSES else -1 for l in labels])
    acc, pred, reason = decide(probs, frac, cal, gate)
    k = known
    out = {
        "n": int(k.sum()),
        "coverage": round(float(acc[k].mean()), 4),
        "selective_accuracy": round(float((pred[k & acc] == y[k & acc]).mean()), 4) if (k & acc).any() else None,
        "leaf_check_rejected": round(float((reason[k] == "not_leaf").mean()), 4),
        "healthy_said_for_diseased": int(((pred == 0) & acc & k & (y != 0)).sum()),
    }
    hp = acc & k & (pred == 0)
    out["healthy_precision"] = round(float((y[hp] == 0).mean()), 4) if hp.any() else None
    if (~known).any():
        out["unseen_class_n"] = int((~known).sum())
        out["unseen_class_rejection"] = round(float((~acc[~known]).mean()), 4)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--scores", type=Path, required=True)
    ap.add_argument("--calibration", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--write-calibration", action="store_true")
    a = ap.parse_args()

    rows = list(csv.DictReader(open(a.scores / "ood_rows.csv", encoding="utf-8")))
    z = np.load(a.scores / "ood_scores.npz")
    cal = json.load(open(a.calibration, encoding="utf-8"))
    probs = softmax(z["logits"].astype(np.float64), cal["temperature"])
    hist = z["hist"].reshape(len(rows), 36, 5, 3)
    sets = np.array([r["set"] for r in rows])
    labels = np.array([r["label"] for r in rows])
    ood = np.isin(sets, ["natural", "plantvillage"])
    halves = np.array([half(r["set"] + "/" + r["label"] + "/" + r["file"]) for r in rows])
    val = sets == "internal_val"
    ood_fit = ood & (halves == "fit")
    ext = np.isin(sets, ["sylhet", "savar"])
    ext_fit = ext & (halves == "fit")

    # 1. Leaf rule: for each candidate, set min_fraction so <=0.5% of val leaves fail,
    #    then keep the candidate that rejects the most non-rice images (fit half).
    best = None
    for hmin in range(0, 9):
        for hmax in range(hmin + 4, 22):
            for sidx in range(1, 5):
                for vidx in range(1, 3):
                    fr = leaf_fraction(hist, hmin, hmax, sidx, vidx)
                    thr = min(
                        float(np.quantile(fr[val], MAX_LEAF_REJECT)),
                        float(np.quantile(fr[ext_fit], MAX_EXT_LEAF_REJECT)),
                    )
                    if thr <= 0:
                        continue
                    rej = float((fr[ood_fit & (sets == "natural")] < thr).mean())
                    if best is None or rej > best[0]:
                        best = (rej, hmin, hmax, sidx, vidx, thr)
    rej, hmin, hmax, sidx, vidx, thr = best
    leaf_check = {
        "hue_bin_min": hmin,
        "hue_bin_max": hmax,
        "sat_min": SAT_EDGES[sidx],
        "val_min": VAL_EDGES[vidx],
        "min_fraction": round(np.floor(thr * 1000) / 1000, 3),
    }
    frac = leaf_fraction(hist, hmin, hmax, sidx, vidx)
    print("leaf_check:", leaf_check, f"(fit-half natural rejection {rej:.3f})")

    # 2. Healthy threshold: smallest value giving healthy precision >= target on val.
    healthy_t = None
    for t in np.round(np.arange(cal["threshold"], 0.99, 0.01), 2):
        m = rice_metrics(labels[val], probs[val], frac[val], cal, {"min_fraction": leaf_check["min_fraction"], "healthy_threshold": float(t)})
        if m["healthy_precision"] is not None and m["healthy_precision"] >= HEALTHY_PRECISION_TARGET:
            healthy_t = float(t)
            break
    print("healthy_threshold from precision target:", healthy_t)
    healthy_t = max(healthy_t or 0.0, HIGH_CONFIDENCE_BAND)
    print("healthy_threshold (aligned to high-confidence band):", healthy_t)

    gate = {"min_fraction": leaf_check["min_fraction"], "healthy_threshold": healthy_t}
    report = {
        "selection": {
            "fitted_on": "internal_val + fit halves of Sylhet/Savar and non-rice sets",
            "max_val_leaf_rejection": MAX_LEAF_REJECT,
            "max_outside_district_leaf_rejection": MAX_EXT_LEAF_REJECT,
            "healthy_precision_target": HEALTHY_PRECISION_TARGET,
            "healthy_threshold_rule": "max(precision-target value, app high-confidence band 0.90)",
        },
        "leaf_check": leaf_check,
        "healthy_threshold": healthy_t,
        "before": {},
        "after": {},
        "non_rice_rejection": {},
    }
    for s in ["internal_val", "internal_test", "sylhet", "savar"]:
        m = sets == s
        if s in ("sylhet", "savar"):
            m &= halves == "report"
        if m.any():
            report["before"][s] = rice_metrics(labels[m], probs[m], frac[m], cal, {})
            report["after"][s] = rice_metrics(labels[m], probs[m], frac[m], cal, gate)
    for s in ["natural", "plantvillage"]:
        m = (sets == s) & (halves == "report")
        if not m.any():
            continue
        acc_b, pred_b, _ = decide(probs[m], frac[m], cal, {})
        acc_a, pred_a, reason_a = decide(probs[m], frac[m], cal, gate)
        groups = {}
        for g in sorted(set(labels[m])):
            gm = labels[m] == g
            groups[g.replace("__ood__:", "")] = round(float((~acc_a[gm]).mean()), 3)
        report["non_rice_rejection"][s] = {
            "n_report_half": int(m.sum()),
            "rejected_before": round(float((~acc_b).mean()), 4),
            "rejected_after": round(float((~acc_a).mean()), 4),
            "called_healthy_before": round(float((acc_b & (pred_b == 0)).mean()), 4),
            "called_healthy_after": round(float((acc_a & (pred_a == 0)).mean()), 4),
            "by_reason_after": {r: int((reason_a == r).sum()) for r in sorted(set(reason_a))},
            "rejected_after_by_group": groups,
        }
    a.out.parent.mkdir(parents=True, exist_ok=True)
    json.dump(report, open(a.out, "w", encoding="utf-8"), indent=2)
    print(json.dumps(report, indent=2))
    if a.write_calibration:
        cal["leaf_check"] = leaf_check
        cal["healthy_threshold"] = healthy_t
        json.dump(cal, open(a.calibration, "w", encoding="utf-8"), indent=2)
        print("updated", a.calibration)


if __name__ == "__main__":
    main()
