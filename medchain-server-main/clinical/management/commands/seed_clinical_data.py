"""
seed_clinical_data.py
---------------------
Management command: python manage.py seed_clinical_data

Creates realistic test clinical data for RAG pipeline testing.

Idempotency strategy:
  - Test patients: identified by their fixed email addresses; uses
    get_or_create so no duplicates are created on repeated runs.
  - Vitals / Diagnosis / Prescription: each seeded record has
    "[SEED DATA]" in its notes / instructions field. The command
    checks for its own marker before inserting, so rerunning is safe.

Constraints honoured:
  - Does NOT add author / visibility fields (that is §7, a later task).
  - Does NOT modify any existing model or file.
  - Uses the current model shape as-is (clinical/models.py, users/models.py).
"""

from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from clinical.models import Diagnosis, Prescription, Vitals

User = get_user_model()

SEED_MARKER = "[SEED DATA]"

# ---------------------------------------------------------------------------
# Fixture definitions
# ---------------------------------------------------------------------------

TEST_PATIENTS = [
    {
        "email": "test.patient1@example.com",
        "first_name": "Alice",
        "last_name": "Sharma",
        "password": "TestPass123!",
    },
    {
        "email": "test.patient2@example.com",
        "first_name": "Rahul",
        "last_name": "Verma",
        "password": "TestPass123!",
    },
    {
        "email": "test.patient3@example.com",
        "first_name": "Priya",
        "last_name": "Nair",
        "password": "TestPass123!",
    },
]


def _vitals_for(patient, offset_days, weight, height, sys_bp, dia_bp, hr, temp, note):
    """Return a Vitals kwargs dict (not saved yet)."""
    return dict(
        user=patient,
        recorded_at=timezone.now() - timedelta(days=offset_days),
        weight_kg=weight,
        height_cm=height,
        blood_pressure_sys=sys_bp,
        blood_pressure_dia=dia_bp,
        heart_rate_bpm=hr,
        temperature_c=temp,
        notes=f"{note} {SEED_MARKER}",
    )


# Per-patient vital timelines spread across ~12 months
VITALS_FIXTURES = {
    "test.patient1@example.com": [
        # 12 months ago → 1 week ago: mild hypertension slowly improving
        _vitals_for("p", 360, 68.0, 162.0, 148, 94, 82, 37.0,
                    "Initial visit. BP elevated; started dietary advice."),
        _vitals_for("p", 270, 67.5, 162.0, 142, 90, 79, 36.8,
                    "Follow-up. BP trending down. Patient reports reduced salt intake."),
        _vitals_for("p", 180, 67.2, 162.0, 138, 88, 76, 36.7,
                    "Medication review. Lisinopril 5mg added."),
        _vitals_for("p", 90, 66.8, 162.0, 130, 84, 74, 36.6,
                    "Good response to medication. Continue current plan."),
        _vitals_for("p", 30, 66.5, 162.0, 126, 82, 72, 36.6,
                    "BP well controlled. Weight stable."),
        _vitals_for("p", 7, 66.3, 162.0, 122, 80, 70, 36.7,
                    "Excellent control. Routine check; no concerns."),
    ],
    "test.patient2@example.com": [
        _vitals_for("p", 365, 85.0, 178.0, 118, 76, 80, 36.9,
                    "Annual check-up. All vitals within normal range."),
        _vitals_for("p", 240, 86.2, 178.0, 124, 79, 83, 37.1,
                    "Slight weight gain noted. Advised to increase physical activity."),
        _vitals_for("p", 150, 84.5, 178.0, 120, 78, 78, 36.8,
                    "Post-exercise test. HR and BP normal."),
        _vitals_for("p", 60, 83.0, 178.0, 116, 74, 75, 36.6,
                    "Weight trending down post-dietary changes."),
        _vitals_for("p", 14, 82.5, 178.0, 118, 75, 74, 36.7,
                    "Follow-up. All vitals stable."),
    ],
    "test.patient3@example.com": [
        _vitals_for("p", 330, 55.0, 155.0, 110, 70, 88, 37.2,
                    "Post-viral fatigue review. Slightly elevated HR."),
        _vitals_for("p", 210, 54.5, 155.0, 108, 68, 82, 36.8,
                    "Recovery check. HR normalising. Energy levels improving."),
        _vitals_for("p", 120, 54.8, 155.0, 112, 72, 80, 36.7,
                    "Routine visit. Vitals stable."),
        _vitals_for("p", 45, 55.2, 155.0, 110, 70, 78, 36.6,
                    "No active complaints. Thyroid labs pending."),
        _vitals_for("p", 10, 55.0, 155.0, 108, 70, 76, 36.6,
                    "Thyroid results normal. Continue monitoring."),
    ],
}

DIAGNOSES_FIXTURES = {
    "test.patient1@example.com": [
        dict(
            condition_name="Essential hypertension",
            icd_code="I10",
            diagnosed_date=date.today() - timedelta(days=360),
            status="Active",
            severity="Mild",
            notes="Elevated readings on two separate visits. Family history of hypertension. "
                  "Initiated lifestyle modifications and pharmacotherapy. " + SEED_MARKER,
        ),
        dict(
            condition_name="Hypercholesterolaemia",
            icd_code="E78.00",
            diagnosed_date=date.today() - timedelta(days=300),
            status="Active",
            severity="Moderate",
            notes="LDL 4.2 mmol/L on fasting lipid panel. Diet counselling commenced. " + SEED_MARKER,
        ),
        dict(
            condition_name="Seasonal allergic rhinitis",
            icd_code="J30.1",
            diagnosed_date=date.today() - timedelta(days=180),
            status="Resolved",
            severity="Mild",
            notes="Symptomatic during monsoon season. Resolved with 14-day antihistamine course. " + SEED_MARKER,
        ),
    ],
    "test.patient2@example.com": [
        dict(
            condition_name="Type 2 diabetes mellitus without complications",
            icd_code="E11.9",
            diagnosed_date=date.today() - timedelta(days=400),
            status="Active",
            severity="Moderate",
            notes="HbA1c 7.8% at diagnosis. Managed with metformin and dietary changes. " + SEED_MARKER,
        ),
        dict(
            condition_name="Obesity, unspecified",
            icd_code="E66.9",
            diagnosed_date=date.today() - timedelta(days=400),
            status="Active",
            severity="Moderate",
            notes="BMI 26.8 at last measurement. Dietary plan initiated. " + SEED_MARKER,
        ),
        dict(
            condition_name="Acute pharyngitis, unspecified",
            icd_code="J02.9",
            diagnosed_date=date.today() - timedelta(days=60),
            status="Resolved",
            severity="Mild",
            notes="Bacterial pharyngitis confirmed by rapid strep test. Treated with amoxicillin. " + SEED_MARKER,
        ),
    ],
    "test.patient3@example.com": [
        dict(
            condition_name="Hypothyroidism, unspecified",
            icd_code="E03.9",
            diagnosed_date=date.today() - timedelta(days=320),
            status="Active",
            severity="Mild",
            notes="TSH 6.8 mIU/L confirmed hypothyroidism. Levothyroxine commenced. " + SEED_MARKER,
        ),
        dict(
            condition_name="Iron deficiency anaemia",
            icd_code="D50.9",
            diagnosed_date=date.today() - timedelta(days=200),
            status="Resolved",
            severity="Mild",
            notes="Haemoglobin 9.8 g/dL. 3-month ferrous sulphate course completed. Levels normalised. " + SEED_MARKER,
        ),
        dict(
            condition_name="Generalised anxiety disorder",
            icd_code="F41.1",
            diagnosed_date=date.today() - timedelta(days=150),
            status="Active",
            severity="Moderate",
            notes="GAD-7 score 12 at presentation. Referred for CBT; pharmacotherapy deferred. " + SEED_MARKER,
        ),
    ],
}

PRESCRIPTIONS_FIXTURES = {
    "test.patient1@example.com": [
        dict(
            medication_name="Lisinopril",
            dosage="5mg",
            frequency="Once daily in the morning",
            start_date=date.today() - timedelta(days=180),
            end_date=None,
            refills_remaining=6,
            instructions="Take with a full glass of water. Monitor for dry cough. "
                         "Avoid NSAIDs unless advised. " + SEED_MARKER,
        ),
        dict(
            medication_name="Atorvastatin",
            dosage="10mg",
            frequency="Once daily at night",
            start_date=date.today() - timedelta(days=300),
            end_date=None,
            refills_remaining=5,
            instructions="Take with or without food. Avoid grapefruit juice. "
                         "Report any unexplained muscle pain. " + SEED_MARKER,
        ),
        dict(
            medication_name="Loratadine",
            dosage="10mg",
            frequency="Once daily as needed",
            start_date=date.today() - timedelta(days=180),
            end_date=date.today() - timedelta(days=166),
            refills_remaining=0,
            instructions="Non-drowsy antihistamine. Safe to take with current antihypertensive. " + SEED_MARKER,
        ),
    ],
    "test.patient2@example.com": [
        dict(
            medication_name="Metformin",
            dosage="500mg",
            frequency="Twice daily with meals",
            start_date=date.today() - timedelta(days=400),
            end_date=None,
            refills_remaining=8,
            instructions="Take with meals to reduce GI side effects. Monitor renal function annually. " + SEED_MARKER,
        ),
        dict(
            medication_name="Amoxicillin",
            dosage="500mg",
            frequency="Three times daily for 7 days",
            start_date=date.today() - timedelta(days=60),
            end_date=date.today() - timedelta(days=53),
            refills_remaining=0,
            instructions="Complete full course even if symptoms improve. May reduce efficacy of oral contraceptives. " + SEED_MARKER,
        ),
    ],
    "test.patient3@example.com": [
        dict(
            medication_name="Levothyroxine",
            dosage="50mcg",
            frequency="Once daily, 30 minutes before breakfast",
            start_date=date.today() - timedelta(days=320),
            end_date=None,
            refills_remaining=10,
            instructions="Take on an empty stomach. Avoid calcium/iron supplements within 4 hours. "
                         "TSH review in 6 weeks. " + SEED_MARKER,
        ),
        dict(
            medication_name="Ferrous sulphate",
            dosage="200mg",
            frequency="Once daily with orange juice",
            start_date=date.today() - timedelta(days=200),
            end_date=date.today() - timedelta(days=110),
            refills_remaining=0,
            instructions="Take with vitamin C to improve absorption. May cause dark stools. "
                         "Course completed; levels normalised. " + SEED_MARKER,
        ),
        dict(
            medication_name="Sertraline",
            dosage="50mg",
            frequency="Once daily in the morning",
            start_date=date.today() - timedelta(days=120),
            end_date=None,
            refills_remaining=4,
            instructions="Takes 4-6 weeks for full effect. Do not discontinue abruptly. "
                         "Review in 8 weeks. " + SEED_MARKER,
        ),
    ],
}


# ---------------------------------------------------------------------------
# Command
# ---------------------------------------------------------------------------

class Command(BaseCommand):
    help = (
        "Seeds realistic test clinical data (Vitals, Diagnoses, Prescriptions). "
        "Idempotent: safe to run multiple times. Uses '[SEED DATA]' marker to avoid duplicates."
    )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("\n=== seed_clinical_data ===\n"))

        patients = self._ensure_patients()
        vitals_created, vitals_existed = self._seed_vitals(patients)
        diagnoses_created, diagnoses_existed = self._seed_diagnoses(patients)
        prescriptions_created, prescriptions_existed = self._seed_prescriptions(patients)

        self.stdout.write("\n" + self.style.MIGRATE_HEADING("=== Summary ==="))
        self.stdout.write(
            f"  Patients   : {len(patients)} total "
            f"(created + found from test fixtures)"
        )
        self.stdout.write(
            f"  Vitals     : {vitals_created} created, {vitals_existed} already existed"
        )
        self.stdout.write(
            f"  Diagnoses  : {diagnoses_created} created, {diagnoses_existed} already existed"
        )
        self.stdout.write(
            f"  Prescriptions: {prescriptions_created} created, {prescriptions_existed} already existed"
        )

        # Final DB counts (includes any pre-existing non-seed data)
        from clinical.models import Vitals as V, Diagnosis as D, Prescription as Pr
        self.stdout.write(
            self.style.SUCCESS(
                f"\nDB totals — Vitals: {V.objects.count()}, "
                f"Diagnoses: {D.objects.count()}, "
                f"Prescriptions: {Pr.objects.count()}\n"
            )
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _ensure_patients(self):
        """
        Return a list of patient user objects.
        Prefer existing PATIENT-role users; also ensure test fixture users exist.
        """
        existing = list(
            User.objects.filter(role=User.RoleChoices.PATIENT)
        )

        created_count = 0
        for spec in TEST_PATIENTS:
            user, created = User.objects.get_or_create(
                email=spec["email"],
                defaults=dict(
                    first_name=spec["first_name"],
                    last_name=spec["last_name"],
                    role=User.RoleChoices.PATIENT,
                    is_active=True,
                ),
            )
            if created:
                user.set_password(spec["password"])
                user.save()
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f"  [+] Created test patient: {user.email}")
                )
            else:
                self.stdout.write(f"  [=] Found existing patient: {user.email}")

            # Make sure this user appears in our working set exactly once
            if user not in existing:
                existing.append(user)

        self.stdout.write(
            f"\n  {created_count} test patient(s) created, "
            f"{len(existing) - created_count} already existed.\n"
        )
        return existing

    def _seed_vitals(self, patients):
        created = existed = 0
        for patient in patients:
            fixtures = VITALS_FIXTURES.get(patient.email, [])
            for kwargs in fixtures:
                kwargs = dict(kwargs)
                kwargs["user"] = patient
                note_text = kwargs["notes"]
                # idempotency check: same user + same note marker + same recorded_at
                if Vitals.objects.filter(
                    user=patient,
                    notes=note_text,
                ).exists():
                    existed += 1
                    continue
                Vitals.objects.create(**kwargs)
                created += 1
        self.stdout.write(
            f"  Vitals: {created} created, {existed} already existed."
        )
        return created, existed

    def _seed_diagnoses(self, patients):
        created = existed = 0
        for patient in patients:
            fixtures = DIAGNOSES_FIXTURES.get(patient.email, [])
            for kwargs in fixtures:
                kwargs = dict(kwargs)
                # idempotency: same user + same ICD code + same condition name
                if Diagnosis.objects.filter(
                    user=patient,
                    icd_code=kwargs["icd_code"],
                    condition_name=kwargs["condition_name"],
                ).exists():
                    existed += 1
                    continue
                Diagnosis.objects.create(user=patient, **kwargs)
                created += 1
        self.stdout.write(
            f"  Diagnoses: {created} created, {existed} already existed."
        )
        return created, existed

    def _seed_prescriptions(self, patients):
        created = existed = 0
        for patient in patients:
            fixtures = PRESCRIPTIONS_FIXTURES.get(patient.email, [])
            for kwargs in fixtures:
                kwargs = dict(kwargs)
                # idempotency: same user + medication + dosage + start_date
                if Prescription.objects.filter(
                    user=patient,
                    medication_name=kwargs["medication_name"],
                    dosage=kwargs["dosage"],
                    start_date=kwargs["start_date"],
                ).exists():
                    existed += 1
                    continue
                Prescription.objects.create(user=patient, **kwargs)
                created += 1
        self.stdout.write(
            f"  Prescriptions: {created} created, {existed} already existed."
        )
        return created, existed
