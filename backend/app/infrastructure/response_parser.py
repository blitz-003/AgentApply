import json
import logging
import re

logger = logging.getLogger(__name__)

SAFETY_PREFIXES = re.compile(
    r"^(User Safety|Safety|Note|Warning|Attention|Disclaimer)"
    r"[^\{]*",
    re.IGNORECASE | re.MULTILINE,
)


class ResponseParser:
    @staticmethod
    def parse_json(text: str) -> dict:
        if not text or not text.strip():
            raise ValueError("Empty AI response")

        cleaned = text.strip()

        cleaned = SAFETY_PREFIXES.sub("", cleaned).strip()

        patterns = [
            (r"```json\s*(.*?)\s*```", re.DOTALL),
            (r"```\s*(.*?)\s*```", re.DOTALL),
        ]
        for pattern, flags in patterns:
            match = re.search(pattern, cleaned, flags)
            if match:
                cleaned = match.group(1).strip()
                break

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        first_brace = cleaned.find("{")
        last_brace = cleaned.rfind("}")
        if first_brace != -1 and last_brace > first_brace:
            try:
                return json.loads(cleaned[first_brace:last_brace + 1])
            except json.JSONDecodeError:
                pass

        logger.error(f"Failed to parse AI response (first 500 chars): {cleaned[:500]}")
        raise ValueError(f"Failed to parse AI response as JSON")


response_parser = ResponseParser()
