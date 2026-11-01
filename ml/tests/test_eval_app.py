"""Hand-checked cases for ml/tools/eval_app.py and ml/tools/compare_models.py.

These only validate the metric code, not any model: each case is small enough
to work out by hand.
"""
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "ml"))
sys.path.insert(0, str(ROOT / "ml" / "tools"))
from compare_models import fit_temperature  # noqa: E402
from eval_app import evaluate_set  # noqa: E402

C8 = ["healthy", "blast", "brown_spot", "leaf_smut", "tungro", "sheath_blight", "other_rice", "not_rice"]
CAL = {"temperature": 1.0, "threshold": 0.5, "healthy_threshold": 0.9, "suppress": ["leaf_smut"]}


def logits_for(top, p_top=0.95):
    """Logits whose softmax gives `top` probability p_top and spreads the rest evenly."""
    rest = (1 - p_top) / 7
    p = np.full(8, rest)
    p[C8.index(top)] = p_top
    return np.log(p)


def run(rows, cal=CAL, leaf=None):
    L = np.stack([logits_for(pred, p) for _, pred, p in rows])
    y = np.array([C8.index(t) for t, _, _ in rows])
    return evaluate_set(L, y, C8, cal, leaf)


def test_false_healthy_counts_only_diagnosable_diseases():
    # 2 diseased leaves (one called healthy) + non-rice and unsupported rows also called healthy
    m = run([("blast", "healthy", 0.97), ("tungro", "tungro", 0.95),
             ("not_rice", "healthy", 0.97), ("other_rice", "healthy", 0.97)])
    assert m["app"]["diseased_called_healthy"] == 0.5  # 1 of the 2 diseased leaves; other rows not in denominator


def test_unsupported_escape_excludes_non_rice():
    m = run([("other_rice", "blast", 0.95), ("other_rice", "other_rice", 0.95),
             ("not_rice", "blast", 0.95), ("not_rice", "not_rice", 0.95)])
    assert m["app"]["unsupported_disease_escape_rate"] == 0.5  # only the two other_rice rows count
    assert m["app"]["not_rice_no_disease_named"] == 0.5


def test_coverage_selective_and_reject_outputs():
    m = run([("blast", "blast", 0.95),          # named, right
             ("brown_spot", "tungro", 0.95),    # named, wrong
             ("tungro", "not_rice", 0.95),      # rejected as not a leaf: not named
             ("healthy", "healthy", 0.80),      # healthy below 0.90: not named
             ("leaf_smut", "leaf_smut", 0.99)])  # suppressed: not named
    a = m["app"]
    assert a["coverage"] == 2 / 5
    assert a["selective_accuracy"] == 0.5
    assert a["outcomes"]["not_leaf"] == 0.2 and a["outcomes"]["healthy_needs_high_confidence"] == 0.2
    assert a["outcomes"]["suppressed"] == 0.2


def test_colour_gate_applies_when_configured():
    cal = {**CAL, "leaf_check": {"min_fraction": 0.006}}
    m = run([("blast", "blast", 0.95), ("blast", "blast", 0.95)], cal, leaf=np.array([0.5, 0.001]))
    assert m["app"]["coverage"] == 0.5 and m["app"]["outcomes"]["not_leaf"] == 0.5


def test_tie_is_not_sure():
    L = np.log(np.array([[0.4, 0.4, 0.05, 0.05, 0.05, 0.05, 1e-9, 1e-9]]))
    m = evaluate_set(L, np.array([1]), C8, CAL)
    assert m["app"]["coverage"] == 0.0 and m["app"]["outcomes"]["tie"] == 1.0


def test_raw_metrics_ignore_non_diagnosable_rows():
    m = run([("blast", "blast", 0.9), ("tungro", "brown_spot", 0.9), ("not_rice", "not_rice", 0.9)])
    assert m["raw"]["accuracy"] == 0.5
    cm = np.array(m["raw"]["confusion_matrix"]["rows_true_cols_pred"])
    assert cm.sum() == 2  # the not_rice row is not in the disease confusion matrix


def test_temperature_fit_skips_rows_a_6_output_model_cannot_predict():
    rng = np.random.default_rng(0)
    y = rng.integers(0, 6, 400)
    L6 = rng.normal(0, 1, (400, 6))
    L6[np.arange(400), y] += 2.0
    padded = np.concatenate([L6, np.full((400, 2), -1e4)], 1)
    with_nonrice = np.concatenate([padded, np.concatenate([rng.normal(0, 1, (100, 6)), np.full((100, 2), -1e4)], 1)])
    y_all = np.concatenate([y, np.full(100, 7)])
    assert fit_temperature(with_nonrice, y_all) == fit_temperature(padded, y)
