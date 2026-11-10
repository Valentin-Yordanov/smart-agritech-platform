"""API v1 router registry."""

from fastapi import APIRouter

from app.api.v1.endpoints import classify, detect, diagnose, health, rag

api_router = APIRouter()

# Health & Diagnostic Probes
api_router.include_router(health.router, prefix="/health", tags=["Health & Probes"])

# AI Vision & Inference Services
api_router.include_router(detect.router, tags=["Detection"])
api_router.include_router(classify.router, tags=["Classification"])
api_router.include_router(diagnose.router, tags=["Diagnosis Pipeline"])

# Agronomic Advisory & RAG Services
api_router.include_router(rag.router, prefix="/rag", tags=["Agronomic Advisory (RAG)"])
