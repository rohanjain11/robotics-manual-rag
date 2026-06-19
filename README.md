# RoboDocs — Robotics Manual RAG

[![Live Demo](https://img.shields.io/badge/demo-live-5B7FA6?style=flat-square)](https://rohanjain11.github.io/robotics-manual-rag/)
[![API](https://img.shields.io/badge/API-Render-46E3B7?style=flat-square)](https://robodocs-api.onrender.com/health)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

A retrieval-augmented generation (RAG) app for question-answering over robotics technical manuals. Ask about setup, operation, maintenance, safety, or troubleshooting — get answers grounded in indexed PDFs with source citations (document + page).

**Live demo:** [rohanjain11.github.io/robotics-manual-rag](https://rohanjain11.github.io/robotics-manual-rag/)  
**API:** [robodocs-api.onrender.com](https://robodocs-api.onrender.com)  
**Repo:** [github.com/rohanjain11/robotics-manual-rag](https://github.com/rohanjain11/robotics-manual-rag)

## Architecture

```
PDF Manuals → pdfplumber → Chunking → OpenAI Embeddings → Pinecone
                                                              ↓
User Question → Embed Query → Pinecone Retrieval → GPT-4o-mini → Cited Answer
```

| Layer | Stack |
|-------|--------|
| Backend | Python 3.11+, FastAPI, OpenAI, Pinecone, pdfplumber |
| Frontend | React 18, Vite, Tailwind CSS, framer-motion |
| Vector DB | Pinecone serverless |
| Hosting | GitHub Pages (UI) + Render (API) |

## Features

- Natural-language Q&A with inline source citations
- Filter by **document** (one or more PDFs) or **section type** (safety, installation, maintenance, troubleshooting, general)
- Safety-related answers highlighted with an amber callout
- Honest fallback when the manuals do not contain enough information
- Industrial UI with animated wireframe background

## Indexed content

10 Universal Robots manuals (~3,870 chunks) including UR5e, UR10, e-Series service/software guides, and script tutorials. PDFs are in `backend/data/documents/`.

---

## Quick start (local)

### Prerequisites

- Python 3.11+ (tested on 3.13)
- Node.js 18+
- [OpenAI API key](https://platform.openai.com/api-keys)
- [Pinecone API key](https://app.pinecone.io/)

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # add your keys
python src/ingest.py   # skip if index already populated
uvicorn src.api:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api/*` → `http://localhost:8000`.

Optional eval:

```bash
cd backend && python src/evaluate.py
```

---

## Deployment

Production is split across two free-tier hosts. Vectors live in Pinecone — ingest once locally, then deploy.

| Service | URL | Role |
|---------|-----|------|
| **Frontend** | https://rohanjain11.github.io/robotics-manual-rag/ | React static site (GitHub Pages) |
| **API** | https://robodocs-api.onrender.com | FastAPI backend (Render) |

### Backend — Render

1. [Render Dashboard](https://dashboard.render.com/) → **New → Blueprint** → connect this repo
2. `render.yaml` configures the `robodocs-api` web service automatically
3. Set environment variables:

```
OPENAI_API_KEY=...
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=robotics-manual-rag
CORS_ORIGINS=https://rohanjain11.github.io
```

Verify:

```bash
curl https://robodocs-api.onrender.com/health
curl https://robodocs-api.onrender.com/documents
```

> Render free tier spins down after inactivity. First request after idle may take 30–60 seconds.

### Frontend — GitHub Pages

1. **Settings → Pages → Source:** GitHub Actions
2. **Settings → Secrets → Actions:** add `VITE_API_URL` = `https://robodocs-api.onrender.com`
3. Push to `main` — `.github/workflows/deploy-pages.yml` builds and deploys

To redeploy after changing the API URL:

```bash
git commit --allow-empty -m "Rebuild frontend"
git push
```

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Embeddings + chat |
| `PINECONE_API_KEY` | Yes | Vector search |
| `PINECONE_INDEX_NAME` | Yes | `robotics-manual-rag` |
| `CORS_ORIGINS` | Prod | `http://localhost:5173,https://rohanjain11.github.io` |

### Frontend (`frontend/.env` / GitHub secret)

| Variable | Local | Production |
|----------|-------|------------|
| `VITE_API_URL` | unset (uses `/api` proxy) | `https://robodocs-api.onrender.com` |
| `VITE_BASE_PATH` | `/` | `/robotics-manual-rag/` |

---

## API reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/chat` | Ask a question with optional filters |
| `GET` | `/documents` | List indexed document filenames |
| `GET` | `/health` | Health check + Pinecone status |

### POST /chat

```json
{
  "message": "What is the emergency stop procedure?",
  "filter_documents": ["UR5e_User_Manual_en_Global.pdf"],
  "filter_section": "safety"
}
```

```json
{
  "answer": "...",
  "sources": [{ "document": "...", "page": 12, "excerpt": "..." }],
  "is_safety_related": true
}
```

---

## Project structure

```
robotics-manual-rag/
├── render.yaml                    # Render Blueprint
├── .github/workflows/
│   └── deploy-pages.yml           # GitHub Pages CI
├── backend/
│   ├── src/
│   │   ├── config.py              # Env and constants
│   │   ├── ingest.py              # PDF → Pinecone
│   │   ├── retrieve.py            # Vector search + filter enforcement
│   │   ├── generate.py            # GPT-4o-mini answers
│   │   ├── api.py                 # FastAPI routes
│   │   └── evaluate.py            # Manual eval script
│   ├── data/documents/            # UR manual PDFs
│   └── artifacts/                 # Manifest, eval output (gitignored)
└── frontend/
    ├── src/
    │   ├── config.js              # API_BASE / apiUrl()
    │   └── components/            # Chat UI
    └── vite.config.js             # base path + dev proxy
```

---

## Filters

**Document filter** — limits retrieval to selected PDF filenames.

**Section filter** — limits to chunks tagged at ingest by keyword heuristics:

| Section | Typical content |
|---------|-----------------|
| `safety` | E-stop, warnings, protective equipment |
| `installation` | Mounting, wiring, commissioning |
| `maintenance` | Lubrication, inspection, replacement |
| `troubleshooting` | Error codes, diagnostics |
| `general` | Everything else |

Section filters can return chunks from multiple manuals if they share that section type.

---

## Cost estimate

| Operation | Approximate cost |
|-----------|------------------|
| Ingest ~10 PDFs | < $0.50 (embeddings) |
| Per chat query | < $0.01 (gpt-4o-mini) |
| Pinecone serverless | Free tier for small indexes |
| Render + GitHub Pages | Free tiers |

Set an OpenAI spending limit in your dashboard to cap usage.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS error in browser | Set `CORS_ORIGINS=https://rohanjain11.github.io` on Render |
| Blank page on GitHub Pages | Confirm Pages source is **GitHub Actions**; `VITE_BASE_PATH=/robotics-manual-rag/` |
| API timeout on first request | Render cold start — wait ~60s and retry |
| No documents in sidebar | Run `ingest.py`; `/documents` falls back to Pinecone if manifest is missing |
| GitHub Actions build fails | Enable Pages under **Settings → Pages → GitHub Actions** first |
| Chat works locally, not in prod | Check `VITE_API_URL` secret and redeploy frontend |

---

## License

MIT — use and adapt freely for learning and portfolio projects.
