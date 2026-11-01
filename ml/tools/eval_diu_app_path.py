"""Score the live system (v1 + G1 gate) and a candidate on the DIU Bangladesh raw set
through the app's own preprocessing, then apply model/experiments/run5_v5/PROTOCOL.md.

App path (verified equal to the browser by the decode-path test): EXIF upright,
longest side capped at 1024, Resize(256) + CenterCrop(224) (Pillow BILINEAR, as
torchvision), ImageNet normalisation; decisions by ml/app_decision.py.

Usage:
  python ml/tools/eval_diu_app_path.py <diu_raw_dir> <v1.onnx> <v1_calibration.json>
      <gate.onnx> <candidate.onnx> <candidate_calibration.json> <out_dir>
Writes <out_dir>/{v1_live,candidate}/diu__heldout.npz, index.json and decision.json.
"""
from __future__ import annotations

import glob
import io
import json
import sys
from collections import Counter
from pathlib import Path

import numpy as np
import onnxruntime as ort
import pyarrow.parquet as pq
import torchvision.transforms as T
from PIL import Image, ImageOps

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))
import compare_models as cm  # noqa: E402
import coverage_compare as cc  # noqa: E402
from eval_app import evaluate_set  # noqa: E402

# DIU class names (from the parquet metadata): Healthy, Insect, Leaf Scald, Rice, Rice Blast,
# Rice Leaffolder, Rice Stripes, Rice Tungro. "Rice" (unclear) is excluded, per PROTOCOL.md.
DIU_MAP = {"healthy": "healthy", "rice blast": "blast", "rice tungro": "tungro", "leaf scald": "other_rice",
           "insect": "other_rice", "rice leaffolder": "other_rice", "rice stripes": "other_rice"}
GEO = T.Compose([T.Resize(256), T.CenterCrop(224)])
NORM = T.Compose([T.ToTensor(), T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])])


def label_names(pf):
    meta = pf.schema_arrow.metadata or {}
    info = json.loads(meta.get(b"huggingface", b"{}")).get("info", {}).get("features", {})
    for name, f in info.items():
        if f.get("_type") == "ClassLabel":
            return name, f["names"]
    return None, None


def load_diu(raw_dir):
    items, skipped = [], Counter()
    for path in sorted(glob.glob(f"{raw_dir}/*.parquet")):
        pf = pq.ParquetFile(path)
        lab_col, names = label_names(pf)
        tbl = pf.read()
        img_col = [c for c in tbl.column_names if c != lab_col][0]
        for img, lab in zip(tbl[img_col].to_pylist(), tbl[lab_col].to_pylist()):
            raw = names[lab] if names else str(lab)
            key = DIU_MAP.get(raw.strip().lower().replace("_", " "))
            if key is None:
                skipped[raw] += 1
                continue
            items.append((img["bytes"], key, raw))
    return items, skipped


def app_tensor(data):
    im = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGB")
    w, h = im.size
    if max(w, h) > 1024:
        s = 1024 / max(w, h)
        im = im.resize((round(w * s), round(h * s)), Image.BILINEAR)
    crop = GEO(im)
    return NORM(crop).numpy(), crop


def leaf_fraction(crop, lc):
    hsv = np.asarray(crop.convert("HSV")).reshape(-1, 3).astype(int)
    b = hsv[:, 0] * 36 // 256
    return float(np.mean((b >= lc["hue_bin_min"]) & (b <= lc["hue_bin_max"]) & (hsv[:, 1] >= lc["sat_min"]) & (hsv[:, 2] >= lc["val_min"])))


def run(sess, x):
    name = sess.get_inputs()[0].name
    return np.concatenate([sess.run(None, {name: x[i:i + 1]})[0] for i in range(len(x))])


def main():
    raw_dir, v1p, v1c, gatep, candp, candc, out = sys.argv[1:8]
    out = Path(out)
    v1_cal, cand_cal = json.load(open(v1c)), json.load(open(candc))
    items, skipped = load_diu(raw_dir)
    print("DIU used:", dict(Counter((r, k) for _, k, r in items)), "| skipped:", dict(skipped), flush=True)
    xs, lfs = [], []
    for data, _, _ in items:
        x, crop = app_tensor(data)
        xs.append(x)
        lfs.append(leaf_fraction(crop, v1_cal["leaf_check"]))
    X = np.stack(xs).astype(np.float32)
    y = np.array([cm.CLASSES.index(k) for _, k, _ in items])
    s = lambda p: ort.InferenceSession(p, providers=["CPUExecutionProvider"])
    L1, Lg, Lc = run(s(v1p), X), run(s(gatep), X), run(s(candp), X)
    gate = Lg.argmax(1) == 7
    # live system: v1 logits padded to 8 outputs; gated rows forced to the not_rice outcome
    L1p = np.concatenate([L1, np.full((len(L1), 2), -1e4)], 1)
    L1p[gate] = -1e4
    L1p[gate, 7] = 0.0
    for name, L in (("v1_live", L1p), ("candidate", Lc)):
        (out / name).mkdir(parents=True, exist_ok=True)
        np.savez(out / name / "diu__heldout.npz", logits=L, y=y, leaf_fraction=np.array(lfs))
    (out / "index.json").write_text(json.dumps({"sets": {"diu__heldout": int(len(y))}, "gate_rejected": int(gate.sum())}))
    # decision (protocol): same images, app rule; live = v1 deployed calibration + colour gate + G1
    live_img = cc.per_image(out / "v1_live", "diu__heldout", v1_cal)
    cand_img = cc.per_image(out / "candidate", "diu__heldout", cand_cal)
    live = cc.at(live_img, v1_cal["threshold"])
    target = max(live["coverage"], 0.30)
    t_live, t_cand = cc.threshold_for(live_img, target), cc.threshold_for(cand_img, target)
    res = {"n": int(len(y)), "labels": dict(Counter(cm.CLASSES[i] for i in y)), "gate_rejected_rice": int(gate.sum()),
           "live_as_deployed": cc.strip(live), "target_coverage": target}
    if t_live is not None and t_cand is not None:
        a, b = cc.at(live_img, t_live), cc.at(cand_img, t_cand)
        res.update(live_at_target=cc.strip(a), candidate_at_target=cc.strip(b), diff_ci95=cc.paired_bootstrap(a, b))
    else:
        res["candidate_at_target"] = "coverage not reachable"
    res["candidate_as_calibrated"] = cc.strip(cc.at(cand_img, cand_cal["threshold"]))
    for name, cal in (("v1_live", v1_cal), ("candidate", cand_cal)):
        L, yy, lf = cm.load(out / name, "diu__heldout")
        res[f"raw_{name}"] = evaluate_set(L, yy, cm.CLASSES, cal, lf if "leaf_check" in cal else None)
    (out / "decision.json").write_text(json.dumps(res, indent=2, default=float))
    print(json.dumps({k: v for k, v in res.items() if not k.startswith("raw_")}, indent=1, default=float))


if __name__ == "__main__":
    main()
