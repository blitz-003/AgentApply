"""Stable, code-level error taxonomy for AI failures.

Every AI failure carries a machine-readable ``code`` so callers can branch on the
cause and so the exact upstream failure is visible instead of one generic
"the AI provider failed" string. The HTTP layer turns these into a JSON body of
the form::

    {"detail": {"code": "ai_output_truncated", "message": "...",
                "provider_code": "json_validate_failed", "provider_status": 400,
                "reason": "...", "path": "/resume_data", "missing": [...]}}

Provider text is sanitised before it reaches a client: raw Groq errors embed the
account and organisation identifiers (for example ``org_01ky...``), so the reason
is scrubbed rather than echoed verbatim.
"""

import re

# --- client-safe codes -------------------------------------------------------

CODE_RATE_LIMITED = "ai_rate_limited"
CODE_OUTPUT_TRUNCATED = "ai_output_truncated"
CODE_SCHEMA_INVALID = "ai_schema_invalid"
CODE_EMPTY_RESPONSE = "ai_empty_response"
CODE_AUTH_FAILED = "ai_auth_failed"
CODE_PROVIDER_REJECTED = "ai_provider_rejected"
CODE_UNAVAILABLE = "ai_unavailable"
CODE_INVALID_REQUEST = "ai_invalid_request"

# Patterns that must never reach a browser. Deliberately narrow: a blanket
# "mask any 20+ character token" rule also destroyed provider error codes such as
# 'json_validate_failed', which are the most useful part of the message.
# Targeted at what credentials actually look like instead.
_SECRET_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    # JWTs (Supabase anon/service keys).
    (
        re.compile(r"\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}"),
        "***",
    ),
    # Prefixed provider keys: gsk_, sk-, rk_, xai. The length floor is deliberately
    # low: anything carrying one of these prefixes is a credential by convention,
    # and a short key must still be masked if it ever appears in an error.
    (re.compile(r"\b(?:sk|gsk|rk|xai)[_-][A-Za-z0-9_-]{4,}"), "***"),
    # Long hex blobs (tokens, signatures, ids).
    (re.compile(r"\b[0-9a-f]{32,}\b"), "***"),
    # Account / organisation identifiers Groq embeds in rate-limit messages.
    (re.compile(r"\b(org|proj|team|user)_[A-Za-z0-9]{6,}"), r"\1_***"),
    (re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b"), "***@***"),
    (re.compile(r"(?i)\bbearer\s+\S+"), "Bearer ***"),
)

_MAX_REASON_CHARS = 600


def sanitize_provider_text(text: str) -> str:
    """Strip account identifiers, keys and emails out of provider text."""
    if not text:
        return ""
    cleaned = str(text)
    for pattern, replacement in _SECRET_PATTERNS:
        cleaned = pattern.sub(replacement, cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if len(cleaned) > _MAX_REASON_CHARS:
        cleaned = cleaned[:_MAX_REASON_CHARS].rstrip() + "..."
    return cleaned


def provider_error_fields(exc: Exception) -> tuple[str, int | None, str]:
    """Pull (code, status, message) out of an OpenAI/Groq client exception."""
    status = getattr(exc, "status_code", None)
    if not isinstance(status, int):
        status = None

    message = str(exc)
    if not message:
        body = getattr(exc, "body", None)
        if body is not None:
            message = str(body)

    code = ""
    body = getattr(exc, "body", None)
    if isinstance(body, dict):
        err = body.get("error")
        if isinstance(err, dict):
            raw_code = err.get("code")
            if isinstance(raw_code, str):
                code = raw_code

    if not code:
        # Some failures only report the code inside the rendered message, e.g.
        # "Error code: 400 - {'error': {'code': 'json_validate_failed', ...}}".
        # Relying on a parsed body attribute alone reported an empty code for the
        # exact 400 that caused the original bug.
        match = re.search(r"['\"]code['\"]\s*:\s*['\"]([a-z_]+)['\"]", message)
        if match:
            code = match.group(1)
    return code, status, message


class AIError(Exception):
    """Base class for every AI failure that reaches the HTTP layer."""

    code: str = CODE_UNAVAILABLE
    http_status: int = 502

    def __init__(
        self,
        message: str,
        *,
        reason: str = "",
        provider_code: str = "",
        provider_status: int | None = None,
        path: str = "",
        missing: list[str] | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.reason = sanitize_provider_text(reason)
        self.provider_code = provider_code
        self.provider_status = provider_status
        self.path = path
        self.missing = missing or []

    def to_payload(self) -> dict:
        """Client-safe structured detail."""
        payload: dict = {"code": self.code, "message": self.message}
        if self.provider_code:
            payload["provider_code"] = self.provider_code
        if self.provider_status is not None:
            payload["provider_status"] = self.provider_status
        if self.reason:
            payload["reason"] = self.reason
        if self.path:
            payload["path"] = self.path
        if self.missing:
            payload["missing"] = self.missing
        return payload


class RateLimitExhaustedError(AIError):
    """Every model in the pool is rate limited."""

    code = CODE_RATE_LIMITED
    http_status = 429

    def __init__(self, message: str, retry_after: int, **kwargs):
        super().__init__(message, **kwargs)
        self.retry_after = retry_after

    def to_payload(self) -> dict:
        payload = super().to_payload()
        payload["retry_after"] = self.retry_after
        return payload


class AIOutputTruncatedError(AIError):
    """The provider hit max_completion_tokens before emitting valid JSON."""

    code = CODE_OUTPUT_TRUNCATED
    http_status = 502


class AIResponseValidationError(AIError, ValueError):
    """AI output did not satisfy its declared schema (AGENTS.md rule 5)."""

    code = CODE_SCHEMA_INVALID
    http_status = 502


class AIEmptyResponseError(AIError):
    """The model returned no content at all."""

    code = CODE_EMPTY_RESPONSE
    http_status = 502


class AIAuthError(AIError):
    """The provider rejected the configured credentials."""

    code = CODE_AUTH_FAILED
    http_status = 502


class AIProviderRejectedError(AIError):
    """The provider refused the request for a non-rate-limit reason."""

    code = CODE_PROVIDER_REJECTED
    http_status = 502


class AIInvalidRequestError(AIError, ValueError):
    """Our own input validation rejected the request; the client can fix it."""

    code = CODE_INVALID_REQUEST
    http_status = 400


# Substrings Groq uses when the answer was cut off by the output cap. Matched
# case-insensitively because the wording has changed between provider revisions.
TRUNCATION_MARKERS = (
    "max completion tokens reached",
    "max_completion_tokens reached",
    "is missing required content",
    "output was truncated",
)

_SCHEMA_MARKERS = (
    "does not validate with",
    "failed to validate json",
)


def looks_truncated(message: str) -> bool:
    lowered = (message or "").lower()
    return any(marker in lowered for marker in TRUNCATION_MARKERS)


def looks_like_schema_failure(message: str) -> bool:
    lowered = (message or "").lower()
    return any(marker in lowered for marker in _SCHEMA_MARKERS)


def extract_missing_fields(message: str) -> list[str]:
    """Pull required-property names out of a jsonschema error message.

    Groq phrases these as ``missing properties: 'projects', 'certifications'``,
    which is the most actionable part of the failure for the caller. Only the
    leading run of quoted names is taken: the provider continues the same error
    object with other quoted fields such as ``'type'`` that are not properties.
    """
    match = re.search(
        r"missing properties?:\s*((?:'[^',]{1,80}'\s*,?\s*)+)", message or "", re.I
    )
    if not match:
        return []
    return re.findall(r"'([^']+)'", match.group(1))


def extract_json_path(message: str) -> str:
    """Pull the failing instance path, e.g. ``'/resume_data'``."""
    match = re.search(r"'(/[^']*)'\s+does not validate", message or "")
    return match.group(1) if match else ""
