"""ml/app_decision.py must decide exactly like frontend/src/ml/decide.js.

Runs the real JavaScript (node) and the Python mirror on the same 3,000 random
cases: 6-class (v1) and 8-class (v3) outputs, ties, suppression, healthy
threshold and leaf-colour gate. Skipped when node is not installed.
"""
import json
import random
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "ml"))
from app_decision import decide  # noqa: E402

V1 = ["healthy", "blast", "brown_spot", "leaf_smut", "tungro", "sheath_blight"]
V3 = V1 + ["other_rice", "not_rice"]


def random_cases(n=3000, seed=0):
    rng = random.Random(seed)
    cases = []
    for i in range(n):
        keys = V1 if i % 2 else V3
        w = [rng.random() ** rng.choice([1, 3, 8]) for _ in keys]
        if i % 17 == 0:  # exact tie between the two largest
            j = sorted(range(len(w)), key=lambda k: -w[k])
            w[j[1]] = w[j[0]]
        s = sum(w)
        probs = {k: x / s for k, x in zip(keys, w)}
        safety = {}
        if i % 3 == 0:
            safety["healthyThreshold"] = rng.choice([0.8, 0.9])
        if i % 5 == 0:
            safety["leafFraction"] = rng.random() * 0.02
            safety["leafMinFraction"] = 0.006
        cases.append({"probs": probs, "threshold": rng.choice([0.4, 0.48, 0.6]),
                      "suppress": ["leaf_smut"] if i % 4 else [], "safety": safety})
    return cases


def normalise(d):
    """Compare on keys/statuses/reasons; probabilities are the inputs, not recomputed."""
    top = d.get("top")
    top_key = top[0] if isinstance(top, (list, tuple)) else (top or {}).get("key")
    top2 = [x[0] if isinstance(x, (list, tuple)) else x["key"] for x in d.get("top2", [])]
    return {"status": d["status"], "top": top_key, "top2": top2, "reason": d.get("reason")}


@pytest.mark.skipif(shutil.which("node") is None, reason="node not installed")
def test_python_decide_matches_javascript(tmp_path):
    cases = random_cases()
    case_file = tmp_path / "cases.json"
    case_file.write_text(json.dumps(cases))
    decide_js = (ROOT / "frontend" / "src" / "ml" / "decide.js").as_uri()
    script = (
        f"import {{ decide }} from '{decide_js}';"
        "import fs from 'node:fs';"
        f"const cases = JSON.parse(fs.readFileSync({json.dumps(str(case_file))}, 'utf-8'));"
        "process.stdout.write(JSON.stringify(cases.map((c) => decide(c.probs, c.threshold, c.suppress, c.safety))));"
    )
    out = subprocess.run(["node", "--input-type=module", "-e", script], capture_output=True, text=True, check=True)
    js = json.loads(out.stdout)
    mismatches = []
    for i, (c, j) in enumerate(zip(cases, js)):
        p = decide(c["probs"], c["threshold"], c["suppress"], c["safety"])
        if normalise(p) != normalise(j):
            mismatches.append((i, normalise(p), normalise(j)))
    assert not mismatches, f"{len(mismatches)} of {len(cases)} differ, first: {mismatches[:3]}"
    reasons = {normalise(j)["reason"] for j in js}
    # the random cases must exercise every branch, or the test proves little
    assert {None, "not_leaf", "other_problem", "suppressed", "healthy_needs_high_confidence", "low_confidence"} <= reasons
