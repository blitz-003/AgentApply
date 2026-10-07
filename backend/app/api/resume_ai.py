import logging

from fastapi import APIRouter, Depends, HTTPException, Response

from app.api.deps import get_current_user
from app.infrastructure.ai_errors import (
    CODE_INVALID_REQUEST,
    AIError,
    RateLimitExhaustedError,
)
from app.schemas.ai import (
    ExperienceResponse,
    GenerateExperienceRequest,
    GenerateRequest,
    GenerateResponse,
    ImproveExperienceRequest,
    ImproveProjectRequest,
    ImproveSummaryRequest,
    ProjectResponse,
    RewriteSummaryRequest,
    SkillsResponse,
    SummaryResponse,
    SuggestSkillsRequest,
)
from app.schemas.auth import UserResponse
from app.services.resume_ai import resume_ai

logger = logging.getLogger(__name__)
router = APIRouter()


def _ai_error(prefix: str, exc: Exception) -> HTTPException:
    """Translate AI failures into client-safe HTTP errors with a stable code.

    Every response body is {"code": ..., "message": ..., plus whatever the
    failure actually was}: the provider's own code and status, the offending
    schema path, and the named missing fields. Previously all of these collapsed
    into "The AI provider could not complete this request.", which hid the one
    piece of information needed to act on it.

    Provider text is still sanitised by the error classes themselves: raw Groq
    messages embed account and organisation identifiers.
    """
    if isinstance(exc, AIError):
        payload = exc.to_payload()
        payload["message"] = f"{prefix}: {payload['message']}"
        log = logger.warning if exc.http_status < 500 else logger.error
        log(
            f"{prefix} [{exc.code}] {payload['message']} "
            f"provider_code={payload.get('provider_code')} "
            f"provider_status={payload.get('provider_status')} "
            f"path={payload.get('path') or '-'} "
            f"missing={payload.get('missing') or '-'} "
            f"reason={payload.get('reason') or '-'}"
        )
        headers = None
        if isinstance(exc, RateLimitExhaustedError):
            headers = {"Retry-After": str(exc.retry_after)}
        return HTTPException(
            status_code=exc.http_status, detail=payload, headers=headers
        )

    # Our own input validation. Raised as ValueError by the service layer.
    if isinstance(exc, ValueError):
        logger.warning(f"{prefix}: invalid request: {exc}")
        return HTTPException(
            status_code=400,
            detail={
                "code": CODE_INVALID_REQUEST,
                "message": f"{prefix}: {exc}",
            },
        )

    logger.exception(f"{prefix}: unhandled {type(exc).__name__}: {exc}")
    return HTTPException(
        status_code=500,
        detail={
            "code": "ai_internal_error",
            "message": f"{prefix} failed with an unexpected error.",
            "error_type": type(exc).__name__,
        },
    )


@router.post("/{resume_id}/ai/generate", response_model=GenerateResponse)
async def generate_resume(
    resume_id: str,
    data: GenerateRequest,
    response: Response,
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        return await resume_ai.generate(
            current_user.id, resume_id, data.job_description, data.target_role
        )
    except Exception as e:
        error = _ai_error("AI generation", e)
        if error.status_code == 429 and error.headers:
            response.headers["Retry-After"] = error.headers["Retry-After"]
        raise error


@router.post("/{resume_id}/ai/improve-summary", response_model=SummaryResponse)
async def improve_summary(
    resume_id: str,
    data: ImproveSummaryRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        return await resume_ai.improve_summary(current_user.id, resume_id, data.summary)
    except Exception as e:
        raise _ai_error("Summary improvement", e)


@router.post("/{resume_id}/ai/rewrite-summary", response_model=SummaryResponse)
async def rewrite_summary(
    resume_id: str,
    data: RewriteSummaryRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        return await resume_ai.rewrite_summary(current_user.id, resume_id, data.summary)
    except Exception as e:
        raise _ai_error("Summary rewrite", e)


@router.post(
    "/{resume_id}/ai/generate-experience", response_model=ExperienceResponse
)
async def generate_experience(
    resume_id: str,
    data: GenerateExperienceRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        return await resume_ai.generate_experience(
            current_user.id, resume_id, data.experience
        )
    except Exception as e:
        raise _ai_error("Experience generation", e)


@router.post(
    "/{resume_id}/ai/improve-experience", response_model=ExperienceResponse
)
async def improve_experience(
    resume_id: str,
    data: ImproveExperienceRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        return await resume_ai.improve_experience(
            current_user.id, resume_id, data.experience
        )
    except Exception as e:
        raise _ai_error("Experience improvement", e)


@router.post(
    "/{resume_id}/ai/improve-project", response_model=ProjectResponse
)
async def improve_project(
    resume_id: str,
    data: ImproveProjectRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        return await resume_ai.improve_project(current_user.id, resume_id, data.project)
    except Exception as e:
        raise _ai_error("Project improvement", e)


@router.post("/{resume_id}/ai/suggest-skills", response_model=SkillsResponse)
async def suggest_skills(
    resume_id: str,
    data: SuggestSkillsRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        return await resume_ai.suggest_skills(current_user.id, resume_id, data.skills)
    except Exception as e:
        raise _ai_error("Skills suggestion", e)



