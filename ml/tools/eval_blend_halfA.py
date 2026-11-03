"""Blends of already-scored models on DIU half A (run9_v9/PROTOCOL_AMENDMENT_2.md and 3).

Each member's half-A logits come from eval_diu_app_path.py (<half_A_dir>/<name>/diu__heldout.npz).
Each member's probabilities use its own temperature. The blend threshold is fitted on the
in-domain validation rows only (every preds_*_val.npz, rows matched by file name): the smallest
threshold in 0.30..0.95 where answers on rice rows are >= 92% right (as in training). DIU half A is
then scored with the app rules and compared with the reference model at the reference's own answer rate.

kind: single (one member, its own calibration), avg (mean of the probability vectors), or
classwise (two members; first member's weight 1.0 healthy, 0.0 blast and tungro, 0.5 otherwise).

Usage:
  python ml/tools/eval_blend_halfA.py <half_A_dir> <ref_name>=<ref_cal.json> <kind> <out_name>
      <name>=<val_dir>,<cal.json> [...]
Writes <half_A_dir>/<out_name>/diu__heldout.npz and <half_A_dir>/<out_name>/result.json.
"""
from __future__ import annotations

import glob
import json
import os
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))
import compare_models as cm  # noqa: E402
import coverage_compare as cc  # noqa: E402
from eval_app import evaluate_set, softmax_np  # noqa: E402

RULES = {"healthy_threshold": 0.9, "suppress": ["leaf_smut"]}
TARGET = 0.92
CI = {c: i for i, c in enumerate(cm.CLASSES)}
CLASSWISE_FIRST = np.array([1.0 if c == "healthy" else 0.0 if c in ("blast", "tungro") else 0.5 for c in cm.CLASSES])


def val_rows(val_dir):
    rows = {}
    for f in sorted(glob.glob(f"{val_dir}/preds_*_val.npz")):
        z = np.load(f)
        for name, l, y in zip(z["files"], z["logits"], z["y"]):
            rows[(os.path.basename(f), str(name))] = (l, int(y))
    return rows


def blend(probs, kind):
    if kind == "single":
        return probs[0]
    if kind == "avg":
        return np.mean(probs, 0)
    assert kind == "classwise" and len(probs) == 2
    p = CLASSWISE_FIRST * probs[0] + (1 - CLASSWISE_FIRST) * probs[1]
    return p / p.sum(1, keepdims=True)


def fit_threshold(p, y):
    top, conf, rice = p.argmax(1), p.max(1), y < 7
    for t in np.arange(0.30, 0.96, 0.01):
        a = (top < 6) & (top != CI["leaf_smut"]) & (conf >= t) & rice
        if a.sum() and np.mean(top[a] == y[a]) >= TARGET:
            return float(round(t, 2)), True
    return 0.95, False


def main():
    half_dir, ref, kind, out_name = Path(sys.argv[1]), sys.argv[2].split("="), sys.argv[3], sys.argv[4]
    members = [(n, *spec.split(",")) for n, spec in (a.split("=", 1) for a in sys.argv[5:])]
    assert (kind == "single") == (len(members) == 1)
    cals = [json.load(open(c)) for _, _, c in members]
    if kind == "single":
        cal = {**RULES, **cals[0]}
        reached, n_val = None, None
    else:
        vals = [val_rows(v) for _, v, _ in members]
        keys = sorted(set.intersection(*(set(v) for v in vals)))
        yv = np.array([vals[0][k][1] for k in keys])
        assert all(np.array_equal(yv, [v[k][1] for k in keys]) for v in vals), "validation labels differ"
        pv = blend([softmax_np(np.array([v[k][0] for k in keys], np.float64), c["temperature"]) for v, c in zip(vals, cals)], kind)
        thr, reached = fit_threshold(pv, yv)
        cal, n_val = {**RULES, "temperature": 1.0, "threshold": thr}, len(keys)
    loaded = [cm.load(half_dir / n, "diu__heldout") for n, _, _ in members]
    y, lf = loaded[0][1], loaded[0][2]
    assert all(np.array_equal(y, l[1]) for l in loaded)
    if kind == "single":
        L = loaded[0][0]
    else:
        L = np.log(blend([softmax_np(l[0], c["temperature"]) for l, c in zip(loaded, cals)], kind) + 1e-12)
    out = half_dir / out_name
    out.mkdir(parents=True, exist_ok=True)
    np.savez(out / "diu__heldout.npz", logits=L, y=y, leaf_fraction=lf)
    ref_cal = {**RULES, **json.load(open(ref[1]))}
    base = cc.at(cc.per_image(half_dir / ref[0], "diu__heldout", ref_cal), ref_cal["threshold"])
    img = cc.per_image(out, "diu__heldout", cal)
    res = {"kind": kind, "members": [n for n, _, _ in members], "calibration": cal, "val_rows": n_val, "val_target_reached": reached,
           "reference": ref[0], "reference_as_calibrated": cc.strip(base), "as_calibrated": cc.strip(cc.at(img, cal["threshold"])),
           "max_reachable_coverage": float((img["eligible"] & (img["y"] < 7)).sum() / (img["y"] < 7).sum())}
    t = cc.threshold_for(img, base["coverage"])
    if t is None:
        res["at_reference_rate"] = "coverage not reachable"
    else:
        b = cc.at(img, t)
        res.update(at_reference_rate=cc.strip(b), right_share_diff=(b["selective_accuracy"] or 0) - (base["selective_accuracy"] or 0),
                   diff_ci95=cc.paired_bootstrap(base, b))
    res["qualifies"] = bool(t is not None and res["right_share_diff"] > 0)
    raw = evaluate_set(L, y, cm.CLASSES, cal, None)["raw"]
    res["raw"] = {"macro_f1": raw["macro_f1"], "accuracy": raw["accuracy"],
                  "per_class": {c: {k: round(v, 3) for k, v in m.items()} for c, m in raw["per_class"].items()}}
    (out / "result.json").write_text(json.dumps(res, indent=2, default=float))
    print(json.dumps({k: res[k] for k in ("kind", "members", "calibration", "max_reachable_coverage", "qualifies")}, default=float))
    print("as calibrated:", {k: res["as_calibrated"][k] for k in ("coverage", "selective_accuracy", "false_healthy_rate", "unsupported_escape_rate")})
    if t is not None:
        print("at ref rate:", {k: res["at_reference_rate"][k] for k in ("coverage", "selective_accuracy")}, "diff", round(res["right_share_diff"], 4), "CI", res["diff_ci95"])
    print("raw macro-F1", round(raw["macro_f1"], 4), {c: (m["precision"], m["recall"]) for c, m in res["raw"]["per_class"].items()})


if __name__ == "__main__":
    main()
