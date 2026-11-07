"""Configuration management using Pydantic Settings.

Supports environment variables, .env file loading, and sensible defaults
tailored for low-latency CPU inference via ONNX Runtime.
"""

from functools import lru_cache
import os
from pathlib import Path
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application and Inference Runtime Configuration."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # General Service Metadata
    PROJECT_NAME: str = "AgriTech AI Vision Microservice"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENV: str = Field(default="production", description="Environment: development, test, production")
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS Settings
    CORS_ORIGINS: List[str] = ["*"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]

    # File and Image Constraints
    MAX_IMAGE_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
    ALLOWED_IMAGE_CONTENT_TYPES: List[str] = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
    ]

    # Model Files Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    MODELS_DIR: Path = BASE_DIR / "app" / "models"
    YOLO_MODEL_PATH: Path = MODELS_DIR / "yolo11n_leaf.onnx"
    CLASSIFIER_MODEL_PATH: Path = MODELS_DIR / "mobilenetv4_plant_disease.onnx"
    CLASSES_JSON_PATH: Path = MODELS_DIR / "classes.json"

    # ONNX Runtime CPU Optimization Settings
    # Threading strategy: Sequential execution + tuned intra-op threads prevents core contention
    ONNX_INTER_OP_NUM_THREADS: int = 1
    ONNX_INTRA_OP_NUM_THREADS: int = Field(
        default_factory=lambda: min(4, max(1, os.cpu_count() or 1)),
        description="Threadpool size for tensor parallel execution on CPU",
    )
    ONNX_EXECUTION_MODE: str = "ORT_SEQUENTIAL"
    ONNX_GRAPH_OPTIMIZATION_LEVEL: str = "ORT_ENABLE_ALL"
    WARMUP_ON_STARTUP: bool = True

    # YOLOv11 Detector Settings
    DETECTOR_INPUT_SIZE: int = 640
    DETECTOR_CONF_THRESHOLD: float = 0.25
    DETECTOR_IOU_THRESHOLD: float = 0.45
    DETECTOR_MAX_BOXES: int = 50

    # MobileNetV4 Classifier Settings
    CLASSIFIER_INPUT_SIZE: int = 224
    CLASSIFIER_TOP_K: int = 5
    CLASSIFIER_CONF_THRESHOLD: float = 0.05
    IMAGE_NET_MEAN: List[float] = [0.485, 0.456, 0.406]
    IMAGE_NET_STD: List[float] = [0.229, 0.224, 0.225]

    # Pipeline Orchestration Settings
    CROP_PADDING_RATIO: float = 0.10  # 10% bounding box margin to preserve context edges
    LATENCY_BUDGET_MS: float = 100.0  # Competition benchmark target


@lru_cache()
def get_settings() -> Settings:
    """Singleton getter for application settings."""
    return Settings()
