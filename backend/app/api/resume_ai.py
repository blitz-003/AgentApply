import logging

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
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


@router.post("/{resume_id}/ai/generate", response_model=GenerateResponse)
async def generate_resume(
    resume_id: str,
    data: GenerateRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        return resume_ai.generate(
            current_user.id, resume_id, data.job_description, data.target_role
        )
    except Exception as e:
        logger.error(f"Generate failed for resume {resume_id}: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


@router.post("/{resume_id}/ai/improve-summary", response_model=SummaryResponse)
async def improve_summary(
    resume_id: str,
    data: ImproveSummaryRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        return resume_ai.improve_summary(current_user.id, resume_id, data.summary)
    except Exception as e:
        logger.error(f"Improve summary failed for resume {resume_id}: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"Summary improvement failed: {str(e)}")


@router.post("/{resume_id}/ai/rewrite-summary", response_model=SummaryResponse)
async def rewrite_summary(
    resume_id: str,
    data: RewriteSummaryRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        return resume_ai.rewrite_summary(current_user.id, resume_id, data.summary)
    except Exception as e:
        logger.error(f"Rewrite summary failed for resume {resume_id}: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"Summary rewrite failed: {str(e)}")


@router.post(
    "/{resume_id}/ai/generate-experience", response_model=ExperienceResponse
)
async def generate_experience(
    resume_id: str,
    data: GenerateExperienceRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        return resume_ai.generate_experience(
            current_user.id, resume_id, data.experience
        )
    except Exception as e:
        logger.error(f"Generate experience failed for resume {resume_id}: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"Experience generation failed: {str(e)}")


@router.post(
    "/{resume_id}/ai/improve-experience", response_model=ExperienceResponse
)
async def improve_experience(
    resume_id: str,
    data: ImproveExperienceRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        return resume_ai.improve_experience(
            current_user.id, resume_id, data.experience
        )
    except Exception as e:
        logger.error(f"Improve experience failed for resume {resume_id}: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"Experience improvement failed: {str(e)}")


@router.post(
    "/{resume_id}/ai/improve-project", response_model=ProjectResponse
)
async def improve_project(
    resume_id: str,
    data: ImproveProjectRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        return resume_ai.improve_project(current_user.id, resume_id, data.project)
    except Exception as e:
        logger.error(f"Improve project failed for resume {resume_id}: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"Project improvement failed: {str(e)}")


@router.post("/{resume_id}/ai/suggest-skills", response_model=SkillsResponse)
async def suggest_skills(
    resume_id: str,
    data: SuggestSkillsRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        return resume_ai.suggest_skills(current_user.id, resume_id, data.skills)
    except Exception as e:
        logger.error(f"Suggest skills failed for resume {resume_id}: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"Skills suggestion failed: {str(e)}")



