"""Readiness and liveness health check endpoints."""

from typing import Any, Dict
from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse

from app.core.config import get_settings

router = APIRouter()


@router.get("/liveness", summary="Liveness Probe")
def liveness_check() -> Dict[str, str]:
    """Kubernetes / Docker liveness probe: returns 200 if process is responsive."""
    return {"status": "alive"}


@router.get("/readiness", summary="Readiness Probe")
def readiness_check(request: Request) -> JSONResponse:
    """Readiness probe: validates that ONNX inference sessions are active and primed."""
    settings = get_settings()

    detector_ready = getattr(request.app.state, "detector", None) is not None
    classifier_ready = getattr(request.app.state, "classifier", None) is not None
    pipeline_ready = getattr(request.app.state, "pipeline", None) is not None

    all_ready = detector_ready and classifier_ready and pipeline_ready

    data: Dict[str, Any] = {
        "status": "ready" if all_ready else "not_ready",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "models": {
            "yolo11n_detector": {
                "loaded": detector_ready,
                "model_path": str(settings.YOLO_MODEL_PATH.name),
            },
            "mobilenetv4_classifier": {
                "loaded": classifier_ready,
                "model_path": str(settings.CLASSIFIER_MODEL_PATH.name),
            },
            "pipeline": {
                "loaded": pipeline_ready,
            },
        },
        "onnx_runtime": {
            "intra_op_threads": settings.ONNX_INTRA_OP_NUM_THREADS,
            "inter_op_threads": settings.ONNX_INTER_OP_NUM_THREADS,
            "execution_mode": settings.ONNX_EXECUTION_MODE,
        },
    }

    status_code = status.HTTP_200_OK if all_ready else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(status_code=status_code, content=data)
