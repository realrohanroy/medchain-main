from django.test import TestCase
from django.contrib.auth import get_user_model
from sharing.access_control import (
    get_clinical_visibility_q,
    can_view_clinical_chunk,
    has_active_full_grant
)
from sharing.models import CareRelationship, AccessGrant
from clinical.models import Vitals

User = get_user_model()

class ClinicalVisibilityMatrixTest(TestCase):
    def setUp(self):
        # Create base patient
        self.patient = User.objects.create_user(
            email='patient@test.com',
            password='password',
            role='PATIENT'
        )
        
        # Create a doctor
        self.doctor = User.objects.create_user(
            email='doctor@test.com',
            password='password',
            role='DOCTOR'
        )

        # Create another patient
        self.other_patient = User.objects.create_user(
            email='other_patient@test.com',
            password='password',
            role='PATIENT'
        )

        # Create another doctor
        self.other_doctor = User.objects.create_user(
            email='other_doctor@test.com',
            password='password',
            role='DOCTOR'
        )

    def test_visibility_matrix(self):
        roles = ['PATIENT', 'DOCTOR']
        visibilities = ['PATIENT_VISIBLE', 'PROVIDER_ONLY']
        author_matches = [True, False]
        grant_scopes = [None, 'NONE', 'SELECTED', 'FULL']

        for role in roles:
            for visibility in visibilities:
                for author_match in author_matches:
                    if role == 'PATIENT':
                        for same_patient in [True, False]:
                            requester = self.patient if same_patient else self.other_patient
                            author = requester if author_match else self.other_doctor
                            
                            self._run_scenario(
                                requester=requester,
                                patient=self.patient,
                                author=author,
                                visibility=visibility,
                                has_grant_scope=None,
                                description=f"Role: PATIENT, SamePatient: {same_patient}, Visibility: {visibility}, AuthorMatch: {author_match}"
                            )
                    elif role == 'DOCTOR':
                        for grant_scope in grant_scopes:
                            requester = self.doctor
                            author = requester if author_match else self.other_doctor
                            
                            self._run_scenario(
                                requester=requester,
                                patient=self.patient,
                                author=author,
                                visibility=visibility,
                                has_grant_scope=grant_scope,
                                description=f"Role: DOCTOR, GrantScope: {grant_scope}, Visibility: {visibility}, AuthorMatch: {author_match}"
                            )

    def _run_scenario(self, requester, patient, author, visibility, has_grant_scope, description):
        # Clean up any existing care relationships / grants for patient/requester
        CareRelationship.objects.filter(patient=patient).delete()
        Vitals.objects.filter(user=patient).delete()

        # Set up grant if applicable
        if has_grant_scope is not None and requester.role == 'DOCTOR':
            rel = CareRelationship.objects.create(
                doctor=requester,
                patient=patient,
                status='ACTIVE',
                initiated_by='PATIENT_QR'
            )
            AccessGrant.objects.create(
                care_relationship=rel,
                scope=has_grant_scope
            )

        # Create vitals record
        record = Vitals.objects.create(
            user=patient,
            author=author,
            visibility=visibility,
            notes='Test note'
        )

        # Django Q check
        visibility_q = get_clinical_visibility_q(requester, patient)
        django_allowed = Vitals.objects.filter(user=patient).filter(visibility_q).filter(id=record.id).exists()

        # RAG check
        has_full = has_active_full_grant(requester, patient)
        rag_allowed = can_view_clinical_chunk(
            requester_role=requester.role,
            requester_id=str(requester.id),
            patient_id=str(patient.id),
            chunk_author_id=str(record.author_id) if record.author_id else "",
            chunk_visibility=record.visibility,
            has_full_grant=has_full
        )

        # Assert parity
        self.assertEqual(
            django_allowed, 
            rag_allowed, 
            msg=f"Mismatch in scenario: {description}. Django allowed: {django_allowed}, RAG allowed: {rag_allowed}"
        )
