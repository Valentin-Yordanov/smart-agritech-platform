"""Agronomic Advisory (RAG) API Endpoint."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.core.logger import logger
from app.services.rag_engine import get_rag_engine

router = APIRouter()


class RAGChatRequest(BaseModel):
    """Payload for conversational agronomic advisory query."""

    query: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="Farmer or agronomist question regarding symptoms, treatments, or soil",
        examples=["How do I treat early blight on my tomato crop organically?"],
    )
    history: List[Dict[str, str]] = Field(
        default_factory=list,
        description="Prior conversation turns in format [{'role': 'user'|'assistant', 'content': str}]",
    )
    diagnosis_context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Contextual vision diagnosis results: {'crop': str, 'disease': str, 'confidence': float}",
    )


class RAGChatResponse(BaseModel):
    """Response payload containing LLM answer and grounded reference sources."""

    answer: str = Field(..., description="Context-grounded agronomic recommendation")
    sources: List[str] = Field(..., description="Referenced agronomic guide source files")


@router.post(
    "/chat",
    response_model=RAGChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Agronomic Advisory & Treatment Recommendation",
    description=(
        "Retrieves nearest semantic context chunks from persistent ChromaDB and prompts "
        "Groq Llama-3.1-8b to provide clinical-grade diagnosis and treatment recommendations."
    ),
)
async def chat_agronomic_advisory(request: RAGChatRequest) -> RAGChatResponse:
    """Handles farmer question and returns RAG-synthesized agronomic advisory."""
    try:
        engine = get_rag_engine()
        result = engine.generate_advisory(
            query=request.query,
            history=request.history,
            diagnosis_context=request.diagnosis_context,
        )
        return RAGChatResponse(
            answer=result["answer"],
            sources=result["sources"],
        )
    except Exception as exc:
        logger.error(f"Error executing RAG advisory pipeline: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate agronomic advisory: {str(exc)}",
        )
