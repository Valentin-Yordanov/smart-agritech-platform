"""Ingestion script for Agronomic Knowledge Base into ChromaDB.

Processes markdown guides from data/agronomy/, chunks them into overlapping
semantic segments, generates dense vector embeddings via sentence-transformers,
and persists them into ChromaDB for low-latency RAG retrieval.
"""

import os
from pathlib import Path
import re
import sys
from typing import List, Dict, Any

# Add service root to sys.path to access app modules
SERVICE_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SERVICE_ROOT))

import chromadb
from sentence_transformers import SentenceTransformer
from app.core.config import get_settings
from app.core.logger import logger


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Chunks text into sliding character windows with overlap, respecting sentence boundaries where possible."""
    # Normalize whitespaces
    text = re.sub(r"\r\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()

    if len(text) <= chunk_size:
        return [text] if text else []

    chunks: List[str] = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + chunk_size, text_len)
        
        # If not at the end of the text, try to find a newline or sentence break near the end
        if end < text_len:
            last_newline = text.rfind("\n", start + chunk_size // 2, end)
            last_period = text.rfind(". ", start + chunk_size // 2, end)
            
            break_pt = max(last_newline, last_period)
            if break_pt > start:
                end = break_pt + (1 if break_pt == last_period else 0)

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        # Slide window
        start = max(start + 1, end - overlap)
        if start >= text_len or end == text_len:
            break

    return chunks


def ingest_agronomy_knowledge() -> None:
    """Reads markdown agronomic files, embeds them, and upserts into ChromaDB."""
    settings = get_settings()
    data_dir = SERVICE_ROOT / "data" / "agronomy"
    persist_dir = settings.CHROMA_PERSIST_DIR
    collection_name = settings.CHROMA_COLLECTION_NAME

    logger.info(f"Connecting to ChromaDB persistent storage at: {persist_dir}")
    os.makedirs(persist_dir, exist_ok=True)
    chroma_client = chromadb.PersistentClient(path=str(persist_dir))

    # Initialize or retrieve collection
    collection = chroma_client.get_or_create_collection(
        name=collection_name,
        metadata={"description": "Competition-grade agronomic advisory vector index"},
    )

    logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL_NAME}...")
    embedder = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)

    md_files = sorted(list(data_dir.glob("*.md")))
    if not md_files:
        logger.warning(f"No markdown documents found in {data_dir}!")
        return

    logger.info(f"Found {len(md_files)} knowledge guides to index.")

    total_chunks = 0
    for file_path in md_files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
        doc_title = title_match.group(1) if title_match else file_path.stem

        chunks = chunk_text(content, chunk_size=500, overlap=50)
        if not chunks:
            continue

        logger.info(f"Processing '{file_path.name}' -> {len(chunks)} chunks.")

        # Compute embeddings for chunks
        embeddings = embedder.encode(chunks, show_progress_bar=False, normalize_embeddings=True).tolist()

        ids = [f"{file_path.stem}_chunk_{i:03d}" for i in range(len(chunks))]
        metadatas = [
            {
                "source": file_path.name,
                "title": doc_title,
                "chunk_index": i,
                "total_chunks": len(chunks),
            }
            for i in range(len(chunks))
        ]

        collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=chunks,
            metadatas=metadatas,
        )
        total_chunks += len(chunks)

    count = collection.count()
    logger.info(f"Ingestion complete! Total indexed chunks in collection '{collection_name}': {count}")


if __name__ == "__main__":
    ingest_agronomy_knowledge()
