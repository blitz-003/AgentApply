from functools import cached_property

from openai import OpenAI

from app.config import settings


class LLMClient:
    @cached_property
    def client(self) -> OpenAI:
        return OpenAI(api_key=settings.openai_api_key)

    def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        response_format: dict | None = None,
    ) -> str:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        kwargs = {
            "model": "gpt-4o-mini",
            "messages": messages,
            "temperature": 0.7,
        }
        if response_format:
            kwargs["response_format"] = response_format
        response = self.client.chat.completions.create(**kwargs)
        return response.choices[0].message.content


llm_client = LLMClient()
