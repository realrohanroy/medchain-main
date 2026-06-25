"""
Retrieval unit tests — tests context builder without requiring a real FAISS index.
Run with: pytest tests/test_retrieval.py -v
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from django_setup import init_django
init_django()

from retrieval.retriever import build_context


def test_build_context_empty():
    ctx = build_context([])
    assert "No relevant" in ctx


def test_build_context_single_chunk():
    chunks = [
        {
            "text": "Patient Alice — Blood Test on 2024-01-15",
            "source_type": "record",
            "source_id": "r1",
            "patient_id": "p1",
            "score": 0.1,
        }
    ]
    ctx = build_context(chunks)
    assert "Alice" in ctx
    assert "Context 1" in ctx
    assert "Record" in ctx


def test_build_context_multiple_chunks():
    chunks = [
        {"text": "Chunk A", "source_type": "record",      "source_id": "r1", "patient_id": "p1", "score": 0.1},
        {"text": "Chunk B", "source_type": "appointment", "source_id": "a1", "patient_id": "p1", "score": 0.2},
    ]
    ctx = build_context(chunks)
    assert "Context 1" in ctx
    assert "Context 2" in ctx
    assert "Appointment" in ctx
    assert "---" in ctx  # separator between chunks


def test_selected_scope_filtering_integration():
    """
    Test that retrieve() filters out ungranted record chunks when a doctor
    queries under SELECTED scope.
    """
    from unittest.mock import patch, MagicMock
    import uuid
    from retrieval.retriever import retrieve

    mock_search_results = [
        {"text": "Record 1 content", "source_type": "record", "source_id": "rec-1", "patient_id": "pat-1"},
        {"text": "Record 2 content", "source_type": "record", "source_id": "rec-2", "patient_id": "pat-1"},
        {"text": "Record 3 content", "source_type": "record", "source_id": "rec-3", "patient_id": "pat-1"},
        {"text": "Record 4 content", "source_type": "record", "source_id": "rec-4", "patient_id": "pat-1"},
        {"text": "Record 5 content", "source_type": "record", "source_id": "rec-5", "patient_id": "pat-1"},
    ]

    with patch("retrieval.retriever.search", return_value=mock_search_results) as mock_search, \
         patch("users.models.CustomUser.objects.get") as mock_get_user, \
         patch("sharing.access_control.get_accessible_record_ids") as mock_get_accessible:
        
        # Setup mocks
        mock_doctor = MagicMock()
        mock_patient = MagicMock()
        mock_get_user.side_effect = [mock_doctor, mock_patient]
        
        # Doctor only has access to rec-1 and rec-3
        mock_get_accessible.return_value = [
            uuid.UUID("00000000-0000-0000-0000-000000000001"), 
            uuid.UUID("00000000-0000-0000-0000-000000000003")
        ]
        
        # Modify the mock search results to use these UUIDs
        mock_search_results[0]["source_id"] = "00000000-0000-0000-0000-000000000001"
        mock_search_results[1]["source_id"] = "00000000-0000-0000-0000-000000000002"
        mock_search_results[2]["source_id"] = "00000000-0000-0000-0000-000000000003"
        mock_search_results[3]["source_id"] = "00000000-0000-0000-0000-000000000004"
        mock_search_results[4]["source_id"] = "00000000-0000-0000-0000-000000000005"

        results = retrieve(
            query="show my diagnoses",
            patient_id="pat-1",
            top_k=5,
            requester_role="DOCTOR",
            requester_id="doc-1"
        )
        
        # Assert that only rec-1 and rec-3 are returned
        assert len(results) == 2
        assert results[0]["source_id"] == "00000000-0000-0000-0000-000000000001"
        assert results[1]["source_id"] == "00000000-0000-0000-0000-000000000003"
