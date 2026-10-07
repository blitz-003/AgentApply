"""Tests for schema validation of AI output (AGENTS.md rule 5)."""

import pytest

from app.infrastructure.response_schemas import (
    ATS_GENERATION_SCHEMA,
    COVER_LETTER_GENERATION_SCHEMA,
    RESUME_GENERATION_SCHEMA,
)
from app.infrastructure.response_validator import (
    AIResponseValidationError,
    response_validator,
)


def test_accepts_valid_cover_letter():
    payload = {"content": "Dear Hiring Manager, ..."}
    assert (
        response_validator.validate_payload(
            payload, COVER_LETTER_GENERATION_SCHEMA, "cover letter"
        )
        is payload
    )


def test_rejects_missing_required_key():
    with pytest.raises(AIResponseValidationError, match="cover letter"):
        response_validator.validate_payload({}, COVER_LETTER_GENERATION_SCHEMA, "cover letter")


def test_rejects_unexpected_key():
    payload = {"content": "hi", "unexpected": True}
    with pytest.raises(AIResponseValidationError):
        response_validator.validate_payload(
            payload, COVER_LETTER_GENERATION_SCHEMA, "cover letter"
        )


def test_rejects_wrong_type():
    with pytest.raises(AIResponseValidationError):
        response_validator.validate_payload(
            {"content": 123}, COVER_LETTER_GENERATION_SCHEMA, "cover letter"
        )


def test_rejects_non_object_payload():
    with pytest.raises(AIResponseValidationError, match="expected a JSON object"):
        response_validator.validate_payload(["not", "a", "dict"], COVER_LETTER_GENERATION_SCHEMA, "x")


def test_ats_schema_requires_every_key():
    valid = {
        "previous_score": 55,
        "strengths": ["Clear impact bullets"],
        "weaknesses": ["No metrics"],
        "recommendations": ["Quantify"],
        "missing_keywords": ["Kubernetes"],
        "keywords_extracted": ["Kubernetes"],
        "keyword_categories": [{"keyword": "Kubernetes", "category": "Cloud/DevOps"}],
    }
    response_validator.validate_payload(valid, ATS_GENERATION_SCHEMA, "ats")

    incomplete = {k: v for k, v in valid.items() if k != "weaknesses"}
    with pytest.raises(AIResponseValidationError):
        response_validator.validate_payload(incomplete, ATS_GENERATION_SCHEMA, "ats")


def test_resume_schema_rejects_malformed_skills():
    """Skills must be groups of {category, items}; a bare string list is invalid."""
    bad = {
        "keywords_extracted": ["React"],
        "keyword_categories": [{"keyword": "React", "category": "Frontend"}],
        "resume_data": {
            "personal_info": {
                "name": "A",
                "email": "a@b.c",
                "phone": "",
                "location": "",
                "linkedin": "",
                "github": "",
            },
            "summary": "s",
            "education": [],
            "experience": [],
            "projects": [],
            "skills": ["React", "TypeScript"],
            "certifications": [],
            "languages": [],
            "achievements": [],
        },
    }
    with pytest.raises(AIResponseValidationError):
        response_validator.validate_payload(bad, RESUME_GENERATION_SCHEMA, "resume")