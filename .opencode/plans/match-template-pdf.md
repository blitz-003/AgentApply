# Match PDF Output to Template Resume Styling

## Target
Generated PDF must look identical to `template_resume.docx` in font, size, color, and layout.

## Files to Change

### 1. `frontend/lib/pdf/generate-pdf.ts` — complete rewrite of `renderResumeHtml()`

### 2. `backend/app/infrastructure/prompt_builder.py` — tighten bullet point rules

### 3. `backend/app/services/resume_ai.py` — already has response_format fix

---

## File 1: `generate-pdf.ts` — New Styling Spec

| Element | CSS |
|---|---|
| Font stack | `Helvetica Neue, Helvetica, Arial, sans-serif` |
| Name | `font-size: 13pt; text-align: center; font-weight: 400;` |
| Role/Title | `font-size: 10.5pt; text-align: center;` (skip if not in data) |
| Contact links | `font-size: 10.5pt;` email in `color: #0066FF` |
| Section headings | `font-size: 11pt; font-weight: 400; text-transform: uppercase;` no border/underline |
| Company line | `font-size: 10.5pt;` company name **bold**, rest normal |
| Body text | `font-size: 11pt; color: #000000; line-height: 1.15;` |
| Colors | Text: `#000000`, email: `#0066FF`, no blue accents elsewhere |

### Layout Details

**Header area:**
```
ELMAN PATHAN (13pt, centered)
Full-Stack Developer (10.5pt, centered) — only if personal_info.title exists
elmanpathan@gmail.com | linkedin.com/in/blitz-003 | github.com/blitz-003 (10.5pt, email in #0066FF)
```

**Section headings (all sections):**
- 11pt, uppercase, NOT bold, no border/underline
- Text only, with ~10pt margin-bottom

**Experience entries:**
```
Company Name | Position | Location | Dates (10.5pt, company bold, rest normal)
Description point 1 (11pt, #000000, separate <p>)
Description point 2 (11pt, #000000, separate <p>)
Description point 3 (11pt, #000000, separate <p>)
```
- No left border, no flex layout, no background
- Description: split by newlines into separate `<p>` elements

**Skills section:**
```
TECHNICAL SKILLS (11pt uppercase heading)
Category: skill1, skill2, skill3 (11pt, #000000, plain text)
Category2: skill4, skill5, skill6
```
- NOT tag pills — render as category-labeled lines
- If no category info, fall back to: `Programming: skill1, skill2, skill3` etc.
- Each line separated, no bullets

**Projects:**
```
1. Project Title – Subtitle | Tech Stack (10.5pt, title bold, rest normal)
Description point 1 (11pt, #000000, separate <p>)
Description point 2 (11pt, #000000, separate <p>)
```
- Numbered with `#. ` prefix
- Title bold, tech stack normal
- Description split by newlines

**Education:**
```
Institution, Location (11pt)
Degree Field | Dates (11pt)
```
- Institution on one line, degree + dates on next

**Extra sections (render if data has them):**
- `achievements` → ACHIEVEMENTS heading + bullet list
- `languages` → LANGUAGES heading + comma-separated line
- `certifications` → CERTIFICATIONS heading + list

### Cover letter
Same font/color scheme, plain text layout.

### Description paragraph splitting rule
- Split `description` string by `\n` into separate `<p>` elements
- If no newlines, render as a single `<p>`

---

## File 2: `prompt_builder.py` — Tighten bullet rules

### In `build_generate_prompt()` and `build_parse_resume_prompt()`:

**Update `STAR_RULES` or add per-entry rule:**

Current:
```
"Maximum 3 bullet points per section. Be concise and impactful."
```

Change to:
```
"Each experience entry must have exactly 3 bullet points separated by newlines. "
"Each project entry must have exactly 3 bullet points separated by newlines. "
"Be concise and impactful. Use strong action verbs and quantify achievements."
```

**Also add to the resume_data schema in `build_generate_prompt()`:**

The `description` field in experience and projects should note that bullet points are separated by `\n`.

---

## File 3: `resume_ai.py`
Already fixed — `response_format={"type": "json_object"}` on all chat() calls.
No changes needed.

---

## Summary of Changes

| File | Change |
|---|---|
| `prompt_builder.py` | Change STAR_RULES: "Maximum 3 per section" → "Exactly 3 per entry, separated by newlines" |
| `generate-pdf.ts` | Full rewrite of `renderResumeHtml()`: Helvetica Neue 13/11/10.5pt, #000000/#0066FF, no borders/underlines/pills, newline-split descriptions, comma-separated skills, numbered projects |
