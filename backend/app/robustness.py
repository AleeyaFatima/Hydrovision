"""Robustness stress testing under realistic drone/aerial distortions."""
import argparse
import json
from pathlib import Path
import cv2
import numpy as np
import torch
from torch.utils.data import DataLoader
from PIL import Image

from app.config import settings
from app.dataset import FloodDataset, create_or_load_splits
from app.transforms import get_val_transforms
from app.models import get_model, get_device
from app.metrics import compute_metrics


def apply_corruption(image: np.ndarray, corruption_type: str, severity: int) -> np.ndarray:
    """Applies a corruption at severity 1, 2, or 3 to an uint8 RGB image."""
    img = image.copy()
    if corruption_type == "gaussian_blur":
        ksize = {1: 5, 2: 11, 3: 21}[severity]
        return cv2.GaussianBlur(img, (ksize, ksize), sigmaX=ksize / 3)

    elif corruption_type == "darkness":
        # Decreases brightness
        factor = {1: 0.75, 2: 0.50, 3: 0.25}[severity]
        return np.clip(img.astype(np.float32) * factor, 0, 255).astype(np.uint8)

    elif corruption_type == "gaussian_noise":
        std = {1: 15, 2: 35, 3: 65}[severity]
        noise = np.random.normal(0, std, img.shape).astype(np.float32)
        return np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)

    elif corruption_type == "jpeg_compression":
        quality = {1: 45, 2: 20, 3: 8}[severity]
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
        _, encimg = cv2.imencode(".jpg", cv2.cvtColor(img, cv2.COLOR_RGB2BGR), encode_param)
        decimg = cv2.imdecode(encimg, 1)
        return cv2.cvtColor(decimg, cv2.COLOR_BGR2RGB)

    elif corruption_type == "fog_haze":
        # Simulates atmospheric fog with a white veil and contrast attenuation
        alpha = {1: 0.25, 2: 0.50, 3: 0.75}[severity]
        white_haze = np.ones_like(img, dtype=np.float32) * 230.0
        blended = (1.0 - alpha) * img.astype(np.float32) + alpha * white_haze
        return np.clip(blended, 0, 255).astype(np.uint8)

    else:
        raise ValueError(f"Unknown corruption type: {corruption_type}")


class CorruptedFloodDataset(FloodDataset):
    """Dataset wrapper applying corruption before normalization."""
    def __init__(self, samples, corruption_type, severity, base_dir, img_size=256):
        super().__init__(samples, transform=None, base_dir=base_dir)
        self.corruption_type = corruption_type
        self.severity = severity
        self.val_transform = get_val_transforms(img_size)

    def __getitem__(self, idx):
        item = self.samples[idx]
        img_p = Path(item["image"])
        mask_p = Path(item["mask"])
        if self.base_dir and not img_p.is_absolute():
            img_p = self.base_dir / img_p
            mask_p = self.base_dir / mask_p

        with Image.open(img_p) as f:
            raw_img = np.array(f.convert("RGB"))
        with Image.open(mask_p) as f:
            mask = (np.array(f.convert("L")) > 127).astype(np.float32)

        corrupted = apply_corruption(raw_img, self.corruption_type, self.severity)
        augmented = self.val_transform(image=corrupted, mask=mask)

        mask_tensor = augmented["mask"]
        if mask_tensor.dim() == 2:
            mask_tensor = mask_tensor.unsqueeze(0)

        return {
            "image": augmented["image"],
            "mask": mask_tensor,
            "id": img_p.stem
        }


def run_robustness_benchmark(
    model_name: str = "unet_mobilenetv2",
    checkpoint_path: Path | None = None,
):
    device = get_device(settings.DEVICE)
    if checkpoint_path is None:
        checkpoint_path = settings.MODELS_DIR / f"best_{model_name}.pth"

    checkpoint = torch.load(checkpoint_path, map_location=device)
    best_thresh = checkpoint.get("best_threshold", 0.5)

    model = get_model(model_name, pretrained=False)
    model.load_state_dict(checkpoint["state_dict"])
    model.to(device)
    model.eval()

    splits = create_or_load_splits(settings.DATA_DIR, settings.SPLITS_FILE)
    test_samples = splits["test"]

    corruption_types = [
        "gaussian_blur",
        "darkness",
        "gaussian_noise",
        "jpeg_compression",
        "fog_haze",
    ]
    severities = [1, 2, 3]

    results = {
        "model_name": model_name,
        "threshold": best_thresh,
        "corruptions": {},
    }

    print(f"\n--- Running Robustness Stress Test on {model_name} ---")

    for c_type in corruption_types:
        results["corruptions"][c_type] = {}
        for sev in severities:
            ds = CorruptedFloodDataset(test_samples, c_type, sev, settings.BASE_DIR)
            loader = DataLoader(ds, batch_size=4, shuffle=False)

            all_preds = []
            all_targets = []

            with torch.no_grad():
                for batch in loader:
                    imgs = batch["image"].to(device)
                    masks = batch["mask"].numpy()
                    logits = model(imgs)
                    probs = torch.sigmoid(logits).cpu().numpy()

                    for b in range(imgs.size(0)):
                        all_preds.append(probs[b, 0])
                        all_targets.append(masks[b, 0])

            m = compute_metrics(np.array(all_preds), np.array(all_targets), threshold=best_thresh)
            results["corruptions"][c_type][f"severity_{sev}"] = {
                "iou": m["iou"],
                "dice": m["dice"],
                "precision": m["precision"],
                "recall": m["recall"],
            }
            print(f"[{c_type.ljust(18)}] Severity {sev} -> Dice: {m['dice']:.4f} | IoU: {m['iou']:.4f}")

    settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    out_file = settings.REPORTS_DIR / f"robustness_{model_name}.json"
    with open(out_file, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\nSaved robustness benchmark to {out_file}")
    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=str, default="unet_mobilenetv2")
    args = parser.parse_args()
    run_robustness_benchmark(model_name=args.model)


if __name__ == "__main__":
    main()

