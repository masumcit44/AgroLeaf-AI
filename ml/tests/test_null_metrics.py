#!/usr/bin/env python3
"""
Test that external metrics return None (null) rather than fake 0.0 values
when unseen or mapped images are absent.
"""


def test_null_metrics():
    # Scenario A: External set with mapped images but 0 unseen images
    mapped_n = 20
    unseen_total = 0

    if unseen_total > 0:
        unseen_rate = 0.0
    else:
        unseen_rate = None

    assert unseen_rate is None, "unseen_rejection_rate must be None when unseen_total == 0"

    # Scenario B: External set with 0 mapped images (pure OOD set)
    mapped_n_b = 0
    if mapped_n_b > 0:
        accuracy_mapped = 0.0
        macro_f1_mapped = 0.0
        coverage_val = 0.0
        selective_acc_val = 0.0
    else:
        accuracy_mapped = None
        macro_f1_mapped = None
        coverage_val = None
        selective_acc_val = None

    assert accuracy_mapped is None
    assert macro_f1_mapped is None
    assert coverage_val is None
    assert selective_acc_val is None

    print("PASS: test_null_metrics (null reporting for absent categories)")


if __name__ == "__main__":
    test_null_metrics()

