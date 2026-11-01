"""Build browser decode-path regression fixtures with PyTorch reference outputs.

Each fixture is a file a farmer could upload (EXIF-rotated phone JPEG, PNG with
transparency, odd aspect ratios, a photo over the 1024 px cap). The reference is
the training-time view of the same picture: EXIF-upright, transparency composited
on white, torchvision Resize(256) + CenterCrop(224), deployed ONNX model.

The EXIF and PNG bugs are also checked directly, because the model is too robust
to always reveal them: the browser test asserts the decoded canvas is upright
(expected_size) and that transparent pixels read as white (white_probe). For
information, the script records how far the *wrong* reading (rotation ignored,
transparency read as black) moves the model's probabilities.

Usage: python ml/tools/make_decode_fixtures.py
Writes frontend/tests/fixtures/decode/ (images + expected.json).
"""
import json
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torchvision.transforms as T
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "frontend" / "public"
OUT = ROOT / "frontend" / "tests" / "fixtures" / "decode"
TOLERANCE = 0.05  # max |p_browser - p_reference| for photos over the 1024 px cap (measured max 0.040);
# below the cap the browser test requires an exact match, see frontend/scripts/verify-decode-parity.mjs

pre = json.loads((PUBLIC / "data" / "preprocess.json").read_text())
cal = json.loads((PUBLIC / "data" / "calibration.json").read_text())
classes = json.loads((PUBLIC / "data" / "class_index.json").read_text())["classes"]
sess = ort.InferenceSession(str(PUBLIC / "models" / "rice-mnv3l-v1.onnx"), providers=["CPUExecutionProvider"])
tf = T.Compose([T.Resize(pre["resize_shorter"]), T.CenterCrop(pre["crop"]), T.ToTensor(), T.Normalize(pre["mean"], pre["std"])])


def probs(rgb):
    logits = sess.run(None, {"input": tf(rgb).unsqueeze(0).numpy()})[0][0] / cal["temperature"]
    e = np.exp(logits - logits.max())
    return (e / e.sum()).tolist()


def training_view(path):
    """How training sees an upload: upright, alpha composited on white, RGB."""
    with Image.open(path) as im:
        im = ImageOps.exif_transpose(im)
        if im.mode in ("RGBA", "LA", "P"):
            im = im.convert("RGBA")
            bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
            return Image.alpha_composite(bg, im).convert("RGB")
        return im.convert("RGB")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    fixtures = []

    def add(name, kind, wrong=None, **checks):
        view = training_view(OUT / name)
        p = probs(view)
        entry = {"file": name, "kind": kind, "expected_size": list(view.size), "expected_probs": p,
                 "expected_top1": classes[int(np.argmax(p))], **checks}
        if wrong is not None:
            entry["wrong_reading_gap"] = round(float(np.max(np.abs(np.array(probs(wrong)) - np.array(p)))), 4)
        fixtures.append(entry)

    for key in ["healthy_1", "blast_1", "brown_spot_1", "sheath_blight_1", "tungro_1"]:
        src = Image.open(PUBLIC / "samples" / f"{key}.jpg").convert("RGB")
        w, h = src.size
        # Odd aspect ratios exercise the long-side truncation and half-even crop offset
        wide = src.resize((1366, 768), Image.LANCZOS)
        wide.save(OUT / f"{key}_1366x768.jpg", quality=92)
        add(f"{key}_1366x768.jpg", "aspect")
        tall = src.resize((683, 1024), Image.LANCZOS)
        tall.save(OUT / f"{key}_683x1024.jpg", quality=92)
        add(f"{key}_683x1024.jpg", "aspect")
        # Over the 1024 px cap: the browser downscales first, training never did
        big = src.resize((1600, 1200), Image.LANCZOS)
        big.save(OUT / f"{key}_1600x1200.jpg", quality=90)
        add(f"{key}_1600x1200.jpg", "large")
        # Phone portrait photo: pixels stored sideways, EXIF Orientation=6 says "rotate 90 deg clockwise"
        upright = src.resize((480, 640), Image.LANCZOS)
        stored = upright.rotate(90, expand=True)  # counter-clockwise; Orientation=6 undoes it
        exif = Image.Exif()
        exif[0x0112] = 6
        stored.save(OUT / f"{key}_exif6.jpg", quality=95, exif=exif.tobytes())
        add(f"{key}_exif6.jpg", "exif", wrong=Image.open(OUT / f"{key}_exif6.jpg").convert("RGB"))
        # PNG with a transparent frame whose hidden colour is magenta
        rgba = src.resize((448, 448), Image.LANCZOS).convert("RGBA")
        a = np.array(rgba)
        a[:150, :, :3] = (255, 0, 255)
        a[:150, :, 3] = 0
        a[-150:, :, :3] = (255, 0, 255)
        a[-150:, :, 3] = 0
        Image.fromarray(a, "RGBA").save(OUT / f"{key}_alpha.png")
        black = a.copy()
        black[black[:, :, 3] == 0, :3] = 0
        add(f"{key}_alpha.png", "alpha", wrong=Image.fromarray(black[:, :, :3], "RGB"), white_probe=[224, 40])

    out = {"model": "rice-mnv3l-v1.onnx", "tolerance": TOLERANCE, "classes": classes, "fixtures": fixtures}
    (OUT / "expected.json").write_text(json.dumps(out, indent=2))
    for f in fixtures:
        print(f"{f['file']:32s} {f['kind']:6s} top1={f['expected_top1']:14s} gap={f.get('wrong_reading_gap', '-')}")


if __name__ == "__main__":
    main()
