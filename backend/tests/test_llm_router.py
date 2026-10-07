"""Tests for the LLM rotation router: failover, budget accounting, fail-fast."""

import time

import pytest

from app.config import settings
from app.infrastructure.ai_errors import (
    AIAuthError,
    AIOutputTruncatedError,
    AIProviderRejectedError,
)
from app.infrastructure.response_validator import AIResponseValidationError
from app.infrastructure.llm_client import (
    INCOMPLETE_OUTPUT_REMINDER,
    LLMRouter,
    ModelSlot,
    RateLimitExhaustedError,
    TPM_SAFETY_MARGIN,
    _RateLimited,
    estimate_tokens,
)
from tests.test_ai_errors import REAL_TRUNCATION


# The exact provider rejection captured when gpt-oss-20b looped: it emitted the
# keyword list three times over and never started 'resume_data'. Note the
# duplicated keywords -- that repetition is the actual defect, not the budget.
INCOMPLETE_DOCUMENT = (
    "Error code: 400 - {'error': {'message': \"Generated JSON does not match the "
    "expected schema. Please adjust your prompt. See 'failed_generation' for more "
    "details. Error: jsonschema: '' does not validate with /required: missing "
    "properties: 'resume_data'\", 'type': 'invalid_request_error', 'code': "
    "'json_validate_failed', 'failed_generation': '{\"keywords_extracted\": "
    "[\"Python\",\"FastAPI\",\"Python\",\"FastAPI\"], \"keyword_categories\": "
    "[{\"k'}}"
)


class FakeLimitError(Exception):
    """Mimics an OpenAI/Groq error carrying a status code and headers."""

    def __init__(self, status_code: int, message: str, headers: dict | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.headers = headers or {}


def make_router() -> LLMRouter:
    router = LLMRouter()
    router._slots = {
        "model-a": ModelSlot("model-a", 8000),
        "model-b": ModelSlot("model-b", 8000),
        "model-c": ModelSlot("model-c", 8000),
    }
    return router


def stub_client(router: LLMRouter, handler) -> list[str]:
    """Install a fake provider client that records the model it was called with.

    Driving the real _complete/_classify path (rather than stubbing _complete
    directly) is what makes these tests exercise error classification too.
    """
    attempted: list[str] = []

    async def create(**kwargs):
        attempted.append(kwargs["model"])
        return handler(kwargs["model"], kwargs)

    class _Completions:
        pass

    class _Chat:
        completions = _Completions()

    _Completions.create = staticmethod(create)
    _Chat.chat = _Chat()
    router._client = type("_FakeClient", (), {"chat": _Chat.chat})()
    return attempted


def _resp(content: str):
    class _Message:
        pass

    class _Choice:
        pass

    class _Response:
        pass

    _Message.content = content
    _Choice.message = _Message()
    _Response.choices = [_Choice()]
    _Response.usage = None
    return _Response()


@pytest.mark.asyncio
async def test_fails_over_to_next_model_on_413():
    """A 413 rate_limit_exceeded on the first model must land on the second."""
    router = make_router()

    def handler(model, kwargs):
        if model == "model-a":
            raise FakeLimitError(413, "tokens per minute: Limit 8000, Requested 16406")
        return _resp('{"ok": true}')

    attempted = stub_client(router, handler)

    result = await router.chat("sys", "user")
    assert result == '{"ok": true}'
    assert attempted == ["model-a", "model-b"]
    # The exhausted model is now cooling down.
    assert router.slots["model-a"].cooldown_until > 0


@pytest.mark.asyncio
async def test_fails_over_on_429_and_uses_retry_after():
    router = make_router()

    def handler(model, kwargs):
        if model == "model-a":
            raise FakeLimitError(429, "rate limit", {"retry-after": "17"})
        return _resp("ok")

    attempted = stub_client(router, handler)

    assert await router.chat("sys", "user") == "ok"
    assert attempted == ["model-a", "model-b"]

    # retry-after of 17s honoured rather than the 60s default.
    remaining = router.slots["model-a"].cooldown_until - time.monotonic()
    assert 0 < remaining <= 17


@pytest.mark.asyncio
async def test_raises_rate_limit_exhausted_when_all_cooling(monkeypatch):
    router = make_router()
    now = time.monotonic()
    for slot in router.slots.values():
        slot.cool_down(30, now)

    async def never_called(*args, **kwargs):
        raise AssertionError("should not call any model")

    monkeypatch.setattr(router, "_complete", never_called)

    with pytest.raises(RateLimitExhaustedError) as exc_info:
        await router.chat("sys", "user")
    assert exc_info.value.retry_after > 0


@pytest.mark.asyncio
async def test_fails_over_when_a_model_returns_an_incomplete_document():
    """A model that loops and never finishes must not fail the whole request.

    gpt-oss-20b intermittently repeated the same keyword list three times and
    never emitted 'resume_data'; the provider rejected it with
    json_validate_failed. Because that failure is about the model's behaviour
    and not the request, the request must be retried on another model.
    """
    router = make_router()
    used: list[str] = []

    def handler(model, kwargs):
        used.append(model)
        if model == "model-a":
            raise FakeLimitError(400, INCOMPLETE_DOCUMENT, {"code": "json_validate_failed"})
        return _resp('{"ok": true}')

    stub_client(router, handler)

    assert await router.chat("sys", "user") == '{"ok": true}'
    assert "model-a" in used
    assert any(m != "model-a" for m in used)


@pytest.mark.asyncio
async def test_incomplete_document_is_repaired_in_place_when_pool_is_busy():
    """With no free model left, retry once with a completion reminder.

    /ai/generate fires three parallel calls and the pool is only three models
    wide, so every sibling already holds a reservation by the time one call
    degenerates. Failing immediately would turn a recoverable, stochastic
    model hiccup into a user-visible 502.
    """
    router = make_router()
    prompts: list[str] = []

    def handler(model, kwargs):
        prompts.append(kwargs["messages"][1]["content"])
        if len(prompts) == 1:
            raise FakeLimitError(400, INCOMPLETE_DOCUMENT, {"code": "json_validate_failed"})
        return _resp('{"ok": true}')

    stub_client(router, handler)
    # Occupy the other two models so no failover target is free.
    router.slots["model-b"].charge(8000, time.monotonic())
    router.slots["model-c"].charge(8000, time.monotonic())

    assert await router.chat("sys", "user") == '{"ok": true}'
    assert len(prompts) == 2
    assert prompts[0] == "user"
    assert INCOMPLETE_OUTPUT_REMINDER.strip() in prompts[1]


@pytest.mark.asyncio
async def test_incomplete_document_is_repaired_at_most_once():
    """The repair must not loop; a second degeneration surfaces the real error."""
    router = make_router()
    calls = 0

    def handler(model, kwargs):
        nonlocal calls
        calls += 1
        raise FakeLimitError(400, INCOMPLETE_DOCUMENT, {"code": "json_validate_failed"})

    stub_client(router, handler)
    router.slots["model-b"].charge(8000, time.monotonic())
    router.slots["model-c"].charge(8000, time.monotonic())

    with pytest.raises(AIResponseValidationError) as info:
        await router.chat("sys", "user")

    assert info.value.provider_code == "json_validate_failed"
    assert info.value.missing == ["resume_data"]
    assert calls == 2, "should try the model, fail over, then repair exactly once"


@pytest.mark.asyncio
async def test_incomplete_document_reports_the_providers_own_fields():
    """When every model degenerates, the caller still gets the real details."""
    router = make_router()

    def handler(model, kwargs):
        raise FakeLimitError(400, INCOMPLETE_DOCUMENT, {"code": "json_validate_failed"})

    stub_client(router, handler)

    with pytest.raises(AIResponseValidationError) as info:
        await router.chat("sys", "user")

    payload = info.value.to_payload()
    assert payload["code"] == "ai_schema_invalid"
    assert payload["provider_code"] == "json_validate_failed"
    assert payload["provider_status"] == 400
    assert payload["missing"] == ["resume_data"]


@pytest.mark.asyncio
async def test_truncation_retry_asks_for_more_room_rather_than_bailing_out():
    """Truncation is a room problem, so the fix is a bigger allowance.

    The pool may hand the retry to whichever model has the most budget left, so
    this asserts on the requested token count rather than on the model name.
    """
    router = make_router()
    requested: list[int] = []

    def handler(model, kwargs):
        requested.append(kwargs["max_completion_tokens"])
        if len(requested) == 1:
            raise FakeLimitError(400, REAL_TRUNCATION, {"code": "json_validate_failed"})
        return _resp('{"ok": true}')

    stub_client(router, handler)

    assert await router.chat("sys", "user", max_output_tokens=500) == '{"ok": true}'
    assert len(requested) == 2
    assert requested[1] > requested[0], (
        f"retry should ask for more room, got {requested}"
    )
    # No model is permanently sidelined for a truncation.
    assert all(s.cooldown_until == 0 for s in router.slots.values())


@pytest.mark.asyncio
async def test_truncated_output_is_retried_once_with_more_room():
    """A cut-off answer is retried with a larger allowance, then succeeds.

    This is the failure behind the original bug: the provider rejected the
    output as json_validate_failed because it ran out of completion tokens
    mid-document, and nothing retried it with more headroom.
    """
    router = make_router()
    attempts: list[int] = []

    async def fake_once(system, user, response_format, max_completion):
        attempts.append(max_completion)
        if len(attempts) == 1:
            raise AIOutputTruncatedError(
                "cut off", provider_code="json_validate_failed", provider_status=400
            )
        return '{"ok": true}'

    router._chat_once = fake_once  # type: ignore[assignment]

    result = await router.chat("sys", "user", max_output_tokens=1000)

    assert result == '{"ok": true}'
    assert len(attempts) == 2
    assert attempts[1] > attempts[0]


@pytest.mark.asyncio
async def test_truncation_retry_is_not_repeated_forever():
    """A retry that is also truncated surfaces the error instead of looping."""
    router = make_router()
    attempts: list[int] = []

    async def fake_once(system, user, response_format, max_completion):
        attempts.append(max_completion)
        raise AIOutputTruncatedError(
            "still cut off", provider_code="json_validate_failed"
        )

    router._chat_once = fake_once  # type: ignore[assignment]

    with pytest.raises(AIOutputTruncatedError):
        await router.chat("sys", "user", max_output_tokens=1000)
    assert len(attempts) == 2


@pytest.mark.asyncio
async def test_truncation_retry_skipped_when_budget_already_maximal():
    """No point retrying when the first request already asked for everything."""
    router = make_router()
    attempts: list[int] = []

    async def fake_once(system, user, response_format, max_completion):
        attempts.append(max_completion)
        raise AIOutputTruncatedError("cut off")

    router._chat_once = fake_once  # type: ignore[assignment]

    # A prompt that consumes the model's whole per-minute limit pins the output
    # allowance at the floor, so the retry cannot ask for more.
    with pytest.raises(AIOutputTruncatedError):
        await router.chat("x" * 40_000, "user", max_output_tokens=100_000)
    assert len(attempts) == 1


@pytest.mark.asyncio
async def test_skips_models_that_cannot_fit_the_request():
    """A request needing more than the remaining budget is not attempted."""
    router = make_router()
    router.slots["model-a"].charge(7900, time.monotonic())

    attempted = stub_client(router, lambda model, kwargs: _resp("ok"))

    await router.chat("sys", "x" * 8000)
    assert "model-a" not in attempted


@pytest.mark.asyncio
async def test_parallel_calls_get_distinct_models():
    """Three concurrent calls must land on three different models.

    This is the property that makes the free tier viable: a shared model would
    combine all three requests against one 8K TPM budget.
    """
    import asyncio

    router = make_router()
    used: list[str] = []

    async def create(**kwargs):
        used.append(kwargs["model"])
        await asyncio.sleep(0)  # yield, as a real HTTP call would
        return _resp("ok")

    class _Completions:
        pass

    class _Chat:
        completions = _Completions()

    _Completions.create = staticmethod(create)
    router._client = type("_FakeClient", (), {"chat": _Chat()})()

    await asyncio.gather(*(router.chat("sys", "user") for _ in range(3)))

    assert len(used) == 3
    assert len(set(used)) == 3, f"expected 3 distinct models, got {used}"


@pytest.mark.asyncio
async def test_reservation_is_charged_before_the_response_arrives():
    """Budget is claimed up front, not after completion."""
    router = make_router()

    async def create(**kwargs):
        # Model is already charged while the request is still in flight.
        assert router.slots[kwargs["model"]].spent_this_minute > 0
        return _resp("ok")

    class _Completions:
        pass

    class _Chat:
        completions = _Completions()

    _Completions.create = staticmethod(create)
    router._client = type("_FakeClient", (), {"chat": _Chat()})()

    await router.chat("sys", "user")


@pytest.mark.asyncio
async def test_non_rate_limit_error_propagates_without_cooldown():
    router = make_router()

    def handler(model, kwargs):
        raise FakeLimitError(500, "internal server error")

    stub_client(router, handler)

    with pytest.raises(AIProviderRejectedError) as info:
        await router.chat("sys", "user")
    assert info.value.provider_status == 500
    assert info.value.to_payload()["code"] == "ai_provider_rejected"
    assert router.slots["model-a"].cooldown_until == 0


@pytest.mark.asyncio
async def test_auth_error_becomes_safe_runtime_error():
    router = make_router()

    def handler(model, kwargs):
        raise FakeLimitError(401, "invalid api key")

    stub_client(router, handler)

    with pytest.raises(AIAuthError, match="API key") as info:
        await router.chat("sys", "user")
    # The provider's status is retained rather than flattened to a generic error.
    assert info.value.provider_status == 401
    assert info.value.to_payload()["code"] == "ai_auth_failed"


@pytest.mark.asyncio
async def test_reasoning_models_are_forced_to_low_effort():
    """Default reasoning effort can eat the entire output budget.

    A structured JSON request billed against max_completion_tokens returned an
    empty document at the default effort, which the provider rejected as
    json_validate_failed. Only reasoning-capable models get the parameter.
    """
    router = make_router()
    router.slots["model-a"].supports_reasoning_effort = True
    router.slots["model-b"].supports_reasoning_effort = False
    seen: dict[str, dict] = {}

    def handler(model, kwargs):
        seen[model] = kwargs
        return _resp('{"ok": true}')

    stub_client(router, handler)

    await router.chat("sys", "user")
    assert seen["model-a"].get("reasoning_effort") == "low"

    await router.chat("sys", "user")
    assert "reasoning_effort" not in seen["model-b"]


def test_classify_treats_rate_limit_code_as_rate_limit():
    router = make_router()
    slot = router.slots["model-a"]
    # No status code, but the provider's rate_limit_exceeded code is present.
    exc = router._classify(Exception("{'code': 'rate_limit_exceeded'}"), slot)
    assert isinstance(exc, _RateLimited)
    assert exc.retry_after == settings.ai_cooldown_seconds


def test_classify_reports_truncation_instead_of_a_generic_error():
    """A cut-off answer is a distinct, actionable failure.

    Collapsing it into the generic provider error is what left the original bug
    looking like an unexplained 502.
    """
    router = make_router()
    slot = router.slots["model-a"]
    exc = router._classify(
        FakeLimitError(400, REAL_TRUNCATION, {"code": "json_validate_failed"}), slot
    )
    assert isinstance(exc, AIOutputTruncatedError)
    payload = exc.to_payload()
    assert payload["code"] == "ai_output_truncated"
    assert payload["provider_code"] == "json_validate_failed"
    assert payload["missing"] == [
        "projects",
        "certifications",
        "languages",
        "achievements",
    ]
    # Truncation must not trigger failover or cooldown.
    assert slot.cooldown_until == 0


def test_classify_uses_retry_after_header_when_present():
    router = make_router()
    exc = router._classify(
        FakeLimitError(429, "rate limit", {"retry-after": "42"}),
        router.slots["model-a"],
    )
    assert exc.retry_after == 42


def test_output_budget_is_derived_from_the_model_tpm_limit():
    router = make_router()
    slot_tpm = router.slots["model-a"].tpm_limit
    # With a short prompt, the requested output is granted in full.
    assert router.output_budget(1000, 100) == 1000
    # A request larger than any model's per-minute limit is pulled down to what
    # that model can actually accept, minus a safety margin. This is the case
    # that produced json_validate_failed: the ceiling was derived from a flat
    # request budget, so it shrank as the prompt grew and starved the response.
    assert router.output_budget(100_000, 100) == slot_tpm - 100 - TPM_SAFETY_MARGIN
    # Once the prompt consumes the limit, output collapses to the floor rather
    # than going negative.
    assert router.output_budget(100_000, slot_tpm) == 256
    assert router.output_budget(1, 1) == 256
    # The flat request budget still acts as a hard ceiling.
    assert router.output_budget(100_000) <= settings.ai_request_token_budget


def test_estimate_tokens_is_monotonic_and_generous():
    assert estimate_tokens("") == 1
    assert estimate_tokens("a" * 3500) > estimate_tokens("a" * 100)


def test_model_slot_window_resets_after_sixty_seconds():
    slot = ModelSlot("model-x", 100)
    now = time.monotonic()
    slot.charge(100, now)
    assert slot.remaining(now) == 0
    assert not slot.available(now)
    # Budget returns on the next window.
    assert slot.available(now + 61)


def test_supports_json_schema_only_for_gpt_oss():
    assert ModelSlot("openai/gpt-oss-120b", 8000).supports_json_schema
    assert not ModelSlot("qwen/qwen3.8-27b", 8000).supports_json_schema