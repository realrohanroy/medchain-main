from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model

import uuid
import logging

from .models import ShareToken, CareRelationship, AccessRequest, AccessGrant
from .serializers import (
    AccessRequestSerializer, AccessGrantSerializer, 
    CareRelationshipSerializer, RecordManifestSerializer
)
from records.models import Record
from records.serializers import RecordTimelineSerializer
from records.pagination import StandardResultsSetPagination
from .access_control import has_active_relationship, has_active_grant, get_accessible_record_ids

logger = logging.getLogger(__name__)
User = get_user_model()


# ── Share Tokens (unchanged) ───────────────────────────────────────────────────

class GenerateShareTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        record_id = request.data.get('record_id')
        record = None

        if record_id:
            try:
                record_uuid = uuid.UUID(record_id)
                record = Record.objects.get(id=record_uuid, user=request.user)
            except (ValueError, ValidationError, Record.DoesNotExist):
                return Response(
                    {"error": "Record not found or access denied."},
                    status=status.HTTP_404_NOT_FOUND
                )

            ShareToken.objects.filter(user=request.user, record=record).delete()
        else:
            ShareToken.objects.filter(user=request.user, record__isnull=True).delete()

        share_token = ShareToken.objects.create(user=request.user, record=record)
        share_url = request.build_absolute_uri(f"/share/{share_token.token}/")

        logger.info(
            f"Share token generated | user_id={request.user.id} | token={share_token.token}"
        )

        return Response({
            "token": share_token.token,
            "share_url": share_url,
            "expires_at": share_token.expires_at,
            "record_id": share_token.record.id if share_token.record else None
        }, status=status.HTTP_201_CREATED)


class AccessSharedRecordsView(APIView):
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination

    def get(self, request, token):
        try:
            share_token = ShareToken.objects.get(token=token)
        except ShareToken.DoesNotExist:
            return Response({"error": "Invalid or expired token"}, status=status.HTTP_404_NOT_FOUND)

        if not share_token.is_valid():
            return Response({"error": "Invalid or expired token"}, status=status.HTTP_404_NOT_FOUND)

        ip = request.META.get('REMOTE_ADDR', 'Unknown IP')
        logger.info(
            f"Share token accessed | token_owner_id={share_token.user.id} | token={share_token.token} | ip={ip}"
        )

        if share_token.record and share_token.record.user_id == share_token.user_id:
            serializer = RecordTimelineSerializer(
                [share_token.record],
                many=True,
                context={'request': request}
            )
            return Response(serializer.data, status=status.HTTP_200_OK)

        records = Record.objects.filter(user=share_token.user)\
            .select_related('blockchain_tx')\
            .order_by('-record_date', '-created_at')

        paginator = self.pagination_class()
        paginated_records = paginator.paginate_queryset(records, request, view=self)

        if paginated_records is not None:
            serializer = RecordTimelineSerializer(
                paginated_records,
                many=True,
                context={'request': request}
            )
            return paginator.get_paginated_response(serializer.data)

        serializer = RecordTimelineSerializer(records, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


# ── CareRelationship ───────────────────────────────────────────────────────────

class CareRelationshipViewSet(viewsets.ModelViewSet):
    serializer_class = CareRelationshipSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'DOCTOR':
            return CareRelationship.objects.filter(doctor=user).order_by('-created_at')
        return CareRelationship.objects.filter(patient=user).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def connect(self, request):
        """Patient QR scan: connect to doctor using token"""
        if request.user.role != 'PATIENT':
            return Response({"error": "Only patients can initiate QR connection"}, status=status.HTTP_403_FORBIDDEN)
        
        token = request.data.get('token')
        if not token:
            return Response({"error": "Token is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            doctor = User.objects.get(connection_token=token, role='DOCTOR')
        except User.DoesNotExist:
            return Response({"error": "Invalid connection token"}, status=status.HTTP_404_NOT_FOUND)

        rel, created = CareRelationship.objects.get_or_create(
            patient=request.user,
            doctor=doctor,
            defaults={
                'status': 'ACTIVE',
                'initiated_by': 'PATIENT_QR',
                'started_at': timezone.now()
            }
        )
        
        if not created and rel.status == 'ENDED':
            rel.status = 'ACTIVE'
            rel.ended_at = None
            rel.ended_by = None
            rel.started_at = timezone.now()
            rel.save()
            
        # Ensure a grant always exists
        AccessGrant.objects.get_or_create(care_relationship=rel, defaults={'scope': 'NONE'})

        return Response(self.get_serializer(rel).data, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Path 2 forward-compatibility stub: Patient accepts a pending connection request"""
        return Response({"status": "Not implemented (Path 2 deferred)"}, status=status.HTTP_501_NOT_IMPLEMENTED)

    @action(detail=True, methods=['post'])
    def deny(self, request, pk=None):
        """Path 2 forward-compatibility stub: Patient denies a pending connection request"""
        return Response({"status": "Not implemented (Path 2 deferred)"}, status=status.HTTP_501_NOT_IMPLEMENTED)

    @action(detail=True, methods=['post'])
    def end(self, request, pk=None):
        """End the relationship"""
        rel = self.get_object()
        if rel.status != 'ACTIVE':
            return Response({"error": "Relationship is not ACTIVE"}, status=status.HTTP_400_BAD_REQUEST)
        
        rel.status = 'ENDED'
        rel.ended_at = timezone.now()
        rel.ended_by = 'PATIENT' if request.user.role == 'PATIENT' else 'DOCTOR'
        rel.save()
        return Response(self.get_serializer(rel).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def manifest(self, request, pk=None):
        """
        Lightweight metadata only.
        Gate: has_active_relationship (connection alone is sufficient).
        """
        rel = self.get_object()
        
        # Security check: must be active connection
        if not has_active_relationship(request.user, rel.patient):
            return Response({"error": "No active connection to patient"}, status=status.HTTP_403_FORBIDDEN)
            
        records = Record.objects.filter(user=rel.patient).order_by('-record_date')
        serializer = RecordManifestSerializer(records, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ── AccessRequest ──────────────────────────────────────────────────────────────

class AccessRequestViewSet(viewsets.ModelViewSet):
    serializer_class = AccessRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'DOCTOR':
            return AccessRequest.objects.filter(care_relationship__doctor=user).order_by('-created_at')
        return AccessRequest.objects.filter(care_relationship__patient=user).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        if request.user.role != 'DOCTOR':
            return Response({"error": "Only doctors can request access."}, status=status.HTTP_403_FORBIDDEN)
            
        care_relationship_id = request.data.get('care_relationship')
        if not care_relationship_id:
            return Response({"error": "care_relationship is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            rel = CareRelationship.objects.get(id=care_relationship_id, doctor=request.user, status='ACTIVE')
        except CareRelationship.DoesNotExist:
            return Response({"error": "Active care relationship not found."}, status=status.HTTP_404_NOT_FOUND)

        if AccessRequest.objects.filter(care_relationship=rel, status='Pending').exists():
            return Response({"error": "A pending request already exists for this patient."}, status=status.HTTP_400_BAD_REQUEST)

        access_request = AccessRequest.objects.create(
            care_relationship=rel,
            requested_scope=request.data.get('requested_scope', 'FULL'),
            reason=request.data.get('reason', '')
        )
        
        record_ids = request.data.get('requested_records', [])
        if record_ids and access_request.requested_scope == 'SELECTED':
            access_request.requested_records.set(record_ids)
            
        serializer = self.get_serializer(access_request)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        access_request = self.get_object()
        if access_request.care_relationship.patient != request.user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        access_request.status = 'Approved'
        access_request.save()

        # Update Grant
        grant, _ = AccessGrant.objects.get_or_create(care_relationship=access_request.care_relationship)
        grant.scope = access_request.requested_scope
        grant.granted_at = timezone.now()
        grant.revoked_at = None
        
        if access_request.requested_scope == 'SELECTED':
            grant.records.set(access_request.requested_records.all())
            
        grant.save()
        return Response({"status": "Approved"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        access_request = self.get_object()
        if access_request.care_relationship.patient != request.user:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        access_request.status = 'Declined'
        access_request.save()
        return Response({"status": "Declined"}, status=status.HTTP_200_OK)


# ── AccessGrant ────────────────────────────────────────────────────────────────

class AccessGrantViewSet(viewsets.ModelViewSet):
    serializer_class = AccessGrantSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'head', 'options']  # No DELETE

    def get_queryset(self):
        user = self.request.user
        if user.role == 'DOCTOR':
            return AccessGrant.objects.filter(care_relationship__doctor=user).order_by('-granted_at')
        return AccessGrant.objects.filter(care_relationship__patient=user).order_by('-granted_at')

    @action(detail=True, methods=['patch'])
    def set_scope(self, request, pk=None):
        """Widen, narrow, or revoke access."""
        grant = self.get_object()
        if grant.care_relationship.patient != request.user:
            return Response({"error": "Only the patient can modify grant scope."}, status=status.HTTP_403_FORBIDDEN)
            
        scope = request.data.get('scope')
        if scope not in ['NONE', 'SELECTED', 'FULL']:
            return Response({"error": "Invalid scope"}, status=status.HTTP_400_BAD_REQUEST)
            
        grant.scope = scope
        if scope == 'NONE':
            grant.revoked_at = timezone.now()
            grant.records.clear()
        else:
            grant.revoked_at = None
            if scope == 'SELECTED':
                record_ids = request.data.get('record_ids', [])
                grant.records.set(record_ids)
            elif scope == 'FULL':
                grant.records.clear() # Not needed for full
                
        grant.save()
        return Response(self.get_serializer(grant).data, status=status.HTTP_200_OK)


# ── Records View (Patient API view for single doctor) ──────────────────────────

class GrantedPatientRecordsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, patient_id):
        # Uses the unified access control check
        accessible_ids = get_accessible_record_ids(request.user, patient_id)
        
        if not accessible_ids.exists():
             return Response({"error": "Access denied. Patient has not granted you access."}, status=status.HTTP_403_FORBIDDEN)
             
        records = Record.objects.filter(id__in=accessible_ids)\
            .select_related('blockchain_tx')\
            .order_by('-record_date', '-created_at')
            
        serializer = RecordTimelineSerializer(records, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
