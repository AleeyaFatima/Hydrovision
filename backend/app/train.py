"""Training pipeline for AquaMap benchmark models with MLflow tracking and early stopping."""
import argparse
import os
import random
import subprocess
import time
from pathlib import Path
import numpy as np
import torch
from torch.utils.data import DataLoader
from torch.optim import AdamW
from torch.optim.lr_scheduler import ReduceLROnPlateau
import mlflow

from app.config import settings
from app.dataset import FloodDataset, create_or_load_splits
from app.transforms import get_train_transforms, get_val_transforms
from app.models import get_model, get_device
from app.losses import CombinedBCEDiceLoss
from app.metrics import compute_metrics, find_best_threshold


def seed_everything(seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False


def get_git_commit() -> str:
    try:
        return subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], text=True).strip()
    except Exception:
        return "unknown"


def train_one_epoch(
    model: torch.nn.Module,
    loader: DataLoader,
    optimizer: torch.optim.Optimizer,
    criterion: torch.nn.Module,
    device: torch.device,
    use_amp: bool = False,
) -> tuple[float, float, float]:
    model.train()
    total_loss = 0.0
    all_preds = []
    all_targets = []

    scaler = torch.amp.GradScaler("cuda", enabled=(use_amp and device.type == "cuda"))

    for batch in loader:
        images = batch["image"].to(device)
        masks = batch["mask"].to(device)

        optimizer.zero_grad()

        if use_amp and device.type == "cuda":
            with torch.amp.autocast("cuda"):
                logits = model(images)
                loss = criterion(logits, masks)
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
        else:
            logits = model(images)
            loss = criterion(logits, masks)
            loss.backward()
            optimizer.step()

        total_loss += loss.item() * images.size(0)
        probs = torch.sigmoid(logits).detach().cpu().numpy()
        all_preds.append(probs)
        all_targets.append(masks.detach().cpu().numpy())

    avg_loss = total_loss / len(loader.dataset)
    all_preds_cat = np.concatenate(all_preds, axis=0)
    all_targets_cat = np.concatenate(all_targets, axis=0)
    m = compute_metrics(all_preds_cat, all_targets_cat, threshold=0.5)

    return avg_loss, m["iou"], m["dice"]


@torch.no_grad()
def validate(
    model: torch.nn.Module,
    loader: DataLoader,
    criterion: torch.nn.Module,
    device: torch.device,
) -> tuple[float, float, float, float]:
    model.eval()
    total_loss = 0.0
    val_probs = []
    val_targets = []

    for batch in loader:
        images = batch["image"].to(device)
        masks = batch["mask"].to(device)

        logits = model(images)
        loss = criterion(logits, masks)
        total_loss += loss.item() * images.size(0)

        probs = torch.sigmoid(logits).detach().cpu().numpy()
        targets = masks.detach().cpu().numpy()
        for p, t in zip(probs, targets):
            val_probs.append(p)
            val_targets.append(t)

    avg_loss = total_loss / len(loader.dataset)
    best_thresh, best_dice = find_best_threshold(val_probs, val_targets)

    # Compute IoU at best threshold
    all_p = np.concatenate([p[None, ...] for p in val_probs], axis=0)
    all_t = np.concatenate([t[None, ...] for t in val_targets], axis=0)
    m = compute_metrics(all_p, all_t, threshold=best_thresh)

    return avg_loss, m["iou"], best_dice, best_thresh


def run_training(
    model_name: str = "unet_mobilenetv2",
    epochs: int = 40,
    batch_size: int = 8,
    img_size: int = 256,
    lr: float = 1e-4,
    seed: int = 42,
    patience: int = 8,
):
    seed_everything(seed)
    device = get_device(settings.DEVICE)
    print(f"\n========================================================")
    print(f"Starting training: {model_name} on {device}")
    print(f"Epochs: {epochs}, Batch size: {batch_size}, LR: {lr}, Img size: {img_size}")
    print(f"========================================================\n")

    # Load data splits
    splits = create_or_load_splits(settings.DATA_DIR, settings.SPLITS_FILE, seed=seed)
    train_dataset = FloodDataset(
        splits["train"],
        transform=get_train_transforms(img_size),
        base_dir=settings.BASE_DIR,
    )
    val_dataset = FloodDataset(
        splits["val"],
        transform=get_val_transforms(img_size),
        base_dir=settings.BASE_DIR,
    )

    print(f"Train samples: {len(train_dataset)}, Validation samples: {len(val_dataset)}")

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=0,
        pin_memory=(device.type == "cuda"),
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=0,
    )

    # Instantiate model
    pretrained = (model_name != "unet_scratch")
    model = get_model(model_name, pretrained=pretrained).to(device)

    criterion = CombinedBCEDiceLoss(bce_weight=0.5, dice_weight=0.5)
    optimizer = AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = ReduceLROnPlateau(optimizer, mode="max", factor=0.5, patience=3, min_lr=1e-6)

    # MLflow tracking setup
    mlruns_dir = settings.BASE_DIR / "mlruns"
    mlruns_dir.mkdir(parents=True, exist_ok=True)
    db_path = mlruns_dir / "mlflow.db"
    mlflow.set_tracking_uri(f"sqlite:///{db_path.absolute()}")
    mlflow.set_experiment("AquaMap")

    best_val_dice = -1.0
    best_threshold = 0.5
    no_improve_epochs = 0
    checkpoint_dir = settings.MODELS_DIR
    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    best_model_path = checkpoint_dir / f"best_{model_name}.pth"

    with mlflow.start_run(run_name=f"{model_name}_{int(time.time())}"):
        mlflow.log_params({
            "model_name": model_name,
            "epochs": epochs,
            "batch_size": batch_size,
            "lr": lr,
            "img_size": img_size,
            "seed": seed,
            "patience": patience,
            "device": str(device),
            "git_commit": get_git_commit(),
        })

        for epoch in range(1, epochs + 1):
            train_loss, train_iou, train_dice = train_one_epoch(
                model, train_loader, optimizer, criterion, device, use_amp=(device.type == "cuda")
            )
            val_loss, val_iou, val_dice, val_thresh = validate(
                model, val_loader, criterion, device
            )

            current_lr = optimizer.param_groups[0]["lr"]
            scheduler.step(val_dice)

            print(
                f"Epoch [{epoch:02d}/{epochs:02d}] "
                f"Train Loss: {train_loss:.4f} | Train Dice: {train_dice:.4f} | "
                f"Val Loss: {val_loss:.4f} | Val Dice: {val_dice:.4f} (IoU: {val_iou:.4f}, Thr: {val_thresh:.2f}) | "
                f"LR: {current_lr:.1e}"
            )

            mlflow.log_metrics({
                "train_loss": train_loss,
                "train_iou": train_iou,
                "train_dice": train_dice,
                "val_loss": val_loss,
                "val_iou": val_iou,
                "val_dice": val_dice,
                "val_best_threshold": val_thresh,
                "learning_rate": current_lr,
            }, step=epoch)

            # Checkpoint on best validation Dice
            if val_dice > best_val_dice:
                best_val_dice = val_dice
                best_threshold = val_thresh
                no_improve_epochs = 0

                torch.save({
                    "state_dict": model.state_dict(),
                    "model_name": model_name,
                    "img_size": img_size,
                    "normalization": {
                        "mean": settings.IMAGENET_MEAN,
                        "std": settings.IMAGENET_STD,
                    },
                    "best_val_dice": best_val_dice,
                    "best_threshold": best_threshold,
                    "epoch": epoch,
                    "git_commit": get_git_commit(),
                }, best_model_path)
                print(f"  --> Saved new best checkpoint to {best_model_path.name} (Val Dice: {best_val_dice:.4f})")
            else:
                no_improve_epochs += 1
                if no_improve_epochs >= patience:
                    print(f"\nEarly stopping triggered after {epoch} epochs (no improvement in {patience} epochs).")
                    break

        mlflow.log_artifact(str(best_model_path))
        print(f"\nTraining complete for {model_name}!")
        print(f"Best Validation Dice: {best_val_dice:.4f} at threshold {best_threshold:.2f}")

    return best_model_path, best_val_dice


def main():
    parser = argparse.ArgumentParser(description="Train AquaMap flood segmentation models")
    parser.add_argument("--model", type=str, default="unet_mobilenetv2", choices=["unet_scratch", "unet_mobilenetv2", "segformer_b0"])
    parser.add_argument("--epochs", type=int, default=40)
    parser.add_argument("--batch-size", type=int, default=8)
    parser.add_argument("--img-size", type=int, default=256)
    parser.add_argument("--lr", type=float, default=None)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--patience", type=int, default=8)

    args = parser.parse_args()

    # Default learning rates per model as specified in Section 7.1
    default_lrs = {
        "unet_scratch": 1e-3,
        "unet_mobilenetv2": 1e-4,
        "segformer_b0": 6e-5,
    }
    lr = args.lr if args.lr is not None else default_lrs.get(args.model, 1e-4)

    run_training(
        model_name=args.model,
        epochs=args.epochs,
        batch_size=args.batch_size,
        img_size=args.img_size,
        lr=lr,
        seed=args.seed,
        patience=args.patience,
    )


if __name__ == "__main__":
    main()
