"""PDF ingestion, chunking, embedding, and Pinecone upsert pipeline."""

import json
import re
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import pdfplumber
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from pinecone import Pinecone, ServerlessSpec

from config import (
    ARTIFACTS_DIR,
    CHUNK_OVERLAP,
    CHUNK_SIZE,
    DOCUMENTS_DIR,
    EMBEDDING_MODEL,
    MANIFEST_PATH,
    OPENAI_API_KEY,
    PINECONE_API_KEY,
    PINECONE_INDEX_NAME,
)

SECTION_PATTERNS: dict[str, re.Pattern] = {
    "safety": re.compile(r"\b(safety|emergency|hazard|warning|caution|danger)\b", re.I),
    "maintenance": re.compile(r"\b(maintenance|service|inspection|lubrication|calibration)\b", re.I),
    "troubleshooting": re.compile(r"\b(troubleshoot(ing)?|fault|error|diagnos(is|e)|problem)\b", re.I),
    "installation": re.compile(r"\b(install(ation|ation)?|setup|mounting|commissioning|assembly)\b", re.I),
}

BATCH_SIZE = 100
EMBEDDING_DIMENSION = 1536


def load_pdfs(directory_path: Path | str) -> list[dict]:
    """Extract text from every PDF in the given directory.

    Args:
        directory_path: Path to the folder containing PDF files.

    Returns:
        List of dicts with keys: text, source_filename, page_number.
    """
    directory = Path(directory_path)
    if not directory.exists():
        raise FileNotFoundError(f"Documents directory not found: {directory}")

    pdf_files = sorted(directory.glob("*.pdf"))
    if not pdf_files:
        raise FileNotFoundError(
            f"No PDF files found in {directory}. "
            "Place robotics manual PDFs in backend/data/documents/ before running ingest."
        )

    documents: list[dict] = []
    for pdf_path in pdf_files:
        with pdfplumber.open(pdf_path) as pdf:
            for page_idx, page in enumerate(pdf.pages, start=1):
                text = page.extract_text() or ""
                text = text.strip()
                if text:
                    documents.append(
                        {
                            "text": text,
                            "source_filename": pdf_path.name,
                            "page_number": page_idx,
                        }
                    )
    return documents


def _guess_section_type(text: str) -> str:
    """Guess section type from nearby text using header keyword patterns."""
    window = text[:400]
    for section_type, pattern in SECTION_PATTERNS.items():
        if pattern.search(window):
            return section_type
    return "general"


def chunk_documents(documents: list[dict]) -> list[dict]:
    """Split documents into overlapping chunks with metadata preserved.

    Args:
        documents: Output from load_pdfs().

    Returns:
        List of chunk dicts with text and metadata fields.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
    )

    chunks: list[dict] = []
    chunk_counter: Counter[str] = Counter()

    for doc in documents:
        splits = splitter.split_text(doc["text"])
        for split in splits:
            section_type = _guess_section_type(split)
            chunk_index = chunk_counter[doc["source_filename"]]
            chunk_counter[doc["source_filename"]] += 1
            chunks.append(
                {
                    "text": split,
                    "source_filename": doc["source_filename"],
                    "page_number": doc["page_number"],
                    "chunk_index": chunk_index,
                    "section_type": section_type,
                }
            )
    return chunks


def create_pinecone_index_if_not_exists() -> None:
    """Create a serverless Pinecone index if it does not already exist."""
    pc = Pinecone(api_key=PINECONE_API_KEY)
    existing = {idx.name for idx in pc.list_indexes()}
    if PINECONE_INDEX_NAME not in existing:
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=EMBEDDING_DIMENSION,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
        print(f"Created Pinecone index: {PINECONE_INDEX_NAME}")


def embed_and_upsert(chunks: list[dict]) -> int:
    """Generate embeddings and upsert chunks to Pinecone in batches.

    Args:
        chunks: Chunk dicts from chunk_documents().

    Returns:
        Total number of vectors upserted.
    """
    create_pinecone_index_if_not_exists()

    embeddings = OpenAIEmbeddings(
        model=EMBEDDING_MODEL,
        openai_api_key=OPENAI_API_KEY,
    )
    pc = Pinecone(api_key=PINECONE_API_KEY)
    index = pc.Index(PINECONE_INDEX_NAME)

    total_upserted = 0
    for batch_start in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[batch_start : batch_start + BATCH_SIZE]
        texts = [c["text"] for c in batch]
        vectors_embedded = embeddings.embed_documents(texts)

        vectors = []
        for i, (chunk, vector) in enumerate(zip(batch, vectors_embedded)):
            vector_id = f"{chunk['source_filename']}_p{chunk['page_number']}_c{chunk['chunk_index']}"
            vectors.append(
                {
                    "id": vector_id,
                    "values": vector,
                    "metadata": {
                        "source_filename": chunk["source_filename"],
                        "page_number": chunk["page_number"],
                        "section_type": chunk["section_type"],
                        "chunk_index": chunk["chunk_index"],
                        "chunk_text": chunk["text"][:500],
                    },
                }
            )

        index.upsert(vectors=vectors)
        total_upserted += len(vectors)

    return total_upserted


def _write_document_manifest(chunks: list[dict]) -> None:
    """Persist unique source filenames for the /documents API endpoint."""
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    filenames = sorted({c["source_filename"] for c in chunks})
    manifest = {"documents": filenames, "total_chunks": len(chunks)}
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2))


def main() -> None:
    """Run the full ingestion pipeline and print a summary."""
    print(f"Loading PDFs from {DOCUMENTS_DIR}...")
    documents = load_pdfs(DOCUMENTS_DIR)
    pdf_count = len({d["source_filename"] for d in documents})
    print(f"  PDFs processed: {pdf_count}")
    print(f"  Pages extracted: {len(documents)}")

    print("Chunking documents...")
    chunks = chunk_documents(documents)
    print(f"  Chunks created: {len(chunks)}")

    section_breakdown = Counter(c["section_type"] for c in chunks)
    print("  Breakdown by section_type:")
    for section_type, count in sorted(section_breakdown.items()):
        print(f"    {section_type}: {count}")

    print("Embedding and upserting to Pinecone...")
    upserted = embed_and_upsert(chunks)
    print(f"  Vectors upserted: {upserted}")

    _write_document_manifest(chunks)
    print(f"Document manifest written to {MANIFEST_PATH}")
    print("Ingestion complete.")


if __name__ == "__main__":
    main()
