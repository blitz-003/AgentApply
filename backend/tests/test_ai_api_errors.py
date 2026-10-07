"""Tests for AI error mapping at the API layer. No network, no auth, no DB."""

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.infrastructure.ai_errors import (
    AIOutputTruncatedError,
    AIProviderRejectedError,
)
from app.infrastructure.llm_client import RateLimitExhaustedError
from app.infrastructure.response_validator import AIResponseValidationError
from app.main import app
from app.schemas.auth import UserResponse
from app.services import resume_ai as resume_ai_module
from tests.test_ai_errors import REAL_TRUNCATION

USER = UserResponse(id="user-1", email="a@b.c", name="Ada")
GENERATE_URL = "/api/v1/resumes/resume-1/ai/generate"


@pytest.fixture
def client():
    # dependency_overrides is keyed on the original callable, so it works even
    # though the router imported get_current_user by value at import time.
    app.dependency_overrides[get_current_user] = lambda: USER
    try:
        yield TestClient(app, raise_server_exceptions=False)
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def stub_repos(monkeypatch):
    """Replace DB writes so tests never touch Supabase."""
    service = resume_ai_module.resume_ai
    monkeypatch.setattr(
        service, "_get_resume_data", lambda user_id, resume_id: {"resume_data": {}}
    )
    monkeypatch.setattr(
        resume_ai_module.resume_repository, "update", lambda *a, **k: None
    )
    monkeypatch.setattr(
        resume_ai_module.ats_analysis_repository, "upsert", lambda *a, **k: None
    )
    monkeypatch.setattr(
        resume_ai_module.cover_letter_repository, "list_by_resume", lambda *a: []
    )
    monkeypatch.setattr(
        resume_ai_module.cover_letter_repository, "create", lambda *a, **k: None
    )
    return service


@pytest.fixture
def stub_calls(monkeypatch):
    """Replace the per-call AI invocation with a canned payload."""

    def _install(payloads: dict[str, dict]):
        async def fake_run_call(prompt, schema, schema_name, context, max_output_tokens):
            return payloads[context]

        monkeypatch.setattr(resume_ai_module.resume_ai, "_run_call", fake_run_call)

    return _install


def _resume_payload() -> dict:
    return {
        "keywords_extracted": ["React"],
        "keyword_categories": [{"keyword": "React", "category": "Frontend"}],
        "resume_data": {
            "personal_info": {
                "name": "Ada", "email": "a@b.c", "phone": "", "location": "",
                "linkedin": "", "github": "",
            },
            "summary": "Summary.",
            "education": [],
            "experience": [],
            "projects": [],
            "skills": [{"category": "Frontend", "items": ["React"]}],
            "certifications": [],
            "languages": [],
            "achievements": [],
        },
    }


def _letter_payload() -> dict:
    return {"content": "Dear Hiring Manager, this is a tailored letter."}


def _ats_payload() -> dict:
    return {
        "previous_score": 42,
        "strengths": ["Quantified bullets"],
        "weaknesses": ["No metrics"],
        "recommendations": ["Add numbers"],
        "missing_keywords": ["Kubernetes"],
        "keywords_extracted": ["React", "Kubernetes"],
        "keyword_categories": [
            {"keyword": "React", "category": "Frontend"},
            {"keyword": "Kubernetes", "category": "Cloud/DevOps"},
        ],
    }


@pytest.fixture(autouse=True)
def no_network(monkeypatch):
    """Fail loudly if any test in this file reaches the real provider."""
    from app.infrastructure.llm_client import llm_router

    async def forbidden(*a, **k):
        raise AssertionError("test attempted a real AI provider call")

    monkeypatch.setattr(llm_router, "_complete", forbidden)


def test_successful_generation_merges_all_three_calls(client, stub_repos, stub_calls):
    stub_calls({
        "resume generation": _resume_payload(),
        "cover letter generation": _letter_payload(),
        "ATS analysis": _ats_payload(),
    })

    resp = client.post(GENERATE_URL, json={"target_role": "Backend Engineer"})

    assert resp.status_code == 200, resp.text
    body = resp.json()
    # Keywords missing from the generated resume are injected under the category
    # reported by the ATS call: React already present, Kubernetes is added.
    assert body["resume_data"]["skills"] == [
        {"category": "Frontend", "items": ["React"]},
        {"category": "Cloud/DevOps", "items": ["Kubernetes"]},
    ]
    assert body["cover_letter"]["content"].startswith("Dear")
    # previous_score comes from the ATS call.
    assert body["ats_analysis"]["previous_score"] == 42
    assert body["ats_analysis"]["included_keywords"] == ["Kubernetes"]
    assert body["ats_analysis"]["overall_score"] == 100


def test_letter_opening_with_header_echo_is_rerun_and_fixed(
    client, stub_repos, stub_calls, monkeypatch
):
    """A schema-valid letter that opens with a header echo is re-requested once.

    The rerun is the same targeted cover-letter call: gym-generated content
    (name/contact block above the salutation) must not be persisted as-is.
    """
    echo_letter = {"content": "Ada Lovelace\nLondon, UK\nada@example.com\n\nDear Hiring Manager"}
    stub_calls({
        "resume generation": _resume_payload(),
        "cover letter generation": echo_letter,
        "ATS analysis": _ats_payload(),
    })

    reruns = []

    async def fake_rerun(resume_data, job_description, target_role, raw_text):
        reruns.append((job_description, target_role))
        return {"content": "Dear Hiring Manager, fixed letter."}

    monkeypatch.setattr(
        resume_ai_module.resume_ai,
        "_rerun_letter_with_opening_reminder",
        fake_rerun,
    )

    resp = client.post(GENERATE_URL, json={"target_role": "Backend Engineer"})

    assert resp.status_code == 200, resp.text
    assert len(reruns) == 1
    assert reruns[0][1] == "Backend Engineer"
    assert resp.json()["cover_letter"]["content"].startswith("Dear")


def test_letter_header_echo_rerun_can_fail_diagnosably(
    client, stub_repos, stub_calls, monkeypatch
):
    """If the guarded rerun itself fails, the API must report it — never persist
    a header-echo letter, and never loop forever."""
    stub_calls({
        "resume generation": _resume_payload(),
        "cover letter generation": {"content": "Ada Lovelace\nLondon, UK"},
        "ATS analysis": _ats_payload(),
    })

    async def failing_rerun(*a, **k):
        raise AIResponseValidationError(
            "cover letter generation: content did not start with 'Dear'",
            reason="model repeated the resume header instead of a salutation",
            path="cover_letter.content",
        )

    monkeypatch.setattr(
        resume_ai_module.resume_ai, "_rerun_letter_with_opening_reminder", failing_rerun
    )

    resp = client.post(GENERATE_URL, json={"target_role": "Backend Engineer"})

    assert resp.status_code == 502
    detail = resp.json()["detail"]
    assert detail["code"] == "ai_schema_invalid"
    assert detail["path"] == "cover_letter.content"


def test_rate_limit_exhausted_returns_429_with_retry_after(
    client, stub_repos, monkeypatch
):
    async def boom(*a, **k):
        raise RateLimitExhaustedError("all cooling", retry_after=42)

    monkeypatch.setattr(resume_ai_module.resume_ai, "_run_call", boom)

    resp = client.post(GENERATE_URL, json={"target_role": "Backend Engineer"})

    assert resp.status_code == 429
    assert resp.headers["Retry-After"] == "42"
    detail = resp.json()["detail"]
    assert detail["code"] == "ai_rate_limited"
    assert detail["retry_after"] == 42
    # The original message is preserved but names the failing operation.
    assert detail["message"] == "AI generation: all cooling"


def test_schema_violation_returns_502_naming_the_missing_fields(
    client, stub_repos, monkeypatch
):
    async def boom(*a, **k):
        raise AIResponseValidationError(
            "resume generation: missing 'summary'",
            reason="'summary' is a required property",
            path="resume_data",
            missing=["summary", "skills"],
        )

    monkeypatch.setattr(resume_ai_module.resume_ai, "_run_call", boom)

    resp = client.post(GENERATE_URL, json={"target_role": "Backend Engineer"})

    assert resp.status_code == 502
    detail = resp.json()["detail"]
    assert detail["code"] == "ai_schema_invalid"
    # The caller is told exactly which fields were absent, not just that the
    # response was unusable.
    assert detail["missing"] == ["summary", "skills"]
    assert detail["path"] == "resume_data"
    assert "ai_schema_invalid" not in detail["message"]


def test_truncation_returns_502_with_provider_code_and_fields(
    client, stub_repos, monkeypatch
):
    async def boom(*a, **k):
        raise AIOutputTruncatedError(
            "The AI's answer was cut off before it finished.",
            reason=REAL_TRUNCATION,
            provider_code="json_validate_failed",
            provider_status=400,
            path="/resume_data",
            missing=["projects", "certifications"],
        )

    monkeypatch.setattr(resume_ai_module.resume_ai, "_run_call", boom)

    resp = client.post(GENERATE_URL, json={"target_role": "Backend Engineer"})

    assert resp.status_code == 502
    detail = resp.json()["detail"]
    assert detail["code"] == "ai_output_truncated"
    assert detail["provider_code"] == "json_validate_failed"
    assert detail["provider_status"] == 400
    assert detail["missing"] == ["projects", "certifications"]
    # The provider's own wording survives sanitisation.
    assert "json_validate_failed" in detail["reason"]
    assert "max completion tokens reached" in detail["reason"]


def test_provider_error_returns_502_without_leaking_detail(
    client, stub_repos, monkeypatch
):
    async def boom(*a, **k):
        raise AIProviderRejectedError(
            "AI provider rejected the request.",
            reason="key gsk_secret leaked org_01ky4tkanzf9kvgv4b4dkbb8tb",
            provider_code="model_not_found",
            provider_status=404,
        )

    monkeypatch.setattr(resume_ai_module.resume_ai, "_run_call", boom)

    resp = client.post(GENERATE_URL, json={"target_role": "Backend Engineer"})

    assert resp.status_code == 502
    detail = resp.json()["detail"]
    assert detail["code"] == "ai_provider_rejected"
    # The code and status are preserved...
    assert detail["provider_code"] == "model_not_found"
    assert detail["provider_status"] == 404
    # ...but credentials and account identifiers are not.
    assert "gsk_secret" not in resp.text
    assert "org_01ky4tkanzf9kvgv4b4dkbb8tb" not in resp.text


def test_both_target_fields_returns_400(client, stub_repos):
    resp = client.post(
        GENERATE_URL,
        json={"target_role": "Dev", "job_description": "We need a dev"},
    )
    assert resp.status_code == 400


def test_no_target_field_returns_400(client, stub_repos):
    resp = client.post(GENERATE_URL, json={})
    assert resp.status_code == 400
