# AgentApply

**AgentApply** is an AI-powered resume builder designed to help users create, improve, and optimize professional resumes with AI assistance.

## Live Demo

[**agent-apply-two.vercel.app**](https://agent-apply-two.vercel.app/)

## Features

- AI-powered resume assistance
- Resume creation and management
- ATS-focused resume optimization
- Resume analysis and improvement suggestions
- PDF/DOCX resume processing
- User authentication
- Professional resume templates
- AI-assisted content generation

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- TanStack Query
- React Hook Form
- Zod

### Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Supabase
- OpenAI
- PDF/DOCX processing

## Architecture

```text
┌─────────────────────┐
│   Next.js Frontend  │
│ TypeScript + React  │
└──────────┬──────────┘
           │ REST API
           ▼
┌─────────────────────┐
│   FastAPI Backend   │
│       Python        │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌──────────┐ ┌──────────┐
│ Supabase │ │  OpenAI  │
│ DB / Auth│ │ AI APIs  │
└──────────┘ └──────────┘