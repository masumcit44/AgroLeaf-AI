"""One-time final test of v9 vs live v8_b0 on Sylhet (run9_v9/PROTOCOL_EVAL.md), app preprocessing and rule.

Images are read straight from the Kaggle zip (sikanderk/riceleafbd-mendeley).
- Mapping: Healthy Leaf -> healthy, Brown Spot -> brown_spot, Tungro Virus -> tungro, Bacterial Leaf Blight -> other_rice.
- Exact pHash duplicates inside Sylhet are kept once (first in zip order), for both systems alike.
- Gate: run9_v9/PROTOCOL_EVAL.md. Per-class precision / recall / F1 are reported against the 90% target (not a gate condition).

Usage: python ml/tools/eval_sylhet_v9.py <sylhet.zip> <v8.onnx> <v8_cal.json> <v9.onnx> <v9_cal.json> <out_dir>
"""
from __future__ import annotations

import io
import json
import sys
import zipfile
from collections import Counter
from pathlib import Path

import numpy as np
import onnxruntime as ort

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))
import compare_models as cm  # noqa: E402
import coverage_compare as cc  # noqa: E402
from eval_app import evaluate_set  # noqa: E402
from eval_diu_app_path import RULES, app_crops, run  # noqa: E402

SYLHET_MAP = {"Healthy Leaf": "healthy", "Brown Spot": "brown_spot", "Tungro Virus": "tungro", "Bacterial Leaf Blight": "other_rice"}


def load_sylhet(zip_path):
    z = zipfile.ZipFile(zip_path)
    items = []
    for n in z.namelist():
        if not n.lower().endswith((".jpg", ".jpeg", ".png")):
            continue
        folder = n.split("/")[-2]
        if folder in SYLHET_MAP:
            items.append((z.read(n), SYLHET_MAP[folder], n))
    return items


def per_class(y, pred, labels):
    out = {}
    for c in labels:
        tp = int(np.sum((pred == c) & (y == c))); fp = int(np.sum((pred == c) & (y != c))); fn = int(np.sum((pred != c) & (y == c)))
        p = tp / (tp + fp) if tp + fp else 0.0; r = tp / (tp + fn) if tp + fn else 0.0
        out[cm.CLASSES[c]] = {"precision": round(p, 4), "recall": round(r, 4), "f1": round(2 * p * r / (p + r), 4) if p + r else 0.0,
                              "support": int(np.sum(y == c)), "meets_90": bool(p >= 0.9 and r >= 0.9)}
    return out


def main():
    zp, v8p, v8c, v9p, v9c, out = sys.argv[1:7]
    out = Path(out)
    cals = {"v8_b0": {**RULES, **json.load(open(v8c))}, "v9": {**RULES, **json.load(open(v9c))}}
    paths = {"v8_b0": v8p, "v9": v9p}
    sizes = sorted({224} | {c.get("input_size", 224) for c in cals.values()})  # app_crops always returns the 224 view
    items = load_sylhet(zp)
    crops, keep, seen, dups = {sz: [] for sz in sizes}, [], set(), 0
    for data, key, name in items:
        cs, _, ph = app_crops(data, sizes)
        if ph in seen:
            dups += 1
            continue
        seen.add(ph)
        for sz in sizes:
            crops[sz].append(cs[sz])
        keep.append(key)
    y = np.array([cm.CLASSES.index(k) for k in keep])
    print("Sylhet:", dict(Counter(keep)), "| exact pHash duplicates dropped:", dups, flush=True)
    imgs, raw = {}, {}
    for name in ("v8_b0", "v9"):
        s = ort.InferenceSession(paths[name], providers=["CPUExecutionProvider"])
        L = run(s, crops[cals[name].get("input_size", 224)])
        (out / name).mkdir(parents=True, exist_ok=True)
        np.savez(out / name / "sylhet__heldout.npz", logits=L, y=y, leaf_fraction=np.zeros(len(y)))
        imgs[name] = cc.per_image(out / name, "sylhet__heldout", cals[name])
        raw[name] = evaluate_set(L, y, cm.CLASSES, cals[name], None)
    base = cc.at(imgs["v8_b0"], cals["v8_b0"]["threshold"])
    target = max(base["coverage"], 0.30)
    tb, tc = cc.threshold_for(imgs["v8_b0"], target), cc.threshold_for(imgs["v9"], target)
    res = {"n": int(len(y)), "labels": dict(Counter(keep)), "duplicates_dropped": dups, "target_coverage": target,
           "v8_b0_as_deployed": cc.strip(base), "v9_as_calibrated": cc.strip(cc.at(imgs["v9"], cals["v9"]["threshold"]))}
    if tb is not None and tc is not None:
        a, b = cc.at(imgs["v8_b0"], tb), cc.at(imgs["v9"], tc)
        ci = cc.paired_bootstrap(a, b)
        res.update(v8_b0_at_target=cc.strip(a), v9_at_target=cc.strip(b), right_diff=(b["selective_accuracy"] or 0) - (a["selective_accuracy"] or 0), diff_ci95=ci)
    else:
        res["v9_at_target"] = "coverage not reachable"
    diag = sorted(set(y.tolist()) - {6, 7})
    for name in ("v8_b0", "v9"):
        res[f"raw_{name}"] = {k: raw[name]["raw"][k] for k in ("accuracy", "macro_f1")}
        res[f"per_class_{name}"] = per_class(y, raw[name]["raw_pred"] if "raw_pred" in raw[name] else np.load(out / name / "sylhet__heldout.npz")["logits"].argmax(1), diag + [6])
    g = {}
    g["1_macro_f1_higher"] = res["raw_v9"]["macro_f1"] > res["raw_v8_b0"]["macro_f1"]
    g["2_right_not_lower_ci_ge_-2"] = bool(isinstance(res.get("v9_at_target"), dict) and res["right_diff"] >= 0 and res["diff_ci95"][0] >= -0.02)
    vb = res["v8_b0_at_target"] if "v8_b0_at_target" in res else base
    vc = res["v9_at_target"] if isinstance(res.get("v9_at_target"), dict) else None
    g["3_false_healthy_le_+2"] = bool(vc and (vc["false_healthy_rate"] or 0) <= (vb["false_healthy_rate"] or 0) + 0.02)
    g["3_unsupported_le_+2"] = bool(vc and (vc["unsupported_escape_rate"] or 0) <= (vb["unsupported_escape_rate"] or 0) + 0.02)
    res["gate"] = g
    res["gate_pass_sylhet_conditions"] = all(g.values())
    (out / "decision.json").write_text(json.dumps(res, indent=2, default=float))
    print(json.dumps({k: v for k, v in res.items() if not k.startswith("raw_")}, indent=1, default=float))


if __name__ == "__main__":
    main()
