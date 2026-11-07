"""Pytest suite for AI Vision microservice inference and health endpoints."""

import io
from pathlib import Path

import cv2
from fastapi.testclient import TestClient
import numpy as np
import pytest

from app.core.config import get_settings
from app.main import app


@pytest.fixture(scope="module")
def client():
    """Test client context manager with lifespan startup/shutdown execution."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def synthetic_leaf_image_bytes() -> bytes:
    """Generates an in-memory synthetic plant leaf image (green canvas with lesion spot)."""
    # Create green leaf-like canvas 640x480
    img = np.full((480, 640, 3), (35, 120, 45), dtype=np.uint8)

    # Draw simulated leaf contour and stem
    cv2.ellipse(img, (320, 240), (180, 100), 25, 0, 360, (50, 160, 60), -1)
    # Draw necrotic brown spot
    cv2.circle(img, (350, 230), 25, (30, 60, 110), -1)

    success, encoded = cv2.imencode(".jpg", img)
    assert success, "Failed to encode synthetic JPEG image"
    return encoded.tobytes()


def test_root_endpoint(client: TestClient):
    """Test root service metadata endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "version" in data


def test_liveness_probe(client: TestClient):
    """Test Kubernetes liveness probe."""
    response = client.get("/health/liveness")
    assert response.status_code == 200
    assert response.json() == {"status": "alive"}


def test_readiness_probe(client: TestClient):
    """Test Kubernetes readiness probe verifying ONNX sessions."""
    response = client.get("/health/readiness")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["models"]["yolo11n_detector"]["loaded"] is True
    assert data["models"]["mobilenetv4_classifier"]["loaded"] is True
    assert data["models"]["pipeline"]["loaded"] is True


def test_detect_endpoint(client: TestClient, synthetic_leaf_image_bytes: bytes):
    """Test YOLOv11 leaf and pest detection endpoint."""
    files = {"file": ("test_leaf.jpg", synthetic_leaf_image_bytes, "image/jpeg")}
    response = client.post("/api/v1/detect?conf_threshold=0.20", files=files)

    assert response.status_code == 200
    data = response.json()
    assert "detections" in data
    assert "count" in data
    assert "latency_ms" in data
    assert data["image_width"] == 640
    assert data["image_height"] == 480
    assert data["latency_ms"] > 0
    assert "X-Process-Time-Ms" in response.headers


def test_classify_endpoint(client: TestClient, synthetic_leaf_image_bytes: bytes):
    """Test MobileNetV4 plant disease classification endpoint."""
    files = {"file": ("test_crop.jpg", synthetic_leaf_image_bytes, "image/jpeg")}
    response = client.post("/api/v1/classify?top_k=3", files=files)

    assert response.status_code == 200
    data = response.json()
    assert "predictions" in data
    assert len(data["predictions"]) == 3
    assert "top_prediction" in data
    assert "latency_ms" in data

    top = data["top_prediction"]
    assert "class_name" in top
    assert "confidence" in top
    assert 0.0 <= top["confidence"] <= 1.0


def test_diagnose_pipeline_endpoint(client: TestClient, synthetic_leaf_image_bytes: bytes):
    """Test complete end-to-end diagnosis pipeline."""
    files = {"file": ("full_canopy.jpg", synthetic_leaf_image_bytes, "image/jpeg")}
    response = client.post("/api/v1/diagnose", files=files)

    assert response.status_code == 200
    data = response.json()

    assert data["status"] in ["HEALTHY", "DISEASED", "PEST_INFESTATION", "UNCERTAIN"]
    assert "overall_health_score" in data
    assert 0.0 <= data["overall_health_score"] <= 100.0
    assert "latencies" in data

    latencies = data["latencies"]
    assert "detection_ms" in latencies
    assert "crop_ms" in latencies
    assert "classification_ms" in latencies
    assert "total_pipeline_ms" in latencies
    assert isinstance(latencies["sub_100ms_target_met"], bool)
    assert len(data["recommendations"]) > 0


def test_unsupported_file_format(client: TestClient):
    """Test upload rejection for non-image MIME types."""
    files = {"file": ("report.pdf", b"%PDF-1.4 dummy", "application/pdf")}
    response = client.post("/api/v1/diagnose", files=files)
    assert response.status_code == 415
    assert "Unsupported file format" in response.json()["detail"]


def test_empty_file_upload(client: TestClient):
    """Test upload rejection for 0-byte payload."""
    files = {"file": ("empty.jpg", b"", "image/jpeg")}
    response = client.post("/api/v1/detect", files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_corrupted_image_bytes(client: TestClient):
    """Test upload rejection for invalid image data."""
    files = {"file": ("corrupt.jpg", b"NOT_A_VALID_JPEG_HEADER", "image/jpeg")}
    response = client.post("/api/v1/classify", files=files)
    assert response.status_code == 400
    assert "Unable to decode image" in response.json()["detail"]
