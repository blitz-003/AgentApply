````markdown
# Agent Apply

# API Design Specification

**Version:** 1.0  
**Base URL:** `/api/v1`  
**Authentication:** JWT via HTTPOnly Cookie

---

# Authentication

## Register

### POST `/auth/register`

### Request

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Response

```json
{
  "message": "Registration successful",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

## Login

### POST `/auth/login`

### Request

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Response

```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

Sets Access Token and Refresh Token as HTTPOnly cookies.

---

## Logout

### POST `/auth/logout`

### Response

```json
{
  "message": "Logged out successfully"
}
```

---

## Current User

### GET `/auth/me`

### Response

```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com"
}
```

---

# Dashboard / Resume Library

## Get All Resumes

### GET `/resumes`

### Query Parameters

| Name   | Required | Description            |
| ------ | -------- | ---------------------- |
| search | No       | Search by resume title |
| page   | No       | Default 1              |
| limit  | No       | Default 10             |

### Response

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Frontend Resume",
      "target_role": "Frontend Developer",
      "template": {
        "id": "uuid",
        "name": "Modern"
      },
      "updated_at": "2026-07-19T12:00:00Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 1
}
```

---

## Create Resume

### POST `/resumes`

Creates an empty resume record before entering the guided AI flow.

### Request

```json
{
  "title": "Frontend Resume"
}
```

### Response

```json
{
  "id": "uuid",
  "title": "Frontend Resume"
}
```

---

## Get Resume

### GET `/resumes/{resumeId}`

### Response

```json
{
  "id": "uuid",
  "title": "Frontend Resume",
  "template_id": "uuid",
  "resume_data": {},
  "ats_analysis": {},
  "cover_letter": {}
}
```

---

## Update Resume

### PATCH `/resumes/{resumeId}`

### Request

```json
{
  "title": "Updated Resume",
  "template_id": "uuid",
  "resume_data": {}
}
```

### Response

```json
{
  "message": "Resume updated successfully"
}
```

---

## Delete Resume

### DELETE `/resumes/{resumeId}`

### Response

```
204 No Content
```

---

# Resume Upload

## Upload Existing Resume

### POST `/resumes/{resumeId}/upload`

Content-Type

```
multipart/form-data
```

### Form Data

| Field  | Type |
| ------ | ---- |
| resume | File |

Accepted Types

- PDF
- DOCX

### Response

```json
{
  "resume_data": {
    "personal_info": {},
    "summary": "",
    "education": [],
    "experience": [],
    "projects": [],
    "skills": [],
    "certifications": [],
    "languages": [],
    "achievements": []
  }
}
```

---

# AI Guided Flow

## Generate Tailored Resume

### POST `/resumes/{resumeId}/ai/generate`

### Request

```json
{
  "job_description": "...",
  "target_role": "Frontend Developer"
}
```

Only one of the following is required:

- job_description
- target_role

### Response

```json
{
  "resume_data": {},
  "cover_letter": {},
  "ats_analysis": {}
}
```

---

## ATS Analysis

### POST `/resumes/{resumeId}/ai/ats-analysis`

### Request

```json
{
  "job_description": "...",
  "target_role": "Frontend Developer"
}
```

### Response

```json
{
  "overall_score": 91,
  "strengths": ["Strong React experience"],
  "weaknesses": ["Missing Docker"],
  "recommendations": ["Mention CI/CD experience"],
  "missing_keywords": ["Docker", "Kubernetes"]
}
```

---

## Generate Cover Letter

### POST `/resumes/{resumeId}/ai/cover-letter`

### Request

```json
{
  "company_name": "Google",
  "job_title": "Frontend Developer",
  "job_description": "..."
}
```

### Response

```json
{
  "content": "Generated cover letter..."
}
```

---

# AI Resume Editing

## Improve Summary

### POST `/resumes/{resumeId}/ai/improve-summary`

### Request

```json
{
  "summary": "Current summary..."
}
```

### Response

```json
{
  "summary": "Improved summary..."
}
```

---

## Rewrite Summary

### POST `/resumes/{resumeId}/ai/rewrite-summary`

### Request

```json
{
  "summary": "Current summary..."
}
```

### Response

```json
{
  "summary": "Rewritten summary..."
}
```

---

## Generate Experience

### POST `/resumes/{resumeId}/ai/generate-experience`

### Request

```json
{
  "experience": {
    "company": "ABC",
    "position": "Frontend Developer",
    "description": "Built React applications"
  }
}
```

### Response

```json
{
  "experience": {
    "company": "ABC",
    "position": "Frontend Developer",
    "description": "AI-generated experience..."
  }
}
```

---

## Improve Experience

### POST `/resumes/{resumeId}/ai/improve-experience`

### Request

```json
{
  "experience": {
    "company": "ABC",
    "position": "Frontend Developer",
    "description": "Current description"
  }
}
```

### Response

```json
{
  "experience": {
    "company": "ABC",
    "position": "Frontend Developer",
    "description": "Improved description..."
  }
}
```

---

## Improve Project

### POST `/resumes/{resumeId}/ai/improve-project`

### Request

```json
{
  "project": {
    "title": "Portfolio Website",
    "description": "Built using Next.js"
  }
}
```

### Response

```json
{
  "project": {
    "title": "Portfolio Website",
    "description": "Improved project description..."
  }
}
```

---

## Suggest Skills

### POST `/resumes/{resumeId}/ai/suggest-skills`

### Request

```json
{
  "skills": ["React", "JavaScript"]
}
```

### Response

```json
{
  "skills": ["React", "JavaScript", "TypeScript", "Next.js", "Tailwind CSS"]
}
```

---

# Templates

## Get All Templates

### GET `/templates`

### Response

```json
[
  {
    "id": "uuid",
    "name": "Modern",
    "description": "Modern resume layout",
    "preview_image": "/templates/modern.png"
  },
  {
    "id": "uuid",
    "name": "Classic",
    "description": "Traditional resume layout",
    "preview_image": "/templates/classic.png"
  }
]
```

---

## Get Template

### GET `/templates/{templateId}`

### Response

```json
{
  "id": "uuid",
  "name": "Modern",
  "description": "Modern resume layout",
  "preview_image": "/templates/modern.png"
}
```

---

## Update Resume Template

### PATCH `/resumes/{resumeId}/template`

### Request

```json
{
  "template_id": "uuid"
}
```

### Response

```json
{
  "message": "Template updated successfully"
}
```

---

# PDF Export

## Export Resume

### POST `/resumes/{resumeId}/export`

### Response

```
Content-Type: application/pdf
```

Returns the generated PDF file for download.

---

# Common HTTP Status Codes

| Code | Description            |
| ---- | ---------------------- |
| 200  | Success                |
| 201  | Resource Created       |
| 204  | No Content             |
| 400  | Bad Request            |
| 401  | Unauthorized           |
| 403  | Forbidden              |
| 404  | Not Found              |
| 409  | Conflict               |
| 413  | File Too Large         |
| 415  | Unsupported Media Type |
| 422  | Validation Error       |
| 429  | Too Many Requests      |
| 500  | Internal Server Error  |

---

# Endpoint Summary

| Method | Endpoint                                     | Description              |
| ------ | -------------------------------------------- | ------------------------ |
| POST   | `/auth/register`                             | Register user            |
| POST   | `/auth/login`                                | Login                    |
| POST   | `/auth/logout`                               | Logout                   |
| GET    | `/auth/me`                                   | Current user             |
| GET    | `/resumes`                                   | List resumes             |
| POST   | `/resumes`                                   | Create resume            |
| GET    | `/resumes/{resumeId}`                        | Get resume               |
| PATCH  | `/resumes/{resumeId}`                        | Update resume            |
| DELETE | `/resumes/{resumeId}`                        | Delete resume            |
| POST   | `/resumes/{resumeId}/upload`                 | Upload existing resume   |
| POST   | `/resumes/{resumeId}/ai/generate`            | Generate tailored resume |
| POST   | `/resumes/{resumeId}/ai/ats-analysis`        | Run ATS analysis         |
| POST   | `/resumes/{resumeId}/ai/cover-letter`        | Generate cover letter    |
| POST   | `/resumes/{resumeId}/ai/improve-summary`     | Improve summary          |
| POST   | `/resumes/{resumeId}/ai/rewrite-summary`     | Rewrite summary          |
| POST   | `/resumes/{resumeId}/ai/generate-experience` | Generate experience      |
| POST   | `/resumes/{resumeId}/ai/improve-experience`  | Improve experience       |
| POST   | `/resumes/{resumeId}/ai/improve-project`     | Improve project          |
| POST   | `/resumes/{resumeId}/ai/suggest-skills`      | Suggest skills           |
| GET    | `/templates`                                 | List templates           |
| GET    | `/templates/{templateId}`                    | Get template             |
| PATCH  | `/resumes/{resumeId}/template`               | Change template          |
| POST   | `/resumes/{resumeId}/export`                 | Export PDF               |
````
