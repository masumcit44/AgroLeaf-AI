"""Split an ONNX file into parts under Cloudflare Pages' 25 MiB per-file limit.

The browser joins the parts in order (frontend/src/ml/loadModel.js fetchModel), so
the joined bytes are identical to the original; this script checks that.

Usage: python ml/tools/split_model.py <model.onnx> <out_dir> [part_mib]
Prints the MODEL_PARTS list for frontend/src/ml/config.js.
"""
import hashlib
import sys
from pathlib import Path

src, out = Path(sys.argv[1]), Path(sys.argv[2])
part = int(float(sys.argv[3]) * 2**20) if len(sys.argv) > 3 else 24 * 2**20
data = src.read_bytes()
out.mkdir(parents=True, exist_ok=True)
names = []
for i in range(0, len(data), part):
    p = out / f"{src.stem}.part{i // part}"
    p.write_bytes(data[i:i + part])
    names.append(p.name)
joined = b"".join((out / n).read_bytes() for n in names)
assert hashlib.sha256(joined).digest() == hashlib.sha256(data).digest()
print(f"{len(names)} parts, sha256 {hashlib.sha256(data).hexdigest()}")
print("export const MODEL_PARTS = [" + ", ".join(f"'/models/{n}'" for n in names) + "];")
