import uuid
import secrets
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _


def generate_connection_token():
    return secrets.token_urlsafe(32)


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    class RoleChoices(models.TextChoices):
        PATIENT = 'PATIENT', _('Patient')
        DOCTOR = 'DOCTOR', _('Doctor')

    username = None  # Remove default username field
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True)
    role = models.CharField(max_length=10, choices=RoleChoices.choices, default=RoleChoices.PATIENT)

    # Doctor-only QR connection token. Patients scan/paste this to establish a
    # CareRelationship via POST /share/care/connect/. Stable across sessions;
    # manually rotatable via POST /auth/me/connection-qr/regenerate/.
    # Blank for patient accounts — generated lazily on first QR request for doctors.
    connection_token = models.CharField(
        max_length=64, unique=True, null=True, blank=True,
        db_index=True, default=None,
        help_text="Doctor-only QR connection token. Null for patients."
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    objects = CustomUserManager()

    def __str__(self):
        return self.email
