"""Pydantic schemas package."""

from app.schemas.classification import ClassificationResult, TopKPrediction
from app.schemas.detection import BoundingBox, DetectionItem, DetectionResult
from app.schemas.diagnosis import DiagnosedRegion, DiagnosisResponse, LatencyBenchmark

__all__ = [
    "BoundingBox",
    "DetectionItem",
    "DetectionResult",
    "TopKPrediction",
    "ClassificationResult",
    "DiagnosedRegion",
    "LatencyBenchmark",
    "DiagnosisResponse",
]
