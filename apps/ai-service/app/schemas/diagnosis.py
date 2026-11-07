"""Pydantic schemas for the end-to-end diagnosis pipeline."""

from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.classification import ClassificationResult
from app.schemas.detection import BoundingBox


class DiagnosedRegion(BaseModel):
    """An individual leaf or pest region localized and classified."""

    model_config = ConfigDict(populate_by_name=True)

    region_id: int = Field(..., description="Unique sequential identifier for this region")
    box: BoundingBox = Field(..., description="Pixel bounding box of the cropped ROI")
    detection_label: str = Field(..., description="Object label from YOLO (e.g. 'leaf', 'pest')")
    detection_confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence score")
    classification: ClassificationResult = Field(..., description="Disease classification results for this crop")


class LatencyBenchmark(BaseModel):
    """High-resolution microsecond latency breakdown across the pipeline."""

    model_config = ConfigDict(populate_by_name=True)

    decode_and_preprocess_ms: float = Field(..., description="Image decode and letterboxing time in ms")
    detection_ms: float = Field(..., description="YOLO ONNX inference and NMS time in ms")
    crop_ms: float = Field(..., description="Context-padded ROI cropping time in ms")
    classification_ms: float = Field(..., description="MobileNetV4 ONNX inference on crops in ms")
    total_pipeline_ms: float = Field(..., description="Total wall-clock duration in ms")
    sub_100ms_target_met: bool = Field(
        ...,
        description="True if total inference pipeline execution was under the 100ms budget",
    )


class DiagnosisResponse(BaseModel):
    """End-to-end diagnosis response uniting detection, crops, classification, and agronomic advice."""

    model_config = ConfigDict(populate_by_name=True)

    status: str = Field(
        ...,
        description="Overall diagnosis verdict: 'HEALTHY', 'DISEASED', 'PEST_INFESTATION', or 'UNCERTAIN'",
    )
    primary_species: Optional[str] = Field(None, description="Dominant identified plant species")
    primary_disease: Optional[str] = Field(None, description="Dominant diagnosed pathology or 'None'")
    overall_health_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Overall crop health score [0 = critical pathology/damage, 100 = optimal vigor]",
    )
    severity_level: str = Field(..., description="'None', 'Low', 'Moderate', 'High', 'Critical'")
    regions_analyzed: int = Field(..., description="Number of localized ROIs classified")
    regions: List[DiagnosedRegion] = Field(default_factory=list, description="Localized disease regions")
    full_image_classification: Optional[ClassificationResult] = Field(
        None,
        description="Holistic image-level classification baseline",
    )
    recommendations: List[str] = Field(
        default_factory=list,
        description="Actionable treatment protocols, biosecurity controls, or fertilization tips",
    )
    latencies: LatencyBenchmark = Field(..., description="Precision execution timers for CPU performance evaluation")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="UTC ISO timestamp of the diagnosis execution",
    )
