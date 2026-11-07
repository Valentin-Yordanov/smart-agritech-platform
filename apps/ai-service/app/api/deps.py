"""FastAPI dependencies for inference services and file validation."""

from fastapi import HTTPException, Request, UploadFile, status

from app.core.config import get_settings
from app.services.onnx_classifier import MobileNetV4Classifier
from app.services.onnx_detector import YOLO11Detector
from app.services.pipeline import DiagnosisPipeline


def get_detector(request: Request) -> YOLO11Detector:
    """Dependency for YOLOv11 detector session."""
    detector = getattr(request.app.state, "detector", None)
    if detector is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="YOLO detector is not initialized or ready.",
        )
    return detector


def get_classifier(request: Request) -> MobileNetV4Classifier:
    """Dependency for MobileNetV4 classifier session."""
    classifier = getattr(request.app.state, "classifier", None)
    if classifier is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MobileNetV4 classifier is not initialized or ready.",
        )
    return classifier


def get_pipeline(request: Request) -> DiagnosisPipeline:
    """Dependency for end-to-end diagnosis pipeline."""
    pipeline = getattr(request.app.state, "pipeline", None)
    if pipeline is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Diagnosis pipeline is not initialized or ready.",
        )
    return pipeline


async def validate_image_upload(file: UploadFile) -> bytes:
    """Validates uploaded image file type and size constraints."""
    settings = get_settings()

    content_type = file.content_type or ""
    if content_type.lower() not in settings.ALLOWED_IMAGE_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file format '{content_type}'. Allowed: {settings.ALLOWED_IMAGE_CONTENT_TYPES}",
        )

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes).",
        )

    if len(contents) > settings.MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum threshold of {settings.MAX_IMAGE_SIZE_BYTES / (1024*1024):.1f} MB.",
        )

    return contents
