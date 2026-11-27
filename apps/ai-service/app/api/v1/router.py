"""API v1 router registry."""

from fastapi import APIRouter, Depends

from app.api.security import require_internal_key
from app.api.v1.endpoints import classify, detect, diagnose, health, rag

api_router = APIRouter()

# Health probes stay public for Cloud Run; routes that cost CPU or Groq quota are backend-only
internal_only = [Depends(require_internal_key)]

# Health & Diagnostic Probes
api_router.include_router(health.router, prefix="/health", tags=["Health & Probes"])

# AI Vision & Inference Services
api_router.include_router(detect.router, tags=["Detection"], dependencies=internal_only)
api_router.include_router(classify.router, tags=["Classification"], dependencies=internal_only)
api_router.include_router(diagnose.router, tags=["Diagnosis Pipeline"], dependencies=internal_only)

# Agronomic Advisory & RAG Services
api_router.include_router(
    rag.router, prefix="/rag", tags=["Agronomic Advisory (RAG)"], dependencies=internal_only
)
