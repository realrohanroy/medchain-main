"""
Integration test for /synthesize endpoint filtering.
"""
import sys
import os
import pytest
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from django_setup import init_django
init_django()

from fastapi.testclient import TestClient
from main import app  # Assuming main.py exists

client = TestClient(app)

def test_synthesize_filters_ungranted_content():
    """
    Test that /synthesize excludes ungranted content.
    We mock retrieve()/search() to return a MIX of granted and ungranted chunks.
    Then we let the real filtering and LLM generation run.
    Finally, we assert the actual synthesized output excludes the ungranted content.
    """
    from unittest.mock import patch, MagicMock
    import uuid

    mock_search_results = [
        {"text": "Patient has a highly confidential diagnosis of UNGRANTED_DISEASE_XYZ.", "source_type": "record", "source_id": "00000000-0000-0000-0000-000000000001", "patient_id": "pat-1"},
        {"text": "Patient had a routine checkup for GRANTED_CONDITION_ABC.", "source_type": "record", "source_id": "00000000-0000-0000-0000-000000000002", "patient_id": "pat-1"},
        {"text": "Patient was prescribed UNGRANTED_MEDICATION_123.", "source_type": "record", "source_id": "00000000-0000-0000-0000-000000000003", "patient_id": "pat-1"},
    ]

    with patch("retrieval.retriever.search", return_value=mock_search_results), \
         patch("sharing.access_control.has_active_grant", return_value=True), \
         patch("users.models.CustomUser.objects.get") as mock_get_user, \
         patch("sharing.access_control.get_accessible_record_ids", return_value=[uuid.UUID("00000000-0000-0000-0000-000000000002")]):
        
        # We mock CustomUser.objects.get to return a mock user so has_active_grant doesn't fail
        mock_get_user.return_value = MagicMock()

        # Because get_current_user is a Depends, we must override the dependency on the app
        from api.routes import get_current_user
        app.dependency_overrides[get_current_user] = lambda: {"role": "DOCTOR", "user_id": "doc-1", "email": "doc@test.com"}

        # Call the actual endpoint. The LLM will generate a summary based only on GRANTED_CONDITION_ABC
        response = client.post("/api/v1/synthesize", json={"patient_id": "pat-1"})
        
        assert response.status_code == 200
        data = response.json()
        
        summary = data["summary"]
        
        # Assertions on the actual LLM output string
        assert "UNGRANTED_DISEASE_XYZ" not in summary, "Output must NOT contain ungranted disease."
        assert "UNGRANTED_MEDICATION_123" not in summary, "Output must NOT contain ungranted medication."
        
        # Check that the source list also only contains the granted source
        sources = data["sources"]
        assert len(sources) == 1
        assert sources[0]["source_id"] == "00000000-0000-0000-0000-000000000002"

        # Cleanup override
        app.dependency_overrides = {}
