from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import UserSerializer

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        from .models import CustomUser
        if email and CustomUser.objects.filter(email=email).exists():
            return Response(
                {"detail": "An account with this email already exists. Please log in."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {"message": "User registered successfully", "user_id": user.id, "role": user.role}, 
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        # exclude password from response
        data = dict(serializer.data)
        data.pop('password', None)
        return Response(data, status=status.HTTP_200_OK)

from sharing.models import AccessGrant, CareRelationship
from sharing.access_control import get_accessible_record_ids
from appointments.models import Appointment
from records.models import Record

class DoctorAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'DOCTOR':
            return Response({"error": "Only doctors can view analytics."}, status=status.HTTP_403_FORBIDDEN)

        # 1. Total unique patients the doctor has an active connection with
        active_rels = CareRelationship.objects.filter(doctor=request.user, status='ACTIVE').select_related('patient')
        total_patients = active_rels.count()

        # 2. Total appointments
        total_appointments = Appointment.objects.filter(doctor=request.user).count()

        # 3. Total records accessible
        # Reuses the same logic as record retrieval views — never a separate implementation
        total_records = sum(
            get_accessible_record_ids(request.user, rel.patient).count()
            for rel in active_rels
        )

        # 4. Breakdown of record types for charts
        # Since we use free-form record_type in Record model, we group by it
        from django.db.models import Count
        # Fetch accessible record IDs again to filter records for grouping
        accessible_ids_all = []
        for rel in active_rels:
            accessible_ids_all.extend(get_accessible_record_ids(request.user, rel.patient))
        
        accessible_records = Record.objects.filter(id__in=accessible_ids_all)
        record_distribution = accessible_records.values('record_type').annotate(count=Count('id'))
        
        # Build dictionary for the donut chart
        types_breakdown = {}
        for item in record_distribution:
            rt = item['record_type'] or "Uncategorized"
            types_breakdown[rt] = item['count']

        return Response({
            "total_patients": total_patients,
            "total_appointments": total_appointments,
            "total_records": total_records,
            "record_types": types_breakdown
        }, status=status.HTTP_200_OK)


class DoctorListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        doctors = User.objects.filter(role='DOCTOR')
        data = []
        for doc in doctors:
            first = doc.first_name or ''
            last = doc.last_name or ''
            full_name = f"{first} {last}".strip()
            if not full_name:
                full_name = doc.email.split('@')[0]
            
            if not full_name.lower().startswith('dr.'):
                full_name = f"Dr. {full_name}"

            specialty = "General Medicine"
            email_lower = doc.email.lower()
            if 'harpreet' in email_lower:
                specialty = "Cardiology"
            elif 'subramaniam' in email_lower:
                specialty = "Dermatology"
            elif 'rohan' in email_lower:
                specialty = "Neurology"
            elif 'alok' in email_lower:
                specialty = "Orthopedics"
            elif 'shah' in email_lower:
                specialty = "General Medicine"
            elif 'laukik' in email_lower:
                specialty = "Pulmonology"
            elif 'rocky' in email_lower:
                specialty = "Cardiology"
            
            data.append({
                "id": str(doc.id),
                "email": doc.email,
                "name": full_name,
                "specialty": specialty
            })
        return Response(data, status=status.HTTP_200_OK)


from django.conf import settings
from .jwt import CustomTokenObtainPairSerializer
from .models import CustomUser
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        credential = request.data.get('credential')
        if not credential:
            return Response(
                {"error": "Google credential token is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Verify the Google ID token
            idinfo = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )

            email = idinfo.get('email')
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')

            if not email:
                return Response(
                    {"error": "Unable to retrieve email from Google token."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            flow = request.data.get('flow', 'login')

            # Check if user already exists
            user = CustomUser.objects.filter(email=email).first()

            if flow == 'login':
                if not user:
                    return Response(
                        {"detail": "No account found with this email. Please register first."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            elif flow == 'register':
                if user:
                    return Response(
                        {"detail": "An account with this email already exists. Please log in."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                # Create new user
                role = request.data.get('role', 'PATIENT')
                if role not in ('PATIENT', 'DOCTOR'):
                    role = 'PATIENT'

                user = CustomUser.objects.create_user(
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    role=role,
                )
                return Response(
                    {"message": "User registered successfully. Please log in."},
                    status=status.HTTP_201_CREATED
                )

            # Generate JWT tokens
            token = CustomTokenObtainPairSerializer.get_token(user)

            return Response({
                "access": str(token.access_token),
                "refresh": str(token),
                "role": user.role,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "user_id": str(user.id),
            }, status=status.HTTP_200_OK)

        except ValueError:
            return Response(
                {"error": "Invalid Google token."},
                status=status.HTTP_401_UNAUTHORIZED
            )


from users.models import generate_connection_token

class DoctorConnectionQRView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'DOCTOR':
            return Response({"error": "Only doctors can have connection QRs."}, status=status.HTTP_403_FORBIDDEN)
            
        if not request.user.connection_token:
            request.user.connection_token = generate_connection_token()
            request.user.save(update_fields=['connection_token'])
            
        qr_data = f"medchain:connect:{request.user.connection_token}"
        return Response({
            "token": request.user.connection_token,
            "qr_data": qr_data
        }, status=status.HTTP_200_OK)


class DoctorConnectionQRRegenerateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'DOCTOR':
            return Response({"error": "Only doctors can regenerate connection QRs."}, status=status.HTTP_403_FORBIDDEN)
            
        request.user.connection_token = generate_connection_token()
        request.user.save(update_fields=['connection_token'])
        
        qr_data = f"medchain:connect:{request.user.connection_token}"
        return Response({
            "token": request.user.connection_token,
            "qr_data": qr_data
        }, status=status.HTTP_200_OK)


