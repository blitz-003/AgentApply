"""Strict JSON Schemas for Groq Structured Outputs.

Strict mode (strict: true) constrains decoding so responses always match the
schema exactly: every field must be required and every object must set
additionalProperties to false. Keep every schema here compatible with that
subset (no anyOf/oneOf/nullable/defaults).
"""

PERSONAL_INFO_SCHEMA = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "email": {"type": "string"},
        "phone": {"type": "string"},
        "location": {"type": "string"},
        "linkedin": {"type": "string"},
        "github": {"type": "string"},
    },
    "required": ["name", "email", "phone", "location", "linkedin", "github"],
    "additionalProperties": False,
}

EXPERIENCE_ENTRY_SCHEMA = {
    "type": "object",
    "properties": {
        "company": {"type": "string"},
        "position": {"type": "string"},
        "description": {"type": "string"},
        "start_date": {"type": "string"},
        "end_date": {"type": "string"},
    },
    "required": ["company", "position", "description", "start_date", "end_date"],
    "additionalProperties": False,
}

EDUCATION_ENTRY_SCHEMA = {
    "type": "object",
    "properties": {
        "institution": {"type": "string"},
        "degree": {"type": "string"},
        "field": {"type": "string"},
        "start_date": {"type": "string"},
        "end_date": {"type": "string"},
    },
    "required": ["institution", "degree", "field", "start_date", "end_date"],
    "additionalProperties": False,
}

PROJECT_ENTRY_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "description": {"type": "string"},
        "start_date": {"type": "string"},
        "end_date": {"type": "string"},
    },
    "required": ["title", "description", "start_date", "end_date"],
    "additionalProperties": False,
}

SKILLS_GROUP_SCHEMA = {
    "type": "object",
    "properties": {
        "category": {"type": "string"},
        "items": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["category", "items"],
    "additionalProperties": False,
}

RESUME_DATA_SCHEMA = {
    "type": "object",
    "properties": {
        "personal_info": PERSONAL_INFO_SCHEMA,
        "summary": {"type": "string"},
        "education": {"type": "array", "items": EDUCATION_ENTRY_SCHEMA},
        "experience": {"type": "array", "items": EXPERIENCE_ENTRY_SCHEMA},
        "projects": {"type": "array", "items": PROJECT_ENTRY_SCHEMA},
        "skills": {"type": "array", "items": SKILLS_GROUP_SCHEMA},
        "certifications": {"type": "array", "items": {"type": "string"}},
        "languages": {"type": "array", "items": {"type": "string"}},
        "achievements": {"type": "array", "items": {"type": "string"}},
    },
    "required": [
        "personal_info",
        "summary",
        "education",
        "experience",
        "projects",
        "skills",
        "certifications",
        "languages",
        "achievements",
    ],
    "additionalProperties": False,
}

ATS_ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "previous_score": {"type": "integer"},
        "overall_score": {"type": "integer"},
        "strengths": {"type": "array", "items": {"type": "string"}},
        "weaknesses": {"type": "array", "items": {"type": "string"}},
        "recommendations": {"type": "array", "items": {"type": "string"}},
        "missing_keywords": {"type": "array", "items": {"type": "string"}},
    },
    "required": [
        "previous_score",
        "overall_score",
        "strengths",
        "weaknesses",
        "recommendations",
        "missing_keywords",
    ],
    "additionalProperties": False,
}

KEYWORD_CATEGORY_SCHEMA = {
    "type": "object",
    "properties": {
        "keyword": {"type": "string"},
        "category": {"type": "string"},
    },
    "required": ["keyword", "category"],
    "additionalProperties": False,
}

COVER_LETTER_SCHEMA = {
    "type": "object",
    "properties": {
        "content": {"type": "string"},
    },
    "required": ["content"],
    "additionalProperties": False,
}

GENERATE_SCHEMA = {
    "type": "object",
    "properties": {
        "keywords_extracted": {"type": "array", "items": {"type": "string"}},
        "keyword_categories": {"type": "array", "items": KEYWORD_CATEGORY_SCHEMA},
        "resume_data": RESUME_DATA_SCHEMA,
        "cover_letter": COVER_LETTER_SCHEMA,
        "ats_analysis": ATS_ANALYSIS_SCHEMA,
    },
    "required": [
        "keywords_extracted",
        "keyword_categories",
        "resume_data",
        "cover_letter",
        "ats_analysis",
    ],
    "additionalProperties": False,
}

SUMMARY_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {"type": "string"},
    },
    "required": ["summary"],
    "additionalProperties": False,
}

EXPERIENCE_SCHEMA = {
    "type": "object",
    "properties": {
        "experience": EXPERIENCE_ENTRY_SCHEMA,
    },
    "required": ["experience"],
    "additionalProperties": False,
}

PROJECT_SCHEMA = {
    "type": "object",
    "properties": {
        "project": PROJECT_ENTRY_SCHEMA,
    },
    "required": ["project"],
    "additionalProperties": False,
}

SKILLS_SCHEMA = {
    "type": "object",
    "properties": {
        "skills": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["skills"],
    "additionalProperties": False,
}


def structured_format(name: str, schema: dict) -> dict:
    return {
        "type": "json_schema",
        "json_schema": {"name": name, "strict": True, "schema": schema},
    }