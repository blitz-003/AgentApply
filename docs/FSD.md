---

# Functional Specification Document (FSD)

# Agent Apply

**Version:** 2.0 (AI-Guided MVP)
**Project Type:** AI-Powered Resume Builder & Job Application Assistant
**Timeline:** 1.5 Days

---

# 1. Application Overview

## Purpose

Agent Apply is an AI-powered web application that guides job seekers through creating professional resumes tailored to specific job opportunities.

Rather than presenting users with a traditional resume builder, Agent Apply acts as an AI assistant that asks a series of questions, analyzes the user's background and target job, generates a tailored resume, and allows users to review, edit, and export it.

---

# 2. Application Sitemap

## Public Pages

```
/

Login

Register
```

---

## Protected Pages

```
Dashboard

Resume Editor
```

Only **2 protected pages** are required.

---

# Navigation

## Logged Out

```
Logo

Home

Login

Register
```

---

## Logged In

```
Logo

Dashboard

Profile Menu
    Logout
```

---

# 3. Page Specifications

---

# Home Page

## URL

```
/
```

## Purpose

Introduce Agent Apply and encourage users to register or log in.

### Components

- Navigation Bar
- Hero Section
- Features
- How It Works
- CTA
- Footer

### Primary Actions

- Get Started
- Login
- Register

---

# Login Page

## URL

```
/login
```

### Components

- Email
- Password
- Login Button

### Validation

- Email required
- Valid email format
- Password required

### Success

Redirect to Dashboard

---

# Register Page

## URL

```
/register
```

### Components

- Name
- Email
- Password
- Confirm Password

### Success

Automatically log in

Redirect Dashboard

---

# Dashboard

## URL

```
/dashboard
```

## Purpose

Acts as a resume library where users manage their resumes.

No resume editing or AI generation occurs here.

---

## Components

### Navbar

- Logo
- Dashboard
- User Menu
- Logout

---

### Welcome Section

Displays greeting.

Primary CTA

```
+ New Resume
```

---

### Search

Search resumes by

- Resume title
- Target role

---

### Resume Library

Displays all saved resumes.

---

### Resume Card

Displays

- Resume Title
- Target Role
- Selected Template
- Last Updated

Actions

- Edit
- Download PDF
- Delete

---

## Empty State

```
No resumes yet.

Create your first AI-powered resume.
```

Button

```
Create Resume
```

---

## Loading State

Skeleton cards.

---

## Error State

Unable to load resumes.

Retry button.

---

# Resume Editor

## URL

```
/dashboard/resumes/:id
```

## Purpose

Single workspace for:

- AI Guided Journey
- Resume Editing
- Resume Preview
- Template Selection
- PDF Export
- Cover Letter Review

This is the core page of the application.

---

# 4. Guided Resume Creation Flow

When a newly created resume is opened, users enter an AI-guided journey before accessing the editor.

---

## Step 1

### Target Job

Question

```
Do you have a job description?
```

Options

- Yes
- No

---

If Yes

Show

```
Paste Job Description
```

textarea

---

If No

Ask

```
What role are you applying for?
```

Text input

Examples

- Frontend Developer
- Backend Engineer
- Product Manager

---

## Step 2

### Resume Source

Question

```
How would you like to start?
```

Options

- Upload Existing Resume
- Create From Scratch

---

### Upload Resume

Accepted

- PDF
- DOCX

AI extracts

- Personal Information
- Experience
- Education
- Projects
- Skills

---

### Create From Scratch

Collect only essential information

- Name
- Contact
- Experience
- Education
- Skills

---

## Step 3

### AI Analysis

Display AI progress.

Example

```
Reading Resume

Understanding Job Description

Matching Skills

Identifying Missing Keywords

Optimizing Resume

Generating Cover Letter
```

No user interaction required.

---

## Step 4

### Analysis Summary

Display

- ATS Match Score
- Strengths
- Missing Keywords
- Suggested Improvements

Buttons

```
Generate Tailored Resume
```

---

## Step 5

Resume Editor opens.

---

# 5. Resume Editor

Once the tailored resume is generated, the editor becomes fully editable.

---

## Sections

### Personal Information

Editable.

---

### Professional Summary

Actions

- Improve
- Rewrite

---

### Experience

Actions

- Generate
- Improve

---

### Projects

Actions

- Improve

---

### Skills

Actions

- Suggest Skills

---

### Education

Editable.

---

### Template

Dropdown.

Live preview updates immediately.

---

### Cover Letter

Generated automatically during AI analysis.

User can edit.

---

### Export

Download PDF.

---

# 6. Resume Management Workflow

## Create Resume

Dashboard

↓

New Resume

↓

Guided AI Flow

↓

Resume Editor

↓

Save

---

## Edit Resume

Dashboard

↓

Resume

↓

Resume Editor

↓

Save

---

## Delete Resume

Dashboard

↓

Delete

↓

Confirmation

↓

Delete

---

## Export PDF

Resume Editor

↓

Export PDF

↓

Download

---

# 7. Authentication Flow

Registration

↓

Dashboard

---

Login

↓

Dashboard

---

Logout

↓

Home

---

Unauthenticated access to protected routes

↓

Redirect Login

---

Expired Session

↓

Redirect Login

Display

```
Session expired.
Please login again.
```

---

# 8. Business Rules

- Users can only access their own resumes.
- Resume title is required before saving.
- AI resume generation requires either a Job Description or Target Role.
- AI analysis requires a resume source (uploaded or created).
- Uploaded resumes must be PDF or DOCX.
- PDF export requires a saved resume.
- Cover letter is generated only after AI analysis.
- Resume template must be selected before export.
- Users can edit all AI-generated content before saving.
- Original uploaded resume is never modified directly; the application works on an editable generated version.

---

# 9. Validation Rules

## Registration

| Field            | Rule                 |
| ---------------- | -------------------- |
| Name             | Required             |
| Email            | Valid email          |
| Password         | Minimum 8 characters |
| Confirm Password | Must match           |

---

## Login

| Field    | Rule     |
| -------- | -------- |
| Email    | Required |
| Password | Required |

---

## Guided Flow

### Job Description

Required if "Yes" is selected.

Minimum

50 characters.

---

### Target Role

Required if "No" is selected.

Maximum

100 characters.

---

### Resume Upload

Allowed

- PDF
- DOCX

Maximum file size

10 MB

---

### Resume Form

| Field      | Rule               |
| ---------- | ------------------ |
| Name       | Required           |
| Email      | Required           |
| Experience | At least one entry |
| Education  | At least one entry |
| Skills     | At least one skill |

---

# 10. System Feedback

## Toast Messages

- Resume created successfully.
- Resume updated successfully.
- Resume deleted successfully.
- Resume exported successfully.
- AI analysis completed.
- Tailored resume generated.
- Cover letter generated.

---

## Confirmation Dialogs

Delete Resume

Discard Unsaved Changes

Logout

---

## Error Messages

- Login failed.
- Registration failed.
- Resume save failed.
- PDF export failed.
- AI request failed.
- Resume upload failed.
- Network error.

---

# 11. Edge Cases

- Invalid file format during upload.
- Uploaded resume cannot be parsed.
- AI generation timeout.
- ATS analysis failure.
- PDF generation failure.
- Network disconnect.
- Session expiration.
- Duplicate form submission.
- User leaves page with unsaved changes.
- Resume not found.
- Empty dashboard.
- Missing required fields.
- Job description too short.
- AI returns incomplete content.

---

# 12. Loading, Empty, Error & Success States

| Feature       | Loading               | Empty         | Error          | Success              |
| ------------- | --------------------- | ------------- | -------------- | -------------------- |
| Dashboard     | Skeleton cards        | No resumes    | Failed to load | Resume library shown |
| Guided Flow   | AI progress animation | N/A           | AI failed      | Analysis completed   |
| Resume Upload | Upload progress       | No file       | Upload failed  | Resume parsed        |
| Resume Editor | Section loading       | Blank section | Save failed    | Resume saved         |
| PDF Export    | Generating PDF        | N/A           | Export failed  | Download started     |

---

# 13. Assignment Requirement Mapping

| Assignment Requirement | Implementation                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Authentication         | Register, Login, Logout, Protected Routes                                                               |
| Resume CRUD            | Create, Edit, Delete, View resumes                                                                      |
| AI Feature 1           | AI-guided resume generation integrated into the resume creation flow                                    |
| AI Feature 2           | AI analysis with ATS score, keyword extraction, tailored resume generation, and cover letter generation |
| Resume Templates       | Template selection within the Resume Editor                                                             |
| PDF Export             | Export editable resumes as PDF                                                                          |
| Production UX          | Loading, empty, success, and error states across all workflows                                          |
| Authorization          | Users can only manage their own resumes                                                                 |
| Validation             | Client and server-side validation for all forms                                                         |
| MVP Scope              | Streamlined AI-first workflow achievable within a 1.5-day implementation timeline                       |

---

## Final MVP Architecture

```
Public
│
├── Home
├── Login
└── Register

Protected
│
├── Dashboard
│     ├── Welcome
│     ├── Search
│     ├── Resume Library
│     └── Resume Cards
│
└── Resume Editor
      ├── AI Guided Journey
      ├── ATS Analysis
      ├── Resume Form
      ├── AI Section Actions
      ├── Template Selection
      ├── Cover Letter
      ├── Live Preview
      └── PDF Export
```

### Why this design?

- **Only 2 protected pages**, making navigation simple.
- **One primary workspace (Resume Editor)** where all creation, editing, AI assistance, template selection, preview, and export occur.
- **AI-first onboarding** that guides users instead of presenting a blank form.
- Minimal implementation complexity while still satisfying the assignment requirements and providing a polished, production-ready user experience.
