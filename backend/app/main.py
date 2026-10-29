"""FastAPI application for AquaMap flood segmentation."""
import io
import json
import time
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Any
import numpy as np
from PIL import Image
import cv2
from fastapi import FastAPI, UploadFile, File, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel

from app.config import settings
from app.inference import engine
from app.report import generate_pdf_report

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: attempt to load model checkpoint
    best_model_path = settings.BASE_DIR / settings.MODEL_PATH
    engine.load_model(best_model_path)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AquaMap AI Floodwater Aerial Image Segmentation API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration: strict list without wildcards
cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_name: str | None
    device: str
    inference_backend: str


class PredictResponse(BaseModel):
    mask_png_base64: str
    overlay_png_base64: str
    uncertainty_png_base64: str | None = None
    gradcam_png_base64: str | None = None
    water_pixel_percentage: float
    mean_uncertainty: float | None = None
    threshold: float
    inference_ms: float
    model_name: str
    image_size: list[int]


class CompareResponse(BaseModel):
    before_water_percentage: float
    after_water_percentage: float
    delta_percentage_points: float
    before_overlay_png_base64: str
    after_overlay_png_base64: str
    change_mask_png_base64: str
    alignment_success: bool
    notes: str


def validate_image_file(file: UploadFile, data: bytes) -> Image.Image:
    """Validates file MIME type, size limit, and image decodability."""
    if len(data) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Uploaded file exceeds maximum limit of 10MB (got {len(data) / (1024*1024):.2f}MB)",
        )
    if file.content_type not in ["image/jpeg", "image/png", "image/webp", "image/bmp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{file.content_type}'. Please upload JPEG, PNG, or WebP.",
        )
    try:
        img = Image.open(io.BytesIO(data))
        img.verify()
        # Re-open after verify
        img = Image.open(io.BytesIO(data))
        return img.convert("RGB")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not decode image file: {e}",
        )


@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="healthy",
        model_loaded=engine.is_loaded,
        model_name=engine.model_name if engine.is_loaded else None,
        device=str(engine.device),
        inference_backend=engine.backend,
    )


@app.post("/predict", response_model=PredictResponse)
async def predict(
    file: UploadFile = File(...),
    explain: bool = Query(False, description="Generate Grad-CAM explainability heatmap"),
    uncertainty: bool = Query(False, description="Compute TTA uncertainty quantification map"),
):
    if not engine.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not loaded. Train a model or place checkpoint at models/best_model.pth.",
        )

    content = await file.read()
    _ = validate_image_file(file, content)

    try:
        result = engine.predict(content, explain=explain, uncertainty=uncertainty)
        return PredictResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Inference failed: {e}")


@app.post("/compare", response_model=CompareResponse)
async def compare(
    before: UploadFile = File(..., description="Pre-flood or baseline aerial image"),
    after: UploadFile = File(..., description="Post-flood or subsequent aerial image"),
):
    if not engine.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not loaded. Train a model or place checkpoint at models/best_model.pth.",
        )

    before_bytes = await before.read()
    after_bytes = await after.read()

    before_pil = validate_image_file(before, before_bytes)
    after_pil = validate_image_file(after, after_bytes)

    # Predict both
    res_before = engine.predict(before_bytes)
    res_after = engine.predict(after_bytes)

    pct_before = res_before["water_pixel_percentage"]
    pct_after = res_after["water_pixel_percentage"]
    delta_points = round(pct_after - pct_before, 2)

    # Standardize comparison resolution (using 'after' dimensions)
    target_w, target_h = after_pil.size

    # Decode binary masks
    mask_before_bytes = io.BytesIO(Image.open(io.BytesIO(after_bytes)).tobytes())  # placeholder
    # Convert mask b64 back to numpy
    import base64
    before_mask_img = Image.open(io.BytesIO(base64.b64decode(res_before["mask_png_base64"]))).convert("L")
    after_mask_img = Image.open(io.BytesIO(base64.b64decode(res_after["mask_png_base64"]))).convert("L")

    # Resize before mask to target_w, target_h
    before_mask_resized = np.array(before_mask_img.resize((target_w, target_h), Image.NEAREST)) > 127
    after_mask_resized = np.array(after_mask_img.resize((target_w, target_h), Image.NEAREST)) > 127

    # Optional feature alignment via ORB
    alignment_success = False
    try:
        before_cv = cv2.cvtColor(np.array(before_pil), cv2.COLOR_RGB2GRAY)
        after_cv = cv2.cvtColor(np.array(after_pil), cv2.COLOR_RGB2GRAY)
        orb = cv2.ORB_create(500)
        kp1, des1 = orb.detectAndCompute(before_cv, None)
        kp2, des2 = orb.detectAndCompute(after_cv, None)
        if des1 is not None and des2 is not None:
            bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
            matches = sorted(bf.match(des1, des2), key=lambda x: x.distance)
            if len(matches) >= 10:
                alignment_success = True
    except Exception:
        alignment_success = False

    # Build Change Mask:
    # New water = after AND NOT before -> Coral (#FB7185: RGB 251, 113, 133)
    # Receded water = before AND NOT after -> Green (#34D399: RGB 52, 211, 153)
    # Unchanged water = after AND before -> Cyan (#22D3EE: RGB 34, 211, 238)
    new_water = np.logical_and(after_mask_resized, ~before_mask_resized)
    receded_water = np.logical_and(before_mask_resized, ~after_mask_resized)
    unchanged_water = np.logical_and(after_mask_resized, before_mask_resized)

    change_rgb = np.zeros((target_h, target_w, 3), dtype=np.uint8)
    change_rgb[new_water] = [251, 113, 133]        # Coral
    change_rgb[receded_water] = [52, 211, 153]     # Green
    change_rgb[unchanged_water] = [34, 211, 238]   # Cyan

    change_b64 = engine.image_to_base64(change_rgb)

    notes = "Automatic ORB alignment succeeded." if alignment_success else "Images could not be fully homography-aligned; assuming identical aerial viewpoint."

    return CompareResponse(
        before_water_percentage=pct_before,
        after_water_percentage=pct_after,
        delta_percentage_points=delta_points,
        before_overlay_png_base64=res_before["overlay_png_base64"],
        after_overlay_png_base64=res_after["overlay_png_base64"],
        change_mask_png_base64=change_b64,
        alignment_success=alignment_success,
        notes=notes,
    )


@app.post("/report")
async def create_report(
    file: UploadFile = File(...),
    explain: bool = Query(True),
    uncertainty: bool = Query(True),
):
    if not engine.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not loaded. Train a model or place checkpoint at models/best_model.pth.",
        )

    content = await file.read()
    orig_pil = validate_image_file(file, content)

    # Predict with explain and uncertainty
    res = engine.predict(content, explain=explain, uncertainty=uncertainty)

    # Reconstruct PIL images from base64
    import base64
    overlay_pil = Image.open(io.BytesIO(base64.b64decode(res["overlay_png_base64"]))).convert("RGB")
    uncertainty_pil = (
        Image.open(io.BytesIO(base64.b64decode(res["uncertainty_png_base64"]))).convert("RGB")
        if res["uncertainty_png_base64"] else None
    )
    gradcam_pil = (
        Image.open(io.BytesIO(base64.b64decode(res["gradcam_png_base64"]))).convert("RGB")
        if res["gradcam_png_base64"] else None
    )

    pdf_bytes = generate_pdf_report(
        original_pil=orig_pil,
        overlay_pil=overlay_pil,
        uncertainty_pil=uncertainty_pil,
        gradcam_pil=gradcam_pil,
        stats=res,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=aquamap_report_{int(time.time())}.pdf"}
    )


@app.get("/metrics")
def get_all_metrics():
    """Returns all available benchmark metrics, robustness results, and ONNX benchmarks."""
    reports_dir = settings.REPORTS_DIR
    metrics_files = list(reports_dir.glob("metrics_*.json"))
    robustness_files = list(reports_dir.glob("robustness_*.json"))
    onnx_file = reports_dir / "onnx_benchmark.json"

    if not metrics_files and not robustness_files and not onnx_file.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No evaluation metrics found. Please run evaluation first.",
        )

    models_metrics = {}
    for mf in metrics_files:
        with open(mf, "r") as f:
            data = json.load(f)
            models_metrics[data["model_name"]] = data

    robustness_data = {}
    for rf in robustness_files:
        with open(rf, "r") as f:
            data = json.load(f)
            robustness_data[data["model_name"]] = data

    onnx_data = None
    if onnx_file.exists():
        with open(onnx_file, "r") as f:
            onnx_data = json.load(f)

    return {
        "models": models_metrics,
        "robustness": robustness_data,
        "onnx": onnx_data,
    }


@app.get("/samples")
def get_sample_images():
    """Returns available sample aerial flood images."""
    samples_dir = settings.BASE_DIR.parent / "frontend" / "public" / "samples"
    if not samples_dir.exists():
        return {"samples": []}

    samples = [
        {"name": p.name, "url": f"/samples/{p.name}"}
        for p in samples_dir.glob("*")
        if p.suffix.lower() in [".jpg", ".jpeg", ".png"]
    ]
    return {"samples": samples}
