import uuid
import secrets
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

from records.models import Record


def generate_secure_token():
    return secrets.token_urlsafe(32)


def default_expiry():
    return timezone.now() + timedelta(hours=1)


# ── ShareToken (unchanged) ─────────────────────────────────────────────────────

class ShareToken(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='share_tokens')
    token = models.CharField(max_length=64, unique=True, db_index=True, default=generate_secure_token)
    record = models.ForeignKey(Record, null=True, blank=True, on_delete=models.CASCADE, related_name='share_tokens')
    expires_at = models.DateTimeField(default=default_expiry)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        return timezone.now() < self.expires_at

    def __str__(self):
        return f"Share token for {self.user.email}"


# ── CareRelationship ───────────────────────────────────────────────────────────
# Tier 1: "we are connected" — identity + relationship, no data access on its own.
# A connected doctor may view the record manifest and write new visit entries.
# It does NOT grant access to pre-existing history content.

class CareRelationship(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACTIVE', 'Active'),
        ('ENDED', 'Ended'),
        ('DENIED', 'Denied'),
    ]
    INITIATED_BY_CHOICES = [
        ('PATIENT_QR', 'Patient QR Scan'),
        ('DOCTOR_CODE', 'Doctor Code Entry'),
    ]
    TYPE_CHOICES = [
        ('PRIMARY', 'Primary'),
        ('SPECIALIST', 'Specialist'),
        ('REFERRAL', 'Referral'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='care_relationships_as_patient'
    )
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='care_relationships_as_doctor'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    initiated_by = models.CharField(max_length=20, choices=INITIATED_BY_CHOICES)
    relationship_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='PRIMARY')
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    # Either side can end the relationship; records who initiated the end.
    ended_by = models.CharField(
        max_length=20,
        choices=[('PATIENT', 'Patient'), ('DOCTOR', 'Doctor')],
        null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('patient', 'doctor')

    def __str__(self):
        return f"CareRelationship {self.doctor.email} → {self.patient.email} [{self.status}]"


# ── AccessRequest ──────────────────────────────────────────────────────────────
# Tier 2: "can I see your history?" — a connected doctor asking, optionally scoped.
# Requires an ACTIVE CareRelationship. Old doctor/patient FKs removed;
# both parties are accessible via care_relationship.doctor / care_relationship.patient.

class AccessRequest(models.Model):
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Declined', 'Declined'),
    )
    SCOPE_CHOICES = [
        ('FULL', 'Full History'),
        ('SELECTED', 'Selected Records'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    care_relationship = models.ForeignKey(
        CareRelationship, on_delete=models.CASCADE, related_name='access_requests', null=True, blank=True
    )
    requested_scope = models.CharField(
        max_length=20, choices=SCOPE_CHOICES, default='FULL'
    )
    # Populated only when requested_scope == 'SELECTED'.
    # On approval, these are copied to AccessGrant.records via grant.records.set(...)
    requested_records = models.ManyToManyField(Record, blank=True, related_name='access_requests')
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (
            f"AccessRequest {self.care_relationship.doctor.email} → "
            f"{self.care_relationship.patient.email} [{self.status}]"
        )


# ── AccessGrant ────────────────────────────────────────────────────────────────
# Tier 3: "yes, you may" — the actual permission.
# One grant per CareRelationship (OneToOne). Scope starts at NONE on connection;
# elevated to FULL or SELECTED when a request is approved or patient proactively grants.
# Revoke = PATCH scope back to NONE + set revoked_at. No DELETE endpoint exists.

class AccessGrant(models.Model):
    SCOPE_CHOICES = [
        ('NONE', 'No History Access'),
        ('FULL', 'Full History'),
        ('SELECTED', 'Selected Records'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    care_relationship = models.OneToOneField(
        CareRelationship, on_delete=models.CASCADE, related_name='access_grant', null=True, blank=True
    )
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default='NONE')
    # Populated only when scope == 'SELECTED'. For FULL scope,
    # get_accessible_record_ids() resolves dynamically — no stored list needed.
    records = models.ManyToManyField(Record, related_name='grants', blank=True)
    granted_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return (
            f"AccessGrant {self.care_relationship.doctor.email} → "
            f"{self.care_relationship.patient.email} [{self.scope}]"
        )
