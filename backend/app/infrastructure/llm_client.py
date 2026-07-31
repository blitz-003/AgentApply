import logging
from functools import cached_property

from openai import OpenAI

from app.config import settings

logger = logging.getLogger(__name__)


class LLMClient:
    @cached_property
    def client(self) -> OpenAI:
        return OpenAI(
            base_url=settings.ai_base_url,
            api_key=settings.ai_api_key,
            timeout=60.0,
            max_retries=2,
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
        try:
            response = self.client.chat.completions.create(**kwargs)
            content = response.choices[0].message.content
            logger.debug(f"LLM response (first 200 chars): {content[:200] if content else 'None'}")
            return content
        except Exception as e:
            logger.error(f"LLM API error: {type(e).__name__}: {e}")
            raise


llm_client = LLMClient()
