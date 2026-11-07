"""Pydantic schemas for object detection results."""

from typing import List
from pydantic import BaseModel, ConfigDict, Field, computed_field


class BoundingBox(BaseModel):
    """Bounding box coordinates (pixel coordinates)."""

    model_config = ConfigDict(populate_by_name=True)

    x_min: float = Field(..., description="Top-left X coordinate in pixels", ge=0.0)
    y_min: float = Field(..., description="Top-left Y coordinate in pixels", ge=0.0)
    x_max: float = Field(..., description="Bottom-right X coordinate in pixels", ge=0.0)
    y_max: float = Field(..., description="Bottom-right Y coordinate in pixels", ge=0.0)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def width(self) -> float:
        """Width of the bounding box."""
        return max(0.0, self.x_max - self.x_min)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def height(self) -> float:
        """Height of the bounding box."""
        return max(0.0, self.y_max - self.y_min)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def area(self) -> float:
        """Area of the bounding box."""
        return self.width * self.height


class DetectionItem(BaseModel):
    """A single detected object (leaf, lesion, pest, etc.)."""

    model_config = ConfigDict(populate_by_name=True)

    box: BoundingBox = Field(..., description="Spatial coordinates of the detection")
    class_id: int = Field(..., description="Numeric class identifier from YOLO model")
    class_name: str = Field(..., description="Human-readable label (e.g., 'leaf', 'aphid')")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence score [0.0 - 1.0]")


class DetectionResult(BaseModel):
    """Full response schema for the detection endpoint."""

    model_config = ConfigDict(populate_by_name=True)

    detections: List[DetectionItem] = Field(default_factory=list, description="List of detected objects")
    count: int = Field(..., description="Total number of detected objects")
    image_width: int = Field(..., description="Width of the processed image in pixels")
    image_height: int = Field(..., description="Height of the processed image in pixels")
    latency_ms: float = Field(..., description="Inference and NMS execution latency in milliseconds")
