import json
import logging
import os
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional

import faiss
import numpy as np

from config import FAISS_INDEX_PATH, FAISS_META_PATH
from embeddings.embedder import embed_texts, embed_query as _embed_query

logger = logging.getLogger(__name__)


def _ensure_dir(path: str) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)


# ── Build / Persist ────────────────────────────────────────────────────────────

def build_index(chunks: List[Dict[str, Any]]) -> Tuple[faiss.Index, List[Dict[str, Any]]]:
    """
    Given a list of chunk dicts (must have 'text' key),
    embed all texts and build a FAISS FlatL2 index.
    Returns (index, metadata_list).
    """
    texts = [c["text"] for c in chunks]
    logger.info(f"Embedding {len(texts)} chunks …")
    embeddings = embed_texts(texts)

    dim   = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)
    logger.info(f"FAISS index built: {index.ntotal} vectors, dim={dim}")

    # Metadata parallel to index rows
    metadata = [
        {
            "text":        c.get("text", ""),
            "patient_id":  c.get("patient_id", ""),
            "source_type": c.get("source_type", ""),
            "source_id":   c.get("source_id", ""),
            "chunk_index": c.get("chunk_index", 0),
        }
        for c in chunks
    ]
    return index, metadata


def save_index(index: faiss.Index, metadata: List[Dict[str, Any]]) -> None:
    _ensure_dir(FAISS_INDEX_PATH)
    _ensure_dir(FAISS_META_PATH)
    faiss.write_index(index, FAISS_INDEX_PATH)
    with open(FAISS_META_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False)
    logger.info(f"Saved FAISS index → {FAISS_INDEX_PATH}")


def load_index() -> Tuple[faiss.Index, List[Dict[str, Any]]]:
    if not os.path.exists(FAISS_INDEX_PATH):
        raise FileNotFoundError(
            "FAISS index not found. Call POST /reindex to build it first."
        )
    index = faiss.read_index(FAISS_INDEX_PATH)
    with open(FAISS_META_PATH, "r", encoding="utf-8") as f:
        metadata = json.load(f)
    logger.info(f"Loaded FAISS index: {index.ntotal} vectors")
    return index, metadata


# ── In-memory singleton ────────────────────────────────────────────────────────
_index: Optional[faiss.Index] = None
_meta:  List[Dict[str, Any]] = []


def get_index() -> Tuple[faiss.Index, List[Dict[str, Any]]]:
    global _index, _meta
    if _index is None:
        _index, _meta = load_index()
    return _index, _meta


def refresh_index(index: faiss.Index, metadata: List[Dict[str, Any]]) -> None:
    """Called after /reindex to update the in-memory singleton."""
    global _index, _meta
    _index = index
    _meta  = metadata


# ── Search ─────────────────────────────────────────────────────────────────────

def search(query: str, top_k: int = 5, patient_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Embed query, run FAISS similarity search, return top_k chunks.
    Optionally filter results to a specific patient_id.
    """
    index, meta = get_index()
    q_vec = _embed_query(query).reshape(1, -1)

    # If filtering by patient, we need more candidates to filter from
    k = top_k * 10 if patient_id else top_k
    k = min(k, index.ntotal)

    distances, indices = index.search(q_vec, k)

    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx < 0 or idx >= len(meta):
            continue
        chunk = meta[idx]
        if patient_id and chunk.get("patient_id", "").lower() != patient_id.lower():
            continue
        results.append({**chunk, "score": float(dist)})
        if len(results) >= top_k:
            break

    return results
