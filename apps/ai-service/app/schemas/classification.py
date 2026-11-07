"""Pydantic schemas for plant species and disease classification."""

from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class TopKPrediction(BaseModel):
    """A single predicted class candidate with confidence and agronomic metadata."""

    model_config = ConfigDict(populate_by_name=True)

    class_id: int = Field(..., description="Numeric class index from classification model")
    class_name: str = Field(..., description="Full canonical class name (e.g. 'Tomato___Early_blight')")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Softmax confidence probability [0.0 - 1.0]")
    species: Optional[str] = Field(None, description="Inferred plant species (e.g. 'Tomato', 'Apple')")
    disease: Optional[str] = Field(None, description="Identified pathology or 'Healthy'")
    is_healthy: Optional[bool] = Field(None, description="True if no disease or pest is detected")
    severity: Optional[str] = Field(None, description="Risk level: 'None', 'Low', 'Moderate', 'Severe'")
    treatment: Optional[str] = Field(None, description="Recommended agronomic remedy or cultural control")


class ClassificationResult(BaseModel):
    """Full response schema for the classification endpoint."""

    model_config = ConfigDict(populate_by_name=True)

    predictions: List[TopKPrediction] = Field(
        default_factory=list,
        description="Top-K predicted classes ranked by confidence descending",
    )
    top_prediction: TopKPrediction = Field(..., description="Highest confidence prediction")
    latency_ms: float = Field(..., description="Preprocessing, inference, and softmax latency in milliseconds")
