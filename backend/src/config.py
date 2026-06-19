"""Configuration loader for the robotics manual RAG pipeline."""

import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = BACKEND_ROOT / ".env"

load_dotenv(ENV_PATH)

_REQUIRED_VARS = ("OPENAI_API_KEY", "PINECONE_API_KEY", "PINECONE_INDEX_NAME")

for _var in _REQUIRED_VARS:
    if not os.getenv(_var):
        raise EnvironmentError(
            f"Missing required environment variable: {_var}. "
            f"Copy backend/.env.example to backend/.env and fill in your keys."
        )

OPENAI_API_KEY: str = os.environ["OPENAI_API_KEY"]
PINECONE_API_KEY: str = os.environ["PINECONE_API_KEY"]
PINECONE_INDEX_NAME: str = os.environ["PINECONE_INDEX_NAME"]

_cors_raw = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)
CORS_ORIGINS: list[str] = [origin.strip() for origin in _cors_raw.split(",") if origin.strip()]

CHUNK_SIZE: int = 800
CHUNK_OVERLAP: int = 150
EMBEDDING_MODEL: str = "text-embedding-3-small"
CHAT_MODEL: str = "gpt-4o-mini"
TOP_K: int = 5
DOMAIN_NAME: str = "robotics technical manuals"

DOCUMENTS_DIR = BACKEND_ROOT / "data" / "documents"
ARTIFACTS_DIR = BACKEND_ROOT / "artifacts"
MANIFEST_PATH = ARTIFACTS_DIR / "document_manifest.json"
