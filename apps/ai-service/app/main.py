"""FastAPI Application Factory, CORS configuration, and Lifecycle Management."""

from contextlib import asynccontextmanager
import time
from typing import AsyncGenerator, Dict

from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.endpoints import health
from app.api.v1.router import api_router
from app.core.config import Settings, get_settings
from app.core.logger import logger
from app.services.onnx_classifier import MobileNetV4Classifier
from app.services.onnx_detector import YOLO11Detector
from app.services.pipeline import DiagnosisPipeline


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manages application startup and shutdown lifecycle events."""
    settings: Settings = get_settings()
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENV}]...")

    try:
        # Initialize inference sessions
        detector = YOLO11Detector(settings=settings)
        classifier = MobileNetV4Classifier(settings=settings)
        pipeline = DiagnosisPipeline(detector=detector, classifier=classifier, settings=settings)

        # Attach to application state for dependency injection
        app.state.detector = detector
        app.state.classifier = classifier
        app.state.pipeline = pipeline

        # Prime ONNX graphs and threadpools
        if settings.WARMUP_ON_STARTUP:
            logger.info("Executing startup model priming...")
            pipeline.warmup()

        logger.info("All ONNX inference sessions primed and ready for requests.")
    except Exception as exc:
        logger.error(f"Fatal error initializing inference runtime: {exc}", exc_info=True)
        raise exc

    yield

    logger.info("Shutting down AI vision microservice. Cleaning up resources...")


def create_app() -> FastAPI:
    """FastAPI application factory."""
    settings = get_settings()

    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=(
            "Competition-Grade High-Performance AI Vision Microservice for Plant Disease "
            "Localization and Diagnosis. Optimized for Sub-100ms CPU Inference via ONNX Runtime."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Configure Cross-Origin Resource Sharing (CORS)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=settings.CORS_ALLOW_METHODS,
        allow_headers=settings.CORS_ALLOW_HEADERS,
    )

    # Observability: Execution Latency Header Middleware
    @app.middleware("http")
    async def add_process_time_header(request: Request, call_next) -> Response:
        start_time = time.perf_counter()
        response = await call_next(request)
        process_time_ms = (time.perf_counter() - start_time) * 1000.0
        response.headers["X-Process-Time-Ms"] = f"{process_time_ms:.2f}"
        return response

    # Global Exception Handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error(f"Unhandled exception at {request.url.path}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "InternalInferenceError",
                "message": "An unexpected error occurred during model inference or processing.",
                "path": request.url.path,
            },
        )

    # Mount API Routers
    app.include_router(api_router, prefix=settings.API_V1_STR)

    # Top-level Health Probes (Standard Docker/K8s conventions)
    app.include_router(health.router, prefix="/health", tags=["Root Health"])

    # Service Root Metadata
    @app.get("/", summary="Service Root", tags=["Root"])
    def root() -> Dict[str, str]:
        return {
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "status": "online",
            "docs": "/docs",
            "api_v1": settings.API_V1_STR,
        }

    return app


app = create_app()
