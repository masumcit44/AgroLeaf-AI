"""Leaf isolation / background strategies A–F with the live v10 model
(documentation/preprocessing/LEAF_ISOLATION_PROTOCOL.md; all mask parameters fixed there).

Usage:
  python ml/tools/eval_leaf_isolation.py aman   <aman_raw_dir> <v10.onnx> <v10_cal.json> <out_dir>   (needs AMAN_KEEP)
  python ml/tools/eval_leaf_isolation.py sylhet <sylhet.zip>   <v10.onnx> <v10_cal.json> <out_dir> <strategy>
The Sylhet mode scores A and exactly one chosen strategy (one confirmation read).
"""
from __future__ import annotations

import io
import json
import os
import sys
import time
from collections import Counter
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort
import imagehash
import torchvision.transforms as T
from PIL import Image, ImageOps

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))
import compare_models as cm  # noqa: E402
from eval_app import evaluate_set, softmax_np  # noqa: E402
from app_decision import decide_from_calibration  # noqa: E402
from eval_diu_app_path import AMAN_MAP, RULES, load_diu, normalise  # noqa: E402
from eval_sylhet_v9 import load_sylhet  # noqa: E402

STRATEGIES = ["A", "B", "C", "D", "E", "F"]
FILL = {"B": (255, 255, 255), "C": (124, 116, 104), "D": (86, 120, 60)}
APP_TF = T.Compose([T.Resize(366), T.CenterCrop(320)])


def app_image(data):
    im = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGB")
    w, h = im.size
    if max(w, h) > 1024:
        s = 1024 / max(w, h)
        im = im.resize((round(w * s), round(h * s)), Image.BILINEAR)
    return im


def leaf_mask(rgb):
    """Protocol steps 1–4. Returns (mask uint8 0/1, status) with status 'ok' | 'full' | 'failed'."""
    h, w = rgb.shape[:2]
    r, g, b = [rgb[..., i].astype(np.int16) for i in range(3)]
    core = ((2 * g - r - b) > 15).astype(np.uint8)
    long_side = max(h, w)
    k = max(3, int(0.02 * long_side) | 1)
    core = cv2.morphologyEx(core, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    filled = core.copy()                          # fill holes: flood the background from the border
    flood = np.zeros((h + 2, w + 2), np.uint8)
    inv = (1 - filled).astype(np.uint8)
    cv2.floodFill(inv, flood, (0, 0), 0)
    filled = np.maximum(filled, inv)
    d = max(3, int(0.01 * long_side) | 1)
    filled = cv2.dilate(filled, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (d, d)))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(filled, 8)
    keep = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] >= 0.01 * h * w]
    if not keep:
        return None, "failed"
    mask = np.isin(lab, keep).astype(np.uint8)
    if mask.mean() > 0.85:
        return mask, "full"
    return mask, "ok"


def square_crop_box(mask):
    ys, xs = np.nonzero(mask)
    h, w = mask.shape
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    side = int(round(1.30 * max(x1 - x0, y1 - y0)))
    side = min(side, w, h) if side > min(w, h) else side
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    left = int(round(min(max(cx - side / 2, 0), w - side))) if side <= w else 0
    top = int(round(min(max(cy - side / 2, 0), h - side))) if side <= h else 0
    return left, top, min(left + side, w), min(top + side, h)


def strategy_image(im, strategy, mask, status):
    if strategy == "A" or status in ("failed", "full"):
        return im
    rgb = np.asarray(im)
    l, t, r, b = square_crop_box(mask)
    crop = rgb[t:b, l:r].astype(np.float32)
    if strategy == "F":
        return Image.fromarray(crop.astype(np.uint8))
    m = cv2.GaussianBlur(mask[t:b, l:r].astype(np.float32), (7, 7), 0)[..., None]   # ~3 px feather
    if strategy == "E":
        bg = cv2.GaussianBlur(crop, (0, 0), 12)
    else:
        bg = np.empty_like(crop)
        bg[:] = FILL[strategy]
    return Image.fromarray((m * crop + (1 - m) * bg).clip(0, 255).astype(np.uint8))


def outcome_metrics(L, y, cal):
    p = softmax_np(L, cal["temperature"])
    named, top = [], []
    for i in range(len(y)):
        d = decide_from_calibration(dict(zip(cm.CLASSES, p[i].tolist())), cal, None)
        named.append(d["status"] == "confident")
        top.append(cm.CLASSES.index(d["top"][0]) if d["top"] else -1)
    named, top = np.array(named), np.array(top)
    rice = y < 7
    right = named & (top == y)
    other_ok = rice & (y == 6) & ~named
    return {
        "answered": float(named[rice].mean()),
        "right_among_answered": float(right[rice].sum() / max(1, named[rice].sum())),
        "wrong_rate": float((named & (top != y))[rice].mean()),
        "correct_outcome": float((right | other_ok)[rice].mean()),
    }


def run(items, strategies, model, cal, out_dir, examples=6):
    sess = ort.InferenceSession(model, providers=["CPUExecutionProvider"])
    name = sess.get_inputs()[0].name
    logits = {s: [] for s in strategies}
    y, statuses, mask_ms = [], [], []
    ex_dir = Path(out_dir) / "examples"
    ex_dir.mkdir(parents=True, exist_ok=True)
    for idx, (data, key, _raw) in enumerate(items):
        im = app_image(data)
        t0 = time.perf_counter()
        mask, status = leaf_mask(np.asarray(im))
        mask_ms.append((time.perf_counter() - t0) * 1000)
        statuses.append(status)
        y.append(cm.CLASSES.index(key))
        for s in strategies:
            x = APP_TF(strategy_image(im, s, mask, status))
            if idx < examples:
                x.save(ex_dir / f"{idx:02d}_{key}_{s}_{status}.jpg", quality=88)
            logits[s].append(sess.run(None, {name: normalise(np.asarray(x))[None]})[0][0])
    y = np.array(y)
    res = {"n": int(len(y)), "labels": dict(Counter(cm.CLASSES[i] for i in y)),
           "isolation": dict(Counter(statuses)), "mask_ms_median": float(np.median(mask_ms)), "strategies": {}}
    base_top = None
    for s in strategies:
        L = np.array(logits[s], np.float64)
        raw = evaluate_set(L, y, cm.CLASSES, cal, None)["raw"]
        top = L.argmax(1)
        if base_top is None:
            base_top = top
        res["strategies"][s] = {
            "macro_f1": raw["macro_f1"], "accuracy": raw["accuracy"],
            "per_class": {c: {k: round(v, 3) for k, v in m.items()} for c, m in raw["per_class"].items()},
            **outcome_metrics(L, y, cal),
            "top_changed_vs_A": float((top != base_top).mean()),
            "predicted_class_counts": dict(Counter(cm.CLASSES[i] for i in top)),
        }
        np.savez(Path(out_dir) / f"logits_{s}.npz", logits=L, y=y)
    return res


def main():
    mode, src, model, cal_path, out = sys.argv[1:6]
    cal = {**RULES, **json.load(open(cal_path))}
    Path(out).mkdir(parents=True, exist_ok=True)
    if mode == "aman":
        items, _ = load_diu(src, AMAN_MAP)
        keep = {int(x) for x in open(os.environ["AMAN_KEEP"]).read().split()}
        items = [it for i, it in enumerate(items) if i in keep]
        strategies = STRATEGIES
    elif mode == "sylhet":
        chosen = sys.argv[6]
        assert chosen in STRATEGIES and chosen != "A", "Sylhet: exactly one chosen strategy besides A"
        raw_items, seen, items = load_sylhet(src), set(), []
        for data, key, n in raw_items:              # exact pHash duplicates kept once (as eval_sylhet_v9)
            ph = str(imagehash.phash(app_image(data)))
            if ph in seen:
                continue
            seen.add(ph)
            items.append((data, key, n))
        strategies = ["A", chosen]
    else:
        raise SystemExit("mode: aman | sylhet")
    res = run(items, strategies, model, cal, out)
    (Path(out) / "result.json").write_text(json.dumps(res, indent=2))
    print(json.dumps({k: v for k, v in res.items() if k != "strategies"}))
    for s, m in res["strategies"].items():
        print(f"{s}: macroF1 {m['macro_f1']:.4f} acc {m['accuracy']:.4f} answered {m['answered']:.3f} "
              f"right {m['right_among_answered']:.3f} wrong {m['wrong_rate']:.3f} correct_outcome {m['correct_outcome']:.3f} "
              f"changed {m['top_changed_vs_A']:.3f} pred {m['predicted_class_counts']}")


if __name__ == "__main__":
    main()
