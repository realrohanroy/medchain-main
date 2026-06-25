import logging
from typing import Optional

from django_setup import init_django
init_django()

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from api.schemas import QueryRequest, QueryResponse, ReindexResponse, ReindexRequest, HealthResponse, SourceChunk, QuestionBankResponse, SynthesizeRequest, SynthesizeResponse
from auth.jwt_validator import validate_token
from retrieval.retriever import retrieve, build_context
from llm.generator import generate_answer, classify_query_mode, generate_patient_answer
from ingestion.transformer import build_all_documents
from ingestion.chunker import chunk_documents
from embeddings.faiss_store import build_index, save_index, refresh_index, get_index, invalidate_cache
from config import LLM_PROVIDER, EMBEDDING_MODEL

logger = logging.getLogger(__name__)
router = APIRouter()
bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    return validate_token(credentials.credentials)


# ── /health ────────────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Health check — returns index status and system config."""
    try:
        index, _ = get_index()
        index_loaded  = True
        total_vectors = index.ntotal
    except FileNotFoundError:
        index_loaded  = False
        total_vectors = 0

    return HealthResponse(
        status="ok",
        index_loaded=index_loaded,
        total_vectors=total_vectors,
        llm_provider=LLM_PROVIDER,
        embedding_model=EMBEDDING_MODEL,
    )


# ── /reindex ───────────────────────────────────────────────────────────────────

import os

def _reindex_patient(patient_id: str) -> int:
    """Build and save FAISS index for a single patient. Returns number of chunks."""
    logger.info(f"Reindexing patient: {patient_id}")
    invalidate_cache(patient_id)
    docs = build_all_documents(patient_id)
    chunks = chunk_documents(docs)
    
    from embeddings.faiss_store import _get_patient_paths
    idx_p, meta_p = _get_patient_paths(patient_id)
    
    if not chunks:
        # If no chunks, clean up existing FAISS index files for this patient
        try:
            if os.path.exists(idx_p):
                os.remove(idx_p)
            if os.path.exists(meta_p):
                os.remove(meta_p)
        except Exception as e:
            logger.warning(f"Error removing empty index files for {patient_id}: {e}")
        return 0

    index, meta = build_index(chunks)
    save_index(patient_id, index, meta)
    refresh_index(patient_id, index, meta)
    return len(chunks)


def _do_reindex(patient_id: str = None):
    """Background task: pull DB data, chunk, embed, save FAISS index per patient."""
    logger.info("Starting background reindex …")
    if patient_id:
        _reindex_patient(patient_id)
    else:
        from db.connector import fetch_all_patients
        for p in fetch_all_patients():
            p_id = p.get("id")
            if p_id:
                _reindex_patient(p_id)


@router.post("/reindex", response_model=ReindexResponse, tags=["Admin"])
async def reindex(
    req_body: Optional[ReindexRequest] = None,
    user: dict = Depends(get_current_user),
):
    """
    Rebuild the FAISS index from the database.
    If patient_id is provided, only reindex that patient's data.
    Otherwise, reindex all patients.
    """
    logger.info(f"Reindex triggered by user: {user.get('email')}")
    patient_id = req_body.patient_id if req_body else None

    if patient_id:
        total_chunks = _reindex_patient(patient_id)
        return ReindexResponse(
            status="success",
            total_chunks=total_chunks,
            message=f"Successfully reindexed patient {patient_id} ({total_chunks} chunks).",
        )
    else:
        from db.connector import fetch_all_patients
        patients = fetch_all_patients()
        total_chunks = 0
        reindexed_count = 0
        for p in patients:
            p_id = p.get("id")
            if p_id:
                chunks_count = _reindex_patient(p_id)
                total_chunks += chunks_count
                reindexed_count += 1
        return ReindexResponse(
            status="success",
            total_chunks=total_chunks,
            message=f"Successfully reindexed {reindexed_count} patients (total {total_chunks} chunks).",
        )


# ── /query ─────────────────────────────────────────────────────────────────────

@router.post("/query", response_model=QueryResponse, tags=["RAG"])
async def query_records(
    body: QueryRequest,
    user: dict = Depends(get_current_user),
):
    """
    Main RAG endpoint.
    - Restricted to patients and doctors.
    - If user is a DOCTOR, they must provide patient_id and hold an active AccessGrant.
    - Standardizes patient_id scoping using patient's user_id from JWT or body.patient_id.
    - Classifies the query: record_grounded or general_medical.
    - Fetches context from patient's index if needed; otherwise calls general knowledge flow.
    """
    role = user.get("role", "PATIENT")
    user_id = user.get("user_id", "")

    if role not in ["PATIENT", "DOCTOR"]:
        raise HTTPException(
            status_code=403,
            detail="Access forbidden: The AI Assistant is restricted to patient and doctor accounts only."
        )

    if role == "PATIENT":
        patient_id = user_id
    else:  # DOCTOR
        patient_id = body.patient_id
        if not patient_id:
            raise HTTPException(
                status_code=400,
                detail="patient_id is required in the request body for doctor queries."
            )
        
        # Access Grant Check (Gate)
        from users.models import CustomUser
        from sharing.access_control import has_active_grant
        try:
            doc_user = CustomUser.objects.get(id=user_id)
            pat_user = CustomUser.objects.get(id=patient_id)
        except CustomUser.DoesNotExist:
            raise HTTPException(status_code=404, detail="User not found")
            
        if not has_active_grant(doc_user, pat_user):
            raise HTTPException(
                status_code=403,
                detail="Access forbidden: You do not have an active access grant to query this patient's records."
            )

    logger.info(f"Query from {role.lower()} {user.get('email')} | patient_id={patient_id} | q={body.query[:60]}")

    # Classify query mode
    mode = classify_query_mode(body.query)

    chunks = []
    context = ""
    
    # Try to retrieve records if available
    try:
        chunks = retrieve(body.query, patient_id=patient_id, top_k=body.top_k or 5, requester_role=role, requester_id=user_id)
        context = build_context(chunks)
    except FileNotFoundError:
        # If the FAISS index is not built yet, log a warning and proceed with empty context
        logger.warning(f"FAISS index for patient {patient_id} not built yet. Answering from general knowledge.")
        if mode == "record_grounded":
            mode = "general_medical"
    except Exception as e:
        logger.error(f"Query retrieval error: {e}")
        if mode == "record_grounded":
            mode = "general_medical"

    try:
        answer = await generate_patient_answer(context, body.query, mode)
    except Exception as e:
        logger.error(f"LLM generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate answer: {str(e)}")

    sources = [
        SourceChunk(
            text=c.get("text", ""),
            source_type=c.get("source_type", ""),
            source_id=c.get("source_id", ""),
            patient_id=c.get("patient_id", ""),
            score=c.get("score", 0.0),
        )
        for c in chunks
    ]

    # Resolve follow-up questions
    from llm.question_bank import QUESTIONS, get_suggested_followups
    query_clean = body.query.strip().lower().rstrip("?")
    matched_id = None
    for q in QUESTIONS:
        if q["question_text"].strip().lower().rstrip("?") == query_clean:
            matched_id = q["id"]
            break
            
    if matched_id is not None:
        follow_ups = get_suggested_followups(matched_id)
    else:
        # Default follow-ups if patient enters custom free-text
        follow_ups = [
            "What diagnoses are in my records?",
            "What are my recent vitals?",
            "Show my active prescription list."
        ]

    return QueryResponse(
        answer=answer,
        sources=sources,
        query=body.query,
        answer_mode=mode,
        follow_up_questions=follow_ups
    )


@router.get("/questions", response_model=QuestionBankResponse, tags=["RAG"])
async def get_questions(user: dict = Depends(get_current_user)):
    """
    Get the list of questions organized by category for the patient.
    Restricted to patients only.
    """
    role = user.get("role", "PATIENT")
    if role != "PATIENT":
        raise HTTPException(
            status_code=403,
            detail="Access forbidden: The Question Bank is restricted to patient accounts only."
        )
    
    from llm.question_bank import get_questions_by_category
    categories_dict = get_questions_by_category()
    
    categories_list = []
    for cat_name, qs in categories_dict.items():
        categories_list.append({
            "category_name": cat_name,
            "questions": [
                {
                    "id": q["id"],
                    "question_text": q["question_text"],
                    "requires_records": q["requires_records"],
                    "category": q["category"]
                }
                for q in qs
            ]
        })
    return QuestionBankResponse(categories=categories_list)


# ── /synthesize ────────────────────────────────────────────────────────────────

@router.post("/synthesize", response_model=SynthesizeResponse, tags=["RAG"])
async def synthesize_records(
    body: SynthesizeRequest,
    user: dict = Depends(get_current_user),
):
    """
    Synthesize a chronological history for a patient.
    - Restricted to doctors with an active grant.
    """
    role = user.get("role", "PATIENT")
    user_id = user.get("user_id", "")

    if role != "DOCTOR":
        raise HTTPException(
            status_code=403,
            detail="Access forbidden: Only doctors can synthesize longitudinal patient records."
        )

    patient_id = body.patient_id
    if not patient_id:
        raise HTTPException(
            status_code=400,
            detail="patient_id is required."
        )
    
    # Access Grant Check (Gate)
    from users.models import CustomUser
    from sharing.access_control import has_active_grant
    try:
        doc_user = CustomUser.objects.get(id=user_id)
        pat_user = CustomUser.objects.get(id=patient_id)
    except CustomUser.DoesNotExist:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not has_active_grant(doc_user, pat_user):
        raise HTTPException(
            status_code=403,
            detail="Access forbidden: You do not have an active access grant to query this patient's records."
        )

    logger.info(f"Synthesize request from doctor {user.get('email')} for patient_id={patient_id}")

    mode = "synthesize"
    query = "Summarize my medical history chronologically."

    chunks = []
    context = ""
    
    try:
        # EXACT same retrieve pipeline as /query
        chunks = retrieve(query, patient_id=patient_id, top_k=100, requester_role=role, requester_id=user_id)
        context = build_context(chunks)
    except FileNotFoundError:
        logger.warning(f"FAISS index for patient {patient_id} not built yet.")
    except Exception as e:
        logger.error(f"Query retrieval error: {e}")

    try:
        answer = await generate_patient_answer(context, query, mode)
    except Exception as e:
        logger.error(f"LLM generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate answer: {str(e)}")

    sources = [
        SourceChunk(
            text=c.get("text", ""),
            source_type=c.get("source_type", ""),
            source_id=c.get("source_id", ""),
            patient_id=c.get("patient_id", ""),
            score=c.get("score", 0.0),
        )
        for c in chunks
    ]

    return SynthesizeResponse(
        summary=answer,
        sources=sources,
    )

