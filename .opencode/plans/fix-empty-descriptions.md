# Fix Empty Descriptions in AI Output

## Problem
Upload flow prompt says "parse... extract... structure" — the AI thinks it should only extract what exists. When the raw text lacks descriptions, the AI leaves them empty instead of generating them.

## Changes

### File: `backend/app/infrastructure/prompt_builder.py`

**Change 1** — System prompt (upload flow, raw_text branch):
```
- "Given raw text from an uploaded resume, parse it, optimize it for the target role, and generate an ATS-friendly resume."
+ "Given raw text from an uploaded resume, extract everything you can and GENERATE any missing content (especially 3 detailed bullet points per entry) to produce a complete, optimized resume for the target role."
```

**Change 2** — User context (upload flow):
```
- "Parse this raw text, extract all information, correct spelling/grammar errors, and structure it into a professional resume."
+ "Extract all available information from this raw text, correct spelling/grammar errors, then GENERATE any missing content (descriptions, bullet points) to produce a complete professional resume. Each experience entry must have exactly 3 bullet points. Each project entry must have exactly 3 bullet points."
```

## No other files changed
`generate-pdf.ts` and `resume_ai.py` are already correct.
