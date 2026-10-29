"""Tests for backend API /health, input validation, and metrics endpoints."""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "model_loaded" in data
    assert "device" in data
    assert "inference_backend" in data


def test_predict_503_when_no_model():
    # If no model is loaded, predict should return 503
    fake_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0\x00\x00\x03\x01\x01\x00\x18\xdd\x8d\xb0\x00\x00\x00\x00IEND\xaeB`\x82"
    response = client.post(
        "/predict",
        files={"file": ("test.png", fake_png, "image/png")}
    )
    # If model is not loaded, expect 503
    from app.inference import engine
    if not engine.is_loaded:
        assert response.status_code == 503
        assert "Model is not loaded" in response.json()["detail"]


def test_predict_bad_mime_type():
    response = client.post(
        "/predict",
        files={"file": ("test.txt", b"plain text content", "text/plain")}
    )
    assert response.status_code in [400, 503]


def test_metrics_404_when_empty(tmp_path, monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "REPORTS_DIR", tmp_path)
    response = client.get("/metrics")
    assert response.status_code == 404
