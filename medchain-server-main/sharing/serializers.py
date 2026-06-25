from rest_framework import serializers
from .models import ShareToken, AccessRequest, AccessGrant, CareRelationship
from django.contrib.auth import get_user_model
from records.models import Record

User = get_user_model()


# ── Shared nested user detail ──────────────────────────────────────────────────

class TargetUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'first_name', 'last_name']


# ── CareRelationship ───────────────────────────────────────────────────────────

class CareRelationshipSerializer(serializers.ModelSerializer):
    patient_details = TargetUserSerializer(source='patient', read_only=True)
    doctor_details = TargetUserSerializer(source='doctor', read_only=True)

    class Meta:
        model = CareRelationship
        fields = [
            'id', 'patient', 'doctor', 'patient_details', 'doctor_details',
            'status', 'initiated_by', 'relationship_type',
            'started_at', 'ended_at', 'ended_by', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'patient_details', 'doctor_details']


# ── Record manifest (lightweight — no file content, no notes) ─────────────────
# NOTE: covers records.Record (uploaded files) only.
# clinical.Vitals/Diagnosis/Prescription will be added in the §7 task.

class RecordManifestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Record
        fields = ['id', 'record_type', 'record_date', 'doctor_name', 'created_at']


# ── AccessRequest ──────────────────────────────────────────────────────────────

class AccessRequestSerializer(serializers.ModelSerializer):
    # Exposes nested doctor/patient via the care_relationship FK
    doctor_details = TargetUserSerializer(
        source='care_relationship.doctor', read_only=True
    )
    patient_details = TargetUserSerializer(
        source='care_relationship.patient', read_only=True
    )

    class Meta:
        model = AccessRequest
        fields = [
            'id', 'care_relationship', 'doctor_details', 'patient_details',
            'requested_scope', 'requested_records',
            'reason', 'status', 'created_at',
        ]
        read_only_fields = ['id', 'status', 'created_at', 'doctor_details', 'patient_details']


# ── AccessGrant ────────────────────────────────────────────────────────────────

class AccessGrantSerializer(serializers.ModelSerializer):
    doctor_details = TargetUserSerializer(
        source='care_relationship.doctor', read_only=True
    )
    patient_details = TargetUserSerializer(
        source='care_relationship.patient', read_only=True
    )

    class Meta:
        model = AccessGrant
        fields = [
            'id', 'care_relationship', 'doctor_details', 'patient_details',
            'scope', 'records', 'granted_at', 'revoked_at',
        ]
        read_only_fields = ['id', 'doctor_details', 'patient_details']
