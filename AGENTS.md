# AGENTS.md — Agent Instructions for Agent Apply

## Documentation-First Workflow

This repo follows a documentation-first development process. All requirements, architecture, API contracts, database design, and implementation rules are in `/docs`.

**Read every document before implementing anything.**

Precedence order (highest first):

1. `docs/PRD.md` (currently empty — skip until populated)
2. `docs/FSD.md` — primary user-facing spec (most detailed)
3. `docs/SAD.md` — architecture, folder structure, architectural rules
4. `docs/DDD.md` — database entities, relationships, indexes
5. `docs/API_DESIGN.md` — all 24 endpoints, request/response shapes
6. `docs/ROADMAP.md` — 9 sequential milestones
7. `docs/IMPLEMENTATION_RULES.md` — implementation constraints

If docs conflict, **stop and ask**. Never guess or invent.

## Current State

- `backend/` and `frontend/` directories exist but are **empty**.
- No code, no configs, no package.json, no requirements.txt, no CI.
- Start from **Milestone 1** (Project Setup).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (feature-first), React Query, React Hook Form, Zod |
| Backend | FastAPI (Python), Clean Architecture |
| Database | Supabase PostgreSQL |
| AI | OpenAI via abstracted AI Orchestrator |
| PDF Export | LaTeX compiler pipeline (JSON → .tex → PDF) |
| Auth | Supabase Auth, JWT via HTTPOnly cookies |

## Architecture Rules

Non-negotiable rules from SAD — violating any of these is a bug:

1. **Components never call APIs directly.** Hooks own mutations; components consume hook results.
2. **Features do not import other features.** Each feature is self-contained.
3. **Repositories only access the DB.** Repositories never call AI services.
4. **Infrastructure never imports services.** Dependency flows inward only.
5. **AI output must pass schema validation.** Never trust raw LLM responses.
6. **One endpoint = one responsibility = one file.** No mega-routers.
7. **Keep files small.** If a file grows large, split it.
8. **Original uploaded resumes are never modified.** AI works on a generated editable copy.
9. **Follow Clean Architecture layers:** Routers → Services → Repositories → Infrastructure → Database.

## Folder Structure

### Frontend

```
app/            # Next.js app router (pages, layouts)
features/       # auth/, dashboard/, workspace/, resume/, template/
components/     # shared UI components
lib/            # api/, auth/, ai/, pdf/ (utilities and clients)
hooks/          # custom React hooks
schemas/        # Zod validation schemas
types/          # TypeScript type definitions
```

### Backend

```
app/
  api/            # FastAPI routers (one per domain)
  services/       # Business logic
  repositories/   # DB access only
  models/         # DB models
  schemas/        # Pydantic models (request/response/validation)
  infrastructure/ # External service clients (AI, PDF, etc.)
  db/             # Database config and migrations
  middleware/     # Auth, logging, rate limiting
```

## Roadmap

Implement **sequentially, milestone by milestone**. Never implement a future milestone.

| # | Milestone | Key Deliverables |
|---|-----------|-----------------|
| 1 | Project Setup | Next.js + FastAPI scaffold, folder structure, env vars, base layouts |
| 2 | Authentication | Supabase Auth, login/register, protected routes, logout |
| 3 | Resume CRUD | DB models, resume API, dashboard, create/edit/delete |
| 4 | AI Resume Copilot | AI endpoints, prompt builders, resume generation & improvement |
| 5 | ATS Analyzer | Job description analysis, keyword extraction, cover letter generation |
| 6 | Resume Upload | PDF/DOCX parsing, normalization, populate editor |
| 7 | PDF Export | HTML rendering → PDF generation → download |
| 8 | UI Polish | Loading/error/empty states, responsiveness, toasts |
| 9 | Testing & Deployment | Final fixes, env setup, production deploy |

## API Contracts

- **Base URL:** `/api/v1`
- **Auth:** JWT access + refresh tokens via HTTPOnly cookies
- **24 endpoints** defined in `docs/API_DESIGN.md`
- Follow the **exact request/response shapes** — do not add, remove, or rename fields.

## Key Business Rules

- Users can only access their own resumes (authorization on every protected endpoint).
- AI generation requires either a job description OR a target role — not both, not neither.
- Uploaded resumes (PDF/DOCX, max 10 MB) are parsed to JSON, then the **original file is deleted**.
- Cover letters are stored separately — one resume can have many cover letters.
- ATS analysis is a 1:1 relationship with a resume (unique constraint).
- Hard delete only — no soft delete.
- Do **not** persist prompts, raw LLM responses, or chain-of-thought to the database.
- PDFs are generated on demand from LaTeX templates — not stored in the database.
- Resume data is stored as JSONB in the `resumes` table following the schema in DDD.md.

## Validation

- **Frontend:** Zod schemas (matching Pydantic models on the backend).
- **Backend:** Pydantic validation on every request body and response.
- Both layers enforce the same rules — keep them in sync.
