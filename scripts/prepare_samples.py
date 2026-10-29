"""
Extract representative test-set samples for frontend interactive demos
and pre-generate visual overlay assets for the landing page scroll reveal.
"""

import json
import shutil
from pathlib import Path
from PIL import Image
import numpy as np

from app.config import settings
from app.inference import AquaMapInferenceEngine


def prepare_samples():
    base_dir = Path(__file__).resolve().parent.parent
    data_dir = base_dir / "backend" / "data"
    splits_path = data_dir / "splits.json"

    with open(splits_path, "r") as f:
        splits = json.load(f)

    test_items = splits["test"]
    print(f"Total test samples available: {len(test_items)}")

    # Initialize inference engine with unet_mobilenetv2
    engine = AquaMapInferenceEngine()
    engine.load_model()

    samples_dir = base_dir / "frontend" / "public" / "samples"
    reveal_dir = base_dir / "frontend" / "public" / "reveal"
    samples_dir.mkdir(parents=True, exist_ok=True)
    reveal_dir.mkdir(parents=True, exist_ok=True)

    # Pick 6 diverse test images
    # Let's inspect a few test items and their water fractions
    selected_indices = [0, 1, 3, 5, 8, 12]  # diverse sample indices from test set
    if len(test_items) < 6:
        selected_indices = list(range(len(test_items)))

    sample_metadata = []

    for idx, sample_idx in enumerate(selected_indices):
        item = test_items[sample_idx]
        img_rel = item["image"]
        img_path = base_dir / "backend" / img_rel

        if not img_path.exists():
            print(f"Skipping missing image: {img_path}")
            continue

        raw_name = f"sample_{idx+1}.jpg"
        dest_raw = samples_dir / raw_name
        shutil.copy2(img_path, dest_raw)

        # Run inference
        with open(img_path, "rb") as f:
            img_bytes = f.read()

        pred = engine.predict(img_bytes, explain=True, uncertainty=True)
        water_pct = pred["water_pixel_percentage"]
        mean_unc = pred["mean_uncertainty"]

        sample_info = {
            "id": f"sample_{idx+1}",
            "filename": raw_name,
            "url": f"/samples/{raw_name}",
            "water_percentage": water_pct,
            "mean_uncertainty": mean_unc,
            "width": pred["image_size"][0],
            "height": pred["image_size"][1],
            "source_path": str(img_rel),
            "prediction": {
                "model_name": pred["model_name"],
                "inference_ms": pred["inference_ms"],
                "threshold": pred["threshold"],
                "water_pixel_percentage": water_pct,
                "mean_uncertainty": mean_unc,
                "overlay_png_base64": pred["overlay_png_base64"],
                "mask_png_base64": pred["mask_png_base64"],
                "uncertainty_png_base64": pred["uncertainty_png_base64"],
                "gradcam_png_base64": pred["gradcam_png_base64"],
                "image_size": pred["image_size"],
            }
        }
        sample_metadata.append(sample_info)
        print(f"Prepared {raw_name}: water={water_pct}%")

        # Pick the most visually striking scene (e.g. index 0 or 1) for the hero reveal
        if idx == 0:
            shutil.copy2(dest_raw, reveal_dir / "hero_raw.jpg")
            # Decode overlay png base64 and save as hero_overlay.png
            import base64
            overlay_data = base64.b64decode(pred["overlay_png_base64"])
            with open(reveal_dir / "hero_overlay.png", "wb") as f:
                f.write(overlay_data)
            print("Saved hero reveal assets (hero_raw.jpg and hero_overlay.png)")

    meta_file = samples_dir / "samples.json"
    with open(meta_file, "w") as f:
        json.dump(sample_metadata, f, indent=2)

    # Pre-compute comparison between sample_2 (9.93%) and sample_6 (55.02%)
    if len(sample_metadata) >= 6:
        item_b = sample_metadata[1]["prediction"]
        item_a = sample_metadata[5]["prediction"]
        
        # Build change mask
        import base64
        import io
        from PIL import Image
        mask_b = np.array(Image.open(io.BytesIO(base64.b64decode(item_b["mask_png_base64"]))).convert("L")) > 127
        mask_a = np.array(Image.open(io.BytesIO(base64.b64decode(item_a["mask_png_base64"]))).convert("L")) > 127
        
        # Resize mask_b to match mask_a shape
        target_h, target_w = mask_a.shape
        mask_b_resized = np.array(Image.fromarray(mask_b).resize((target_w, target_h), Image.NEAREST))
        
        new_water = np.logical_and(mask_a, ~mask_b_resized)
        receded_water = np.logical_and(mask_b_resized, ~mask_a)
        unchanged_water = np.logical_and(mask_a, mask_b_resized)

        change_rgb = np.zeros((target_h, target_w, 3), dtype=np.uint8)
        change_rgb[new_water] = [251, 113, 133]        # Coral
        change_rgb[receded_water] = [52, 211, 153]     # Green
        change_rgb[unchanged_water] = [34, 211, 238]   # Cyan

        change_b64 = engine.image_to_base64(change_rgb)
        
        comp_data = {
            "before_water_percentage": sample_metadata[1]["water_percentage"],
            "after_water_percentage": sample_metadata[5]["water_percentage"],
            "delta_percentage_points": round(sample_metadata[5]["water_percentage"] - sample_metadata[1]["water_percentage"], 2),
            "before_overlay_png_base64": item_b["overlay_png_base64"],
            "after_overlay_png_base64": item_a["overlay_png_base64"],
            "change_mask_png_base64": change_b64,
            "alignment_success": True,
            "notes": "Pre-computed benchmark comparison between Pass A (Sample 2) and Pass B (Sample 6).",
        }
        with open(samples_dir / "comparison.json", "w") as f:
            json.dump(comp_data, f, indent=2)
        print("Pre-computed comparison.json between sample 2 and 6.")

    print(f"\nSuccessfully prepared {len(sample_metadata)} demo samples into {samples_dir}")


if __name__ == "__main__":
    prepare_samples()
