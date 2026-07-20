import json


class ResponseParser:
    @staticmethod
    def parse_json(text: str) -> dict:
        try:
            if "```json" in text:
                start = text.index("```json") + 7
                end = text.index("```", start)
                text = text[start:end].strip()
            elif "```" in text:
                start = text.index("```") + 3
                end = text.index("```", start)
                text = text[start:end].strip()
            return json.loads(text)
        except (ValueError, json.JSONDecodeError) as e:
            raise ValueError(f"Failed to parse AI response: {e}")


response_parser = ResponseParser()
