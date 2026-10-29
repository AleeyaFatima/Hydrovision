"""Unit tests for segmentation metrics."""
import numpy as np
import pytest
from app.metrics import compute_metrics, compute_metrics_from_counts, compute_confusion_matrix_elements


def test_perfect_prediction():
    preds = np.ones((10, 10))
    targets = np.ones((10, 10))
    m = compute_metrics(preds, targets, threshold=0.5)
    assert pytest.approx(m["iou"], 1e-4) == 1.0
    assert pytest.approx(m["dice"], 1e-4) == 1.0
    assert pytest.approx(m["precision"], 1e-4) == 1.0
    assert pytest.approx(m["recall"], 1e-4) == 1.0
    assert pytest.approx(m["accuracy"], 1e-4) == 1.0


def test_zero_overlap():
    preds = np.zeros((10, 10))
    targets = np.ones((10, 10))
    m = compute_metrics(preds, targets, threshold=0.5)
    assert pytest.approx(m["iou"], abs=1e-4) == 0.0
    assert pytest.approx(m["dice"], abs=1e-4) == 0.0
    assert pytest.approx(m["recall"], abs=1e-4) == 0.0


def test_known_confusion():
    # 2 TP, 1 FP, 1 FN, 6 TN
    counts = compute_metrics_from_counts(tp=2, fp=1, fn=1, tn=6)
    # IoU = 2 / (2 + 1 + 1) = 2/4 = 0.5
    assert pytest.approx(counts["iou"], 1e-4) == 0.5
    # Dice = (2 * 2) / (2 * 2 + 1 + 1) = 4/6 = 0.6667
    assert pytest.approx(counts["dice"], 1e-3) == 0.667
    # Precision = 2 / (2 + 1) = 0.6667
    assert pytest.approx(counts["precision"], 1e-3) == 0.667
    # Recall = 2 / (2 + 1) = 0.6667
    assert pytest.approx(counts["recall"], 1e-3) == 0.667
