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
    # Server-to-server only: browsers never call this service directly
    CORS_ORIGINS: List[str] = []
    CORS_ALLOW_CREDENTIALS: bool = False
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
    CLASSIFIER_CONF_THRESHOLD: float = 0.75
    UNKNOWN_CLASS_NAMES: List[str] = ["unknown", "not_a_plant_leaf"]
    CLASSIFIER_MAX_REGIONS: int = 8
    PEST_DETECTION_LABELS: List[str] = ["pest", "aphid", "whitefly", "caterpillar", "spider_mite"]
    IMAGE_NET_MEAN: List[float] = [0.485, 0.456, 0.406]
    IMAGE_NET_STD: List[float] = [0.229, 0.224, 0.225]

    # Pipeline Orchestration Settings
    CROP_PADDING_RATIO: float = 0.10  # 10% bounding box margin to preserve context edges
    LATENCY_BUDGET_MS: float = 100.0  # Competition benchmark target

    # Groq & ChromaDB RAG Configuration
    INTERNAL_API_KEY: str = Field(default="", description="Shared secret the backend sends as X-Internal-API-Key")
    GROQ_API_KEY: str = Field(default="", description="Groq Cloud API Key for LLM advisory")
    GROQ_MODEL: str = Field(default="openai/gpt-oss-120b", description="Fast inference LLM model")
    GROQ_VISION_MODEL: str = Field(default="qwen/qwen3.8-27b", description="Multimodal model used only when images are attached")

    # Chat attachments: Groq rejects base64 image payloads above 4 MB per request, so keep a safety margin
    ATTACHMENT_MAX_FILES: int = 4
    ATTACHMENT_MAX_IMAGES: int = 3
    ATTACHMENT_MAX_BYTES: int = 10 * 1024 * 1024
    ATTACHMENT_IMAGE_MAX_SIDE: int = 1280
    ATTACHMENT_IMAGE_B64_BUDGET: int = int(3.5 * 1024 * 1024)
    ATTACHMENT_PDF_MAX_PAGES: int = 20
    ATTACHMENT_TEXT_MAX_CHARS: int = 12_000
    ATTACHMENT_DOCX_MAX_UNCOMPRESSED: int = 25 * 1024 * 1024

    CHROMA_PERSIST_DIR: Path = BASE_DIR / "data" / "chroma_db"
    CHROMA_COLLECTION_NAME: str = "agronomy_knowledge"
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"
    RAG_TOP_K: int = 3


@lru_cache()
def get_settings() -> Settings:
    """Singleton getter for application settings."""
    return Settings()
