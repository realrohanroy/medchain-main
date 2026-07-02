import json
import logging
import os
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional

import faiss
import numpy as np

from config import PATIENT_INDICES_DIR
from embeddings.embedder import embed_texts, embed_query as _embed_query

logger = logging.getLogger(__name__)


def _ensure_dir(path: str) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)


def _get_patient_paths(patient_id: str) -> Tuple[str, str]:
    """Return (index_path, meta_path) for a patient."""
    import uuid
    normalized = str(patient_id).lower().strip("{}")
    try:
        valid_uuid = uuid.UUID(normalized)
        normalized_hex = valid_uuid.hex
    except ValueError:
        raise ValueError(f"Invalid patient_id for FAISS index: {patient_id}")
        
    index_path = os.path.join(PATIENT_INDICES_DIR, f"{normalized_hex}.index")
    meta_path = os.path.join(PATIENT_INDICES_DIR, f"{normalized_hex}_meta.json")
    return index_path, meta_path


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
            "author_id":   c.get("author_id", ""),
            "visibility":  c.get("visibility", "PATIENT_VISIBLE"),
        }
        for c in chunks
    ]
    return index, metadata


def save_index(patient_id: str, index: faiss.Index, metadata: List[Dict[str, Any]]) -> None:
    index_path, meta_path = _get_patient_paths(patient_id)
    _ensure_dir(index_path)
    _ensure_dir(meta_path)
    faiss.write_index(index, index_path)
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False)
    logger.info(f"Saved FAISS index for patient {patient_id} -> {index_path}")


def load_index(patient_id: str) -> Tuple[faiss.Index, List[Dict[str, Any]]]:
    index_path, meta_path = _get_patient_paths(patient_id)
    if not os.path.exists(index_path) or not os.path.exists(meta_path):
        raise FileNotFoundError(
            f"FAISS index not found for patient {patient_id}. "
            "Call POST /reindex to build the index before querying."
        )
    index = faiss.read_index(index_path)
    with open(meta_path, "r", encoding="utf-8") as f:
        metadata = json.load(f)
    logger.info(f"Loaded FAISS index for patient {patient_id}: {index.ntotal} vectors")
    return index, metadata


# ── In-memory singleton / caching ──────────────────────────────────────────────
_cached_indices: Dict[str, Tuple[faiss.Index, List[Dict[str, Any]]]] = {}


def get_index(patient_id: str) -> Tuple[faiss.Index, List[Dict[str, Any]]]:
    global _cached_indices
    import uuid
    normalized = uuid.UUID(str(patient_id).lower().strip("{}")).hex
    if normalized not in _cached_indices:
        _cached_indices[normalized] = load_index(normalized)
    return _cached_indices[normalized]


def refresh_index(patient_id: str, index: faiss.Index, metadata: List[Dict[str, Any]]) -> None:
    """Called after /reindex to update the in-memory singleton cache."""
    global _cached_indices
    import uuid
    normalized = uuid.UUID(str(patient_id).lower().strip("{}")).hex
    _cached_indices[normalized] = (index, metadata)


def invalidate_cache(patient_id: str) -> None:
    """Remove patient's index from the singleton cache."""
    global _cached_indices
    import uuid
    normalized = uuid.UUID(str(patient_id).lower().strip("{}")).hex
    _cached_indices.pop(normalized, None)


# ── Search ─────────────────────────────────────────────────────────────────────

def search(query: str, patient_id: str, top_k: int = 5, requester_role: Optional[str] = None, requester_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Embed query, run FAISS similarity search, return top_k chunks.
    Filters visibility using can_view_clinical_chunk().
    """
    index, meta = get_index(patient_id)
    q_vec = _embed_query(query).reshape(1, -1)

    # Pre-calculate grant status once per search if it's a doctor querying
    has_full_grant = False
    if requester_role == 'DOCTOR' and requester_id and patient_id:
        from sharing.access_control import has_active_full_grant
        from users.models import CustomUser
        try:
            req_user = CustomUser.objects.get(id=requester_id)
            pat_user = CustomUser.objects.get(id=patient_id)
            has_full_grant = has_active_full_grant(req_user, pat_user)
        except Exception as e:
            logger.error(f"Error checking grant status: {e}")

    from sharing.access_control import can_view_clinical_chunk

    k = min(top_k * 2, index.ntotal)
    distances, indices = index.search(q_vec, k)

    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx < 0 or idx >= len(meta):
            continue
        chunk = meta[idx]
        
        # Clinical Visibility Check
        if chunk.get("source_type") in ["vitals", "diagnosis", "prescription"]:
            if not can_view_clinical_chunk(
                requester_role=requester_role,
                requester_id=requester_id,
                patient_id=patient_id,
                chunk_author_id=chunk.get("author_id", ""),
                chunk_visibility=chunk.get("visibility", "PATIENT_VISIBLE"),
                has_full_grant=has_full_grant
            ):
                continue

        results.append({**chunk, "score": float(dist)})
        if len(results) >= top_k:
            break

    return results
