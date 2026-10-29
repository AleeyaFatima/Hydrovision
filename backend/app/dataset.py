"""Dataset handling and leak-free split generation for AquaMap."""
import json
import random
from pathlib import Path
from typing import Callable, Any
import numpy as np
from PIL import Image
import torch
from torch.utils.data import Dataset
import imagehash


class FloodDataset(Dataset):
    """PyTorch Dataset for binary floodwater segmentation."""

    def __init__(
        self,
        samples: list[dict[str, str]],
        transform: Callable | None = None,
        base_dir: Path | None = None,
    ):
        """
        samples: list of dicts with 'image' and 'mask' file paths.
        transform: Albumentations transform pipeline.
        """
        self.samples = samples
        self.transform = transform
        self.base_dir = base_dir

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> dict[str, Any]:
        item = self.samples[idx]
        img_p = Path(item["image"])
        mask_p = Path(item["mask"])

        if self.base_dir and not img_p.is_absolute():
            img_p = self.base_dir / img_p
            mask_p = self.base_dir / mask_p

        # Read image as RGB
        with Image.open(img_p) as img_f:
            image = np.array(img_f.convert("RGB"))

        # Read mask as grayscale and binarize {0, 1}
        with Image.open(mask_p) as mask_f:
            mask_raw = np.array(mask_f.convert("L"))
            mask = (mask_raw > 127).astype(np.float32)

        if self.transform is not None:
            augmented = self.transform(image=image, mask=mask)
            image_tensor = augmented["image"]
            mask_tensor = augmented["mask"]
        else:
            image_tensor = torch.from_numpy(image).permute(2, 0, 1).float() / 255.0
            mask_tensor = torch.from_numpy(mask).float()

        # Ensure mask is (1, H, W)
        if mask_tensor.dim() == 2:
            mask_tensor = mask_tensor.unsqueeze(0)

        return {
            "image": image_tensor,
            "mask": mask_tensor,
            "image_path": str(img_p),
            "mask_path": str(mask_p),
            "id": img_p.stem
        }


def find_and_pair_files(data_dir: Path) -> list[dict[str, str]]:
    """Scan data/Image and data/Mask to pair images with their ground-truth masks."""
    img_dir = data_dir / "Image"
    mask_dir = data_dir / "Mask"
    meta_file = data_dir / "metadata.csv"

    images = {p.stem.lower(): p for p in img_dir.glob("*") if p.suffix.lower() in [".jpg", ".jpeg", ".png"]}
    masks = {p.stem.lower(): p for p in mask_dir.glob("*") if p.suffix.lower() in [".jpg", ".jpeg", ".png"]}

    paired = []
    if meta_file.exists():
        import csv
        with open(meta_file, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                img_key = Path(row.get("Image", row.get("image", ""))).stem.lower()
                mask_key = Path(row.get("Mask", row.get("mask", ""))).stem.lower()
                if img_key in images and mask_key in masks:
                    paired.append({
                        "image": str(images[img_key].relative_to(data_dir.parent)),
                        "mask": str(masks[mask_key].relative_to(data_dir.parent))
                    })

    if not paired:
        for stem, img_path in images.items():
            if stem in masks:
                paired.append({
                    "image": str(img_path.relative_to(data_dir.parent)),
                    "mask": str(masks[stem].relative_to(data_dir.parent))
                })

    return paired


def group_near_duplicates(pairs: list[dict[str, str]], base_dir: Path) -> list[list[dict[str, str]]]:
    """Group near-duplicate images using perceptual hashing to prevent data leakage across splits."""
    hashes = []
    for item in pairs:
        p = base_dir / item["image"]
        with Image.open(p) as img:
            phash = imagehash.average_hash(img.convert("RGB"))
            hashes.append(phash)

    n = len(pairs)
    visited = [False] * n
    groups = []

    for i in range(n):
        if visited[i]:
            continue
        group = [pairs[i]]
        visited[i] = True
        for j in range(i + 1, n):
            if not visited[j] and (hashes[i] - hashes[j]) <= 2:
                group.append(pairs[j])
                visited[j] = True
        groups.append(group)

    return groups


def create_or_load_splits(
    data_dir: Path,
    splits_file: Path,
    seed: int = 42,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
) -> dict[str, list[dict[str, str]]]:
    """Loads splits if existing; otherwise generates duplicate-aware 70/15/15 splits."""
    if splits_file.exists():
        with open(splits_file, "r") as f:
            return json.load(f)

    pairs = find_and_pair_files(data_dir)
    if not pairs:
        raise FileNotFoundError(f"No paired images and masks found in {data_dir}")

    # Group near duplicates
    base_dir = data_dir.parent
    groups = group_near_duplicates(pairs, base_dir)

    rng = random.Random(seed)
    rng.shuffle(groups)

    total_samples = len(pairs)
    target_train = int(total_samples * train_ratio)
    target_val = int(total_samples * val_ratio)

    train_split, val_split, test_split = [], [], []
    train_count, val_count = 0, 0

    for grp in groups:
        if train_count < target_train:
            train_split.extend(grp)
            train_count += len(grp)
        elif val_count < target_val:
            val_split.extend(grp)
            val_count += len(grp)
        else:
            test_split.extend(grp)

    splits = {
        "train": train_split,
        "val": val_split,
        "test": test_split,
        "seed": seed,
        "total_images": len(pairs),
        "split_counts": {
            "train": len(train_split),
            "val": len(val_split),
            "test": len(test_split)
        }
    }

    splits_file.parent.mkdir(parents=True, exist_ok=True)
    with open(splits_file, "w") as f:
        json.dump(splits, f, indent=2)

    return splits
