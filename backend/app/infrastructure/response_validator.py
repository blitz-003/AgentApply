import logging

from jsonschema import ValidationError, validate

from app.infrastructure.ai_errors import (
    CODE_SCHEMA_INVALID,
    AIResponseValidationError,
)

logger = logging.getLogger(__name__)

__all__ = ["AIResponseValidationError", "CODE_SCHEMA_INVALID", "ResponseValidator"]


class ResponseValidator:
    """Validate parsed AI payloads against the schemas in response_schemas."""

    @staticmethod
    def validate_payload(payload: dict, schema: dict, context: str) -> dict:
        if not isinstance(payload, dict):
            raise AIResponseValidationError(
                f"{context}: expected a JSON object, got {type(payload).__name__}",
                reason=f"context={context} got={type(payload).__name__}",
                path="<root>",
            )
        try:
            validate(instance=payload, schema=schema)
        except ValidationError as exc:
            path_parts = [str(p) for p in exc.absolute_path]
            path = "/".join(path_parts) or "<root>"
            logger.warning(f"{context}: schema violation at {path}: {exc.message}")
            # Carry the validator's own wording plus the fields it actually named
            # as absent, so the caller sees precisely which part of the contract
            # was violated instead of a generic "unusable response".
            missing = _missing_required(payload, path_parts, exc)
            raise AIResponseValidationError(
                f"{context}: AI response did not match the required schema at "
                f"'{path}' ({exc.message})",
                reason=exc.message,
                path=path,
                missing=missing,
            ) from exc
        return payload


def _missing_required(
    payload: dict, path_parts: list[str], exc: ValidationError
) -> list[str]:
    """Names of required properties absent from the instance at this path."""
    if exc.validator != "required" or not isinstance(exc.validator_value, list):
        return []
    target: object = payload
    for part in path_parts:
        if not isinstance(target, dict):
            return []
        target = target.get(part)
    if not isinstance(target, dict):
        return []
    present = set(target)
    return sorted(name for name in exc.validator_value if name not in present)


response_validator = ResponseValidator()