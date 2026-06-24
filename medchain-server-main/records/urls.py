from django.urls import path
from .views import RecordUploadView, RecordTimelineView, DoctorPatientRecordsView

urlpatterns = [
    path('', RecordTimelineView.as_view(), name='record_timeline'),
    path('upload/', RecordUploadView.as_view(), name='record_upload'),
    path('patient/<uuid:patient_id>/', DoctorPatientRecordsView.as_view(), name='doctor_patient_records'),
]
