"""Score the live system (v1 + G1 gate) and a candidate on the DIU Bangladesh raw set
through the app's own preprocessing, then apply model/experiments/run5_v5/PROTOCOL.md.

App path (verified equal to the browser by the decode-path test): EXIF upright,
longest side capped at 1024, Resize(256) + CenterCrop(224) (Pillow BILINEAR, as
torchvision), ImageNet normalisation; decisions by ml/app_decision.py.

DIU is split per PROTOCOL_AMENDMENT_1.md: half A selects between candidates, half B is the
release decision for the one selected candidate (read once).

Usage:
  python ml/tools/eval_diu_app_path.py <diu_raw_dir> <v1.onnx> <v1_calibration.json> <gate.onnx>
      <out_dir> <A|B> <name>=<model.onnx>,<calibration.json> [...]
Writes <out_dir>/half_<A|B>/{v1_live,<name>...}/diu__heldout.npz and decision.json.
"""
from __future__ import annotations

import glob
import hashlib
import io
import json
import sys
from collections import Counter
from pathlib import Path

import numpy as np
import onnxruntime as ort
import pyarrow.parquet as pq
import imagehash
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
RULES = {"healthy_threshold": 0.9, "suppress": ["leaf_smut"]}
# Aman 2025 Bangladesh (Hugging Face Project-AgML/rice_leaf_disease_classification_bd): v7's second final test
AMAN_MAP = {"healthy": "healthy", "leaf_blast": "blast", "brown_spot": "brown_spot", "bacterial_leaf_blight": "other_rice",
            "leaf_scald": "other_rice", "narrow_brown_spot": "other_rice"}
GEO = T.Compose([T.Resize(256), T.CenterCrop(224)])
NORM = T.Compose([T.ToTensor(), T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])])
MEAN = np.array([0.485, 0.456, 0.406], np.float32)
STD = np.array([0.229, 0.224, 0.225], np.float32)


def label_names(pf):
    meta = pf.schema_arrow.metadata or {}
    info = json.loads(meta.get(b"huggingface", b"{}")).get("info", {}).get("features", {})
    for name, f in info.items():
        if f.get("_type") == "ClassLabel":
            return name, f["names"]
    return None, None


def load_diu(raw_dir, mapping=DIU_MAP):
    items, skipped = [], Counter()
    for path in sorted(glob.glob(f"{raw_dir}/*.parquet")):
        pf = pq.ParquetFile(path)
        lab_col, names = label_names(pf)
        tbl = pf.read()
        img_col = [c for c in tbl.column_names if c != lab_col][0]
        for img, lab in zip(tbl[img_col].to_pylist(), tbl[lab_col].to_pylist()):
            raw = names[lab] if names else str(lab)
            key = mapping.get(raw.strip().lower().replace("_", " ") if mapping is DIU_MAP else raw)
            if key is None:
                skipped[raw] += 1
                continue
            items.append((img["bytes"], key, raw))
    return items, skipped


def app_tensor(data):
    cs, crop, ph = app_crops(data, [224])
    return normalise(cs[224]), crop, ph


def app_crops(data, sizes):
    """App preprocessing for each input size: EXIF upright, long side <= 1024, Resize(size * 8 / 7) +
    CenterCrop(size) (Pillow bilinear, as torchvision). Returns uint8 crops, the 224 crop and the pHash."""
    im = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGB")
    w, h = im.size
    if max(w, h) > 1024:
        s = 1024 / max(w, h)
        im = im.resize((round(w * s), round(h * s)), Image.BILINEAR)
    crops = {sz: T.Compose([T.Resize(round(sz * 8 / 7)), T.CenterCrop(sz)])(im) for sz in sizes}
    return {sz: np.asarray(c) for sz, c in crops.items()}, crops[224], str(imagehash.phash(im))


def normalise(u8):
    return ((u8.astype(np.float32) / 255 - MEAN) / STD).transpose(2, 0, 1)


def leaf_fraction(crop, lc):
    hsv = np.asarray(crop.convert("HSV")).reshape(-1, 3).astype(int)
    b = hsv[:, 0] * 36 // 256
    return float(np.mean((b >= lc["hue_bin_min"]) & (b <= lc["hue_bin_max"]) & (hsv[:, 1] >= lc["sat_min"]) & (hsv[:, 2] >= lc["val_min"])))


def run(sess, crops):
    name = sess.get_inputs()[0].name
    return np.concatenate([sess.run(None, {name: normalise(c)[None]})[0] for c in crops])


def diu_half(phash_hex):
    """PROTOCOL_AMENDMENT_1.md: group = pHash minus its last hex digit; A if md5(group) is even."""
    return "A" if int(hashlib.md5(phash_hex[:-1].encode()).hexdigest(), 16) % 2 == 0 else "B"


def main():
    raw_dir, v1p, v1c, gatep, out, half = sys.argv[1:7]
    cands = [a.split("=", 1) for a in sys.argv[7:]]  # name=model.onnx,calibration.json
    assert half in ("A", "B", "AMAN"), "half: A (selection), B or AMAN (final tests: one candidate, read once)"
    assert cands and (half == "A" or len(cands) == 1), "final tests score exactly one (the selected) candidate"
    out = Path(out) / (f"half_{half}" if half != "AMAN" else "aman2025")
    v1_cal = json.load(open(v1c))
    cand_cals = {name: {**RULES, **json.load(open(spec.split(",", 1)[1]))} for name, spec in cands}
    sizes = sorted({224} | {c.get("input_size", 224) for c in cand_cals.values()})
    items, skipped = load_diu(raw_dir, AMAN_MAP if half == "AMAN" else DIU_MAP)
    crops, lfs, keep = {sz: [] for sz in sizes}, [], []
    for data, key, raw in items:
        cs, crop224, ph = app_crops(data, sizes)
        if half != "AMAN" and diu_half(ph) != half:
            continue
        for sz in sizes:
            crops[sz].append(cs[sz])
        lfs.append(leaf_fraction(crop224, v1_cal["leaf_check"])); keep.append((key, raw))
    print(f"set {half}:", dict(Counter(keep)), "| skipped:", dict(skipped), "| input sizes:", sizes, flush=True)
    y = np.array([cm.CLASSES.index(k) for k, _ in keep])
    s = lambda p: ort.InferenceSession(p, providers=["CPUExecutionProvider"])
    L1, Lg = run(s(v1p), crops[224]), run(s(gatep), crops[224])
    gate = Lg.argmax(1) == 7
    # live system: v1 logits padded to 8 outputs; gated rows forced to the not_rice outcome
    L1p = np.concatenate([L1, np.full((len(L1), 2), -1e4)], 1)
    L1p[gate] = -1e4
    L1p[gate, 7] = 0.0
    logits, cals = {"v1_live": L1p}, {"v1_live": v1_cal}
    for name, spec in cands:
        mp = spec.split(",", 1)[0]
        cals[name] = cand_cals[name]  # app rules (Healthy >= 0.90, leaf smut not named) as in PROTOCOL.md
        logits[name] = run(s(mp), crops[cals[name].get("input_size", 224)])
    for name, L in logits.items():
        (out / name).mkdir(parents=True, exist_ok=True)
        np.savez(out / name / "diu__heldout.npz", logits=L, y=y, leaf_fraction=np.array(lfs))
    imgs = {name: cc.per_image(out / name, "diu__heldout", cals[name]) for name in logits}
    live = cc.at(imgs["v1_live"], v1_cal["threshold"])
    target = max(live["coverage"], 0.30)
    t_live = cc.threshold_for(imgs["v1_live"], target)
    res = {"half": half, "n": int(len(y)), "labels": dict(Counter(cm.CLASSES[i] for i in y)),
           "gate_rejected_rice": int(gate.sum()), "live_as_deployed": cc.strip(live), "target_coverage": target,
           "live_at_target": cc.strip(cc.at(imgs["v1_live"], t_live)) if t_live is not None else None, "candidates": {}}
    for name in logits:
        if name == "v1_live":
            continue
        r = {"calibration": cals[name], "as_calibrated": cc.strip(cc.at(imgs[name], cals[name]["threshold"]))}
        t = cc.threshold_for(imgs[name], target)
        if t is not None and t_live is not None:
            a, b = cc.at(imgs["v1_live"], t_live), cc.at(imgs[name], t)
            r.update(at_target=cc.strip(b), right_share_diff_vs_live=(b["selective_accuracy"] or 0) - (a["selective_accuracy"] or 0),
                     diff_ci95=cc.paired_bootstrap(a, b))
        else:
            r["at_target"] = "coverage not reachable"
        res["candidates"][name] = r
    for name in logits:
        L, yy, lf = cm.load(out / name, "diu__heldout")
        res.setdefault("raw", {})[name] = evaluate_set(L, yy, cm.CLASSES, cals[name], lf if "leaf_check" in cals[name] else None)
    (out / "decision.json").write_text(json.dumps(res, indent=2, default=float))
    print(json.dumps({k: v for k, v in res.items() if k != "raw"}, indent=1, default=float))


if __name__ == "__main__":
    main()
