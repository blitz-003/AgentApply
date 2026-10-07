from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_anon_key: str = ""
    ai_base_url: str = "https://api.groq.com/openai/v1"
    ai_api_key: str = ""
    ai_model: str = "llama-3.3-70b-versatile"
    ai_max_tokens: int = 32768

    # Rotation pool. Groq enforces TPM per organization *and* per model, so
    # spreading concurrent calls across models multiplies the effective budget
    # instead of reshuffling it. Free-plan ceilings documented by Groq:
    # gpt-oss-120b / gpt-oss-20b / qwen3.8-27b are 8K TPM each = 24K aggregate.
    ai_models: list[str] = [
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
        "qwen/qwen3.8-27b",
    ]
    # Per-model tokens-per-minute ceiling, used to avoid sending a request that
    # is guaranteed to be rejected. Unlisted models fall back to this value.
    ai_model_tpm: int = 8000
    # Explicit per-model overrides, e.g. {"llama-3.3-70b-versatile": 12000}.
    ai_model_tpm_overrides: dict[str, int] = {}
    # Default ceiling for a single request's input+output budget. Matched to the
    # per-model TPM above: the router subtracts the prompt's own token cost and a
    # safety margin from the model limit, so this must be the model limit and not
    # something smaller. Setting it lower starves long prompts of response room
    # precisely when they need it most.
    ai_request_token_budget: int = 8000
    ai_cooldown_seconds: int = 60
    ai_request_timeout: float = 60.0
    ai_max_retries: int = 2
    ai_temperature: float = 0.7

    # Uploaded resume text is injected into prompts; it is unbounded otherwise.
    ai_raw_text_max_chars: int = 6000

    # Hard cap on keywords asked back from the model. Unbounded extraction once
    # returned 45 keywords and 45 category objects, which consumed roughly two
    # thirds of the output budget before the resume body was even started and
    # reliably truncated the response.
    ai_max_keywords: int = 20

    ai_app_name: str = "Agent Apply"
    ai_app_url: str = "http://localhost:3000"
    allowed_origins: list[str] = ["http://localhost:3000"]
    api_v1_prefix: str = "/api/v1"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
