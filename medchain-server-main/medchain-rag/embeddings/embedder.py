import logging
import numpy as np
from typing import List, Optional
from sentence_transformers import SentenceTransformer
from config import EMBEDDING_MODEL

logger = logging.getLogger(__name__)

# Load model once at module level (singleton)
_model: Optional[SentenceTransformer] = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        logger.info(f"Loading embedding model: {EMBEDDING_MODEL}")
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model


def embed_texts(texts: List[str]) -> np.ndarray:
    """
    Convert a list of text strings to a 2D numpy array of embeddings.
    Shape: (len(texts), embedding_dim)
    """
    model = _get_model()
    embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    return embeddings.astype(np.float32)


def embed_query(query: str) -> np.ndarray:
    """
    Convert a single query string to a 1D numpy embedding vector.
    Shape: (embedding_dim,)
    """
    return embed_texts([query])[0]
