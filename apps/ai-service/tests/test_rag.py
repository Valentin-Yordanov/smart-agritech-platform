"""Unit and integration test for RAG engine and ChromaDB retrieval."""

import pytest
from app.services.rag_engine import RAGEngine
from app.core.config import get_settings


def test_chroma_retrieval():
    """Verify semantic retrieval returns relevant documents for early blight."""
    engine = RAGEngine(settings=get_settings())
    chunks = engine.retrieve_context("target spots concentric rings tomato", top_k=2)
    assert len(chunks) > 0
    assert any("tomato_early_blight" in c["source"] for c in chunks)


def test_rag_generation_mock():
    """Verify generate_advisory produces answer with sources."""
    engine = RAGEngine(settings=get_settings())
    result = engine.generate_advisory(
        query="What are the symptoms and biological controls for tomato early blight?",
        diagnosis_context={"crop": "Tomato", "disease": "Early Blight", "confidence": 0.95},
    )
    assert "answer" in result
    assert len(result["answer"]) > 50
    assert "sources" in result
    assert len(result["sources"]) > 0
