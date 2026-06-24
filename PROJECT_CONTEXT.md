# MedChain — Project Context

_Last updated: 2026-06-24. This document is the ground-truth status of the MedChain codebase, assembled from direct inspection of the repos (not assumptions). Feed this to Antigravity / Claude Code before asking it to fix or build anything — it should not need to re-discover any of this._

---

## 1. Architecture Overview

MedChain is **one Django monolith** with a **separate FastAPI RAG microservice** embedded as a subfolder inside it. They are not peer repos — the RAG service physically lives inside the Django repo's tree.

```
medchain-server-main/              ← Django backend (port 8000)
├── users/                         JWT auth, roles (PATIENT/DOCTOR)
├── records/                       Core medical record storage
├── clinical/                      Vitals, Diagnosis, Prescription
├── appointments/                  Scheduling
├── sharing/                       ShareToken, AccessRequest, AccessGrant
├── blockchain/                    SIMULATED — see §4
├── parsing/                       Document parsing
├── medchain_backend/              Django settings/urls
├── db.sqlite3                     Dev database (SQLite, not Postgres)
└── medchain-rag/                  ← FastAPI RAG service (port 8001), separate process
    ├── ingestion/                 chunker.py, transformer.py
    ├── embeddings/                embedder.py (sentence-transformers), faiss_store.py
    ├── retrieval/                 retriever.py
    ├── llm/                       generator.py (Gemini/Ollama), question_bank.py
    ├── db/                        connector.py — reads Django's SQLite directly
    ├── auth/                      jwt_validator.py — validates Django-issued JWTs
    ├── api/routes.py              /health, /reindex, /query, /questions
    └── tests/                     22+ tests, mostly passing — see §5

medchain-frontend-main/             ← Next.js 14+ App Router, TypeScript
├── src/app/(dashboard)/...        Role-split: dashboard/doctor, dashboard/patient
├── src/app/login/page.tsx         Auth UI (email/password + Google OAuth)
├── src/app/share/[token]/         Public share-link view
├── src/proxy.ts                   Edge middleware — route protection (see §3)
├── src/lib/api/client.ts          Axios instance, JWT bearer + refresh interceptor
├── src/lib/api/auth.ts            Token storage, login/register/logout
└── src/lib/api/rag.ts             Calls RAG service directly at a separate base URL
```

**Key fact:** frontend talks to **two separate backends** directly — Django at `:8000` and FastAPI RAG at `:8001/api/v1` — no shared gateway/proxy between them.

There is also a **design vault** (`MedChain-Blockchain-Vault`, 11 docs) describing a target blockchain architecture (Solidity smart contracts, Hyperledger Besu, `ethers.js`, on-chain ConsentRegistry/AccessControl/AuditLogger). **This vault assumes a Node.js/Express stack and does not match the actual Django/Python codebase.** Treat it as a conceptual reference for *what the blockchain layer should eventually do*, not as a build spec — see §4.

---

## 2. Confirmed Bugs / Issues (evidence-based, not guesses)

### 🔴 High priority

**Frontend has no env file at all.**
- `find . -maxdepth 1 -name ".env*"` returns nothing. No `.env.local`.
- Effects, all confirmed by reading the fallback values in code:
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` unset → falls back to literal string `"YOUR_GOOGLE_CLIENT_ID_HERE"` → **Google OAuth login is broken.**
  - `NEXT_PUBLIC_API_URL` unset → falls back to `http://localhost:8000` → only works when Django is running locally on that exact port; breaks in any deployed environment.
  - `NEXT_PUBLIC_RAG_URL` unset → falls back to `http://localhost:8001/api/v1` → same issue.

**Insecure / fake middleware auth gate (route protection layer is not real).**
- `src/proxy.ts` (Next.js edge middleware) checks for a cookie `auth_token` to decide whether to allow access to protected routes, and parses the doctor/patient role via `authToken.includes('doctor')`.
- The real JWT (`access`/`refresh` from Django) is stored only in `localStorage` (`src/lib/api/auth.ts` → `storeAuthTokens`), which middleware cannot read (middleware runs server/edge-side, no `localStorage` access).
- To work around this, login sets a **second, fake, unsigned cookie**: `document.cookie = `auth_token=jwt-${dashboardRole}`` — literally the string `jwt-doctor` or `jwt-patient`, not a real token.
- **Consequence:** the edge layer has zero ability to cryptographically verify a session. Anyone can set `document.cookie = "auth_token=jwt-doctor"` in devtools and pass the route-level gate (though real API calls would still fail without a valid JWT in localStorage, since Django would reject them — so this is a routing-layer gap, not a full account takeover).
- A stale comment (`// --- TEMPORARILY COMMENTED OUT FOR PROTOTYPE ---`) sits directly above the live redirect code, suggesting this was meant to be revisited and wasn't.
- **Fix direction:** either move to an httpOnly signed cookie that middleware can verify server-side, or drop server-side route gating in favor of client-side checks + strict API-level auth (less ideal for SaaS, but workable as an interim).

### 🟡 Medium priority

**Clinical data tables are empty — blocks meaningful RAG testing.**
- Confirmed via Django shell: `Vitals: 0, Diagnoses: 0, Prescriptions: 0`.
- This is **not a code bug** — `DB_PATH` in the RAG service's `.env` is correctly set to `../db.sqlite3` and resolves correctly. The RAG service is correctly returning empty lists because there's genuinely nothing to fetch yet.
- **Action item, not a fix:** seed realistic clinical test data before RAG retrieval/continuity features can be properly validated end-to-end.

**`JWT_SECRET` is Django's default insecure dev key, shared as-is into the RAG service.**
- `medchain_backend/settings.py:34`: `SECRET_KEY = 'django-insecure-=368c99...'`
- `medchain-rag/config.py` and `.env` use the **same literal string** as `JWT_SECRET`.
- Currently **not broken** — tokens validate correctly between services because both sides match. But this is Django's auto-generated dev default (`django-insecure-` prefix is Django's own "must change before production" marker).
- **⚠️ As of the httpOnly cookie auth-gate fix, `JWT_SECRET` now exists in THREE places:** Django `settings.py`, RAG `.env`, and frontend `.env.local`. When you rotate this key before deployment, update all three — not just two.
- **Action item before any deployment:** generate a real secret, sync it across all three locations, never commit it.

**`protobuf` version conflict in RAG dependencies.**
- Installing `tf-keras` (needed to fix a Keras 3 incompatibility with `transformers`/`sentence-transformers`) pulled in `protobuf==7.35.1`, which `pip` flagged as incompatible with `google-ai-generativelanguage` (needs `<6.0.0`) and `grpcio-status` (needs `<6.0`).
- Tests still passed despite this warning, but **live Gemini API calls are untested** — this conflict could cause real failures that unit tests (which mock the HTTP layer) wouldn't catch.
- **Action item:** run one live end-to-end query against the real Gemini API to confirm this isn't silently broken; pin compatible versions in `requirements.txt` if so.

### 🟢 Low priority

- `medchain-rag/config.py`'s hardcoded `GEMINI_MODEL` fallback default is `"gemini-3.5-flash"` (likely invalid/typo), while `.env.example` correctly specifies `gemini-1.5-flash`. Only matters if `.env` is ever missing this key. Low risk since real `.env` is correct, but worth fixing the fallback for safety.
- `test_call_gemini_success` in `medchain-rag/tests/test_generator.py` fails due to a test-authoring bug, not a code bug: the mock response never sets `mock_response.status_code = 200`, so it defaults to a non-matching `MagicMock`, and the generator correctly (and as-designed) treats this as an API error. One-line test fix, not a logic fix.

---

## 3. RAG Pipeline Status (from `pytest -v`, 23/25 passing)

| Stage | File(s) | Status |
|---|---|---|
| Ingestion / chunking | `ingestion/chunker.py`, `transformer.py` | ✅ Passing |
| Embedding | `embeddings/embedder.py` (sentence-transformers, `all-MiniLM-L6-v2`) | ✅ Passing |
| Vector store | `embeddings/faiss_store.py` (FAISS flat-file index, not a DB) | ✅ Passing |
| Retrieval / context building | `retrieval/retriever.py` | ✅ Passing |
| DB connector (reads Django SQLite) | `db/connector.py` | ✅ Passing (logic); ❌ data is empty, see §2 |
| Prompt construction | `llm/generator.py` | ✅ Passing |
| Generation (Gemini call logic) | `llm/generator.py` | ✅ Passing (one test is a false failure, see §2) |
| Live Gemini API (real network call) | — | ❓ Untested — protobuf conflict risk, see §2 |

**Bottom line: the RAG pipeline's core logic is sound.** The architecture is not broken — what's missing is (a) real clinical data to retrieve, and (b) the access-control filtering described in §6 below, which doesn't exist yet at the retrieval layer.

---

## 4. Blockchain Layer — Fully Simulated, Not a Bug

Confirmed by reading the actual code:

```python
# blockchain/services.py
def simulate_blockchain_submission(tx_id):
    time.sleep(3)  # fakes chain confirmation latency
    tx.tx_hash = f"0xmock{tx.id.hex}"  # fake hash, not a real transaction
    tx.status = 'CONFIRMED'
```

`blockchain/models.py` (`BlockchainTransaction`) only tracks a `tx_hash` string and a status enum (`PENDING`/`CONFIRMED`/`FAILED`) per `Record`. There is:
- No real chain interaction (no `web3.py`, no contract calls, no signing)
- No `content_hash` field — nothing to actually verify a record against later, even conceptually
- No consent logic, no access-control logic, no audit logging — despite the design vault describing all of these in detail (`ConsentRegistry`, `AccessControlModule`, `AuditLogger` contracts)

**This is not a bug to fix — it's an entire layer to build later, deliberately deferred while the core product (auth, records, RAG, care relationships) is made solid first.** Document it as "blockchain: simulated/stub, real implementation deferred" — important to be explicit about this if this project is presented externally (thesis, pitch, demo), since `0xmock{uuid}` is not a real transaction hash.

---

## 5. Product Requirement: Longitudinal Continuity of Care (core differentiator)

This is the most important unbuilt requirement, and it's a real, well-precedented problem in health informatics — not just an intuition:

> A patient's medical history is fragmented across providers who never share data with each other. A new doctor (e.g. after a referral to a specialist or a new hospital) often lacks the patient's prior history, which is a documented contributor to diagnostic error. MedChain's goal is to let a patient bring their own historical records forward — even from providers never connected to the system — and have an AI assistant synthesize a coherent longitudinal context for whichever doctor the patient is currently authorizing.

**Design implications:**
- **The patient, not any one doctor, is the root owner of their own record timeline.** A patient must be able to upload/add historical reports (scanned PDFs, old prescriptions, self-reported conditions) at any time, tagged with approximate date and source (self-reported / named hospital / named doctor), independent of whether that original provider exists in the system.
- These records — structured (`clinical` app rows) and unstructured (uploaded documents) alike — need to flow into the same RAG ingestion pipeline so they're retrievable as context regardless of origin.
- When a **new** doctor establishes a relationship with the patient (see §6) and consent covers the right scope, the RAG assistant should be able to synthesize a chronological clinical summary spanning the patient's full available history — this is the actual "connects the dots" feature.
- **Critical constraint:** the RAG assistant must never use "being helpful" as a backdoor around access control — it must only surface what the *current* requester is authorized to see under the active care relationship and note-visibility rules (§6). The same authorization filter function must be shared between direct API reads and RAG retrieval — never two separate implementations of "what can this person see," or they will drift and create a leak.

---

## 6. Doctor↔Patient Relationship Modeling

### Current state (confirmed from `sharing/models.py`)

```python
ShareToken     # temporary, expiring, single-record share link
AccessRequest  # doctor → patient: requests access, patient approves/declines
AccessGrant    # patient ↔ doctor (unique pair), M2M to specific Record objects
```

This is a reasonable existing primitive. The gap: there's no concept of an ongoing "this doctor is my doctor" relationship separate from data access — `AccessGrant` conflates "we have a relationship" with "you can see my history" into one thing.

> **Correction to an earlier draft of this document:** an earlier version of this section proposed collapsing the relationship and the access grant into one entity. That was wrong — it would mean *any* connection automatically exposes full history, which is too broad (most visits don't need a doctor reading the patient's entire past) and makes a leaked/stale connection mechanism (e.g. a long-lived QR) higher-stakes than it needs to be. The corrected model below uses **three distinct entities**, not two.

### The three-tier model

```
CareRelationship   — "we are connected" (identity + relationship, no data access)
AccessRequest      — "can I see your history?" (a doctor asking, optionally scoped)
AccessGrant        — "yes, you may" (the actual permission, optionally scoped)
```

**1. `CareRelationship`** — lightweight, established via QR scan or doctor-initiated code entry (see below). On its own, this grants the doctor: appearance in their patient list, ability to contact the patient, ability to write **new** entries for the current visit, and ability to see a **manifest** of the patient's available historical records (metadata only — type and date, not content; see below). It does **not** grant access to read any pre-existing history content.

```python
class CareRelationship(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='care_relationships_as_patient')
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='care_relationships_as_doctor')
    status = models.CharField(max_length=20, choices=[('PENDING','Pending'), ('ACTIVE','Active'), ('ENDED','Ended'), ('DENIED','Denied')], default='PENDING')
    initiated_by = models.CharField(max_length=20, choices=[('PATIENT_QR','Patient QR Scan'), ('DOCTOR_CODE','Doctor Code Entry')])
    relationship_type = models.CharField(max_length=20, choices=[('PRIMARY','Primary'), ('SPECIALIST','Specialist'), ('REFERRAL','Referral')], default='PRIMARY')
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    ended_by = models.CharField(max_length=20, choices=[('PATIENT','Patient'), ('DOCTOR','Doctor')], null=True, blank=True)  # bidirectional revoke
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('patient', 'doctor')
```

**2. `AccessRequest`** (existing model, extended) — a connected doctor, after browsing the manifest, asks for either everything or a specific subset:

```python
class AccessRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    care_relationship = models.ForeignKey(CareRelationship, on_delete=models.CASCADE, related_name='access_requests')  # NEW
    requested_scope = models.CharField(max_length=20, choices=[('FULL','Full History'), ('SELECTED','Selected Records')], default='FULL')  # NEW
    requested_records = models.ManyToManyField(Record, blank=True)  # NEW — populated only if requested_scope == SELECTED
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=[('Pending','Pending'), ('Approved','Approved'), ('Declined','Declined')], default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)
```

**3. `AccessGrant`** (existing model, restructured) — the actual permission, created once a request is approved, or proactively by the patient pushing specific records to a connected doctor without waiting for a request:

```python
class AccessGrant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    care_relationship = models.OneToOneField(CareRelationship, on_delete=models.CASCADE, related_name='access_grant')
    scope = models.CharField(max_length=20, choices=[('NONE','No History Access'), ('FULL','Full History'), ('SELECTED','Selected Records')], default='NONE')
    records = models.ManyToManyField(Record, blank=True)  # only used if scope == 'SELECTED'
    granted_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
```

One `AccessGrant` per `CareRelationship`, mutable — scope can be widened (`SELECTED → FULL`) or narrowed/revoked at any time by the patient, without needing a new request cycle each time.

### The manifest (new requirement, makes requesting meaningful)

A connected doctor (regardless of grant status) can see a **lightweight list** of the patient's available record history: type/category (Diagnosis, Prescription, Vitals, Document), date, and a short label (e.g. condition name, medication name) — **never full notes/content**. This is what lets a doctor make an informed request instead of guessing whether asking is worth it, and what lets a patient proactively hand over specific items rather than an all-or-nothing dump.

Open judgment call, not blocking: should a `PROVIDER_ONLY` note's *existence* appear in the manifest (type + date, content still hidden), or be omitted entirely pre-grant? Showing existence is more useful for clinical decision-making; omitting is more conservative. No strong reason to pick one over the other yet — flag as a decision to make once you're building this screen, not now.

### Two initiation paths

**Path 1 — Patient-initiated via QR (primary, in-person visit)**

1. Doctor's app/clinic display shows a QR encoding a connection token (reuses the existing `generate_secure_token()` pattern from `sharing/models.py`). **Recommended rotation: monthly or quarterly**, not per-session — given a `CareRelationship` alone now grants no history access, a stale/leaked QR is low-stakes (worst case: an illegitimate "connection" with zero data exposure, revocable by either side — see "bidirectional revoke" below). Rotation is defense-in-depth here, not the primary control anymore.
2. Patient scans in-app, sees a one-tap confirm screen (*"Connect with Dr. [Name]?"*), confirms.
3. `CareRelationship` created/reactivated with `status='ACTIVE'`, `initiated_by='PATIENT_QR'`.

**Path 2 — Doctor-initiated via patient code (referrals, pre-first-visit cases; lower priority — see note below)**

1. Patient has a short, human-shareable code (distinct from their internal UUID, regenerable if they suspect it leaked) visible in their own profile.
2. Doctor enters the code to send a connection request.
3. Patient grants, denies, or ignores — same as Path 1's confirm step, just doctor-initiated instead of patient-scanned.

**Note on priority:** telemedicine is explicitly **not** in scope right now (product decision — competing with entrenched players like Practo/Apollo 24/7/eSanjeevani in India isn't the differentiator; the vault/continuity model is). Path 2 is kept in the architecture because it's cheap to support and handles legitimate non-telemedicine cases (e.g. a specialist reviewing a referral before the patient's first visit) — but it should be built **after** Path 1, not in parallel, since Path 1 covers the dominant real-world case.

### Patient (and now doctor) controls

- **Grant / Deny** — accept or reject a pending connection or access request
- **Revoke** — either the **patient** or the **doctor** can end an active `CareRelationship` (`ended_by` records which side). Doctor-side revoke matters for cleaning up bogus/stale connections (e.g. someone who scanned a QR but was never actually a patient).
- **Widen/narrow access** — patient can change an `AccessGrant`'s scope at any time, independent of the underlying connection.

**Revocation semantics (recommended default):** revoking blocks any *new* access immediately — including new RAG queries — but doesn't retroactively delete what a doctor already viewed or saved elsewhere. Audit log entries are kept even after revocation, for accountability.

### Validated scenarios this model handles correctly

- **Multiple doctors per patient** (GP + specialist) — naturally supported, no change needed.
- **Referral handoff** — via Path 2, lower priority but available.
- **Re-connecting after a gap** — `unique_together` reactivates the same relationship row.
- **"Doctor only needs today's visit, not the whole history"** (your stated point) — now the *default* behavior: connection alone never exposes history; a grant is a separate, deliberate step.
- **Stale/bogus connections** — doctor-side revoke handles cleanup without needing aggressive QR rotation to compensate.

### Explicitly out of scope for now
- Per-category partial grants finer than "selected records" (e.g. "everything except mental health") — the `SELECTED` scope already gets you most of the way there manually; a smarter category-based toggle is a future refinement.
- Clinic/organization entities — not a current requirement.
- Emergency/break-glass overrides — not a current requirement.

---

## 7. Architectural Gap: Private Clinical Notes (doctor notes hidden from patient)

### Requirement
Confirmed with the project owner: a doctor's private clinical notes/impressions should not be visible to the patient. This is a real, legally precedented distinction — under HIPAA, a clinician's private working notes (e.g. "psychotherapy notes") are explicitly excluded from a patient's right of access. This is a legitimate feature, not a workaround.

### Current state (confirmed from `clinical/models.py`)
`Vitals`, `Diagnosis`, and `Prescription` each have only a `user` field (the patient) and a single undifferentiated `notes` text field. **There is no `author` field at all** — no way to know which doctor wrote an entry — and no visibility flag. So today, anything written in `notes` is, by construction, fully patient-visible. The feature doesn't fail at the access-control layer; it fails earlier, because the concept of authorship doesn't exist in the data model yet.

### Recommended fix

```python
# Add to Vitals, Diagnosis, Prescription:
author = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                            on_delete=models.SET_NULL, related_name='+',
                            help_text="Doctor who created this entry, if any")
visibility = models.CharField(max_length=20, default='PATIENT_VISIBLE',
                               choices=[('PATIENT_VISIBLE', 'Patient Visible'),
                                        ('PROVIDER_ONLY', 'Provider Only')])
```

Any patient-facing read — **both the direct Django API and the RAG retrieval step** — must apply the same filter:
```
WHERE patient = X AND (visibility = 'PATIENT_VISIBLE' OR requester_role == 'DOCTOR' AND has_active_access_grant(requester, patient))
```
**Product decision:** `PROVIDER_ONLY` notes are hidden from the patient, but visible to **any** doctor who holds an active `AccessGrant` for that patient — not just the original author, but also not merely any doctor with an active `CareRelationship`. This is the critical distinction from the three-tier model in §6: *connection alone does not imply history visibility*. A doctor who has connected but not yet received a grant cannot read `PROVIDER_ONLY` notes. One exception: **a doctor can always read entries they personally authored**, with no `AccessGrant` required — otherwise a doctor couldn't review their own chart notes from the current visit without a separate approval cycle. This exception applies regardless of grant status, and the filter function must implement it explicitly. This must be a single shared filter function called from both the direct API and RAG retrieval. If the two layers implement this check separately, they will eventually drift, and the RAG assistant becomes a side channel that leaks exactly what the access-control layer was built to hide.

---

## 8. RAG Architecture: Strict Per-Patient Isolation

**Requirement:** when a doctor selects a patient and converses with the RAG assistant, the assistant must never mix in another patient's data — zero cross-contamination risk, explicitly called out as a security/breach concern, not just a quality concern.

### Current state — not strong enough for this requirement

There is currently **one global FAISS index** for the whole system (`data/faiss.index`, `data/faiss_meta.json`). Any isolation today would have to happen via metadata filtering (`patient_id`) applied at query time. That's a real risk for medical data: isolation becomes dependent on *every single retrieval code path* applying that filter correctly, forever, with zero future exceptions. One missed filter, one refactor that forgets to pass `patient_id`, and another patient's data could theoretically surface.

### Recommended architecture: one FAISS index per patient

```
data/patient_indices/{patient_uuid}.index
data/patient_indices/{patient_uuid}_meta.json
```

This is **structural** isolation, not filter-based isolation — one patient's vectors are never physically present in another patient's index file, so there is nothing for a filtering bug to leak. This also matches actual usage: a doctor always selects exactly **one** patient before chatting, so a query only ever needs to load one (small) index — faster than searching one large shared index, and a bug while reindexing only affects one patient rather than the whole system.

**Ingestion model changes accordingly:** instead of the current bulk `/reindex` endpoint rebuilding one global index, ingestion becomes **incremental per patient** — whenever a new record, vitals entry, diagnosis, prescription, or uploaded document is added for patient X, only that new chunk is embedded and appended to patient X's index. The `/reindex` endpoint should be redesigned to accept a `patient_id` and rebuild only that one patient's index (useful for backfills or recovering from a corrupted index), not the whole system.

### Required access gate (ties together §6, §7, and this section)

Before any RAG query runs:
1. Doctor selects patient X.
2. Backend checks for an **active** `CareRelationship` between this doctor and patient X. No active relationship → refuse before any retrieval is attempted, not after.
3. Load patient X's isolated FAISS index.
4. Apply the note-visibility filter from §7 (same shared function used by the direct API).
5. Retrieve → build prompt → generate.

Patient self-queries ("summarize my own history") follow the same path against their own index, with the visibility filter still applied (excludes `PROVIDER_ONLY` notes from anyone but the patient themself, per §7's rule).

---

## 9. Parked for Later (explicitly agreed, not in current scope)

**Pre-appointment dynamic intake questionnaires.** Idea: when a patient books an appointment, the system generates a short, easy-to-fill dynamic form/questionnaire based on the issue(s) they mention, so the doctor has structured context *before* the visit — reclaiming the first 10–15 minutes typically spent on verbal history-taking. Good idea, intentionally deferred until everything in §6, §7, and §8 is implemented and stable. Do not start building this until the current requirements above are done.

---

## 10. Suggested Priority Order

1. **Frontend `.env.local`** — trivial, unblocks Google OAuth and removes hardcoded localhost URLs. Do this first, it's free.
2. **Seed realistic clinical test data** — needed before RAG/continuity features can be meaningfully tested at all.
3. **Fix the fake auth-gate cookie** — security-relevant, not urgent for a prototype demo, but must be resolved before any real users touch this.
4. **`CareRelationship` migration + QR connection flow** (§6) — unblocks everything below; this is the foundational entity the rest depends on.
5. **Note-visibility fields + shared filter function** (§7) — straightforward once §6 exists.
6. **Per-patient FAISS index restructuring** (§8) — re-architect ingestion/retrieval before building the continuity feature on top of the current shared-index setup, to avoid building on something you'll need to tear out later.
7. **Longitudinal RAG continuity feature** (§5) — the real product value, built once 4–6 are in place.
8. **Real `JWT_SECRET` rotation, `protobuf` pin fix** — pre-deployment hardening, not urgent for continued local development.
9. **Real blockchain implementation** (§4) — deliberately last; everything above matters more for the actual product than the trust-anchoring layer, which can remain simulated for a good while longer without blocking anything else.
10. **Pre-appointment intake questionnaires** (§9) — after everything above is solid.
