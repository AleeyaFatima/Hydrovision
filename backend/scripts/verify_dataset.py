"""Verify dataset integrity, mask pairing, duplicate detection, statistics, and preview grid."""
import os
import sys
import hashlib
import json
from pathlib import Path
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt
import imagehash

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
REPORTS_DIR = Path(__file__).resolve().parents[1] / "reports"
IMG_DIR = DATA_DIR / "Image"
MASK_DIR = DATA_DIR / "Mask"
METADATA_FILE = DATA_DIR / "metadata.csv"


def get_image_hash(path: Path) -> str:
    """Calculate MD5 hash of an image file for exact duplicate detection."""
    hasher = hashlib.md5()
    with open(path, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()


def get_perceptual_hash(path: Path) -> imagehash.ImageHash:
    """Calculate average perceptual hash for near-duplicate detection."""
    with Image.open(path) as img:
        return imagehash.average_hash(img.convert("RGB"))


def pair_dataset():
    """Pair images and masks using metadata.csv or filename stem."""
    if not IMG_DIR.exists() or not MASK_DIR.exists():
        print(f"Error: Dataset directories missing in {DATA_DIR}", file=sys.stderr)
        return []

    images = {p.stem.lower(): p for p in IMG_DIR.glob("*") if p.suffix.lower() in [".jpg", ".jpeg", ".png"]}
    masks = {p.stem.lower(): p for p in MASK_DIR.glob("*") if p.suffix.lower() in [".jpg", ".jpeg", ".png"]}

    paired = []
    unmatched_images = []
    unmatched_masks = set(masks.keys())

    # Try metadata.csv if available
    if METADATA_FILE.exists():
        import csv
        with open(METADATA_FILE, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Common headers in Kaggle datasets: 'Image' and 'Mask' or 'image_id'
                img_key = Path(row.get("Image", row.get("image", ""))).stem.lower()
                mask_key = Path(row.get("Mask", row.get("mask", ""))).stem.lower()
                if img_key in images and mask_key in masks:
                    paired.append((images[img_key], masks[mask_key]))
                    unmatched_masks.discard(mask_key)
                elif img_key in images:
                    unmatched_images.append(images[img_key])

    # If metadata didn't pair everything or doesn't exist, fall back to matching stem
    if not paired:
        for stem, img_path in images.items():
            if stem in masks:
                paired.append((img_path, masks[stem]))
                unmatched_masks.discard(stem)
            else:
                unmatched_images.append(img_path)

    print(f"Total images found: {len(images)}")
    print(f"Total masks found: {len(masks)}")
    print(f"Successfully paired: {len(paired)} image-mask pairs")

    if unmatched_images:
        print(f"Warning: {len(unmatched_images)} images without matching masks: {[p.name for p in unmatched_images[:5]]}")
    if unmatched_masks:
        print(f"Warning: {len(unmatched_masks)} masks without matching images: {list(unmatched_masks)[:5]}")

    return paired


def analyze_and_verify(pairs):
    if not pairs:
        print("Error: No paired data found. Pairing check failed.", file=sys.stderr)
        sys.exit(1)

    print("\n--- Running Dataset Verification & Diagnostics ---")
    sizes = []
    water_fractions = []
    unique_mask_values = set()
    corrupt_files = []
    exact_hashes = {}
    perceptual_hashes = []

    for img_path, mask_path in pairs:
        try:
            with Image.open(img_path) as img:
                img_rgb = img.convert("RGB")
                sizes.append(img_rgb.size)  # (W, H)
                exact_hash = get_image_hash(img_path)
                exact_hashes.setdefault(exact_hash, []).append(img_path.name)
                phash = get_perceptual_hash(img_path)
                perceptual_hashes.append((img_path.name, phash))

            with Image.open(mask_path) as msk:
                msk_arr = np.array(msk.convert("L"))
                unique_vals = np.unique(msk_arr)
                unique_mask_values.update(unique_vals.tolist())
                # Binarize with threshold > 127
                bin_mask = (msk_arr > 127).astype(np.float32)
                water_frac = float(bin_mask.mean())
                water_fractions.append(water_frac)

        except Exception as e:
            corrupt_files.append((img_path.name, str(e)))

    if corrupt_files:
        print(f"Error: Found corrupt files: {corrupt_files}", file=sys.stderr)
        sys.exit(1)

    widths, heights = zip(*sizes)
    print(f"Image sizes: {len(sizes)} total images")
    print(f"  Widths: min={min(widths)}, median={np.median(widths):.0f}, max={max(widths)}")
    print(f"  Heights: min={min(heights)}, median={np.median(heights):.0f}, max={max(heights)}")

    print(f"\nMask values detected (raw unique values sample): {sorted(list(unique_mask_values))[:10]}")
    print("Confirmed mask binarization threshold: (mask > 127)")

    wf_arr = np.array(water_fractions) * 100
    print(f"\nWater percentage per image:")
    print(f"  Min: {wf_arr.min():.2f}%")
    print(f"  Mean: {wf_arr.mean():.2f}%")
    print(f"  Max: {wf_arr.max():.2f}%")

    # Duplicate check
    exact_duplicates = [names for names in exact_hashes.values() if len(names) > 1]
    if exact_duplicates:
        print(f"\nExact duplicate groups found ({len(exact_duplicates)} groups): {exact_duplicates}")
    else:
        print("\nNo exact duplicate images found.")

    # Near duplicates using Hamming distance <= 2
    near_dup_groups = []
    used = set()
    for i in range(len(perceptual_hashes)):
        name_i, hash_i = perceptual_hashes[i]
        if name_i in used:
            continue
        group = [name_i]
        for j in range(i + 1, len(perceptual_hashes)):
            name_j, hash_j = perceptual_hashes[j]
            if name_j not in used and (hash_i - hash_j) <= 2:
                group.append(name_j)
                used.add(name_j)
        if len(group) > 1:
            used.add(name_i)
            near_dup_groups.append(group)

    if near_dup_groups:
        print(f"Near-duplicate groups found via perceptual hashing ({len(near_dup_groups)} groups): {near_dup_groups}")
    else:
        print("No significant near-duplicate groups found via perceptual hashing.")

    # Generate 12-sample preview grid
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    preview_path = REPORTS_DIR / "dataset_preview.png"
    save_preview_grid(pairs[:12], preview_path)
    print(f"\nSaved 12-sample dataset preview grid to: {preview_path}")

    # Return summary dict
    summary = {
        "total_pairs": len(pairs),
        "water_percentage": {
            "min": float(wf_arr.min()),
            "mean": float(wf_arr.mean()),
            "max": float(wf_arr.max()),
        },
        "exact_duplicate_groups": exact_duplicates,
        "near_duplicate_groups": near_dup_groups
    }
    with open(REPORTS_DIR / "dataset_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    return summary


def save_preview_grid(pairs, save_path: Path):
    """Saves a 12-sample grid: (Original, Mask, Overlay)."""
    n = min(12, len(pairs))
    fig, axes = plt.subplots(n, 3, figsize=(10, 3 * n))
    if n == 1:
        axes = np.expand_dims(axes, 0)

    for idx in range(n):
        img_p, msk_p = pairs[idx]
        img = Image.open(img_p).convert("RGB").resize((256, 256))
        msk = Image.open(msk_p).convert("L").resize((256, 256))
        img_arr = np.array(img)
        msk_arr = (np.array(msk) > 127).astype(np.uint8)

        # Overlay: Cyan for water (R: 34, G: 211, B: 238)
        overlay = img_arr.copy()
        cyan_mask = msk_arr == 1
        overlay[cyan_mask] = (0.5 * overlay[cyan_mask] + 0.5 * np.array([34, 211, 238])).astype(np.uint8)

        axes[idx, 0].imshow(img_arr)
        axes[idx, 0].set_title(f"Image: {img_p.stem}", fontsize=9)
        axes[idx, 0].axis("off")

        axes[idx, 1].imshow(msk_arr, cmap="gray")
        axes[idx, 1].set_title("Ground Truth Mask", fontsize=9)
        axes[idx, 1].axis("off")

        axes[idx, 2].imshow(overlay)
        axes[idx, 2].set_title(f"Overlay ({msk_arr.mean() * 100:.1f}% water)", fontsize=9)
        axes[idx, 2].axis("off")

    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    plt.close()


def main():
    pairs = pair_dataset()
    if not pairs:
        print("Pairing verification failed: No matching data found.", file=sys.stderr)
        sys.exit(1)
    analyze_and_verify(pairs)
    print("\nDataset verification passed successfully!")


if __name__ == "__main__":
    main()
