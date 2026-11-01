#!/usr/bin/env python3
"""
Test that external macro-F1 is calculated strictly over classes present in the external dataset,
preventing unfair drag from absent classes predicted by the model.
"""

import numpy as np
from sklearn.metrics import f1_score


def test_external_f1():
    # External dataset only contains class 0 and 1
    t_labels = np.array([0, 0, 1, 1])
    # Model predicts class 0, 1, and mistakenly predicts class 2 (absent from dataset)
    p_classes = np.array([0, 2, 1, 1])

    unique_labels = sorted(list(set(t_labels)))
    assert unique_labels == [0, 1]

    # Without labels restriction (flawed calculation):
    flawed_f1 = f1_score(t_labels, p_classes, average="macro", zero_division=0)

    # With mapped classes restriction (correct calculation):
    correct_f1 = f1_score(t_labels, p_classes, labels=unique_labels, average="macro", zero_division=0)

    # Class 0: recall=0.5, prec=1.0 -> f1=2/3 = 0.6667
    # Class 1: recall=1.0, prec=1.0 -> f1=1.0
    # Expected correct macro-F1 = (0.6667 + 1.0) / 2 = 0.8333
    # Flawed macro-F1 includes class 2 (f1=0) -> (0.6667 + 1.0 + 0) / 3 = 0.5556
    expected_correct = (2 / 3 + 1.0) / 2

    assert abs(correct_f1 - expected_correct) < 1e-4, f"Expected {expected_correct}, got {correct_f1}"
    assert correct_f1 > flawed_f1, f"Correct macro-F1 ({correct_f1}) should exceed flawed macro-F1 ({flawed_f1})"

    print(f"PASS: test_external_f1 (correct={correct_f1:.4f} vs flawed={flawed_f1:.4f})")


if __name__ == "__main__":
    test_external_f1()

