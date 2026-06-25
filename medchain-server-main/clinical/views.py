from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from sharing.access_control import get_clinical_visibility_q, has_active_relationship
from .models import Vitals, Diagnosis, Prescription
from .serializers import VitalsSerializer, DiagnosisSerializer, PrescriptionSerializer

User = get_user_model()

class ClinicalRecordsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, patient_id):
        patient = get_object_or_404(User, id=patient_id)
        
        # Access Check:
        # A patient can read their own clinical records.
        # A doctor can read a patient's clinical records if they have an active care relationship.
        if request.user.role == 'DOCTOR':
            if not has_active_relationship(request.user, patient):
                return Response(
                    {"error": "You do not have an active care relationship with this patient."}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        elif request.user != patient:
            return Response(
                {"error": "You do not have access to this resource."}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Get visibility filter Q object
        visibility_q = get_clinical_visibility_q(request.user, patient)
        
        # Query and filter each model
        vitals = Vitals.objects.filter(user=patient).filter(visibility_q)
        diagnoses = Diagnosis.objects.filter(user=patient).filter(visibility_q)
        prescriptions = Prescription.objects.filter(user=patient).filter(visibility_q)
        
        # Serialize the results
        vitals_data = VitalsSerializer(vitals, many=True).data
        diagnoses_data = DiagnosisSerializer(diagnoses, many=True).data
        prescriptions_data = PrescriptionSerializer(prescriptions, many=True).data
        
        return Response({
            "vitals": vitals_data,
            "diagnoses": diagnoses_data,
            "prescriptions": prescriptions_data
        }, status=status.HTTP_200_OK)
