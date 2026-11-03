"""Python mirror of frontend/src/ml/decide.js, so offline evaluation scores the
decision the app actually shows (not the raw argmax).

ml/tests/test_app_decision.py runs the real JavaScript on the same random inputs
and requires identical decisions, so the two cannot drift apart silently.
"""
from __future__ import annotations

import math

REJECT_KEYS = ("not_rice", "other_rice")


def softmax(logits, temperature=1.0):
    t = max(0.01, temperature or 1.0)
    z = [x / t for x in logits]
    m = max(z)
    e = [math.exp(x - m) for x in z]
    s = sum(e)
    return [x / s for x in e]


def decide(probs: dict, threshold=0.60, suppress=(), safety=None) -> dict:
    """Same contract as decide.js: {status, top, top2, reason?}; top/top2 are (key, prob)."""
    safety = safety or {}
    if not probs or any(p is None or (isinstance(p, float) and math.isnan(p)) for p in probs.values()):
        return {"status": "not_sure", "top": None, "top2": []}
    entries = sorted(probs.items(), key=lambda kv: -kv[1])  # stable, like Array.prototype.sort
    top1 = entries[0]
    top2 = [kv for kv in entries if kv[0] not in REJECT_KEYS][:2]
    if top1[0] == "not_rice":
        return {"status": "not_sure", "top": None, "top2": [], "reason": "not_leaf"}
    if top1[0] == "other_rice":
        return {"status": "not_sure", "top": None, "top2": [], "reason": "other_problem"}
    frac, min_frac = safety.get("leafFraction"), safety.get("leafMinFraction")
    if isinstance(frac, (int, float)) and isinstance(min_frac, (int, float)) and frac < min_frac:
        return {"status": "not_sure", "top": None, "top2": [], "reason": "not_leaf"}
    if len(top2) >= 2 and abs(top2[0][1] - top2[1][1]) < 1e-6:
        return {"status": "not_sure", "top": top1, "top2": top2}
    if top1[0] in suppress:
        return {"status": "not_sure", "top": top1, "top2": top2, "suppressed": True, "reason": "suppressed"}
    healthy = safety.get("healthyThreshold")
    if top1[0] == "healthy" and isinstance(healthy, (int, float)) and top1[1] < healthy:
        return {"status": "not_sure", "top": top1, "top2": top2, "reason": "healthy_needs_high_confidence"}
    if top1[1] >= threshold:
        return {"status": "confident", "top": top1, "top2": top2}
    return {"status": "not_sure", "top": top1, "top2": top2, "reason": "low_confidence"}


def decide_from_calibration(probs: dict, cal: dict, leaf_fraction=None) -> dict:
    """decide() with the parameters predict.js reads from calibration.json."""
    leaf = cal.get("leaf_check") or {}
    return decide(
        probs,
        cal.get("threshold") or 0.60,
        cal.get("suppress") or [],
        {"leafFraction": leaf_fraction, "leafMinFraction": leaf.get("min_fraction"),
         "healthyThreshold": cal.get("healthy_threshold")},
    )
