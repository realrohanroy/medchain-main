import uuid
from django.db import models
from django.conf import settings

class Record(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='records', db_index=True)
    record_type = models.CharField(max_length=100, blank=True)
    record_date = models.DateField(blank=True, null=True, db_index=True)
    doctor_name = models.CharField(max_length=200, blank=True)
    file_url = models.FileField(upload_to='uploads/')
    file_hash = models.CharField(max_length=64, help_text="SHA-256 hash of the file contents", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    source_facility = models.CharField(max_length=200, blank=True)
    date_confidence = models.CharField(
        max_length=20,
        choices=[('EXACT', 'Exact'), ('APPROXIMATE', 'Approximate'), ('UNKNOWN', 'Unknown')],
        default='UNKNOWN'
    )

    class Meta:
        indexes = [
            models.Index(fields=['user', 'record_date']),
        ]

    def __str__(self):
        return f"Record {self.id} for {self.user.email}"
