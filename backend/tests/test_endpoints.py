import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image
import numpy as np

from app.main import app, engine
from app.config import settings


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def create_dummy_jpeg():
    """Creates a valid in-memory RGB JPEG image."""
    img = Image.new("RGB", (128, 128), color=(30, 80, 150))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf.getvalue()


def test_health_endpoint(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "model_loaded" in data


def test_predict_endpoint(client):
    jpeg_bytes = create_dummy_jpeg()
    files = {"file": ("test.jpg", jpeg_bytes, "image/jpeg")}
    res = client.post("/predict?explain=true&uncertainty=true", files=files)
    assert res.status_code == 200
    data = res.json()
    assert "mask_png_base64" in data
    assert "overlay_png_base64" in data
    assert "uncertainty_png_base64" in data
    assert "gradcam_png_base64" in data
    assert "water_pixel_percentage" in data
    assert isinstance(data["water_pixel_percentage"], float)


def test_compare_endpoint(client):
    img_b = create_dummy_jpeg()
    img_a = create_dummy_jpeg()
    files = {
        "before": ("before.jpg", img_b, "image/jpeg"),
        "after": ("after.jpg", img_a, "image/jpeg"),
    }
    res = client.post("/compare", files=files)
    assert res.status_code == 200
    data = res.json()
    assert "before_water_percentage" in data
    assert "after_water_percentage" in data
    assert "delta_percentage_points" in data
    assert "change_mask_png_base64" in data
    assert "notes" in data


def test_report_endpoint(client):
    jpeg_bytes = create_dummy_jpeg()
    files = {"file": ("test.jpg", jpeg_bytes, "image/jpeg")}
    res = client.post("/report?explain=true&uncertainty=true", files=files)
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert res.content.startswith(b"%PDF-")


def test_metrics_endpoint(client):
    res = client.get("/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert "unet_mobilenetv2" in data["models"]
    assert "onnx" in data
    assert data["onnx"] is not None
    assert data["onnx"]["speedup_factor"] > 1.0


def test_samples_endpoint(client):
    res = client.get("/samples")
    assert res.status_code == 200
    data = res.json()
    assert "samples" in data
    assert len(data["samples"]) > 0
