# MedChain 🔗

> **A full-stack AI-powered personal health record platform** — securely upload, organize, share, and query your medical history through a Retrieval-Augmented Generation (RAG) AI assistant.

---

## Table of Contents

- [Overview](#overview)
- [Live Architecture](#live-architecture)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Django Backend](#1-django-backend)
  - [2. RAG (AI) Service](#2-rag-ai-service)
  - [3. Next.js Frontend](#3-nextjs-frontend)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Access Control Model](#access-control-model)
- [RAG Pipeline](#rag-pipeline)
- [Running Tests](#running-tests)
- [Design Decisions](#design-decisions)
- [Roadmap](#roadmap)

---

## Overview

MedChain is a **patient-owned health record platform** that solves a fundamental problem in personal healthcare: medical records are scattered across hospitals, clinics, and labs with no unified, patient-controlled view.

With MedChain, patients can:
- **Upload** medical documents (PDFs, images) with SHA-256 integrity hashing
- **View** a chronological timeline of their entire health history
- **Share** records securely with doctors via a tiered, consent-based access control system
- **Ask questions** about their health records in plain English using an AI assistant powered by Google Gemini or a local Ollama model

Doctors can:
- Connect with patients via a QR-code-based pairing flow
- Request access to a patient's full or selected records
- Query and synthesize a patient's longitudinal medical history through the RAG AI — but **only after** the patient explicitly grants permission

---

## Live Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser Client                             │
│                    Next.js 16 + TypeScript + Tailwind               │
└────────────┬───────────────────────────────────────┬────────────────┘
             │ REST (JWT)                             │ REST (JWT)
             ▼                                        ▼
┌────────────────────────┐              ┌─────────────────────────────┐
│   Django REST API      │              │   FastAPI RAG Service       │
│   (Port 8000)          │              │   (Port 8001)               │
│                        │              │                             │
│  • Auth / JWT tokens   │              │  • /api/v1/query            │
│  • Records upload      │◄────SQLite──►│  • /api/v1/reindex          │
│  • Sharing & grants    │              │  • /api/v1/synthesize        │
│  • Appointments        │              │  • /api/v1/questions         │
│  • Clinical data       │              │                             │
│  • Blockchain anchoring│              │  FAISS per-patient index    │
└────────────────────────┘              │  all-MiniLM-L6-v2 embedder  │
                                        │  Google Gemini / Ollama LLM │
                                        └─────────────────────────────┘
```

> The RAG service reads the same SQLite database as Django — there is **no data duplication**. It builds a per-patient FAISS vector index over all records, clinical notes, vitals, diagnoses, and prescriptions on demand.

---

## Key Features

### 🔐 Authentication
- Email/password login with **JWT** (access + refresh token rotation)
- **Google OAuth 2.0** sign-in
- Role-based accounts: `PATIENT` and `DOCTOR`

### 📁 Medical Records
- Multipart file upload (PDF / JPG / PNG)
- **SHA-256 content hashing** on every upload for integrity verification
- Simulated blockchain anchoring (async, non-blocking, Web3-compatible stub)
- Timeline view sorted chronologically with date-confidence metadata (`EXACT`, `APPROXIMATE`, `UNKNOWN`)

### 🤝 Tiered Access Control
Three-layer consent model between doctors and patients:

| Layer | Model | What it grants |
|---|---|---|
| **Tier 1** | `CareRelationship` | Identity connection — doctor can see record manifest |
| **Tier 2** | `AccessRequest` | Doctor formally requests full or selected history |
| **Tier 3** | `AccessGrant` | Patient approves. Scope: `NONE` / `FULL` / `SELECTED` |

Patients can **revoke** at any time. Doctors cannot self-elevate permissions.

### 🔗 Secure Sharing
- Generate expiring URL-safe tokens (1-hour TTL by default)
- Share full vault or a specific record
- Public read-only endpoint: `GET /share/<token>/` — no authentication required

### 🤖 AI Health Assistant (RAG)
- Retrieval-Augmented Generation over the patient's own records
- Classifies queries as `record_grounded` (pulls from FAISS) or `general_medical` (pure LLM)
- Curated **question bank** with ~100+ structured health questions organized by category
- Suggested follow-up questions after every answer
- Doctor-only `/synthesize` endpoint generates a **chronological medical history summary**
- Supports Google Gemini (default) or **local Ollama** (Mistral, Llama, etc.) — fully swappable via `.env`

### 📅 Appointments
- Create and manage appointment records linked to care relationships

### 🩺 Clinical Data
- Doctors can log **Vitals** (BP, heart rate, weight, temperature)
- **Diagnoses** with ICD-10 codes, severity, and active/resolved status
- **Prescriptions** with dosage, frequency, and refill tracking
- Visibility control: `PATIENT_VISIBLE` or `PROVIDER_ONLY` per entry

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| **State management** | Zustand |
| **Forms & validation** | React Hook Form + Zod |
| **Charts** | Recharts |
| **Animations** | Framer Motion |
| **Django API** | Django 5.2, Django REST Framework 3.17, SimpleJWT |
| **RAG Service** | FastAPI 0.115, Uvicorn |
| **Embeddings** | `sentence-transformers` — `all-MiniLM-L6-v2` |
| **Vector Store** | FAISS (per-patient, disk-persisted indices) |
| **LLM** | Google Gemini 2.5 Flash / Ollama (configurable) |
| **Database** | SQLite (dev) / PostgreSQL (production-ready) |
| **Auth** | JWT (`djangorestframework-simplejwt`) + Google OAuth |
| **Blockchain stub** | `web3.py` 7.x integration layer |
| **Testing** | pytest, pytest-asyncio |

---

## Project Structure

```
medchain-main/
├── medchain-frontend-main/          # Next.js application
│   └── src/
│       ├── app/
│       │   ├── (dashboard)/         # Protected routes (layout w/ sidebar)
│       │   │   ├── dashboard/       # Patient & Doctor dashboards
│       │   │   ├── records/         # Upload & timeline view
│       │   │   ├── analytics/       # Health charts & trends
│       │   │   ├── appointments/    # Appointment management
│       │   │   ├── access/          # Grant / revoke doctor access
│       │   │   ├── requests/        # Incoming access requests
│       │   │   ├── doctor/          # Doctor-side patient view
│       │   │   ├── help/            # AI assistant chat
│       │   │   └── profile/         # User profile
│       │   ├── login/               # Auth pages
│       │   └── share/               # Public share token viewer
│       ├── components/              # Reusable UI components
│       ├── store/                   # Zustand global state
│       └── lib/                     # API client, utilities
│
└── medchain-server-main/            # Backend monorepo
    ├── users/                       # Custom user model, auth views, Google OAuth
    ├── records/                     # File upload, SHA-256, timeline
    ├── sharing/                     # ShareToken, CareRelationship, AccessRequest, AccessGrant
    ├── appointments/                # Appointment model & views
    ├── clinical/                    # Vitals, Diagnoses, Prescriptions
    ├── blockchain/                  # Async blockchain anchoring service
    ├── parsing/                     # Document field extraction (async)
    ├── medchain_backend/            # Django settings & URL routing
    └── medchain-rag/                # FastAPI RAG microservice
        ├── api/                     # Routes, request/response schemas
        ├── auth/                    # JWT validator (shared with Django)
        ├── ingestion/               # DB → Document transformer & chunker
        ├── embeddings/              # Sentence-transformer + FAISS store
        ├── retrieval/               # Similarity search & context builder
        ├── llm/                     # Gemini / Ollama generator, question bank
        └── tests/                   # Async pytest test suite
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- `git`

> The project uses **SQLite** out of the box for zero-config local setup. PostgreSQL config is commented in `settings.py` and ready to swap.

---

### 1. Django Backend

```bash
cd medchain-server-main

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment (optional — works without .env for local SQLite dev)
cp .env.example .env
# Edit .env with your GOOGLE_CLIENT_ID if you want Google OAuth

# Apply migrations
python manage.py migrate

# (Optional) Load demo data
python manage.py seed_demo_data   # if available, or:
# python seed_demo_data.py

# Start the server
python manage.py runserver        # Runs on http://localhost:8000
```

---

### 2. RAG (AI) Service

```bash
cd medchain-server-main/medchain-rag

# Install dependencies (in the same venv or a new one)
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Required: set GEMINI_API_KEY (free key at https://aistudio.google.com/apikey)
# Or set LLM_PROVIDER=ollama and configure OLLAMA_URL / OLLAMA_MODEL for local LLM

# Start the FastAPI service
uvicorn main:app --reload --port 8001
# API docs available at http://localhost:8001/docs
```

After at least one patient has uploaded records, trigger indexing:

```bash
# Re-index all patients' records into FAISS
curl -X POST http://localhost:8001/api/v1/reindex \
  -H "Authorization: Bearer <your_jwt_token>"
```

---

### 3. Next.js Frontend

```bash
cd medchain-frontend-main

# Install dependencies
npm install

# Start the dev server
npm run dev                       # Runs on http://localhost:3000
```

The frontend proxies API requests. Ensure Django is on `:8000` and the RAG service on `:8001`.

---

## Environment Variables

### Django Backend (`medchain-server-main/.env`)

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID for social login |
| `MEDCHAIN_CONTRACT_ADDRESS` | Ethereum contract address for blockchain anchoring |
| `MEDCHAIN_WALLET_PRIVATE_KEY` | Wallet key for signing blockchain transactions (dev only) |

### RAG Service (`medchain-server-main/medchain-rag/.env`)

| Variable | Default | Description |
|---|---|---|
| `DB_PATH` | `../db.sqlite3` | Path to the Django SQLite database |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | HuggingFace sentence-transformer model |
| `CHUNK_SIZE` | `400` | Characters per text chunk |
| `CHUNK_OVERLAP` | `80` | Overlap between chunks |
| `TOP_K` | `5` | Number of context chunks retrieved per query |
| `LLM_PROVIDER` | `gemini` | `gemini` or `ollama` |
| `GEMINI_API_KEY` | — | Required for Gemini (get free at aistudio.google.com) |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model version |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `mistral` | Ollama model name |
| `JWT_SECRET` | — | **Must match** Django's `SECRET_KEY` |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins (comma-separated) |

---

## API Reference

### Authentication (`/auth/`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register/` | Public | Register a new patient or doctor account |
| `POST` | `/auth/login/` | Public | Get JWT access + refresh token pair |
| `POST` | `/auth/token/refresh/` | Public | Refresh access token |
| `POST` | `/auth/google/` | Public | Google OAuth sign-in |
| `GET` | `/auth/me/` | JWT | Get current user profile |

### Records (`/records/`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/records/` | JWT | Paginated timeline of user's records |
| `POST` | `/records/upload/` | JWT | Upload a medical document (multipart/form-data) |
| `GET` | `/records/<id>/` | JWT | Get a single record |
| `DELETE` | `/records/<id>/` | JWT | Delete a record |

### Sharing (`/share/`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/share/generate/` | JWT | Generate expiring share token |
| `GET` | `/share/<token>/` | **Public** | Access records via share link |
| `POST` | `/share/care/connect/` | JWT | Connect patient ↔ doctor via QR token |
| `GET` | `/share/care/relationships/` | JWT | List care relationships |
| `POST` | `/share/access/request/` | JWT (Doctor) | Request patient data access |
| `GET` | `/share/access/requests/` | JWT | List incoming/outgoing access requests |
| `PATCH` | `/share/access/grants/<id>/` | JWT (Patient) | Approve or revoke access grant |

### Clinical (`/clinical/`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET/POST` | `/clinical/vitals/` | JWT | List or log vitals |
| `GET/POST` | `/clinical/diagnoses/` | JWT | List or add diagnoses |
| `GET/POST` | `/clinical/prescriptions/` | JWT | List or add prescriptions |

### Blockchain (`/api/v1/blockchain/`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/blockchain/status/<record_id>/` | JWT | Get blockchain anchoring status for a record |

### RAG Service (`http://localhost:8001/api/v1/`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | Service health and index status |
| `POST` | `/reindex` | JWT | Rebuild FAISS index (all or single patient) |
| `POST` | `/query` | JWT | Ask a question about health records |
| `GET` | `/questions` | JWT (Patient) | Get categorized question bank |
| `POST` | `/synthesize` | JWT (Doctor) | Generate longitudinal medical history summary |

---

## Access Control Model

Access between doctors and patients is governed by a **three-tier model**, each tier requiring the previous:

```
Tier 1: CareRelationship (PENDING → ACTIVE)
         ↳ Patient scans doctor's QR code, or doctor enters patient code
         ↳ Doctor can see record manifest, write clinical notes

Tier 2: AccessRequest (Pending → Approved / Declined)
         ↳ Doctor formally requests FULL or SELECTED record access
         ↳ Patient receives notification and decides

Tier 3: AccessGrant (NONE → FULL / SELECTED)
         ↳ Created automatically on connection (scope=NONE)
         ↳ Elevated on approval. Patient can revoke to NONE at any time
         ↳ SELECTED scope: patient picks individual records
```

This same `has_active_grant()` function is called by **both** the Django API and the RAG service — there is no duplicated access logic across services.

---

## RAG Pipeline

```
Patient Record Upload
        │
        ▼
[Django] Stores file + metadata in SQLite
        │
        ▼
POST /api/v1/reindex  (triggered after upload or on-demand)
        │
        ▼
[RAG] ingestion/transformer.py
  • Reads SQLite: Records, Vitals, Diagnoses, Prescriptions
  • Builds structured Document objects per data type
        │
        ▼
[RAG] ingestion/chunker.py
  • Splits documents into 400-character chunks (80-char overlap)
        │
        ▼
[RAG] embeddings/embedder.py
  • all-MiniLM-L6-v2 via sentence-transformers
  • Produces 384-dim dense vectors
        │
        ▼
[RAG] embeddings/faiss_store.py
  • Builds per-patient FAISS IndexFlatL2
  • Saved to disk: data/patient_indices/<patient_id>.{index,meta.json}
        │
        ▼
POST /api/v1/query  ←── Patient question
        │
        ▼
[RAG] Query classified: record_grounded | general_medical
        │
        ▼
[RAG] retrieval/retriever.py  →  top-K similar chunks
        │
        ▼
[RAG] llm/generator.py  →  Gemini / Ollama
        │
        ▼
Answer + source chunks + follow-up questions
```

---

## Running Tests

### RAG Service (pytest)

```bash
cd medchain-server-main/medchain-rag
pytest -v
```

Test coverage includes:
- `test_db.py` — SQLite connector and data fetch
- `test_ingestion.py` — Document transformer and chunker
- `test_retrieval.py` — FAISS similarity search
- `test_generator.py` — LLM prompt building and response parsing
- `test_clinical_rag.py` — Clinical data ingestion into RAG pipeline
- `test_synthesize_api.py` — Doctor synthesis endpoint (access control + generation)

### Django Backend

```bash
cd medchain-server-main
python manage.py test
```

---

## Design Decisions

**Why a separate FastAPI service for RAG?**
The AI pipeline is CPU/IO-intensive (embedding computation, FAISS search, LLM calls). Running it as a separate async FastAPI process keeps Django synchronous and predictable, while FastAPI's `async` I/O handles concurrent LLM requests efficiently.

**Why per-patient FAISS indices?**
A single global index would leak data between patients when filtering by `patient_id` post-retrieval. Per-patient indices enforce **isolation at the retrieval layer** — a doctor querying Patient A can never accidentally surface Patient B's chunks.

**Why SQLite instead of PostgreSQL for development?**
Zero configuration. PostgreSQL config is already in `settings.py` (commented out) and the codebase is fully compatible — one env-var change deploys to Postgres.

**Why SHA-256 hashing on upload?**
Provides a tamper-evidence chain. The hash is stored in the DB and (optionally) anchored to a blockchain transaction — any file modification invalidates the stored hash without requiring blockchain for day-to-day use.

**Why not store the parsed content in the Django ORM?**
Parsed medical text is volatile and model-dependent. Keeping it in the RAG service's FAISS index decouples the AI pipeline from the source-of-truth database schema.

---

## Roadmap

- [ ] AWS S3 file storage (drop-in via `django-storages`)
- [ ] Celery + Redis for robust async task queuing (replace threading.Thread)
- [ ] WebSocket streaming for RAG answers
- [ ] PDF text extraction pipeline for richer context
- [ ] Production deployment guide (Nginx + Gunicorn + Docker Compose)
- [ ] Web3.py live blockchain integration (Infura / Alchemy endpoint)
- [ ] Email notifications for access requests and grants

---

## Author

Built as a full-stack portfolio project demonstrating end-to-end system design across:
- RESTful API architecture with Django REST Framework
- Microservice separation with FastAPI
- RAG (Retrieval-Augmented Generation) AI pipeline
- Complex, multi-tier role-based access control
- Modern React/Next.js frontend with TypeScript

---

*MedChain is a portfolio/educational project. It is not a certified medical device and should not be used for actual clinical decision-making.*
