import sqlite3
import logging
from typing import List, Dict, Any
from config import DB_PATH

logger = logging.getLogger(__name__)


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _normalize_uuid(val: Any) -> str:
    """Normalize UUID values to lowercase string without braces."""
    if val is None:
        return ""
    return str(val).lower().strip("{}")


def fetch_all_patients() -> List[Dict[str, Any]]:
    """Return all users with role=PATIENT and their core profile."""
    conn = _get_conn()
    try:
        rows = conn.execute(
            """
            SELECT LOWER(CAST(id AS TEXT)) AS id, email, first_name, last_name, date_joined
            FROM users_customuser
            WHERE role = 'PATIENT'
            """
        ).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"fetch_all_patients error: {e}")
        return []
    finally:
        conn.close()


def fetch_records_for_patient(patient_id: str) -> List[Dict[str, Any]]:
    """Return medical records belonging to a patient."""
    conn = _get_conn()
    try:
        rows = conn.execute(
            """
            SELECT id, record_type, record_date, doctor_name, file_url, file_hash, created_at
            FROM records_record
            WHERE LOWER(CAST(user_id AS TEXT)) = LOWER(?)
            ORDER BY record_date DESC
            """,
            (_normalize_uuid(patient_id),),
        ).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"fetch_records error: {e}")
        return []
    finally:
        conn.close()


def fetch_appointments_for_patient(patient_id: str) -> List[Dict[str, Any]]:
    """Return appointment history for a patient."""
    conn = _get_conn()
    try:
        rows = conn.execute(
            """
            SELECT id, doctor_name, specialty, appointment_date,
                   appointment_time, reason, status, created_at
            FROM appointments_appointment
            WHERE LOWER(CAST(user_id AS TEXT)) = LOWER(?)
            ORDER BY appointment_date DESC
            """,
            (_normalize_uuid(patient_id),),
        ).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"fetch_appointments error: {e}")
        return []
    finally:
        conn.close()


def fetch_all_records() -> List[Dict[str, Any]]:
    """Return all records with patient email for indexing."""
    conn = _get_conn()
    try:
        rows = conn.execute(
            """
            SELECT r.id, r.record_type, r.record_date, r.doctor_name,
                   r.file_url, r.created_at,
                   LOWER(CAST(u.id AS TEXT)) AS patient_id,
                   u.email AS patient_email,
                   u.first_name, u.last_name
            FROM records_record r
            JOIN users_customuser u ON r.user_id = u.id
            """
        ).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"fetch_all_records error: {e}")
        return []
    finally:
        conn.close()


def fetch_all_appointments() -> List[Dict[str, Any]]:
    """Return all appointments with patient info for indexing."""
    conn = _get_conn()
    try:
        rows = conn.execute(
            """
            SELECT a.id, a.doctor_name, a.specialty, a.appointment_date,
                   a.appointment_time, a.reason, a.status, a.created_at,
                   LOWER(CAST(u.id AS TEXT)) AS patient_id,
                   u.email AS patient_email,
                   u.first_name, u.last_name
            FROM appointments_appointment a
            JOIN users_customuser u ON a.user_id = u.id
            """
        ).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"fetch_all_appointments error: {e}")
        return []
    finally:
        conn.close()


def fetch_all_vitals() -> List[Dict[str, Any]]:
    """Return all vitals records with patient info for indexing."""
    conn = _get_conn()
    try:
        rows = conn.execute(
            """
            SELECT v.id, v.recorded_at, v.weight_kg, v.height_cm,
                   v.blood_pressure_sys, v.blood_pressure_dia,
                   v.heart_rate_bpm, v.temperature_c, v.notes,
                   LOWER(CAST(u.id AS TEXT)) AS patient_id,
                   u.email AS patient_email,
                   u.first_name, u.last_name
            FROM clinical_vitals v
            JOIN users_customuser u ON v.user_id = u.id
            """
        ).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"fetch_all_vitals error: {e}")
        return []
    finally:
        conn.close()


def fetch_all_diagnoses() -> List[Dict[str, Any]]:
    """Return all diagnoses with patient info for indexing."""
    conn = _get_conn()
    try:
        rows = conn.execute(
            """
            SELECT d.id, d.condition_name, d.icd_code, d.diagnosed_date,
                   d.status, d.severity, d.notes,
                   LOWER(CAST(u.id AS TEXT)) AS patient_id,
                   u.email AS patient_email,
                   u.first_name, u.last_name
            FROM clinical_diagnosis d
            JOIN users_customuser u ON d.user_id = u.id
            """
        ).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"fetch_all_diagnoses error: {e}")
        return []
    finally:
        conn.close()


def fetch_all_prescriptions() -> List[Dict[str, Any]]:
    """Return all prescriptions with patient info for indexing."""
    conn = _get_conn()
    try:
        rows = conn.execute(
            """
            SELECT p.id, p.medication_name, p.dosage, p.frequency,
                   p.start_date, p.end_date, p.refills_remaining, p.instructions,
                   LOWER(CAST(u.id AS TEXT)) AS patient_id,
                   u.email AS patient_email,
                   u.first_name, u.last_name
            FROM clinical_prescription p
            JOIN users_customuser u ON p.user_id = u.id
            """
        ).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"fetch_all_prescriptions error: {e}")
        return []
    finally:
        conn.close()


def fetch_patient_by_id(patient_id: str) -> Dict[str, Any]:
    """Fetch a single patient's profile."""
    conn = _get_conn()
    try:
        row = conn.execute(
            """
            SELECT LOWER(CAST(id AS TEXT)) AS id, email, first_name, last_name, date_joined
            FROM users_customuser
            WHERE LOWER(CAST(id AS TEXT)) = LOWER(?)
            """,
            (_normalize_uuid(patient_id),),
        ).fetchone()
        return dict(row) if row else {}
    except Exception as e:
        logger.error(f"fetch_patient_by_id error: {e}")
        return {}
    finally:
        conn.close()


def fetch_all_parsed_data() -> List[Dict[str, Any]]:
    """Return all parsed medical document key-values with patient info for indexing."""
    conn = _get_conn()
    try:
        rows = conn.execute(
            """
            SELECT p.id, p.key, p.value, p.extracted_at, p.record_id,
                   LOWER(CAST(r.user_id AS TEXT)) AS patient_id,
                   u.email AS patient_email,
                   u.first_name AS patient_first_name, u.last_name AS patient_last_name
            FROM parsing_parseddata p
            JOIN records_record r ON p.record_id = r.id
            JOIN users_customuser u ON r.user_id = u.id
            """
        ).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"fetch_all_parsed_data error: {e}")
        return []
    finally:
        conn.close()


def fetch_all_access_grants() -> List[Dict[str, Any]]:
    """Return all access grants with doctor and patient details for indexing."""
    conn = _get_conn()
    try:
        rows = conn.execute(
            """
            SELECT g.id, g.created_at,
                   LOWER(CAST(g.doctor_id AS TEXT)) AS doctor_id,
                   LOWER(CAST(g.patient_id AS TEXT)) AS patient_id,
                   doc.first_name AS doctor_first_name, doc.last_name AS doctor_last_name, doc.email AS doctor_email,
                   pat.email AS patient_email, pat.first_name AS patient_first_name, pat.last_name AS patient_last_name
            FROM sharing_accessgrant g
            JOIN users_customuser doc ON g.doctor_id = doc.id
            JOIN users_customuser pat ON g.patient_id = pat.id
            """
        ).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"fetch_all_access_grants error: {e}")
        return []
    finally:
        conn.close()


def fetch_all_access_requests() -> List[Dict[str, Any]]:
    """Return all access requests with status, doctor, and patient details for indexing."""
    conn = _get_conn()
    try:
        rows = conn.execute(
            """
            SELECT req.id, req.reason, req.status, req.created_at,
                   LOWER(CAST(req.doctor_id AS TEXT)) AS doctor_id,
                   LOWER(CAST(req.patient_id AS TEXT)) AS patient_id,
                   doc.first_name AS doctor_first_name, doc.last_name AS doctor_last_name, doc.email AS doctor_email,
                   pat.email AS patient_email, pat.first_name AS patient_first_name, pat.last_name AS patient_last_name
            FROM sharing_accessrequest req
            JOIN users_customuser doc ON req.doctor_id = doc.id
            JOIN users_customuser pat ON req.patient_id = pat.id
            """
        ).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"fetch_all_access_requests error: {e}")
        return []
    finally:
        conn.close()

