from functools import cached_property

from openai import OpenAI

from app.config import settings


class LLMClient:
    @cached_property
    def client(self) -> OpenAI:
        default_headers = {}
        if "openrouter.ai" in settings.ai_base_url:
            default_headers["HTTP-Referer"] = settings.ai_app_url
            default_headers["X-OpenRouter-Title"] = settings.ai_app_name
        return OpenAI(
            base_url=settings.ai_base_url,
            api_key=settings.ai_api_key,
            timeout=60.0,
            max_retries=2,
            default_headers=default_headers or None,
        )

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
            "model": settings.ai_model,
            "messages": messages,
            "temperature": 0.7,
        }
        if response_format:
            kwargs["response_format"] = response_format
        response = self.client.chat.completions.create(**kwargs)
        return response.choices[0].message.content


llm_client = LLMClient()
