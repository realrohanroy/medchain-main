import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent

def resolve_path(p: str, default: Path) -> str:
    path = os.getenv(p)
    if not path:
        return str(default)
    if not os.path.isabs(path):
        return str((BASE_DIR / path).resolve())
    return path

# Path to the existing Django SQLite database
DB_PATH = resolve_path("DB_PATH", BASE_DIR.parent / "db.sqlite3")

# FAISS index storage directory (per-patient indices)
PATIENT_INDICES_DIR = resolve_path("PATIENT_INDICES_DIR", BASE_DIR / "data" / "patient_indices")

# ── Embedding Model ─────────────────────────────────────────────────────────────
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
CHUNK_SIZE       = int(os.getenv("CHUNK_SIZE", "400"))      # characters per chunk
CHUNK_OVERLAP    = int(os.getenv("CHUNK_OVERLAP", "80"))

# ── Retrieval ──────────────────────────────────────────────────────────────────
TOP_K = int(os.getenv("TOP_K", "5"))

# ── LLM ────────────────────────────────────────────────────────────────────────
LLM_PROVIDER   = os.getenv("LLM_PROVIDER", "gemini")      # "gemini" | "ollama"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
OLLAMA_URL     = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL   = os.getenv("OLLAMA_MODEL", "mistral")

# ── Auth ───────────────────────────────────────────────────────────────────────
# Must match the Django SECRET_KEY used to sign JWT tokens
JWT_SECRET      = os.getenv("JWT_SECRET", "django-insecure-=368c99s73=ih5%4*mlh1f()0zkovo7#!j2#-j*=%4#3h-iat%")
JWT_ALGORITHM   = os.getenv("JWT_ALGORITHM", "HS256")

# ── CORS ───────────────────────────────────────────────────────────────────────
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
