import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from utils.logger import setup_logging
from api.routes import router
from config import CORS_ORIGINS

setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Log number of existing patient indices on startup."""
    try:
        from config import PATIENT_INDICES_DIR
        if os.path.exists(PATIENT_INDICES_DIR):
            indices = [f for f in os.listdir(PATIENT_INDICES_DIR) if f.endswith(".index")]
            logger.info(f"FastAPI startup: found {len(indices)} patient FAISS indices in {PATIENT_INDICES_DIR}")
        else:
            logger.info("FastAPI startup: patient FAISS indices directory not found yet.")
    except Exception as e:
        logger.warning(f"Error checking patient indices at startup: {e}")
    yield


app = FastAPI(
    title="MedChain RAG API",
    description="Retrieval-Augmented Generation pipeline for patient health records",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ─────────────────────────────────────────────────────────────────────
app.include_router(router, prefix="/api/v1")


# ── Global Exception Handler ───────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    # Responses generated here bypass CORSMiddleware, so the browser would see a
    # CORS-less 500 as an opaque "Failed to fetch". Reflect the allowed Origin so
    # the frontend can read the actual error message instead.
    headers = {}
    origin = request.headers.get("origin")
    if origin in CORS_ORIGINS:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again."},
        headers=headers,
    )
