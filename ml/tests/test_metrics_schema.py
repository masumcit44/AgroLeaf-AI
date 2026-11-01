#!/usr/bin/env python3
"""Test model/metrics.schema.json + ml/tools/check_metrics_schema.py.

Run from anywhere:
    python ml/tests/test_metrics_schema.py

The valid document below mirrors exactly what ml/evaluate.py writes (including
nulls for an external set with no mapped images). No training is run, so no
numbers here are presented as real results.
"""

import copy
import importlib.util
import json
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CHECKER_PATH = REPO_ROOT / "ml" / "tools" / "check_metrics_schema.py"
SCHEMA_PATH = REPO_ROOT / "model" / "metrics.schema.json"

CLASS_KEYS = [
    "healthy",
    "blast",
    "brown_spot",
    "leaf_smut",
    "tungro",
    "sheath_blight",
]


def load_checker():
    spec = importlib.util.spec_from_file_location("check_metrics_schema", CHECKER_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def per_class_map(support=250):
    return {
        key: {"precision": 0.9, "recall": 0.9, "f1": 0.9, "support": support}
        for key in CLASS_KEYS
    }


def valid_metrics():
    """A document with the same keys and value domains evaluate.py writes."""
    return {
        "model": {
            "arch": "mnv3_large",
            "onnx_mb": 12.34,
            "trained_on": "RiceLeafDiseaseBD v3 (DOI 10.17632/86s4jzj2m4.3)",
            "date": "2026-11-01",
            "FIXTURE_NOT_REAL": True,
        },
        "calibration": {
            "temperature": 1.2345,
            "threshold": 0.6,
            "target_precision": 0.9,
            "warning": "Threshold could not reach the precision target.",
        },
        "internal_test": {
            "n": 1500,
            "accuracy": 0.95,
            "macro_f1": 0.94,
            "coverage": 0.82,
            "selective_accuracy": 0.98,
            "ece_after": 0.03,
            "per_class": per_class_map(),
        },
        "external": [
            {
                "name": "RiceLeafDisease-BD5",
                "doi": "10.17632/sjkptpgv79.2",
                "classes_tested": ["blast", "healthy", "sheath_blight", "tungro"],
                "n": 400,
                "accuracy_mapped": 0.8,
                "macro_f1_mapped": 0.75,
                "coverage": 0.7,
                "selective_accuracy": 0.9,
                "unseen_rejection_rate": 0.5,
                "per_class": {
                    "healthy": {"precision": 0.8, "recall": 0.8, "f1": 0.8, "support": 100}
                },
            },
            {
                "name": "Pure unseen set",
                "doi": "",
                "classes_tested": [],
                "n": 20,
                "accuracy_mapped": None,
                "macro_f1_mapped": None,
                "coverage": None,
                "selective_accuracy": None,
                "unseen_rejection_rate": 0.0,
                "per_class": {},
            },
        ],
        "limitations": [
            "Leaf Smut has no external test data.",
            "Training images come from one district (Gazipur) and one season.",
        ],
    }


def assert_valid(checker, doc, label):
    errors = checker.validate(doc, json.loads(SCHEMA_PATH.read_text(encoding="utf-8")))
    assert not errors, f"{label} should be valid, got:\n" + "\n".join(errors)


def assert_invalid(checker, doc, label, needle):
    errors = checker.validate(doc, json.loads(SCHEMA_PATH.read_text(encoding="utf-8")))
    assert errors, f"{label} should be invalid"
    joined = "\n".join(errors)
    assert needle in joined, f"{label}: expected {needle!r} in:\n{joined}"


def main():
    checker = load_checker()
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    assert schema.get("$schema") == "https://json-schema.org/draft/2020-12/schema"

    good = valid_metrics()
    assert_valid(checker, good, "valid document")

    # CLI + file round-trip
    with tempfile.TemporaryDirectory() as tmp:
        good_path = Path(tmp) / "metrics-v1.json"
        good_path.write_text(json.dumps(good, indent=2), encoding="utf-8")
        assert checker.main([str(good_path)]) == 0

        broken_path = Path(tmp) / "broken-metrics.json"
        broken = copy.deepcopy(good)
        broken["internal_test"]["accuracy"] = 1.2
        broken_path.write_text(json.dumps(broken), encoding="utf-8")
        assert checker.main([str(broken_path)]) == 1

    # Every required top-level block must be present.
    for key in ("model", "calibration", "internal_test", "external", "limitations"):
        broken = copy.deepcopy(good)
        del broken[key]
        assert_invalid(checker, broken, f"missing {key}", f"missing required property '{key}'")

    # Out-of-range metric
    broken = copy.deepcopy(good)
    broken["internal_test"]["macro_f1"] = -0.01
    assert_invalid(checker, broken, "negative metric", "less than minimum")

    broken = copy.deepcopy(good)
    broken["calibration"]["threshold"] = 1.5
    assert_invalid(checker, broken, "threshold > 1", "greater than maximum")

    # Temperature must be positive
    broken = copy.deepcopy(good)
    broken["calibration"]["temperature"] = 0
    assert_invalid(checker, broken, "zero temperature", "must be greater than")

    # Wrong types
    broken = copy.deepcopy(good)
    broken["internal_test"]["n"] = "1500"
    assert_invalid(checker, broken, "n as string", "expected type integer")

    broken = copy.deepcopy(good)
    broken["internal_test"]["per_class"]["blast"]["support"] = 1.5
    assert_invalid(checker, broken, "fractional support", "expected type integer")

    broken = copy.deepcopy(good)
    broken["limitations"] = "one string"
    assert_invalid(checker, broken, "limitations not array", "expected type array")

    broken = copy.deepcopy(good)
    broken["external"][0]["classes_tested"] = [1, 2]
    assert_invalid(checker, broken, "classes_tested items", "expected type string")

    # Null is allowed for metrics, but not for counts.
    broken = copy.deepcopy(good)
    broken["internal_test"]["n"] = None
    assert_invalid(checker, broken, "null internal count", "expected type integer")

    broken = copy.deepcopy(good)
    broken["external"][0]["macro_f1_mapped"] = None
    assert_valid(checker, broken, "null external metric")

    print("PASS: metrics schema accepts evaluate.py output and rejects broken copies.")


if __name__ == "__main__":
    main()
