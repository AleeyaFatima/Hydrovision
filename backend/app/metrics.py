"""Evaluation metrics for flood segmentation: IoU, Dice/F1, Precision, Recall, Accuracy."""
import numpy as np
import torch


def compute_confusion_matrix_elements(preds: np.ndarray, targets: np.ndarray) -> dict[str, int]:
    """Calculate TP, FP, TN, FN for binary masks."""
    preds_b = preds > 0.5
    targets_b = targets > 0.5

    tp = int(np.logical_and(preds_b, targets_b).sum())
    fp = int(np.logical_and(preds_b, ~targets_b).sum())
    fn = int(np.logical_and(~preds_b, targets_b).sum())
    tn = int(np.logical_and(~preds_b, ~targets_b).sum())

    return {"tp": tp, "fp": fp, "fn": fn, "tn": tn}


def compute_metrics_from_counts(tp: int, fp: int, fn: int, tn: int, eps: float = 1e-7) -> dict[str, float]:
    """Compute IoU, Dice, Precision, Recall, and Accuracy from confusion counts."""
    iou = (tp + eps) / (tp + fp + fn + eps)
    dice = (2.0 * tp + eps) / (2.0 * tp + fp + fn + eps)
    precision = (tp + eps) / (tp + fp + eps)
    recall = (tp + eps) / (tp + fn + eps)
    accuracy = (tp + tn) / (tp + tn + fp + fn + eps)

    return {
        "iou": float(iou),
        "dice": float(dice),
        "precision": float(precision),
        "recall": float(recall),
        "accuracy": float(accuracy),
        "tp": int(tp),
        "fp": int(fp),
        "fn": int(fn),
        "tn": int(tn),
    }


def compute_metrics(
    preds: np.ndarray | torch.Tensor,
    targets: np.ndarray | torch.Tensor,
    threshold: float = 0.5
) -> dict[str, float]:
    """Compute all standard segmentation metrics given predictions (probs or logits) and targets."""
    if isinstance(preds, torch.Tensor):
        if preds.is_cuda or preds.is_mps:
            preds = preds.cpu()
        preds = preds.detach().numpy()
    if isinstance(targets, torch.Tensor):
        if targets.is_cuda or targets.is_mps:
            targets = targets.cpu()
        targets = targets.detach().numpy()

    # Binarize with threshold
    bin_preds = (preds >= threshold).astype(bool)
    bin_targets = (targets >= 0.5).astype(bool)

    tp = int(np.logical_and(bin_preds, bin_targets).sum())
    fp = int(np.logical_and(bin_preds, ~bin_targets).sum())
    fn = int(np.logical_and(~bin_preds, bin_targets).sum())
    tn = int(np.logical_and(~bin_preds, ~bin_targets).sum())

    return compute_metrics_from_counts(tp, fp, fn, tn)


def find_best_threshold(
    val_probs: list[np.ndarray],
    val_targets: list[np.ndarray],
    thresholds: list[float] | None = None
) -> tuple[float, float]:
    """Evaluate candidate thresholds on validation set to find the one maximizing Dice."""
    if thresholds is None:
        thresholds = [0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75]

    best_thresh = 0.5
    best_dice = -1.0

    for thresh in thresholds:
        total_tp = total_fp = total_fn = total_tn = 0
        for p, t in zip(val_probs, val_targets):
            counts = compute_confusion_matrix_elements(p >= thresh, t >= 0.5)
            total_tp += counts["tp"]
            total_fp += counts["fp"]
            total_fn += counts["fn"]
            total_tn += counts["tn"]

        m = compute_metrics_from_counts(total_tp, total_fp, total_fn, total_tn)
        if m["dice"] > best_dice:
            best_dice = m["dice"]
            best_thresh = thresh

    return best_thresh, best_dice

