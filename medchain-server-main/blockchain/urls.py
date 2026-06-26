from django.urls import path
from .views import VerifyHashView

urlpatterns = [
    path('verify/<uuid:record_id>/', VerifyHashView.as_view(), name='verify-hash'),
]
