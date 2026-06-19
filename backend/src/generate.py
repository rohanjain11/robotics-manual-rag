"""Answer generation using retrieved manual context and OpenAI chat."""

import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))

from openai import OpenAI

from config import CHAT_MODEL, DOMAIN_NAME, OPENAI_API_KEY, TOP_K
from retrieve import format_context_for_prompt, retrieve_relevant_chunks

SAFETY_KEYWORDS = ("safety", "emergency", "stop", "hazard", "danger", "warning")

_client = OpenAI(api_key=OPENAI_API_KEY)


def is_safety_related_query(query: str) -> bool:
    """Detect whether a query relates to safety procedures or hazards."""
    query_lower = query.lower()
    return any(keyword in query_lower for keyword in SAFETY_KEYWORDS)


def build_system_prompt() -> str:
    """Build the system prompt for the robotics documentation assistant."""
    return f"""You are a specialized assistant for {DOMAIN_NAME}. Your role is to help \
operators, technicians, and engineers find accurate information from robot operation \
manuals, maintenance guides, safety procedures, and troubleshooting documentation.

STRICT RULES:
1. Answer ONLY using the provided context excerpts from the manuals. Do not use outside \
knowledge or guess.
2. If the provided context does not contain enough information to answer the question, \
respond with exactly: "I don't have enough information in the provided manuals to answer \
this."
3. For EVERY factual claim in your answer, cite the source document name and page number \
in parentheses, e.g. (UR5_manual.pdf, page 12).
4. If the question relates to safety procedures, emergency stops, hazards, or warnings, \
begin your answer with: "⚠️ SAFETY NOTICE: Always follow your organization's lockout/tagout \
procedures and manufacturer guidelines. The following is from the manual documentation:"
5. Be concise, technical, and precise. Use bullet points for multi-step procedures.
6. Do not invent part numbers, torque values, or specifications not present in the context."""


def generate_answer(query: str, retrieved_chunks: list[dict]) -> str:
    """Generate an answer grounded in retrieved manual chunks.

    Args:
        query: User's natural language question.
        retrieved_chunks: Chunks retrieved from Pinecone.

    Returns:
        Generated answer string.
    """
    context = format_context_for_prompt(retrieved_chunks)
    safety_flag = is_safety_related_query(query)

    user_content = f"""Context from robotics manuals:
{context}

Question: {query}

Answer based only on the context above. Cite sources for every claim."""

    response = _client.chat.completions.create(
        model=CHAT_MODEL,
        messages=[
            {"role": "system", "content": build_system_prompt()},
            {"role": "user", "content": user_content},
        ],
        temperature=0.1,
    )
    answer = response.choices[0].message.content or ""
    return answer.strip()


def _extract_unique_sources(chunks: list[dict]) -> list[dict]:
    """Extract unique source filename + page pairs from retrieved chunks."""
    seen: set[tuple[str, int]] = set()
    sources: list[dict] = []
    for chunk in chunks:
        key = (chunk["source_filename"], chunk["page_number"])
        if key not in seen:
            seen.add(key)
            sources.append(
                {
                    "source_filename": chunk["source_filename"],
                    "page_number": chunk["page_number"],
                    "section_type": chunk.get("section_type", "general"),
                    "chunk_text": chunk.get("chunk_text", ""),
                }
            )
    return sources


def generate_answer_with_sources(
    query: str,
    top_k: int = TOP_K,
    filter_dict: dict[str, Any] | None = None,
) -> dict:
    """Full RAG pipeline: retrieve chunks, generate answer, return structured result.

    Args:
        query: User's natural language question.
        top_k: Number of chunks to retrieve.
        filter_dict: Optional Pinecone metadata filter.

    Returns:
        Dict with answer, sources, retrieved_chunks, and is_safety_related flag.
    """
    safety_related = is_safety_related_query(query)
    retrieved_chunks = retrieve_relevant_chunks(query, top_k=top_k, filter_dict=filter_dict)
    answer = generate_answer(query, retrieved_chunks)
    sources = _extract_unique_sources(retrieved_chunks)

    return {
        "answer": answer,
        "sources": sources,
        "retrieved_chunks": retrieved_chunks,
        "is_safety_related": safety_related,
    }
