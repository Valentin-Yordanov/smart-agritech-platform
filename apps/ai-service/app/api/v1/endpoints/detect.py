"""Object detection endpoint for leaves, symptoms, and agricultural pests."""

from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from app.api.deps import get_detector, validate_image_upload
from app.schemas.detection import DetectionResult
from app.services.onnx_detector import YOLO11Detector
import cv2
import numpy as np

router = APIRouter()


@router.post(
    "/detect",
    response_model=DetectionResult,
    summary="Detect leaves, lesions, and pests with YOLOv11-nano",
    status_code=status.HTTP_200_OK,
)
async def detect_objects(
    file: UploadFile = File(..., description="Target leaf or canopy image (JPEG, PNG, WebP)"),
    conf_threshold: Optional[float] = Query(
        None,
        ge=0.01,
        le=1.0,
        description="Optional confidence threshold override (default: 0.25)",
    ),
    iou_threshold: Optional[float] = Query(
        None,
        ge=0.01,
        le=1.0,
        description="Optional IoU threshold for NMS override (default: 0.45)",
    ),
    detector: YOLO11Detector = Depends(get_detector),
) -> DetectionResult:
    """Executes high-speed YOLOv11 inference with aspect-ratio letterboxing and C++ NMS."""
    image_bytes = await validate_image_upload(file)

    np_arr = np.frombuffer(image_bytes, np.uint8)
    image_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if image_bgr is None or image_bgr.size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to decode image. Ensure file has valid image data.",
        )

    result = detector.detect(
        image_bgr=image_bgr,
        conf_threshold=conf_threshold,
        iou_threshold=iou_threshold,
    )
    return result
