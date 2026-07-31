# Fix AI Parsing & PDF Styling

## Problem
After uploading a resume and generating, PDF download shows "Your Name" instead of the actual name. Root cause: `build_generate_prompt()` never specifies the internal structure of `resume_data`, so the AI invents its own key names (e.g. `contact` vs `personal_info`, `work_experience` vs `experience`).

## Changes Required

### 1. `backend/app/infrastructure/prompt_builder.py`
**File:** `backend/app/infrastructure/prompt_builder.py`

**Location 1** — raw_text branch (lines 65-68)
Replace:
```
"The response JSON must have exactly these keys: "
'"resume_data" (object), "cover_letter" (object with key "content"), '
'"ats_analysis" (object with keys "overall_score", "strengths", "weaknesses", '
'"recommendations", "missing_keywords").'
```
With:
```
"The response JSON must have exactly these keys: "
'"resume_data" (object with keys: '
'"personal_info" (object with keys "name", "email", "phone", "location", "linkedin", "github"), '
'"summary" (string), '
'"experience" (list of objects with keys "company", "position", "description", "start_date", "end_date"), '
'"education" (list of objects with keys "institution", "degree", "field", "start_date", "end_date"), '
'"skills" (list of strings), '
'"projects" (list of objects with keys "title", "description", "start_date", "end_date")), '
'"cover_letter" (object with key "content"), '
'"ats_analysis" (object with keys "overall_score", "strengths", "weaknesses", '
'"recommendations", "missing_keywords").'
```

**Location 2** — template branch (lines 79-82)
Same replacement as above (the identical text appears in the `else` branch).

### 2. `backend/app/services/resume_ai.py`
Already fixed — `response_format={"type": "json_object"}` added to all 7 `chat()` calls.

### 3. `frontend/lib/pdf/generate-pdf.ts`
Already fixed — PDF styling cleaned up (no blue accents, no side borders, no underlines, no pill backgrounds).

## Verification
- `cd backend; python -c "import py_compile; py_compile.compile('app/services/resume_ai.py', doraise=True); py_compile.compile('app/infrastructure/prompt_builder.py', doraise=True); print('OK')"`
- `cd frontend; npm run build`
