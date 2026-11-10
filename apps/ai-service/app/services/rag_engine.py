"""Agronomic Advisory RAG Engine using ChromaDB and Groq LLM.

Combines dense vector retrieval from persistent ChromaDB with Groq's high-throughput
Llama-3.1-8b inference to deliver authoritative, clinically-accurate agronomic advice.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import os

import chromadb
from groq import Groq
from sentence_transformers import SentenceTransformer

from app.core.config import Settings, get_settings
from app.core.logger import logger


class RAGEngine:
    """Retrieval-Augmented Generation engine for plant pathology & agronomy advice."""

    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()
        self._embedder: Optional[SentenceTransformer] = None
        self._chroma_client: Optional[chromadb.PersistentClient] = None
        self._collection = None
        self._groq_client: Optional[Groq] = None

    @property
    def embedder(self) -> SentenceTransformer:
        """Lazy loader for SentenceTransformer to optimize memory and cold start."""
        if self._embedder is None:
            logger.info(f"Initializing embedding model: {self.settings.EMBEDDING_MODEL_NAME}")
            self._embedder = SentenceTransformer(self.settings.EMBEDDING_MODEL_NAME)
        return self._embedder

    @property
    def chroma_collection(self):
        """Lazy loader for ChromaDB collection."""
        if self._collection is None:
            persist_dir = str(self.settings.CHROMA_PERSIST_DIR)
            os.makedirs(persist_dir, exist_ok=True)
            self._chroma_client = chromadb.PersistentClient(path=persist_dir)
            self._collection = self._chroma_client.get_or_create_collection(
                name=self.settings.CHROMA_COLLECTION_NAME
            )
        return self._collection

    @property
    def groq_client(self) -> Groq:
        """Lazy loader for Groq API client."""
        if self._groq_client is None:
            api_key = self.settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")
            if not api_key:
                logger.warning("GROQ_API_KEY is not set in environment or config.")
            self._groq_client = Groq(api_key=api_key)
        return self._groq_client

    def retrieve_context(self, query: str, top_k: Optional[int] = None) -> List[Dict[str, Any]]:
        """Queries ChromaDB collection for the top-k nearest semantic chunks."""
        k = top_k or self.settings.RAG_TOP_K
        try:
            collection = self.chroma_collection
            if collection.count() == 0:
                logger.warning("ChromaDB agronomy collection is empty. Run ingest_knowledge.py first.")
                return []

            # Compute normalized embedding
            query_embedding = self.embedder.encode([query], normalize_embeddings=True).tolist()

            results = collection.query(
                query_embeddings=query_embedding,
                n_results=min(k, collection.count()),
                include=["documents", "metadatas", "distances"],
            )

            retrieved: List[Dict[str, Any]] = []
            if results and results.get("documents") and results["documents"][0]:
                docs = results["documents"][0]
                metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
                distances = results["distances"][0] if results.get("distances") else [0.0] * len(docs)

                for doc, meta, dist in zip(docs, metas, distances):
                    retrieved.append({
                        "content": doc,
                        "source": meta.get("source", "Agronomy Guide"),
                        "title": meta.get("title", "Agronomic Knowledge"),
                        "distance": dist,
                    })

            return retrieved
        except Exception as exc:
            logger.error(f"Error querying ChromaDB vector store: {exc}", exc_info=True)
            return []

    def generate_advisory(
        self,
        query: str,
        history: Optional[List[Dict[str, str]]] = None,
        diagnosis_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Synthesizes context-grounded agronomic advice using Groq Llama-3.1."""
        history = history or []

        # Formulate search query incorporating diagnostic signals if available
        search_query = query
        if diagnosis_context:
            crop = diagnosis_context.get("crop") or diagnosis_context.get("species")
            disease = diagnosis_context.get("disease")
            if crop or disease:
                search_query = f"{crop or ''} {disease or ''}: {query}".strip()

        # Retrieve relevant semantic context
        context_chunks = self.retrieve_context(search_query)

        # Build context prompt
        formatted_context = ""
        sources: List[str] = []
        for i, chunk in enumerate(context_chunks, 1):
            src = chunk.get("source", "Reference")
            if src not in sources:
                sources.append(src)
            formatted_context += f"--- Source [{i}]: {src} ---\n{chunk.get('content', '')}\n\n"

        # Diagnostic metadata header if present
        diag_str = ""
        if diagnosis_context:
            diag_str = (
                f"Active Vision Diagnosis Context:\n"
                f"- Crop / Species: {diagnosis_context.get('crop', 'Unknown')}\n"
                f"- Detected Pathogen/Condition: {diagnosis_context.get('disease', 'Unknown')}\n"
                f"- Classification Confidence: {float(diagnosis_context.get('confidence', 0.0)):.1%}\n\n"
            )

        system_prompt = (
            "You are a Senior Agronomist, Plant Pathologist, and Agricultural Extension Specialist "
            "advising farmers and agronomists within the Smart AgriTech platform.\n\n"
            "Your guidance must be scientifically accurate, pragmatic, and directly actionable.\n"
            "Structure your answer with clear markdown headings:\n"
            "### 🌾 Clinical Assessment & Identification\n"
            "### 🛡️ Recommended Intervention (Cultural, Biological & Chemical)\n"
            "### ⚠️ Safety Precautions & Pre-Harvest Interval (PHI)\n"
            "### 🔄 Preventive & Soil Management\n\n"
            "Ground your answer in the provided agronomic reference material. If active ingredients "
            "or FRAC/IRAC groups are mentioned, specify them clearly to prevent resistance buildup.\n\n"
            f"{diag_str}"
            f"Verified Agronomic Knowledge Base Context:\n"
            f"{formatted_context if formatted_context else 'No specific guide found. Provide general expert agronomic principles.'}"
        )

        messages: List[Dict[str, str]] = [
            {"role": "system", "content": system_prompt}
        ]

        # Multi-turn history (filter valid roles: 'user', 'assistant')
        for msg in history:
            role = msg.get("role")
            content = msg.get("content")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

        # Append current user prompt
        messages.append({"role": "user", "content": query})

        try:
            response = self.groq_client.chat.completions.create(
                model=self.settings.GROQ_MODEL,
                messages=messages,
                temperature=0.2,
                max_tokens=1024,
            )
            answer = response.choices[0].message.content or "No response generated."
            return {
                "answer": answer,
                "sources": sources,
            }
        except Exception as exc:
            logger.error(f"Error calling Groq API: {exc}", exc_info=True)
            return {
                "answer": (
                    f"⚠️ An error occurred while consulting the agronomic AI advisor: {str(exc)}. "
                    "Please ensure GROQ_API_KEY is configured and Groq Cloud service is operational."
                ),
                "sources": sources,
            }


# Global singleton instance
_rag_engine_instance: Optional[RAGEngine] = None


def get_rag_engine() -> RAGEngine:
    """Returns the singleton RAG engine instance."""
    global _rag_engine_instance
    if _rag_engine_instance is None:
        _rag_engine_instance = RAGEngine()
    return _rag_engine_instance
