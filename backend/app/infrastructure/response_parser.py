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

        for match in re.finditer(r"\{", cleaned):
            candidate = ResponseParser._extract_json_object(cleaned, match.start())
            if candidate is None:
                continue
            try:
                return json.loads(candidate)
            except json.JSONDecodeError:
                continue

        logger.error(f"Failed to parse AI response (first 500 chars): {cleaned[:500]}")
        raise ValueError("Failed to parse AI response as JSON")

    @staticmethod
    def _extract_json_object(text: str, start: int) -> str | None:
        in_string = False
        escaped = False
        depth = 0
        for i in range(start, len(text)):
            ch = text[i]
            if in_string:
                if escaped:
                    escaped = False
                elif ch == "\\":
                    escaped = True
                elif ch == '"':
                    in_string = False
                continue
            if ch == '"':
                in_string = True
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return text[start : i + 1]
        return None


response_parser = ResponseParser()
