"""Plant species and disease classification endpoint."""

from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from app.api.deps import get_classifier, validate_image_upload
from app.schemas.classification import ClassificationResult
from app.services.onnx_classifier import MobileNetV4Classifier
import cv2
import numpy as np

router = APIRouter()


@router.post(
    "/classify",
    response_model=ClassificationResult,
    summary="Classify plant disease and health with MobileNetV4",
    status_code=status.HTTP_200_OK,
)
async def classify_disease(
    file: UploadFile = File(..., description="Plant or leaf image/crop (JPEG, PNG, WebP)"),
    top_k: Optional[int] = Query(
        None,
        ge=1,
        le=50,
        description="Top-K candidates to return (default: 5)",
    ),
    classifier: MobileNetV4Classifier = Depends(get_classifier),
) -> ClassificationResult:
    """Executes MobileNetV4 inference with ImageNet normalization and enriched pathology metadata."""
    image_bytes = await validate_image_upload(file)

    np_arr = np.frombuffer(image_bytes, np.uint8)
    image_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if image_bgr is None or image_bgr.size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to decode image. Ensure file has valid image data.",
        )

    result = classifier.classify(image_bgr=image_bgr, top_k=top_k)
    return result
