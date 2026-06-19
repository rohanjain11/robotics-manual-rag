"""FastAPI backend for the robotics manual RAG chat application."""

import json
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, Field

# Ensure src/ is on the path when running via uvicorn
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import MANIFEST_PATH, OPENAI_API_KEY, CORS_ORIGINS
from generate import generate_answer_with_sources
from retrieve import get_pinecone_index


class ChatRequest(BaseModel):
    """Incoming chat message with optional retrieval filters."""

    message: str = Field(..., min_length=1)
    filter_document: str | None = None
    filter_documents: list[str] | None = None
    filter_section: str | None = None


class ChatResponse(BaseModel):
    """Chat response with answer, sources, and safety flag."""

    answer: str
    sources: list[dict[str, Any]]
    is_safety_related: bool


def _verify_openai() -> None:
    """Confirm OpenAI API is reachable."""
    client = OpenAI(api_key=OPENAI_API_KEY)
    client.models.list()


def _verify_pinecone() -> tuple[bool, int]:
    """Confirm Pinecone index is reachable and return vector count."""
    index = get_pinecone_index()
    stats = index.describe_index_stats()
    vector_count = stats.get("total_vector_count", 0)
    return True, vector_count


def _build_filter_dict(
    filter_document: str | None,
    filter_documents: list[str] | None,
    filter_section: str | None,
) -> dict[str, Any] | None:
    """Build a Pinecone metadata filter from request parameters."""
    filters: dict[str, Any] = {}

    doc_names: list[str] = []
    if filter_documents:
        doc_names = filter_documents
    elif filter_document:
        doc_names = [filter_document]

    if len(doc_names) == 1:
        filters["source_filename"] = doc_names[0]
    elif len(doc_names) > 1:
        filters["source_filename"] = {"$in": doc_names}

    if filter_section and filter_section.lower() != "all":
        filters["section_type"] = filter_section.lower()
    return filters or None


def _load_documents_from_manifest() -> list[str]:
    """Load document list from the ingestion manifest file."""
    if MANIFEST_PATH.exists():
        data = json.loads(MANIFEST_PATH.read_text())
        return data.get("documents", [])
    return []


def _load_documents_from_pinecone() -> list[str]:
    """Fallback: sample vectors from Pinecone to extract unique filenames."""
    index = get_pinecone_index()
    stats = index.describe_index_stats()
    namespaces = stats.get("namespaces") or {"": {}}
    filenames: set[str] = set()

    for namespace in namespaces:
        results = index.query(
            vector=[0.0] * 1536,
            top_k=100,
            include_metadata=True,
            namespace=namespace if namespace else None,
        )
        for match in results.get("matches", []):
            metadata = match.get("metadata") or {}
            if "source_filename" in metadata:
                filenames.add(metadata["source_filename"])

    return sorted(filenames)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: verify Pinecone and OpenAI connectivity; fail fast on error."""
    try:
        _verify_openai()
        connected, count = _verify_pinecone()
        app.state.pinecone_connected = connected
        app.state.vector_count = count
    except Exception as exc:
        raise RuntimeError(
            f"Startup health check failed. Verify your .env keys and that "
            f"you have run ingest.py first. Error: {exc}"
        ) from exc
    yield


app = FastAPI(
    title="RoboDocs RAG API",
    description="RAG pipeline for robotics technical manual Q&A",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Return API health status including Pinecone connectivity."""
    try:
        connected, count = _verify_pinecone()
        return {
            "status": "ok",
            "pinecone_connected": connected,
            "vector_count": count,
        }
    except Exception:
        return {
            "status": "degraded",
            "pinecone_connected": False,
            "vector_count": 0,
        }


@app.get("/documents")
def list_documents():
    """Return unique source filenames available in the index."""
    documents = _load_documents_from_manifest()
    if not documents:
        try:
            documents = _load_documents_from_pinecone()
        except Exception as exc:
            raise HTTPException(
                status_code=503,
                detail=f"Could not load documents: {exc}",
            ) from exc
    return {"documents": documents}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    """Answer a question using retrieved manual content."""
    filter_dict = _build_filter_dict(
        request.filter_document,
        request.filter_documents,
        request.filter_section,
    )
    try:
        result = generate_answer_with_sources(
            query=request.message,
            filter_dict=filter_dict,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return ChatResponse(
        answer=result["answer"],
        sources=result["sources"],
        is_safety_related=result["is_safety_related"],
    )
