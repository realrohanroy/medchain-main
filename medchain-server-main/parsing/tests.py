from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock
from records.models import Record
from parsing.models import ParsedData
from parsing.parser import parse_medical_record_document
import os
from django.core.files.base import ContentFile

User = get_user_model()

class ParserTestCase(TestCase):
    def setUp(self):
        self.patient = User.objects.create_user(
            email="testpatient@medchain.com",
            password="password123",
            first_name="Test",
            last_name="Patient",
            role="PATIENT"
        )
        # Create a mock file
        content = b"This is a test medical report content."
        self.record = Record.objects.create(
            user=self.patient,
            record_type="Lab Report",
            record_date="2026-06-25",
            doctor_name="Dr. Smith",
            source_facility="City Hospital",
            file_hash="mockhash123",
            file_url=ContentFile(content, name="test_report.txt")
        )

    @patch("parsing.parser.requests.post")
    @patch.dict(os.environ, {"GEMINI_API_KEY": "dummy_gemini_key", "NEXT_PUBLIC_RAG_URL": "http://localhost:8001/api/v1"})
    def test_parse_medical_record_document_success(self, mock_post):
        # Mocking the response of Gemini API
        mock_response_gemini = MagicMock()
        mock_response_gemini.status_code = 200
        mock_response_gemini.json.return_value = {
            "candidates": [{
                "content": {
                    "parts": [{
                        "text": '[{"key": "Blood Glucose", "value": "110 mg/dL"}, {"key": "Diagnosis", "value": "Pre-diabetes"}]'
                    }]
                }
            }]
        }
        
        # Mocking the response of RAG reindex endpoint
        mock_response_rag = MagicMock()
        mock_response_rag.status_code = 200
        
        # requests.post will be called twice: first for Gemini, second for RAG reindex
        mock_post.side_effect = [mock_response_gemini, mock_response_rag]

        # Act
        parse_medical_record_document(self.record.id)

        # Assert ParsedData database creation
        parsed_data = ParsedData.objects.filter(record=self.record)
        self.assertEqual(parsed_data.count(), 2)
        
        glucose_item = parsed_data.get(key="Blood Glucose")
        self.assertEqual(glucose_item.value, "110 mg/dL")
        
        diagnosis_item = parsed_data.get(key="Diagnosis")
        self.assertEqual(diagnosis_item.value, "Pre-diabetes")

        # Verify requests.post was called twice
        self.assertEqual(mock_post.call_count, 2)
        
        # Check first call (Gemini API)
        first_call_args, first_call_kwargs = mock_post.call_args_list[0]
        self.assertIn("generativelanguage.googleapis.com", first_call_args[0])
        self.assertEqual(first_call_kwargs["json"]["generationConfig"]["responseMimeType"], "application/json")
        
        # Check second call (RAG reindex)
        second_call_args, second_call_kwargs = mock_post.call_args_list[1]
        self.assertIn("/reindex", second_call_args[0])
        self.assertEqual(second_call_kwargs["json"]["patient_id"], str(self.patient.id))
        self.assertIn("Authorization", second_call_kwargs["headers"])
