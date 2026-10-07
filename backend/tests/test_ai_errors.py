"""Tests for the AI error taxonomy: codes, sanitisation and truncation parsing."""

import pytest

from app.infrastructure.ai_errors import (
    CODE_AUTH_FAILED,
    CODE_EMPTY_RESPONSE,
    CODE_INVALID_REQUEST,
    CODE_OUTPUT_TRUNCATED,
    CODE_PROVIDER_REJECTED,
    CODE_RATE_LIMITED,
    CODE_SCHEMA_INVALID,
    AIAuthError,
    AIEmptyResponseError,
    AIInvalidRequestError,
    AIOutputTruncatedError,
    AIProviderRejectedError,
    AIResponseValidationError,
    RateLimitExhaustedError,
    extract_json_path,
    extract_missing_fields,
    looks_truncated,
    sanitize_provider_text,
)

# The real provider message captured from the 502 that started this work.
REAL_TRUNCATION = (
    "Error code: 400 - {'error': {'message': 'max completion tokens reached "
    "before generating a valid document: the output was truncated to fit "
    "max_completion_tokens and is missing required content. Increase "
    "max_completion_tokens. See failed_generation for the truncated output. "
    "Error: jsonschema: '/resume_data' does not validate with /required: "
    "missing properties: 'projects', 'certifications', 'languages', "
    "'achievements'', 'type': 'invalid_request_error', 'code': "
    "'json_validate_failed'}}"
)


class TestSanitizeProviderText:
    def test_masks_organisation_identifier(self):
        out = sanitize_provider_text(
            "organization org_01ky4tkanzf9kvgv4b4dkbb8tb exceeded TPM"
        )
        assert "org_01ky4tkanzf9kvgv4b4dkbb8tb" not in out
        assert "org_***" in out

    @pytest.mark.parametrize(
        "secret",
        [
            "gsk_abc123def456ghi789",
            "sk-live-ABCDEFGHIJKLMNOP",
            "rk_0123456789abcdef",
            "xai-abcdefghijklmnop",
        ],
    )
    def test_masks_prefixed_provider_keys(self, secret):
        assert secret not in sanitize_provider_text(f"key {secret} rejected")

    def test_masks_jwt(self):
        jwt = (
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
            "eyJyb2xlIjoiYW5vbiIsImlhdCI6MTc4NDU1OTk0NX0."
            "sig-part-here-abcdefghijklmnop"
        )
        assert jwt not in sanitize_provider_text(f"token {jwt} invalid")

    def test_masks_long_hex_blob(self):
        blob = "a" * 40
        assert blob not in sanitize_provider_text(f"signature {blob}")

    def test_masks_email(self):
        assert "user@example.com" not in sanitize_provider_text(
            "email user@example.com rejected"
        )

    def test_masks_bearer_header(self):
        assert "abcdef123456" not in sanitize_provider_text(
            "Authorization: Bearer abcdef123456"
        )

    def test_preserves_provider_error_codes(self):
        """The code is the most useful part of the message; never mask it."""
        for code in ("json_validate_failed", "rate_limit_exceeded", "model_not_found"):
            assert code in sanitize_provider_text(f"code {code} here")

    def test_preserves_truncation_wording_and_field_names(self):
        out = sanitize_provider_text(REAL_TRUNCATION)
        assert "json_validate_failed" in out
        assert "max completion tokens reached" in out
        assert "projects" in out

    def test_collapses_whitespace_and_bounds_length(self):
        out = sanitize_provider_text("a\n\n  b" + " x" * 900)
        assert "\n" not in out
        assert len(out) <= 610
        assert out.endswith("...")


class TestTruncationParsing:
    def test_detects_real_truncation_message(self):
        assert looks_truncated(REAL_TRUNCATION)

    def test_extracts_missing_fields(self):
        assert extract_missing_fields(REAL_TRUNCATION) == [
            "projects",
            "certifications",
            "languages",
            "achievements",
        ]

    def test_extracts_json_path(self):
        assert extract_json_path(REAL_TRUNCATION) == "/resume_data"

    def test_returns_empty_when_absent(self):
        assert extract_missing_fields("no fields here") == []
        assert extract_json_path("no path here") == ""

    def test_non_truncation_message_is_not_truncated(self):
        assert not looks_truncated("rate limit exceeded, retry later")


class TestErrorPayloads:
    def test_truncation_payload_carries_code_and_provider_details(self):
        err = AIOutputTruncatedError(
            "cut off",
            reason=REAL_TRUNCATION,
            provider_code="json_validate_failed",
            provider_status=400,
            path="/resume_data",
            missing=["projects"],
        )
        payload = err.to_payload()
        assert payload["code"] == CODE_OUTPUT_TRUNCATED
        assert payload["provider_code"] == "json_validate_failed"
        assert payload["provider_status"] == 400
        assert payload["path"] == "/resume_data"
        assert payload["missing"] == ["projects"]
        assert err.http_status == 502

    def test_rate_limit_payload_includes_retry_after(self):
        err = RateLimitExhaustedError("busy", retry_after=42)
        assert err.to_payload()["retry_after"] == 42
        assert err.to_payload()["code"] == CODE_RATE_LIMITED
        assert err.http_status == 429

    @pytest.mark.parametrize(
        "err,expected_code,expected_status",
        [
            (AIResponseValidationError("bad"), CODE_SCHEMA_INVALID, 502),
            (AIEmptyResponseError("empty"), CODE_EMPTY_RESPONSE, 502),
            (AIAuthError("no key"), CODE_AUTH_FAILED, 502),
            (AIProviderRejectedError("nope"), CODE_PROVIDER_REJECTED, 502),
            (AIInvalidRequestError("bad input"), CODE_INVALID_REQUEST, 400),
        ],
    )
    def test_each_error_carries_its_own_code(self, err, expected_code, expected_status):
        assert err.to_payload()["code"] == expected_code
        assert err.http_status == expected_status

    def test_validation_error_is_still_a_value_error(self):
        """Existing callers catch ValueError; keep that contract."""
        assert isinstance(AIResponseValidationError("x"), ValueError)
        assert isinstance(AIInvalidRequestError("x"), ValueError)

    def test_payload_omits_absent_optional_fields(self):
        payload = AIAuthError("no key").to_payload()
        assert set(payload) == {"code", "message"}

    def test_reason_is_sanitised_in_payload(self):
        err = AIProviderRejectedError(
            "x", reason="org_01ky4tkanzf9kvgv4b4dkbb8tb exhausted"
        )
        assert "org_01ky4tkanzf9kvgv4b4dkbb8tb" not in err.to_payload()["reason"]
