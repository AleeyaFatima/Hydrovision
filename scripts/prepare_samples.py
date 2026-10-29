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

    print(f"\nSuccessfully prepared {len(sample_metadata)} demo samples into {samples_dir}")


if __name__ == "__main__":
    prepare_samples()
