from django.urls import path
from .views import ClinicalRecordsListView

urlpatterns = [
    path('patient/<uuid:patient_id>/', ClinicalRecordsListView.as_view(), name='clinical_records_list'),
]
