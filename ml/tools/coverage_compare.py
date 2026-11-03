"""v1 vs a candidate at fixed answer rates on the same images (DECISION_PROTOCOL.md).

For each model, the app's full decision rule (ml/app_decision.py) is run once with
threshold 0. That gives every image's top class and whether it would be answered
apart from the threshold (colour gate, reject outputs, ties, leaf smut, Healthy
>= 0.90). Raising the main threshold then answers exactly the eligible images whose
top probability is >= it, so each coverage level is a probability cut.

Usage: python ml/tools/coverage_compare.py <eval_dir> <candidate_model> <out.json>
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))
import compare_models as cm  # noqa: E402
from app_decision import decide_from_calibration  # noqa: E402
from eval_app import evaluate_set, softmax_np  # noqa: E402

COMPARE_SET = "raihan_bd__extval"
NONRICE_VAL = ["natural__val", "plantvillage__val", "posters__val", "memes__val", "generated__val"]
FIXED = [0.20, 0.40, 0.60]
MIN_USEFUL = 0.30
RULES = {"healthy_threshold": 0.9, "suppress": ["leaf_smut"]}
DIAG = cm.CLASSES[:6]


def per_image(model_dir: Path, name: str, cal: dict):
    L, y, lf = cm.load(model_dir, name)
    p = softmax_np(L, cal["temperature"])
    base = {**cal, "threshold": 0.0}
    top, eligible = [], []
    for i in range(len(y)):
        d = decide_from_calibration(dict(zip(cm.CLASSES, p[i].tolist())), base, float(lf[i]) if "leaf_check" in cal else None)
        eligible.append(d["status"] == "confident")
        top.append(cm.CLASSES.index(d["top"][0]) if d["top"] else -1)
    return dict(y=y, top=np.array(top), conf=p.max(1), eligible=np.array(eligible), L=L)


def threshold_for(img, coverage):
    """Largest threshold whose coverage (over rice photos) is still >= the target."""
    rice = img["y"] < 7
    c = np.sort(img["conf"][img["eligible"] & rice])[::-1]
    k = int(np.ceil(coverage * rice.sum() - 1e-9))  # 0.56 * 300 is 168.00000000000003 in floating point
    return float(c[k - 1]) if 0 < k <= len(c) else None


def at(img, thr):
    rice, diag = img["y"] < 7, img["y"] < 6
    named = img["eligible"] & (img["conf"] >= thr) & rice
    right = named & (img["top"] == img["y"])
    diseased = diag & (img["y"] != 0)
    other = img["y"] == 6
    return {
        "threshold": round(thr, 4), "rice_images": int(rice.sum()), "answered": int(named.sum()), "not_answered": int((rice & ~named).sum()),
        "coverage": float(named.sum() / rice.sum()), "selective_accuracy": float(right.sum() / named.sum()) if named.any() else None,
        "per_class_answered_correct": {DIAG[c]: f"{int((right & (img['y'] == c)).sum())}/{int((img['y'] == c).sum())}" for c in range(6) if (img["y"] == c).any()},
        "false_healthy_rate": float(np.mean(named[diseased] & (img["top"][diseased] == 0))) if diseased.any() else None,
        "unsupported_escape_rate": float(np.mean(named[other])) if other.any() else None,
        "_named": named, "_right": right,
    }


def paired_bootstrap(a, b, n=2000, seed=0):
    """95% interval of selective_accuracy(b) - selective_accuracy(a), resampling images."""
    rng = np.random.default_rng(seed)
    idx = np.arange(len(a["_named"]))
    d = []
    for _ in range(n):
        s = rng.choice(idx, len(idx))
        sa = a["_right"][s].sum() / max(1, a["_named"][s].sum())
        sb = b["_right"][s].sum() / max(1, b["_named"][s].sum())
        d.append(sb - sa)
    return [float(np.percentile(d, 2.5)), float(np.percentile(d, 97.5))]


def strip(m):
    return {k: v for k, v in m.items() if not k.startswith("_")}


def main():
    eval_dir, cand, out = Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3])
    names = sorted(json.loads((eval_dir / "index.json").read_text())["sets"])
    v1_cal = cm.V1_CAL
    cand_cal, _ = cm.fit(eval_dir / cand, names, dict(RULES))  # temperature from the selection set
    imgs = {"v1": per_image(eval_dir / "v1_mnv3l", COMPARE_SET, v1_cal), cand: per_image(eval_dir / cand, COMPARE_SET, cand_cal)}
    report = {"protocol": "model/experiments/eval_unified/DECISION_PROTOCOL.md", "compare_set": COMPARE_SET,
              "calibration": {"v1": v1_cal, cand: cand_cal}, "operating_points": {}}

    v1_deployed = at(imgs["v1"], v1_cal["threshold"])
    target = max(v1_deployed["coverage"], MIN_USEFUL)
    points = [(f"{int(c * 100)}%", c) for c in FIXED] + [(f"decision point: max(v1 deployed {v1_deployed['coverage']:.1%}, 30%)", target)]
    for label, c in points:
        row = {}
        ms = {}
        for k, img in imgs.items():
            thr = threshold_for(img, c)
            ms[k] = at(img, thr) if thr is not None else None
            row[k] = strip(ms[k]) if ms[k] else "coverage not reachable"
        if all(ms.values()):
            row["selective_accuracy_diff_ci95"] = paired_bootstrap(ms["v1"], ms[cand])
        report["operating_points"][label] = row
    report["v1_as_deployed"] = strip(v1_deployed)

    for k, cal in (("v1", v1_cal), (cand, cand_cal)):
        d = eval_dir / ("v1_mnv3l" if k == "v1" else cand)
        L, y, lf = cm.load(d, COMPARE_SET)
        full = evaluate_set(L, y, cm.CLASSES, cal, lf if "leaf_check" in cal else None)
        report.setdefault("raw", {})[k] = {kk: full["raw"][kk] for kk in ("accuracy", "macro_f1", "per_class", "confusion_matrix", "ece")}
        report.setdefault("non_rice_rejected", {})[k] = {
            n: evaluate_set(*cm.load(d, n)[:2], cm.CLASSES, cal, cm.load(d, n)[2] if "leaf_check" in cal else None)["app"]["not_rice_no_disease_named"]
            for n in NONRICE_VAL}
    out.write_text(json.dumps(report, indent=2, default=float))
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
