# RoboDocs — Robotics Manual RAG

A retrieval-augmented generation (RAG) app for question-answering over robotics technical manuals. Ask about setup, operation, maintenance, safety, or troubleshooting and get answers grounded in indexed PDFs, with source citations (document + page).

**Live demo:** `https://YOUR_GITHUB_USERNAME.github.io/robotics-manual-rag/` (frontend) · `https://YOUR-RENDER-URL.onrender.com` (API)

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
| Vector DB | Pinecone serverless (free tier) |

## Features

- Natural-language Q&A with inline source citations
- Filter by **document** (one or more PDFs) or **section type** (safety, installation, maintenance, troubleshooting, general)
- Safety-related answers highlighted with an amber callout
- Honest fallback when the manuals do not contain enough information
- Industrial UI with animated wireframe background

## Prerequisites

- Python 3.11+ (tested on 3.13)
- Node.js 18+
- [OpenAI API key](https://platform.openai.com/api-keys)
- [Pinecone API key](https://app.pinecone.io/) (serverless index)
- Robotics manual PDFs in `backend/data/documents/`

---

## Local development

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
```

Place PDFs in `backend/data/documents/`, then ingest:

```bash
python src/ingest.py
```

This extracts text, chunks pages, embeds with `text-embedding-3-small`, and upserts to Pinecone. Expect roughly **$0.50 or less** for ~10 PDFs.

Optional — run the 10-question eval script:

```bash
python src/evaluate.py
```

Start the API:

```bash
uvicorn src.api:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # optional; defaults work for local dev
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api/*` to `http://localhost:8000`.

---

## Deployment

The app splits across two hosts:

| Service | Host | Role |
|---------|------|------|
| API | **Render** | FastAPI backend (chat, documents, health) |
| UI | **GitHub Pages** | Static React build |

Vectors live in **Pinecone** — you only ingest once locally (or on any machine with the PDFs). The Render service does not need the PDF files at runtime.

### Step 1 — Ingest locally (one time)

```bash
cd backend
python src/ingest.py
```

Confirm your Pinecone index `robotics-manual-rag` has vectors before deploying.

### Step 2 — Deploy backend on Render

**Option A — Blueprint (recommended)**

1. Push this repo to GitHub.
2. In [Render](https://dashboard.render.com/), click **New → Blueprint** and connect the repo.
3. Render reads `render.yaml` at the repo root.
4. Set these secrets in the Render dashboard when prompted:
   - `OPENAI_API_KEY`
   - `PINECONE_API_KEY`
   - `CORS_ORIGINS` — e.g. `https://YOUR_GITHUB_USERNAME.github.io` (comma-separated if you have multiple origins)

**Option B — Manual web service**

| Setting | Value |
|---------|--------|
| Root directory | `backend` |
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn src.api:app --host 0.0.0.0 --port $PORT` |
| Python version | 3.11 |

Environment variables:

```
OPENAI_API_KEY=...
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=robotics-manual-rag
CORS_ORIGINS=https://YOUR_GITHUB_USERNAME.github.io
```

After deploy, note your API URL, e.g. `https://robodocs-api.onrender.com`.

Verify:

```bash
curl https://YOUR-RENDER-URL.onrender.com/health
curl https://YOUR-RENDER-URL.onrender.com/documents
```

> **Free tier cold starts:** Render free instances spin down after inactivity. The first request may take 30–60 seconds.

### Step 3 — Deploy frontend on GitHub Pages

1. In your GitHub repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Add a repository secret:
   - **`VITE_API_URL`** — your Render URL, e.g. `https://robodocs-api.onrender.com` (no trailing slash)
3. Push to `main` (or `master`). The workflow in `.github/workflows/deploy-pages.yml` builds and deploys automatically.

The workflow sets `VITE_BASE_PATH=/robotics-manual-rag/` for project pages. If your repo name differs, edit that value in the workflow file.

Your site will be at:

```
https://YOUR_GITHUB_USERNAME.github.io/robotics-manual-rag/
```

### Step 4 — Wire CORS

Ensure Render's `CORS_ORIGINS` includes your GitHub Pages origin:

```
CORS_ORIGINS=https://YOUR_GITHUB_USERNAME.github.io
```

Browser requests from `https://username.github.io/robotics-manual-rag/` send `Origin: https://username.github.io`, so the origin is the username subdomain, not the full path.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Embeddings + chat |
| `PINECONE_API_KEY` | Yes | Vector search |
| `PINECONE_INDEX_NAME` | Yes | Default: `robotics-manual-rag` |
| `CORS_ORIGINS` | Prod | Comma-separated allowed origins |

### Frontend (`frontend/.env` / GitHub secret)

| Variable | Local | Production |
|----------|-------|------------|
| `VITE_API_URL` | unset (uses `/api` proxy) | Render backend URL |
| `VITE_BASE_PATH` | `/` | `/robotics-manual-rag/` |

---

## API reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/chat` | Ask a question with optional filters |
| `GET` | `/documents` | List indexed document filenames |
| `GET` | `/health` | Health check |

### POST /chat

```json
{
  "message": "What is the emergency stop procedure?",
  "filter_documents": ["UR5_user_manual.pdf"],
  "filter_section": "safety"
}
```

Response:

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
│   ├── data/documents/            # PDFs (not committed)
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

**Section filter** — limits to chunks tagged at ingest time by keyword heuristics:

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
| Render + GitHub Pages | Free tiers available |

Set an OpenAI spending limit in your dashboard to cap usage.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS error in browser | Add `https://username.github.io` to Render `CORS_ORIGINS` |
| Blank page on GitHub Pages | Check `VITE_BASE_PATH` matches repo name (`/robotics-manual-rag/`) |
| API timeout on first request | Render free tier cold start — retry after ~60s |
| No documents in sidebar | Run `ingest.py`; `/documents` falls back to Pinecone sampling if manifest is missing |
| `ModuleNotFoundError` on Render | Confirm root directory is `backend` and start command uses `src.api:app` |

---

## License

MIT — use and adapt freely for learning and portfolio projects.
