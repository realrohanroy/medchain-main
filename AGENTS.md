# MedChain — Agent Rules

Before starting ANY task, read `PROJECT_CONTEXT.md` at the workspace root in full, or the specific section the task references. It is the ground-truth status of this codebase — do not re-derive architecture or assume anything it already states.

## Hard constraints (always apply)
- Only modify files explicitly listed in the current task. Never touch files "while you're in there" unless asked.
- Never invent new models, fields, or endpoints not specified in PROJECT_CONTEXT.md or the current task prompt. If something seems missing, ask first.
- Any access-control or visibility check (CareRelationship, AccessGrant, note visibility) must use a single shared filter function called from both the Django API and the RAG service — never duplicate this logic in two places.
- Do not implement blockchain logic beyond the existing simulated stub unless a task explicitly says so (see PROJECT_CONTEXT.md §4).
- After any change, state which files you modified and why, before considering the task done.
- If a task seems to require touching more than what's listed, stop and ask rather than expanding scope.

## Workflow
- This project has two folders: medchain-frontend-main (Next.js/TypeScript) and medchain-server-main (Django + FastAPI RAG service at medchain-server-main/medchain-rag).
- Work on a feature branch per task, never directly on main.
- Run relevant tests after changes (pytest -v for medchain-rag; manual check for frontend) before reporting a task complete.