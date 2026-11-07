"""Combined end-to-end diagnosis pipeline endpoint."""

from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from app.api.deps import get_pipeline, validate_image_upload
from app.schemas.diagnosis import DiagnosisResponse
from app.services.pipeline import DiagnosisPipeline
import cv2
import numpy as np

router = APIRouter()


@router.post(
    "/diagnose",
    response_model=DiagnosisResponse,
    summary="End-to-end detection + crop + classification diagnosis pipeline",
    status_code=status.HTTP_200_OK,
)
async def diagnose_plant(
    file: UploadFile = File(..., description="High-resolution plant or leaf image (JPEG, PNG, WebP)"),
    conf_threshold: Optional[float] = Query(
        None,
        ge=0.01,
        le=1.0,
        description="Detection confidence threshold (default: 0.25)",
    ),
    iou_threshold: Optional[float] = Query(
        None,
        ge=0.01,
        le=1.0,
        description="NMS IoU threshold (default: 0.45)",
    ),
    pipeline: DiagnosisPipeline = Depends(get_pipeline),
) -> DiagnosisResponse:
    """Orchestrates leaf detection, context-padded ROI extraction, and disease classification.

    Delivers comprehensive agronomic advice, health scores, and sub-100ms CPU latency benchmarking.
    """
    image_bytes = await validate_image_upload(file)

    np_arr = np.frombuffer(image_bytes, np.uint8)
    image_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if image_bgr is None or image_bgr.size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to decode image. Ensure file has valid image data.",
        )

    response = pipeline.diagnose(
        image_bgr=image_bgr,
        conf_threshold=conf_threshold,
        iou_threshold=iou_threshold,
    )
    return response
