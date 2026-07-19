# Agent Apply --- Software Architecture Document (Summary)

## Overview

Agent Apply is an AI-first resume creation platform. The core user
journey is: Dashboard → Guided AI Flow → Resume Workspace → PDF Export.

## Architecture Principles

- Clean Architecture
- Feature-first frontend
- Layered backend
- Single Responsibility Principle
- AI provider abstraction
- Strong validation at every boundary

## High-Level Architecture

```text
Next.js Frontend
      │
HTTP + JWT Cookies
      │
FastAPI Backend
 ├── Business Services
 ├── AI Orchestrator
 ├── Repositories
 └── Infrastructure
      │
Supabase PostgreSQL
OpenAI
LaTeX Compiler
```

## Frontend

```text
features/
  auth/
  dashboard/
  workspace/
  resume/
  template/

lib/
  api/
  auth/
  ai/
  pdf/
```

### Resume Workspace

- Guided Journey
- ATS Summary
- Resume Form
- Live Preview
- AI Actions
- Template Selector
- Cover Letter
- Export Toolbar

State: - Server: TanStack Query - Forms: React Hook Form - Validation:
Zod - Auth: Context - Local UI: useState

## Backend

Layers: - Routers - Services - AI Orchestrator - Repositories -
Infrastructure - Database

Services: - ResumeService - ResumeAIOrchestrator - ResumeParserService -
TemplateService - PDFService - AuthService

## AI Pipeline

```text
ResumeService
    ↓
ResumeAIOrchestrator
    ↓
ContextBuilder
    ↓
PromptBuilder
    ↓
LLMClient
    ↓
ResponseParser
    ↓
ResponseValidator
```

Each AI capability has its own endpoint: - POST /resume/generate -
/resume/improve - /resume/rewrite - /resume/ats-analysis -
/resume/cover-letter

## Resume Upload

```text
Upload
↓
Document Parser
↓
Raw Resume JSON
↓
Normalizer
↓
Resume Schema
↓
Resume Workspace
```

## LaTeX Rendering

```text
Resume JSON
↓
Template Mapper
↓
LaTeX Template
↓
Template Renderer
↓
resume.tex
↓
LaTeX Compiler
↓
PDF
↓
Download
```

## Architectural Rules

1.  Components never call APIs directly.
2.  Hooks own mutations.
3.  Services own business logic.
4.  Repositories only access DB.
5.  Repositories never call AI.
6.  Infrastructure never imports services.
7.  AI output must pass schema validation.
8.  One endpoint = one responsibility.
9.  One file = one responsibility.
10. Features do not import other features.

## Logging

- Correlation/Request ID on every request
- Structured logs
- AI failures logged without sensitive content

## Security

- HTTPOnly JWT cookies
- Pydantic + Zod validation
- Authorization on every protected endpoint
- Rate limiting AI endpoints
- File validation for uploads

## Performance

- React Query caching
- Server Components where possible
- Lazy loaded workspace panels
- Keep AI outside DB transactions

## Folder Structures

### Frontend

```text
app/
features/
components/
lib/
hooks/
schemas/
types/
```

### Backend

```text
app/
 api/
 services/
 repositories/
 models/
 schemas/
 infrastructure/
 db/
 middleware/
```

## Implementation Guidance

Every major file should document: - Purpose - Responsibilities -
Inputs - Outputs - Dependencies - Forbidden Responsibilities -
Collaborators

This summary serves as the blueprint. The full implementation guide
would expand each module into detailed file-level specifications.
