"""Internal API key enforcement for backend-only routes."""

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app


@pytest.fixture()
def keyed_client(monkeypatch):
    monkeypatch.setattr(get_settings(), "INTERNAL_API_KEY", "unit-test-key")
    with TestClient(app) as client:
        yield client


def test_rag_rejects_missing_key(keyed_client: TestClient):
    res = keyed_client.post("/api/v1/rag/chat", json={"query": "hello"})
    assert res.status_code == 401


def test_diagnose_rejects_wrong_key(keyed_client: TestClient):
    res = keyed_client.post(
        "/api/v1/diagnose",
        headers={"X-Internal-API-Key": "wrong"},
        files={"file": ("x.jpg", b"123", "image/jpeg")},
    )
    assert res.status_code == 401


def test_correct_key_passes_auth(keyed_client: TestClient):
    res = keyed_client.post(
        "/api/v1/diagnose",
        headers={"X-Internal-API-Key": "unit-test-key"},
        files={"file": ("x.txt", b"123", "text/plain")},
    )
    # Auth passed, so the request reaches file validation
    assert res.status_code == 415


def test_health_stays_public(keyed_client: TestClient):
    assert keyed_client.get("/health/liveness").status_code == 200


def test_production_without_key_fails_closed(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "INTERNAL_API_KEY", "")
    monkeypatch.setattr(settings, "ENV", "production")
    with TestClient(app) as client:
        res = client.post("/api/v1/rag/chat", json={"query": "hello"})
    assert res.status_code == 503
