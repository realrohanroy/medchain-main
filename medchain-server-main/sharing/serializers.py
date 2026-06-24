from rest_framework import serializers
from .models import ShareToken, AccessRequest, AccessGrant
from django.contrib.auth import get_user_model

User = get_user_model()

class TargetUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'first_name', 'last_name']

class AccessRequestSerializer(serializers.ModelSerializer):
    doctor_details = TargetUserSerializer(source='doctor', read_only=True)
    patient_details = TargetUserSerializer(source='patient', read_only=True)

    class Meta:
        model = AccessRequest
        fields = '__all__'

class AccessGrantSerializer(serializers.ModelSerializer):
    doctor_details = TargetUserSerializer(source='doctor', read_only=True)
    patient_details = TargetUserSerializer(source='patient', read_only=True)
    
    # Normally we would serialize the records M2M here as well, 
    # but for simplicity we just return their IDs or omit to keep JSON clean.
    class Meta:
        model = AccessGrant
        fields = '__all__'
