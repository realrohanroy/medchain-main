import uuid
from django.db import models
from records.models import Record

class ParsedData(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    record = models.ForeignKey(Record, on_delete=models.CASCADE, related_name='parsed_data')
    key = models.CharField(max_length=100)
    value = models.TextField()
    extracted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.key}: {self.value}"
