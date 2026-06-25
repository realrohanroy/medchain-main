# Implementation Plan: §8 Per-Patient FAISS Index Restructuring

## Goal Description
Restructure the RAG architecture from a single global FAISS index to strictly isolated per-patient indices. This addresses major data isolation requirements by preventing cross-contamination at the structural level. Additionally, we will update the query API endpoint to verify doctor-patient `CareRelationship` access gates before allowing doctors to query a patient's index.

## User Review Required

> [!IMPORTANT]
> - **Incremental Ingestion**: I will implement the `/reindex` endpoint to accept an optional `patient_id`. For now, this requires manual triggers (or a future webhook) when new records are added. Does this align with your expectations for the prototype?
> - **Doctor Query Flow**: Doctors will need to pass `patient_id` when calling `/query`. I will modify `/query` to permit both `PATIENT` and `DOCTOR` roles. Doctors will be strictly gated by checking `has_active_relationship(doctor, patient)`.

## Open Questions

> [!WARNING]
> - **Legacy Reindexing:** If `/reindex` is called *without* a `patient_id`, should it wipe all indices and loop over every patient in the database to rebuild them one by one? Given the prototype stage, this seems useful for a complete system reset. Let me know if you prefer to only allow explicit per-patient reindexing.
> - **Index Caching:** With per-patient indices, loading the FAISS flat file per query adds a tiny overhead (milliseconds). Should I implement an LRU cache (e.g., keeping the 100 most recently queried patient indices in memory) or just load from disk per query for maximum simplicity?

## Proposed Changes

---

### Configuration
#### [MODIFY] [config.py](file:///c:/Users/lenovo/Downloads/medchain-main/medchain-server-main/medchain-rag/config.py)
- Replace `FAISS_INDEX_PATH` and `FAISS_META_PATH` with a dynamic per-patient directory: `PATIENT_INDICES_DIR`.

---

### Database & Ingestion Layer
#### [MODIFY] [db/connector.py](file:///c:/Users/lenovo/Downloads/medchain-main/medchain-server-main/medchain-rag/db/connector.py)
- Update `fetch_all_records`, `fetch_all_appointments`, `fetch_all_vitals`, `fetch_all_diagnoses`, `fetch_all_prescriptions`, `fetch_all_parsed_data`, `fetch_all_access_grants`, and `fetch_all_access_requests`.
- Add an optional `patient_id` parameter to each function. If provided, append a `WHERE` clause (or add an `AND` if there is already one) to filter specifically for `user_id = patient_id`.

#### [MODIFY] [ingestion/transformer.py](file:///c:/Users/lenovo/Downloads/medchain-main/medchain-server-main/medchain-rag/ingestion/transformer.py)
- Rename or refactor `build_all_documents()` to `build_patient_documents(patient_id: Optional[str] = None)` and pass the `patient_id` downward to the `fetch_*` functions.

---

### Embeddings & Vector Storage
#### [MODIFY] [embeddings/faiss_store.py](file:///c:/Users/lenovo/Downloads/medchain-main/medchain-server-main/medchain-rag/embeddings/faiss_store.py)
- Completely strip the single global in-memory `_index` singleton.
- Update `save_index(index, meta)` -> `save_index(patient_id, index, meta)` to write to `{patient_id}.index`.
- Update `load_index()` -> `load_index(patient_id)` to load from `{patient_id}.index`.
- Update `search()` to dynamically call `load_index(patient_id)`. The code looping through chunks to filter by `patient_id` will be removed, as the loaded index inherently only contains that patient's data.

---

### FastAPI Routes & API Schemas
#### [MODIFY] [api/schemas.py](file:///c:/Users/lenovo/Downloads/medchain-main/medchain-server-main/medchain-rag/api/schemas.py)
- Add `patient_id: Optional[str] = None` to a new `ReindexRequest` schema.

#### [MODIFY] [api/routes.py](file:///c:/Users/lenovo/Downloads/medchain-main/medchain-server-main/medchain-rag/api/routes.py)
- **`/reindex`**: Update to accept `ReindexRequest`.
  - If `patient_id` is provided, fetch, chunk, embed, and save just that patient's data.
  - If `patient_id` is omitted, loop through all patients (via `fetch_all_patients`) and rebuild each index incrementally.
- **`/query`**: 
  - Remove the restriction that blocks `DOCTOR` users.
  - If the user is a `DOCTOR`, they MUST provide `patient_id` in the request body. If omitted, throw a 400.
  - Add the access gate: Check `has_active_relationship(doctor, patient)`. If false, throw a 403 Forbidden before attempting retrieval.
  - Pass `patient_id` to `retrieve()`.

#### [MODIFY] [retrieval/retriever.py](file:///c:/Users/lenovo/Downloads/medchain-main/medchain-server-main/medchain-rag/retrieval/retriever.py)
- Enforce that `patient_id` must be passed; no longer fallback to global retrieval.

---

### Tests
#### [MODIFY] `tests/test_*.py`
- Update RAG and retrieval unit tests to pass the necessary `patient_id` fields and assert against the new per-patient storage architecture.

## Verification Plan

### Automated Tests
- Run `pytest` within `medchain-rag` to verify parsing, indexing, access gates, and retrieval.

### Manual Verification
- Execute a complete `/reindex` without arguments to verify all patient indices are generated correctly.
- Execute a `/reindex` for a specific patient to verify isolation.
- Check the `data/patient_indices/` folder for multiple `.index` and `_meta.json` files.
- Test queries as a `PATIENT` (verifying self-scoping).
- Test queries as a `DOCTOR` without an active relationship (verifying 403).
- Test queries as a `DOCTOR` with an active relationship (verifying proper retrieval).
