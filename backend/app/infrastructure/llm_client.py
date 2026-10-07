import logging
import time

from openai import AsyncOpenAI

from app.config import settings
from app.infrastructure.ai_errors import (
    AIAuthError,
    AIEmptyResponseError,
    AIOutputTruncatedError,
    AIProviderRejectedError,
    AIResponseValidationError,
    RateLimitExhaustedError,
    extract_json_path,
    extract_missing_fields,
    looks_truncated,
    provider_error_fields,
)

logger = logging.getLogger(__name__)

# Extra headroom granted when a response was cut off by the output cap. The
# provider tells us explicitly to raise max_completion_tokens, so one retry with
# more room resolves the large majority of truncations.
TRUNCATION_RETRY_FLOOR = 1200
# Keep a little slack so input+output stays inside the per-model TPM.
TPM_SAFETY_MARGIN = 250

# Appended when a model produced structurally incomplete output and no other
# model in the pool is free. Degeneration shows up as a repeated early field
# followed by no further content, so the reminder names the missing section and
# restates the no-repeat rule.
INCOMPLETE_OUTPUT_REMINDER = (
    "IMPORTANT: your previous attempt stopped early and omitted required "
    "sections. Return ONE complete JSON object containing every required key. "
    "Do not repeat or restate any list, and do not begin a second copy of the "
    "document. Write each remaining section exactly once, then close the JSON."
)


class ModelSlot:
    """Per-model runtime state: budget window plus cooldown tracking."""

    def __init__(self, name: str, tpm_limit: int):
        self.name = name
        self.tpm_limit = tpm_limit
        self.cooldown_until: float = 0.0
        self.spent_this_minute: int = 0
        self.window_started: float = 0.0
        # Not every model honours strict json_schema response formats. Guessing
        # from the model name silently disabled validation before, so make it an
        # explicit property and fall back to json_object elsewhere.
        self.supports_json_schema = "gpt-oss" in name
        # gpt-oss models emit reasoning tokens that are billed against
        # max_completion_tokens. At the default effort a structured JSON request
        # can spend the entire budget reasoning and return an empty document,
        # which the provider rejects as json_validate_failed. Low effort cut
        # reasoning from 51 to 16 tokens on a trivial prompt.
        self.supports_reasoning_effort = "gpt-oss" in name

    def available(self, now: float) -> bool:
        if now < self.cooldown_until:
            return False
        self._roll_window(now)
        return self.spent_this_minute < self.tpm_limit

    def remaining(self, now: float) -> int:
        self._roll_window(now)
        return max(0, self.tpm_limit - self.spent_this_minute)

    def charge(self, tokens: int, now: float) -> None:
        self._roll_window(now)
        self.spent_this_minute += tokens

    def reserve(self, tokens: int, now: float) -> bool:
        """Claim budget up front so concurrent calls spread across models.

        Selection and charging must be a single atomic step: if budget were
        only charged after the response arrived, every call in a parallel fan-out
        would read the same free model and pick the same one.
        """
        self._roll_window(now)
        if self.spent_this_minute + tokens > self.tpm_limit:
            return False
        self.spent_this_minute += tokens
        return True

    def cool_down(self, seconds: int, now: float) -> None:
        self.cooldown_until = now + seconds

    def _roll_window(self, now: float) -> None:
        # Fixed 60s window: once a minute elapses, the budget resets.
        if now - self.window_started >= 60.0:
            self.window_started = now
            self.spent_this_minute = 0


def estimate_tokens(text: str) -> int:
    """Rough token estimate. Deliberately generous to stay under budget."""
    return int(len(text) / 3.5) + 1


class LLMRouter:
    """Rotates across a pool of free models to stay inside per-model TPM.

    Groq counts a request's input tokens plus its requested max output tokens
    against tokens-per-minute, so an oversized max_tokens can exceed the whole
    per-minute budget before a single token is generated. This caps each
    request's output allowance and fails over between models on 413/429.
    """

    def __init__(self):
        self._slots: dict[str, ModelSlot] = {}
        self._client: AsyncOpenAI | None = None

    @property
    def client(self) -> AsyncOpenAI:
        if self._client is None:
            self._client = AsyncOpenAI(
                base_url=settings.ai_base_url,
                api_key=settings.ai_api_key,
                timeout=settings.ai_request_timeout,
                max_retries=settings.ai_max_retries,
            )
        return self._client

    @property
    def slots(self) -> dict[str, ModelSlot]:
        if not self._slots:
            for name in settings.ai_models:
                tpm = settings.ai_model_tpm_overrides.get(
                    name, settings.ai_model_tpm
                )
                self._slots[name] = ModelSlot(name, tpm)
        return self._slots

    def output_budget(self, needed_output: int, estimated_input: int = 0) -> int:
        """Clamp requested output so input+output fits inside a model's TPM.

        Groq charges a request's input tokens plus its requested max output tokens
        against tokens-per-minute, so the allowance has to be derived from the
        model's own limit minus what the prompt already consumed. Deriving it from
        a flat request budget instead made the ceiling *shrink* as the prompt grew
        and starved long, uploaded resumes of response room.
        """
        limit = min(
            [slot.tpm_limit for slot in self.slots.values()]
            or [settings.ai_request_token_budget]
        )
        ceiling = max(
            256, min(settings.ai_request_token_budget, limit - estimated_input - TPM_SAFETY_MARGIN)
        )
        return max(256, min(needed_output, ceiling))

    def _select_slot(
        self, required: int, exclude: set[str] | None = None
    ) -> ModelSlot | None:
        """Claim budget on the least-loaded available model, or return None.

        No awaits occur here, so this is atomic with respect to other coroutines
        and concurrent calls cannot select the same exhausted model.
        """
        exclude = exclude or set()
        now = time.monotonic()
        usable = [
            slot
            for slot in self.slots.values()
            if slot.name not in exclude and slot.available(now)
        ]
        # Least remaining-budget-first so load spreads evenly across the pool.
        usable.sort(key=lambda s: (-s.remaining(now), s.name))
        for slot in usable:
            if slot.reserve(required, now):
                return slot
        return None

    async def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        response_format: dict | None = None,
        max_output_tokens: int = 1024,
    ) -> str:
        """Run one completion, failing over across the pool on rate limits.

        A response that was cut off by the output cap is retried once with more
        room, because the provider failure is recoverable by construction rather
        than a bad request. Raises RateLimitExhaustedError when no model can serve
        the request, and a typed AIError subclass for every other failure.
        """
        estimated_input = estimate_tokens(system_prompt) + estimate_tokens(
            user_prompt
        )
        max_completion = self.output_budget(max_output_tokens, estimated_input)

        try:
            return await self._chat_once(
                system_prompt, user_prompt, response_format, max_completion
            )
        except AIOutputTruncatedError:
            expanded = self.output_budget(
                max_output_tokens + TRUNCATION_RETRY_FLOOR, estimated_input
            )
            if expanded <= max_completion:
                # Already asking for everything the model can give; a retry with
                # the same budget would burn quota to fail identically.
                raise
            logger.warning(
                f"Output truncated at {max_completion} tokens; "
                f"retrying once with {expanded}"
            )
            return await self._chat_once(
                system_prompt, user_prompt, response_format, expanded
            )

    async def _chat_once(
        self,
        system_prompt: str,
        user_prompt: str,
        response_format: dict | None,
        max_completion: int,
    ) -> str:
        estimated_input = estimate_tokens(system_prompt) + estimate_tokens(
            user_prompt
        )
        required = estimated_input + max_completion

        # Select and reserve in one synchronous step. The parallel /ai/generate
        # fan-out fires three calls before any of them returns, so without an
        # up-front reservation all three would read the same "least loaded"
        # model and pile onto its single per-model budget.
        slot = self._select_slot(required)
        if slot is None:
            raise RateLimitExhaustedError(
                "All AI models are rate limited. Try again shortly.",
                retry_after=self._retry_after(time.monotonic()),
            )

        last_error: Exception | None = None
        # Models already tried for *degenerate* output. Rate-limit cooldowns are
        # tracked separately on the slot itself.
        tried: set[str] = set()
        repaired = False
        while slot is not None:
            try:
                return await self._complete(
                    slot, system_prompt, user_prompt, response_format, max_completion
                )
            except _RateLimited as exc:
                slot.cool_down(exc.retry_after, time.monotonic())
                last_error = exc
                logger.warning(
                    f"Model {slot.name} rate limited ({exc.reason}); "
                    f"cooling down {exc.retry_after}s"
                )
                slot = self._select_slot(required, exclude={slot.name})
                if slot is None:
                    break
            except _SchemaViolation as exc:
                # A model can degenerate into repeating itself and never finish
                # the document. That is a property of the model, not of the
                # request, so a different model from the pool usually succeeds.
                last_error = exc
                tried.add(slot.name)
                logger.warning(
                    f"Model {slot.name} returned an incomplete document "
                    f"({exc.provider_code}); trying another model"
                )
                next_slot = self._select_slot(required, exclude=tried)
                if next_slot is not None:
                    slot = next_slot
                    continue
                if repaired:
                    break
                # Every other model in the pool is either cooling down or
                # already reserved by a sibling call in the same fan-out. The
                # degeneracy is stochastic though: the same model usually
                # succeeds on a second attempt, so repair once in place with an
                # explicit instruction to finish the document instead of
                # looping, rather than failing a request we can still serve.
                logger.warning(
                    f"No unused model left; retrying {slot.name} once with a "
                    "completion reminder"
                )
                repaired = True
                user_prompt = f"{user_prompt}\n\n{INCOMPLETE_OUTPUT_REMINDER}"

        if isinstance(last_error, _SchemaViolation):
            raise last_error.to_public() from last_error
        raise RateLimitExhaustedError(
            "All AI models are rate limited. Try again shortly.",
            retry_after=self._retry_after(time.monotonic()),
        ) from last_error

    async def _complete(
        self,
        slot: ModelSlot,
        system_prompt: str,
        user_prompt: str,
        response_format: dict | None,
        max_completion: int,
    ) -> str:
        kwargs: dict = {
            "model": slot.name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": settings.ai_temperature,
            "max_completion_tokens": max_completion,
        }
        if response_format:
            # Structured-output enforcement is only reliable on models that
            # advertise it; elsewhere fall back to plain JSON mode and rely on
            # response_validator to enforce the schema locally.
            if slot.supports_json_schema:
                kwargs["response_format"] = response_format
            else:
                kwargs["response_format"] = {"type": "json_object"}
        if slot.supports_reasoning_effort:
            kwargs["reasoning_effort"] = "low"

        try:
            response = await self.client.chat.completions.create(**kwargs)
        except Exception as exc:  # noqa: BLE001
            raise self._classify(exc, slot) from exc

        content = response.choices[0].message.content
        if not content:
            raise AIEmptyResponseError(
                "AI model returned an empty response.",
                reason=f"model={slot.name} finish_reason="
                f"{getattr(response.choices[0], 'finish_reason', None)}",
                provider_status=200,
            )
        logger.debug(
            f"[{slot.name}] usage={response.usage} first200={content[:200]!r}"
        )
        return content

    def _classify(self, exc: Exception, slot: ModelSlot) -> Exception:
        """Translate provider errors into typed, code-carrying AI failures.

        Groq returns 413 with code 'rate_limit_exceeded' when a request exceeds
        the per-minute token budget, and 429 for the classic rate limit. Both
        must be treated as rate limits so we fail over instead of surfacing.

        Everything else keeps the provider's own code, status and reason so the
        exact upstream failure is visible to the caller instead of collapsing
        into one generic message.
        """
        provider_code, status, message = provider_error_fields(exc)

        if status in (413, 429) or provider_code == "rate_limit_exceeded":
            retry_after = self._retry_after_value(exc)
            return _RateLimited(retry_after, reason=message[:200])

        if provider_code == "json_validate_failed" and not looks_truncated(message):
            # The model produced JSON, but it was incomplete: it looped on a
            # repeated fragment and never wrote the remaining sections. Observed
            # directly on gpt-oss-20b for a target-role-only resume, where the
            # same keyword list was emitted three times and 'resume_data' was
            # never started. This is a model-level degeneration, not a bad
            # request, so another model can serve the request correctly.
            return _SchemaViolation(
                "AI model produced an incomplete document.",
                reason=message,
                provider_code=provider_code,
                provider_status=status,
            )

        if status in (401, 403):
            return AIAuthError(
                "AI provider rejected the configured API key.",
                reason=message,
                provider_code=provider_code,
                provider_status=status,
            )

        if status is not None and status >= 500:
            return AIProviderRejectedError(
                "AI provider is unavailable or returned a server error.",
                reason=message,
                provider_code=provider_code,
                provider_status=status,
            )

        # A truncated answer is the single most common failure and is recoverable
        # with a larger budget, so it gets its own type and fields.
        if looks_truncated(message):
            return AIOutputTruncatedError(
                "The AI's answer was cut off before it finished. The resume and "
                "job description are too large for one pass.",
                reason=message,
                provider_code=provider_code,
                provider_status=status,
                path=extract_json_path(message),
                missing=extract_missing_fields(message),
            )

        return AIProviderRejectedError(
            "AI provider rejected the request.",
            reason=message,
            provider_code=provider_code,
            provider_status=status,
        )

    @staticmethod
    def _retry_after_value(exc: Exception) -> int:
        headers = getattr(exc, "headers", None) or {}
        raw = headers.get("retry-after") if hasattr(headers, "get") else None
        try:
            return max(1, int(float(raw)))
        except (TypeError, ValueError):
            return settings.ai_cooldown_seconds

    def _retry_after(self, now: float) -> int:
        waits = [s.cooldown_until - now for s in self.slots.values()]
        waits = [w for w in waits if w > 0]
        if not waits:
            return settings.ai_cooldown_seconds
        return max(1, int(min(waits) + 0.999))


class _RateLimited(Exception):
    def __init__(self, retry_after: int, reason: str = ""):
        super().__init__(reason or "rate limited")
        self.retry_after = retry_after
        self.reason = reason


class _SchemaViolation(Exception):
    """A model returned structurally incomplete output that another model can serve.

    Kept internal so the router can fail over without ever surfacing an
    intermediate, retryable-looking error to the caller. If every model in the
    pool degrades this way, the last one is raised as a public
    AIResponseValidationError carrying the provider's own code and fields.
    """

    def __init__(
        self,
        message: str,
        reason: str = "",
        provider_code: str = "",
        provider_status: int | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.reason = reason
        self.provider_code = provider_code
        self.provider_status = provider_status

    def to_public(self) -> AIResponseValidationError:
        return AIResponseValidationError(
            self.message,
            reason=self.reason,
            provider_code=self.provider_code,
            provider_status=self.provider_status,
            path=extract_json_path(self.reason),
            missing=extract_missing_fields(self.reason),
        )


llm_router = LLMRouter()
