# Implement §7: Note-Visibility (Provider-Only Notes)

This plan implements the architectural gap described in §7 of `PROJECT_CONTEXT.md` to ensure that doctors can write private clinical impressions hidden from the patient, while maintaining a single shared access-control filter for both the Django API and the RAG service.

## Proposed Changes

### 1. Database & Models
#### [MODIFY] `medchain-server-main/clinical/models.py`
Add two new fields to `Vitals`, `Diagnosis`, and `Prescription`:
```python
author = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                           on_delete=models.SET_NULL, related_name='+',
                           help_text="Doctor who created this entry, if any")
visibility = models.CharField(max_length=20, default='PATIENT_VISIBLE',
                              choices=[('PATIENT_VISIBLE', 'Patient Visible'),
                                       ('PROVIDER_ONLY', 'Provider Only')])
```

#### [NEW] Django Migrations
- Generate and apply migrations for these new fields. Since the tables already contain data, `null=True` and `default='PATIENT_VISIBLE'` will prevent migration errors.

### 2. Centralized Access Control
#### [MODIFY] `medchain-server-main/sharing/access_control.py`
Add the shared logic to be used by both the Django ORM and the FastAPI RAG service.
```python
from django.db.models import Q

def get_clinical_visibility_q(requester, patient) -> Q:
    """Returns a Django Q object to filter clinical records (Vitals/Diagnosis/Prescription)."""
    if requester == patient:
        return Q(visibility='PATIENT_VISIBLE')
    
    if getattr(requester, 'role', None) == 'DOCTOR':
        if has_active_grant(requester, patient):
            return Q() # Can see all notes
        return Q(author=requester) # Can only see their own authored notes
        
    return Q(pk__in=[])

def can_view_clinical_chunk(requester_role: str, requester_id: str, patient_id: str, 
                            chunk_author_id: str, chunk_visibility: str, has_grant: bool) -> bool:
    """Scalar boolean check for FAISS RAG retrieval, mirroring the Q logic."""
    if requester_role == 'PATIENT' and str(requester_id) == str(patient_id):
        return chunk_visibility == 'PATIENT_VISIBLE'
        
    if requester_role == 'DOCTOR':
        if str(requester_id) == str(chunk_author_id):
            return True
        return has_grant
        
    return False
```

### 3. RAG Pipeline Updates
To use the shared Django logic, the RAG FastAPI service needs to be able to import from the Django app.

#### [NEW] `medchain-server-main/medchain-rag/django_setup.py`
A small utility to bootstrap Django so FastAPI can import `sharing.access_control`.

#### [MODIFY] `medchain-server-main/medchain-rag/api/routes.py`
- Import and initialize Django at startup via `django_setup.py`.
- Pass the requesting user object/role to the `retrieve` function.

#### [MODIFY] `medchain-server-main/medchain-rag/db/connector.py`
- Update raw SQL queries for Vitals, Diagnoses, and Prescriptions to also fetch `LOWER(CAST(author_id AS TEXT)) AS author_id` and `visibility`.

#### [MODIFY] `medchain-server-main/medchain-rag/ingestion/transformer.py` & `chunker.py`
- Plumb the `author_id` and `visibility` fields through the chunking process.

#### [MODIFY] `medchain-server-main/medchain-rag/embeddings/faiss_store.py` & `retrieval/retriever.py`
- Store `author_id` and `visibility` in `faiss_meta.json`.
- In the `search()` / `retrieve()` functions, filter out chunks that fail the `can_view_clinical_chunk()` check.

## Verification Plan
### Automated Tests
- Run `python manage.py makemigrations` and `python manage.py test`.
- Run `pytest medchain-rag/tests/ -v` to ensure RAG retrieval logic functions seamlessly after integrating Django setup.

### Manual Verification
- Seed new data if necessary.
- Attempt to retrieve a `PROVIDER_ONLY` note as a patient using the `/query` endpoint and verify it is not returned in the RAG context.
