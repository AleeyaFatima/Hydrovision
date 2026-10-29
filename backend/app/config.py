"""AquaMap configuration settings."""
import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    # App
    APP_NAME: str = "HydroVision API"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: str = "http://localhost:3000,https://aquamap-chi.vercel.app"

    # Paths
    BASE_DIR: Path = BASE_DIR
    DATA_DIR: Path = BASE_DIR / "data"
    MODELS_DIR: Path = BASE_DIR / "models"
    REPORTS_DIR: Path = BASE_DIR / "reports"
    SPLITS_FILE: Path = BASE_DIR / "data" / "splits.json"

    # Model / Inference
    DEFAULT_MODEL_NAME: str = "unet_mobilenetv2"
    MODEL_PATH: str = "models/best_model.pth"
    INFERENCE_BACKEND: str = "pytorch"  # "pytorch" or "onnx"
    IMAGE_SIZE: int = 256
    DEVICE: str = "auto"  # "auto", "cpu", "cuda", "mps"
    DEFAULT_THRESHOLD: float = 0.5

    # Normalization (ImageNet)
    IMAGENET_MEAN: list[float] = [0.485, 0.456, 0.406]
    IMAGENET_STD: list[float] = [0.229, 0.224, 0.225]

    # Kaggle
    KAGGLE_USERNAME: str | None = None
    KAGGLE_KEY: str | None = None

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

