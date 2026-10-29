"""Download Flood Area Segmentation from Kaggle into backend/data/."""
import os
import shutil
import subprocess
import sys
from pathlib import Path

# Load environment variables if available
try:
    from dotenv import load_dotenv
    env_file = Path(__file__).resolve().parents[1] / ".env"
    if env_file.exists():
        load_dotenv(env_file)
except ImportError:
    pass

DATASET = "faizalkarim/flood-area-segmentation"
DATA_DIR = Path(__file__).resolve().parents[1] / "data"


def via_kagglehub() -> Path:
    import kagglehub
    return Path(kagglehub.dataset_download(DATASET))


def via_cli() -> Path:
    raw = DATA_DIR / "_raw"
    raw.mkdir(parents=True, exist_ok=True)
    subprocess.run(["kaggle", "datasets", "download", "-d", DATASET,
                    "-p", str(raw), "--unzip"], check=True)
    return raw


def find_dir(root: Path, name: str) -> Path:
    for p in root.rglob("*"):
        if p.is_dir() and p.name.lower() == name.lower():
            return p
    raise FileNotFoundError(f"No '{name}' folder under {root}")


def main() -> None:
    print(f"Starting dataset download for: {DATASET}")
    try:
        src = via_kagglehub()
    except Exception as e:
        print(f"kagglehub failed ({e}); trying Kaggle CLI...", file=sys.stderr)
        src = via_cli()

    print(f"Source files downloaded to: {src}")
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    for folder in ("Image", "Mask"):
        dst = DATA_DIR / folder
        if dst.exists():
            shutil.rmtree(dst)
        src_folder = find_dir(src, folder)
        shutil.copytree(src_folder, dst)
        print(f"Copied {folder} directory from {src_folder} -> {dst}")

    meta = next(src.rglob("metadata.csv"), None)
    if meta:
        shutil.copy(meta, DATA_DIR / "metadata.csv")
        print("Copied metadata.csv")

    img_count = len([f for f in (DATA_DIR / 'Image').iterdir() if not f.name.startswith('.')])
    mask_count = len([f for f in (DATA_DIR / 'Mask').iterdir() if not f.name.startswith('.')])
    print(f"Done: {img_count} images, {mask_count} masks in {DATA_DIR}")


if __name__ == "__main__":
    main()
