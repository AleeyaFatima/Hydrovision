"""Evaluation script on test split for AquaMap models."""
import argparse
import json
import time
from pathlib import Path
import numpy as np
import torch
from torch.utils.data import DataLoader
from PIL import Image
import matplotlib.pyplot as plt

from app.config import settings
from app.dataset import FloodDataset, create_or_load_splits
from app.transforms import get_val_transforms
from app.models import get_model, get_device
from app.metrics import compute_metrics, compute_confusion_matrix_elements


def evaluate_model(
    model_name: str = "unet_mobilenetv2",
    checkpoint_path: Path | None = None,
    img_size: int = 256,
    batch_size: int = 1,
):
    device = get_device(settings.DEVICE)
    if checkpoint_path is None:
        checkpoint_path = settings.MODELS_DIR / f"best_{model_name}.pth"

    if not checkpoint_path.exists():
        raise FileNotFoundError(f"Checkpoint not found at {checkpoint_path}. Train the model first.")

    print(f"\n--- Evaluating {model_name} on Test Split ---")
    print(f"Loading checkpoint from: {checkpoint_path}")
    checkpoint = torch.load(checkpoint_path, map_location=device)

    best_thresh = checkpoint.get("best_threshold", 0.5)
    model = get_model(model_name, pretrained=False)
    model.load_state_dict(checkpoint["state_dict"])
    model.to(device)
    model.eval()

    splits = create_or_load_splits(settings.DATA_DIR, settings.SPLITS_FILE)
    test_samples = splits["test"]
    test_dataset = FloodDataset(
        test_samples,
        transform=get_val_transforms(img_size),
        base_dir=settings.BASE_DIR,
    )
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)

    print(f"Test split size: {len(test_dataset)} images")
    print(f"Using threshold: {best_thresh:.2f} (from validation best)")

    latencies = []
    per_image_results = []
    total_tp = total_fp = total_fn = total_tn = 0

    with torch.no_grad():
        for i, batch in enumerate(test_loader):
            images = batch["image"].to(device)
            masks = batch["mask"].cpu().numpy()
            img_ids = batch["id"]

            t0 = time.perf_counter()
            logits = model(images)
            if device.type == "cuda":
                torch.cuda.synchronize()
            elif device.type == "mps":
                torch.mps.synchronize()
            t1 = time.perf_counter()
            latencies.append((t1 - t0) * 1000.0)  # in ms

            probs = torch.sigmoid(logits).cpu().numpy()

            for b in range(images.size(0)):
                p = probs[b, 0]
                t = masks[b, 0]
                counts = compute_confusion_matrix_elements(p >= best_thresh, t >= 0.5)
                total_tp += counts["tp"]
                total_fp += counts["fp"]
                total_fn += counts["fn"]
                total_tn += counts["tn"]

                # Single image metrics
                m_single = compute_metrics(p, t, threshold=best_thresh)
                per_image_results.append({
                    "id": img_ids[b],
                    "iou": m_single["iou"],
                    "dice": m_single["dice"],
                    "prob": p,
                    "target": t,
                    "image_tensor": batch["image"][b].cpu().numpy(),
                })

    # Overall metrics
    overall_metrics = compute_metrics(
        np.array([r["prob"] for r in per_image_results]),
        np.array([r["target"] for r in per_image_results]),
        threshold=best_thresh,
    )

    latencies_arr = np.array(latencies)
    mean_latency = float(np.mean(latencies_arr))
    p95_latency = float(np.percentile(latencies_arr, 95))

    results = {
        "model_name": model_name,
        "device": str(device),
        "threshold": float(best_thresh),
        "metrics": {
            "iou": float(overall_metrics["iou"]),
            "dice": float(overall_metrics["dice"]),
            "precision": float(overall_metrics["precision"]),
            "recall": float(overall_metrics["recall"]),
            "accuracy": float(overall_metrics["accuracy"]),
        },
        "confusion_matrix": {
            "tp": total_tp,
            "fp": total_fp,
            "fn": total_fn,
            "tn": total_tn,
        },
        "latency_ms": {
            "mean": mean_latency,
            "p95": p95_latency,
        },
        "checkpoint": str(checkpoint_path.name),
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
    }

    # Save metrics JSON
    settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    out_json = settings.REPORTS_DIR / f"metrics_{model_name}.json"
    with open(out_json, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Saved evaluation metrics to: {out_json}")

    # Save best and worst predictions
    examples_dir = settings.REPORTS_DIR / "examples"
    examples_dir.mkdir(parents=True, exist_ok=True)

    sorted_by_iou = sorted(per_image_results, key=lambda x: x["iou"], reverse=True)
    best_samples = sorted_by_iou[:3]
    worst_samples = sorted_by_iou[-3:]

    save_examples_gallery(best_samples, examples_dir / f"{model_name}_best_examples.png", "Best Predictions")
    save_examples_gallery(worst_samples, examples_dir / f"{model_name}_worst_examples.png", "Worst Predictions (Failure Analysis)")

    print(f"\n--- Summary for {model_name} ---")
    print(f"IoU:       {overall_metrics['iou']:.4f}")
    print(f"Dice/F1:   {overall_metrics['dice']:.4f}")
    print(f"Precision: {overall_metrics['precision']:.4f}")
    print(f"Recall:    {overall_metrics['recall']:.4f}")
    print(f"Accuracy:  {overall_metrics['accuracy']:.4f}")
    print(f"Mean Latency: {mean_latency:.1f}ms (p95: {p95_latency:.1f}ms)")

    return results


def save_examples_gallery(samples, save_path: Path, title: str):
    fig, axes = plt.subplots(len(samples), 3, figsize=(9, 3 * len(samples)))
    if len(samples) == 1:
        axes = np.expand_dims(axes, 0)

    for i, s in enumerate(samples):
        # Denormalize image
        img = s["image_tensor"].transpose(1, 2, 0)
        mean = np.array(settings.IMAGENET_MEAN)
        std = np.array(settings.IMAGENET_STD)
        img = np.clip((img * std + mean) * 255.0, 0, 255).astype(np.uint8)

        gt = (s["target"] > 0.5).astype(np.uint8)
        pred = (s["prob"] >= 0.5).astype(np.uint8)

        # Overlay
        overlay = img.copy()
        cyan = np.array([34, 211, 238], dtype=np.uint8)
        overlay[pred == 1] = (0.5 * overlay[pred == 1] + 0.5 * cyan).astype(np.uint8)

        axes[i, 0].imshow(img)
        axes[i, 0].set_title(f"Image: {s['id']}", fontsize=9)
        axes[i, 0].axis("off")

        axes[i, 1].imshow(gt, cmap="gray")
        axes[i, 1].set_title(f"Ground Truth", fontsize=9)
        axes[i, 1].axis("off")

        axes[i, 2].imshow(overlay)
        axes[i, 2].set_title(f"Pred Overlay (IoU: {s['iou']:.3f})", fontsize=9)
        axes[i, 2].axis("off")

    plt.suptitle(title, fontsize=12, fontweight="bold")
    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    plt.close()


def generate_comparison_report():
    """Generates reports/model_comparison.md from available metrics JSONs."""
    metrics_files = list(settings.REPORTS_DIR.glob("metrics_*.json"))
    if not metrics_files:
        print("No metrics files found to compare.")
        return

    data = []
    for mf in metrics_files:
        with open(mf, "r") as f:
            data.append(json.load(f))

    # Sort by Dice descending
    data = sorted(data, key=lambda x: x["metrics"]["dice"], reverse=True)

    md = "# AquaMap 3-Model Benchmark Comparison\n\n"
    md += "Evaluation conducted strictly on the unseen **test split**.\n\n"
    md += "| Model | Architecture | IoU | Dice / F1 | Precision | Recall | Pixel Acc | Latency (Mean) |\n"
    md += "|---|---|---|---|---|---|---|---|\n"

    for d in data:
        m = d["metrics"]
        md += f"| **{d['model_name']}** | {d.get('checkpoint', '')} | {m['iou']:.4f} | {m['dice']:.4f} | {m['precision']:.4f} | {m['recall']:.4f} | {m['accuracy']:.4f} | {d['latency_ms']['mean']:.1f} ms |\n"

    md += "\n## Key Observations & Viva Notes\n"
    md += "- **Transfer Learning Advantage:** MobileNetV2 pretrained on ImageNet converges faster and extracts superior low-level edge features for water boundaries.\n"
    md += "- **Recall vs Precision:** In flood response, high Recall is critical (minimizing false negatives / missed flood zones).\n"
    md += "- **Transformer vs CNN:** SegFormer captures global contextual dependencies across the landscape via self-attention.\n"

    out_file = settings.REPORTS_DIR / "model_comparison.md"
    with open(out_file, "w") as f:
        f.write(md)
    print(f"Generated benchmark comparison: {out_file}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=str, default="unet_mobilenetv2")
    parser.add_argument("--checkpoint", type=str, default=None)
    parser.add_argument("--compare", action="store_true", help="Generate comparison markdown from existing metric files")
    args = parser.parse_args()

    if args.compare:
        generate_comparison_report()
    else:
        evaluate_model(
            model_name=args.model,
            checkpoint_path=Path(args.checkpoint) if args.checkpoint else None,
        )
        generate_comparison_report()


if __name__ == "__main__":
    main()

