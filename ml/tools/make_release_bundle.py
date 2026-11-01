#!/usr/bin/env python3
"""Validate a Kaggle run folder and copy its artefacts into the app.

This is the one-command bridge between ``run1_for_app.zip`` (Kaggle output) and
the files the frontend reads. It only copies: the extracted run and the original
zip are never modified or deleted.

Usage:
    python ml/tools/make_release_bundle.py --run-zip "D:\\...\\run1_for_app.zip"
    python ml/tools/make_release_bundle.py --run-zip "D:\\...\\run1" --dry-run
    python ml/tools/make_release_bundle.py --run-zip run1_for_app.zip --repo "D:\\...\\repo"

Exit codes: 0 = validated (and copied), 1 = validation failed or bad input.
"""

import argparse
import json
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
TOOLS_DIR = Path(__file__).resolve().parent
ML_DIR = Path(__file__).resolve().parents[1]

if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))

import check_metrics_schema  # noqa: E402  (stdlib-only local module)
from common import CLASS_KEYS, PREPROCESS_CONFIG  # noqa: E402

MAX_ONNX_BYTES = 24 * 1024 * 1024
JSON_NAMES = [
    "class_index.json",
    "preprocess.json",
    "calibration.json",
    "metrics-v1.json",
    "parity_samples.json",
]


def find_run_dir(root):
    """Return the folder that directly contains model.onnx (zip may nest run1/)."""
    root = Path(root).resolve()
    if (root / "model.onnx").is_file():
        return root, None
    candidates = sorted({p.parent for p in root.rglob("model.onnx") if p.is_file()})
    if len(candidates) == 1:
        return candidates[0], None
    if not candidates:
        return None, f"no model.onnx found under {root}"
    listed = ", ".join(str(p.relative_to(root)) for p in candidates)
    return None, f"multiple model.onnx files found under {root}: {listed}"


def safe_extract(zip_path, dest):
    with zipfile.ZipFile(zip_path) as zf:
        for member in zf.infolist():
            name = member.filename.replace("\\", "/")
            parts = [part for part in name.split("/") if part not in ("", ".")]
            if name.startswith("/") or ".." in parts:
                raise ValueError(f"unsafe path in zip: {member.filename}")
            if (member.external_attr >> 16) & 0o170000 == 0o120000:
                raise ValueError(f"symlink in zip is not allowed: {member.filename}")
        zf.extractall(dest)


def load_json(path):
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle), None
    except FileNotFoundError:
        return None, "missing"
    except json.JSONDecodeError as exc:
        return None, f"invalid JSON: {exc}"
    except OSError as exc:
        return None, f"cannot read: {exc}"


def validate_class_index(run_dir, problems):
    path = run_dir / "class_index.json"
    data, error = load_json(path)
    if error:
        problems.append(f"class_index.json: {error}")
        return
    actual = data.get("classes") if isinstance(data, dict) else None
    if actual != CLASS_KEYS:
        problems.append(
            "class_index.json: class order does not match the contract; "
            f"expected {CLASS_KEYS}, got {actual!r}"
        )


def validate_preprocess(run_dir, problems):
    path = run_dir / "preprocess.json"
    data, error = load_json(path)
    if error:
        problems.append(f"preprocess.json: {error}")
        return
    if data != PREPROCESS_CONFIG:
        problems.append(
            "preprocess.json: values differ from ml/common.py PREPROCESS_CONFIG; "
            f"expected {PREPROCESS_CONFIG}, got {data!r}"
        )


def validate_calibration(run_dir, problems):
    path = run_dir / "calibration.json"
    data, error = load_json(path)
    if error:
        problems.append(f"calibration.json: {error}")
        return
    if not isinstance(data, dict):
        problems.append("calibration.json: expected a JSON object")
        return
    if "placeholder" in data:
        problems.append("calibration.json: still contains 'placeholder' (a real calibration is required)")
    for key in ("temperature", "threshold"):
        if key not in data:
            problems.append(f"calibration.json: missing {key!r}")
        elif isinstance(data[key], bool) or not isinstance(data[key], (int, float)):
            problems.append(f"calibration.json: {key} must be a number, got {data[key]!r}")
    temperature = data.get("temperature")
    if isinstance(temperature, (int, float)) and not isinstance(temperature, bool) and temperature <= 0:
        problems.append(f"calibration.json: temperature must be > 0, got {temperature!r}")
    threshold = data.get("threshold")
    if (
        isinstance(threshold, (int, float))
        and not isinstance(threshold, bool)
        and not 0 <= threshold <= 1
    ):
        problems.append(f"calibration.json: threshold must be within 0..1, got {threshold!r}")


def validate_onnx(run_dir, problems):
    path = run_dir / "model.onnx"
    if not path.is_file():
        problems.append("model.onnx: missing")
        return
    size = path.stat().st_size
    if size >= MAX_ONNX_BYTES:
        problems.append(
            f"model.onnx: {size / (1024 * 1024):.2f} MiB is not below the 24 MiB limit"
        )
    with open(path, "rb") as handle:
        first = handle.read(1)
    if first != b"\x08":
        problems.append(
            f"model.onnx: first byte is {first.hex() or '<empty>'}, expected 08 "
            "(not a self-contained ONNX protobuf)"
        )
    for data_file in sorted(path.parent.glob("*.data")):
        problems.append(f"model.onnx: external data file present ({data_file.name}); must be a single file")

    try:
        import onnx
    except ImportError:
        print("    (onnx not installed: skipped opset/operator inspection)")
        return

    try:
        model = onnx.load(str(path))
        onnx.checker.check_model(model)
    except Exception as exc:  # noqa: BLE001 - report whatever onnx raises
        problems.append(f"model.onnx: onnx could not load/check the file: {exc}")
        return

    opset = model.opset_import[0].version if model.opset_import else "unknown"
    operators = sorted({node.op_type for node in model.graph.node})
    print(f"    ONNX opset {opset}; {len(operators)} operator type(s): {', '.join(operators)}")
    for initializer in model.graph.initializer:
        if initializer.data_location == onnx.TensorProto.EXTERNAL:
            problems.append(
                f"model.onnx: initializer {initializer.name!r} points to external data"
            )


def validate_metrics(run_dir, problems):
    path = run_dir / "metrics-v1.json"
    data, error = load_json(path)
    if error:
        problems.append(f"metrics-v1.json: {error}")
        return
    try:
        schema = json.loads((REPO_ROOT / "model" / "metrics.schema.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        problems.append(f"metrics-v1.json: cannot load model/metrics.schema.json: {exc}")
        return
    for message in check_metrics_schema.validate(data, schema):
        problems.append(f"metrics-v1.json: {message}")


def validate_parity(run_dir, problems):
    path = run_dir / "parity_samples.json"
    data, error = load_json(path)
    if error:
        problems.append(f"parity_samples.json: {error}")
        return
    if not isinstance(data, list):
        problems.append("parity_samples.json: expected a JSON array")


def find_pngs(run_dir):
    return sorted(p for p in run_dir.glob("*.png") if p.is_file())


def validate_bundle(run_dir):
    problems = []
    validate_class_index(run_dir, problems)
    validate_preprocess(run_dir, problems)
    validate_calibration(run_dir, problems)
    validate_onnx(run_dir, problems)
    validate_metrics(run_dir, problems)
    validate_parity(run_dir, problems)
    pngs = find_pngs(run_dir)
    if not pngs:
        problems.append("PNGs: no *.png files found in the run folder")
    return problems, pngs


def build_copy_plan(run_dir, repo, pngs):
    plan = [
        (run_dir / "model.onnx", repo / "frontend" / "public" / "models" / "rice-mnv3l-v1.onnx"),
    ]
    for name in JSON_NAMES:
        plan.append((run_dir / name, repo / "frontend" / "public" / "data" / name))
    for png in pngs:
        plan.append((png, repo / "frontend" / "public" / "accuracy" / png.name))
    evidence_dir = repo / "model" / "experiments" / "run1"
    plan.append((run_dir / "metrics-v1.json", evidence_dir / "metrics-v1.json"))
    for png in pngs:
        plan.append((png, evidence_dir / png.name))
    return plan


def format_metric(value):
    if value is None:
        return "null"
    if isinstance(value, bool):
        return str(value)
    if isinstance(value, (int, float)):
        return f"{value:.4f}"
    return str(value)


def print_measured_summary(run_dir):
    metrics, error = load_json(run_dir / "metrics-v1.json")
    if error or not isinstance(metrics, dict):
        return
    internal = metrics.get("internal_test") or {}
    print("\nMEASURED (from metrics-v1.json)")
    print(
        "  internal test: "
        f"n={internal.get('n')} "
        f"macro-F1={format_metric(internal.get('macro_f1'))} "
        f"coverage={format_metric(internal.get('coverage'))} "
        f"selective accuracy={format_metric(internal.get('selective_accuracy'))}"
    )
    for entry in metrics.get("external") or []:
        if not isinstance(entry, dict):
            continue
        print(
            f"  external {entry.get('name', '<unnamed>')}: "
            f"n={entry.get('n')} "
            f"accuracy(mapped)={format_metric(entry.get('accuracy_mapped'))} "
            f"macro-F1(mapped)={format_metric(entry.get('macro_f1_mapped'))} "
            f"coverage={format_metric(entry.get('coverage'))} "
            f"unseen rejection={format_metric(entry.get('unseen_rejection_rate'))}"
        )
    warning = (metrics.get("calibration") or {}).get("warning")
    if warning:
        print(f"  calibration warning: {warning}")


def print_next_steps(repo):
    print("\nNext step for Antigravity (M07) — not done automatically:")
    print(f"  In {repo / 'frontend' / 'src' / 'ml' / 'config.js'} change this line:")
    print("    export const MODEL_URL = '/models/rice-mnv3l-v1.onnx';")
    print(f"  Delete {repo / 'frontend' / 'public' / 'models' / 'rice-placeholder.onnx'}")


def run_bundle(run_path, repo, dry_run):
    repo = Path(repo).resolve()
    if not repo.is_dir():
        print(f"ERROR: --repo is not a directory: {repo}", file=sys.stderr)
        return 1

    run_source = Path(run_path).resolve()
    if not run_source.exists():
        print(f"ERROR: --run-zip does not exist: {run_source}", file=sys.stderr)
        return 1

    with tempfile.TemporaryDirectory(prefix="agroleaf_run_") as temp:
        if run_source.is_dir():
            extracted_root = run_source
        elif run_source.is_file() and run_source.suffix.lower() == ".zip":
            extracted_root = Path(temp)
            try:
                safe_extract(run_source, extracted_root)
            except (zipfile.BadZipFile, ValueError, OSError) as exc:
                print(f"ERROR: cannot extract {run_source}: {exc}", file=sys.stderr)
                return 1
            print(f"Extracted {run_source.name} to a temporary folder")
        else:
            print(f"ERROR: --run-zip must be a .zip file or a folder: {run_source}", file=sys.stderr)
            return 1

        run_dir, error = find_run_dir(extracted_root)
        if run_dir is None:
            print(f"ERROR: {error}", file=sys.stderr)
            return 1

        print(f"Run folder: {run_dir}")
        problems, pngs = validate_bundle(run_dir)
        if problems:
            print(f"\nVALIDATION FAILED ({len(problems)} problem(s)); nothing was copied:")
            for problem in problems:
                print(f"  - {problem}")
            return 1

        print(
            f"Validation passed: class order, preprocess, calibration, ONNX, "
            f"metrics schema, parity samples, {len(pngs)} PNG(s)."
        )
        plan = build_copy_plan(run_dir, repo, pngs)

        if dry_run:
            print("\nDRY RUN — planned copies (no files written):")
            for src, dest in plan:
                print(f"  {src} -> {dest}")
            print_measured_summary(run_dir)
            print_next_steps(repo)
            return 0

        copied = []
        for src, dest in plan:
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)
            copied.append((src, dest, dest.stat().st_size))

        print(f"\nCopied {len(copied)} file(s):")
        for src, dest, size in copied:
            print(f"  {dest}  ({size:,} bytes)")

        print_measured_summary(run_dir)
        print_next_steps(repo)
        return 0


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Validate a Kaggle run and copy its artefacts into the app"
    )
    parser.add_argument(
        "--run-zip",
        required=True,
        type=Path,
        help="Path to run1_for_app.zip or an already-extracted run folder",
    )
    parser.add_argument(
        "--repo",
        type=Path,
        default=REPO_ROOT,
        help=f"Repository root to copy into (default: {REPO_ROOT})",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate and print the copy plan without writing anything",
    )
    args = parser.parse_args(argv)
    return run_bundle(args.run_zip, args.repo, args.dry_run)


if __name__ == "__main__":
    sys.exit(main())
