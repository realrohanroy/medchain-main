"""
sharing/access_control.py

Single source of truth for all doctor→patient access checks.

AGENTS.md rule: never duplicate this logic in two places.
Both Django views AND the RAG service must import from here — never
re-implement has_active_grant() or get_accessible_record_ids() elsewhere.
"""
from .models import CareRelationship, AccessGrant
from records.models import Record


def has_active_relationship(doctor, patient) -> bool:
    """
    Returns True if an ACTIVE CareRelationship exists between this doctor
    and patient. Connection alone — no history access implied.

    Use for: manifest access, allowing doctor to write new visit entries.
    Do NOT use for: gating record content reads (use has_active_grant instead).
    """
    return CareRelationship.objects.filter(
        doctor=doctor, patient=patient, status='ACTIVE'
    ).exists()


def has_active_grant(doctor, patient) -> bool:
    """
    Returns True if doctor holds an ACTIVE CareRelationship to patient
    AND that relationship's AccessGrant has scope != 'NONE' and is not revoked.

    Single source of truth — call this from views AND RAG service.
    Never duplicate this logic.
    """
    try:
        rel = CareRelationship.objects.get(
            doctor=doctor, patient=patient, status='ACTIVE'
        )
        grant = rel.access_grant  # OneToOne reverse
        return grant.scope != 'NONE' and grant.revoked_at is None
    except (CareRelationship.DoesNotExist, AccessGrant.DoesNotExist):
        return False


def get_accessible_record_ids(doctor, patient):
    """
    Returns a QuerySet of Record IDs this doctor may read for this patient:
      - scope='FULL'     → all of patient's records (resolved dynamically)
      - scope='SELECTED' → only the M2M records stored on the AccessGrant
      - scope='NONE' or no active grant → empty QuerySet

    Use this to FILTER the record queryset, not just gate access.
    Called from DoctorPatientRecordsView, GrantedPatientRecordsView,
    and DoctorAnalyticsView — never re-implement in a fourth place.
    """
    try:
        rel = CareRelationship.objects.get(
            doctor=doctor, patient=patient, status='ACTIVE'
        )
        grant = rel.access_grant
        if grant.revoked_at is not None or grant.scope == 'NONE':
            return Record.objects.none()
        if grant.scope == 'FULL':
            return Record.objects.filter(user=patient).values_list('id', flat=True)
        if grant.scope == 'SELECTED':
            return grant.records.values_list('id', flat=True)
    except (CareRelationship.DoesNotExist, AccessGrant.DoesNotExist):
        pass
    return Record.objects.none()


def has_active_full_grant(doctor, patient) -> bool:
    """
    Returns True if doctor holds an ACTIVE CareRelationship to patient
    AND that relationship's AccessGrant has scope == 'FULL' and is not revoked.
    """
    try:
        rel = CareRelationship.objects.get(
            doctor=doctor, patient=patient, status='ACTIVE'
        )
        grant = rel.access_grant
        return grant.scope == 'FULL' and grant.revoked_at is None
    except (CareRelationship.DoesNotExist, AccessGrant.DoesNotExist):
        return False


from django.db.models import Q

def get_clinical_visibility_q(requester, patient) -> Q:
    """
    Returns a Django Q object to filter clinical records (Vitals, Diagnosis, Prescription)
    for the direct Django API.
    """
    if requester == patient:
        return Q(visibility='PATIENT_VISIBLE')
        
    if getattr(requester, 'role', None) == 'DOCTOR':
        if has_active_full_grant(requester, patient):
            return Q() # Can see all notes
        return Q(author=requester) # Can only see their own authored notes
        
    return Q(pk__in=[])


def can_view_clinical_chunk(requester_role: str, requester_id: str, patient_id: str, 
                            chunk_author_id: str, chunk_visibility: str, has_full_grant: bool) -> bool:
    """
    Scalar boolean check for FAISS RAG retrieval, mirroring the Q logic.
    - has_full_grant is pre-computed using has_active_full_grant(requester, patient)
    """
    if requester_role == 'PATIENT' and str(requester_id) == str(patient_id):
        return chunk_visibility == 'PATIENT_VISIBLE'
        
    if requester_role == 'DOCTOR':
        if str(chunk_author_id) and str(requester_id) == str(chunk_author_id):
            return True
        return has_full_grant
        
    return False
