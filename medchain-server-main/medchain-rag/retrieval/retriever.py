from typing import List, Dict, Any, Optional
from embeddings.faiss_store import search
from config import TOP_K


import logging

logger = logging.getLogger(__name__)

def retrieve(
    query: str,
    patient_id: str,
    top_k: int = TOP_K,
    requester_role: Optional[str] = None,
    requester_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Run semantic search and return top_k relevant chunks.
    Results are strictly scoped to patient_id.
    Filters out chunks the requester is not authorized to see (e.g. post-retrieval SELECTED scope filtering).
    """
    results = search(query, patient_id=patient_id, top_k=top_k * 2, requester_role=requester_role, requester_id=requester_id)
    
    if requester_role == 'DOCTOR' and requester_id:
        from users.models import CustomUser
        from sharing.access_control import get_accessible_record_ids
        try:
            doc_user = CustomUser.objects.get(id=requester_id)
            pat_user = CustomUser.objects.get(id=patient_id)
            accessible_ids = set(str(rid).lower().replace("-", "") for rid in get_accessible_record_ids(doc_user, pat_user))
            
            filtered = []
            for chunk in results:
                if chunk.get("source_type") == "record":
                    chunk_source_id = str(chunk.get("source_id", "")).lower().replace("-", "")
                    if chunk_source_id in accessible_ids:
                        filtered.append(chunk)
                else:
                    filtered.append(chunk)
            results = filtered[:top_k]
        except Exception as e:
            logger.error(f"Error filtering post-retrieval chunks: {e}")
            
    return results[:top_k]


def build_context(chunks: List[Dict[str, Any]]) -> str:
    """
    Concatenate retrieved chunks into a single context string for the LLM prompt.
    Each chunk is separated with a divider and labelled by source type.
    """
    if not chunks:
        return "No relevant medical records found."

    parts = []
    for i, chunk in enumerate(chunks, 1):
        source = chunk.get("source_type", "record").title()
        parts.append(
            f"[Context {i} — {source}]\n{chunk['text'].strip()}"
        )
    return "\n\n---\n\n".join(parts)
