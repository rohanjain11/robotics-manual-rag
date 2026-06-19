"""Pinecone retrieval utilities for the robotics manual RAG pipeline."""

import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))

from langchain_openai import OpenAIEmbeddings
from pinecone import Pinecone

from config import EMBEDDING_MODEL, OPENAI_API_KEY, PINECONE_API_KEY, PINECONE_INDEX_NAME, TOP_K


def get_pinecone_index():
    """Connect to the existing Pinecone index and return the index object.

    Returns:
        Pinecone Index instance.

    Raises:
        ConnectionError: If the index cannot be reached.
    """
    try:
        pc = Pinecone(api_key=PINECONE_API_KEY)
        return pc.Index(PINECONE_INDEX_NAME)
    except Exception as exc:
        raise ConnectionError(
            f"Failed to connect to Pinecone index '{PINECONE_INDEX_NAME}': {exc}"
        ) from exc


def _enforce_metadata_filter(
    chunks: list[dict], filter_dict: dict[str, Any] | None
) -> list[dict]:
    """Re-apply metadata filters locally so results always match requested scope."""
    if not filter_dict or not chunks:
        return chunks

    filtered = chunks

    filename_filter = filter_dict.get("source_filename")
    if filename_filter is not None:
        if isinstance(filename_filter, dict) and "$in" in filename_filter:
            allowed = set(filename_filter["$in"])
            filtered = [c for c in filtered if c["source_filename"] in allowed]
        else:
            filtered = [c for c in filtered if c["source_filename"] == filename_filter]

    section_filter = filter_dict.get("section_type")
    if section_filter is not None:
        filtered = [c for c in filtered if c["section_type"] == section_filter]

    return filtered


def retrieve_relevant_chunks(
    query: str,
    top_k: int = TOP_K,
    filter_dict: dict[str, Any] | None = None,
) -> list[dict]:
    """Embed a query and retrieve the most similar chunks from Pinecone.

    Args:
        query: Natural language question from the user.
        top_k: Number of chunks to retrieve.
        filter_dict: Optional Pinecone metadata filter, e.g.
            {"source_filename": "UR5_manual.pdf"} or {"section_type": "safety"}.

    Returns:
        List of dicts with chunk_text, source_filename, page_number,
        section_type, score, and chunk_index.
    """
    embeddings = OpenAIEmbeddings(
        model=EMBEDDING_MODEL,
        openai_api_key=OPENAI_API_KEY,
    )
    query_vector = embeddings.embed_query(query)

    index = get_pinecone_index()
    results = index.query(
        vector=query_vector,
        top_k=top_k,
        include_metadata=True,
        filter=filter_dict,
    )

    chunks: list[dict] = []
    for match in results.get("matches", []):
        metadata = match.get("metadata") or {}
        chunks.append(
            {
                "chunk_text": metadata.get("chunk_text", ""),
                "source_filename": metadata.get("source_filename", "unknown"),
                "page_number": metadata.get("page_number", 0),
                "section_type": metadata.get("section_type", "general"),
                "chunk_index": metadata.get("chunk_index", 0),
                "score": match.get("score", 0.0),
            }
        )
    return _enforce_metadata_filter(chunks, filter_dict)


def format_context_for_prompt(retrieved_chunks: list[dict]) -> str:
    """Format retrieved chunks into a context string with source citations.

    Args:
        retrieved_chunks: Output from retrieve_relevant_chunks().

    Returns:
        Formatted context string for the LLM prompt.
    """
    if not retrieved_chunks:
        return "No relevant manual content was retrieved."

    sections: list[str] = []
    for i, chunk in enumerate(retrieved_chunks, start=1):
        section_label = chunk["section_type"].replace("_", " ").title()
        citation = (
            f"[Source: {chunk['source_filename']}, page {chunk['page_number']}, "
            f"{section_label} section]"
        )
        sections.append(f"--- Excerpt {i} {citation} ---\n{chunk['chunk_text']}")

    return "\n\n".join(sections)
