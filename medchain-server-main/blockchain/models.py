import uuid
from django.db import models
from records.models import Record

class BlockchainTransaction(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('FAILED', 'Failed')
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    record = models.OneToOneField(Record, on_delete=models.CASCADE, related_name='blockchain_tx')
    tx_hash = models.CharField(max_length=66, blank=True, null=True, help_text="Blockchain transaction hash")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Tx {self.tx_hash} ({self.status})"
