"""Agronomic Advisory (RAG) API Endpoint."""

import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.core.logger import logger
from app.services.attachments import AttachmentError, parse_attachments
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
        max_length=40,
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


class AttachmentResult(BaseModel):
    name: str
    kind: str
    mime: str
    status: str
    summary: str
    detection: Optional[Dict[str, Any]] = None


class AttachmentChatResponse(RAGChatResponse):
    model: str = Field(..., description="Groq model that produced the answer")
    fallback: bool = Field(..., description="True when images were sent but the text model answered")
    attachments: List[AttachmentResult]


def _json_form(raw: Optional[str], field: str, expected: type) -> Any:
    if raw is None or raw == "":
        return None
    try:
        value = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"'{field}' must be valid JSON.") from exc
    if not isinstance(value, expected):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"'{field}' has the wrong shape.")
    return value


@router.post(
    "/chat-with-attachments",
    response_model=AttachmentChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Agronomic advisory with image and document attachments",
)
async def chat_with_attachments(
    request: Request,
    message: str = Form(..., min_length=1, max_length=4000),
    history: Optional[str] = Form(None, max_length=200_000),
    diagnosis_context: Optional[str] = Form(None, max_length=2000),
    language: str = Form("en", pattern="^(en|bg)$"),
    files: Optional[List[UploadFile]] = File(None),
) -> AttachmentChatResponse:
    """Parses attachments safely, then answers with the vision or text model."""
    settings = get_settings()
    history_list = _json_form(history, "history", list) or []
    if len(history_list) > 40:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "History is limited to 40 turns.")
    diag = _json_form(diagnosis_context, "diagnosis_context", dict)

    files = files or []
    if len(files) > settings.ATTACHMENT_MAX_FILES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"At most {settings.ATTACHMENT_MAX_FILES} files per message.")

    raw_files: List[tuple[str, bytes]] = []
    for upload in files:
        data = await upload.read(settings.ATTACHMENT_MAX_BYTES + 1)
        name = (upload.filename or "file")[-200:]
        if len(data) > settings.ATTACHMENT_MAX_BYTES:
            raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"'{name}' is larger than 10 MB.")
        raw_files.append((name, data))

    pipeline = getattr(request.app.state, "pipeline", None)
    try:
        parsed = await run_in_threadpool(parse_attachments, raw_files, pipeline, settings)
    except AttachmentError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc

    engine = get_rag_engine()
    try:
        result = await run_in_threadpool(
            engine.generate_with_attachments,
            message,
            parsed,
            [h for h in history_list if isinstance(h, dict)],
            diag,
            language,
        )
    except Exception as exc:
        logger.error(f"Attachment advisory failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI advisor could not process this request right now.",
        ) from exc

    return AttachmentChatResponse(
        answer=result["answer"],
        sources=result["sources"],
        model=result["model"],
        fallback=result["fallback"],
        attachments=[AttachmentResult(**p.public()) for p in parsed],
    )
