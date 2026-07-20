from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.repositories.ats_analysis import ats_analysis_repository
from app.repositories.cover_letter import cover_letter_repository
from app.repositories.resume import resume_repository
from app.schemas.ai import (
    ATSAnalysisRequest,
    ATSAnalysisResponse,
    CoverLetterListResponse,
    CoverLetterRequest,
    CoverLetterResponse,
    ExperienceResponse,
    FillFieldsRequest,
    FillFieldsResponse,
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
    UpdateCoverLetterRequest,
)
from app.schemas.auth import UserResponse
from app.services.resume_ai import resume_ai

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
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="AI generation failed")


@router.post(
    "/{resume_id}/ai/ats-analysis", response_model=ATSAnalysisResponse
)
async def ats_analysis(
    resume_id: str,
    data: ATSAnalysisRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        return resume_ai.ats_analysis(
            current_user.id, resume_id, data.job_description, data.target_role
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="ATS analysis failed")


@router.post(
    "/{resume_id}/ai/cover-letter", response_model=CoverLetterResponse
)
async def generate_cover_letter(
    resume_id: str,
    data: CoverLetterRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        return resume_ai.cover_letter(
            current_user.id,
            resume_id,
            data.company_name,
            data.job_title,
            data.job_description,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Cover letter generation failed")


@router.post("/{resume_id}/ai/improve-summary", response_model=SummaryResponse)
async def improve_summary(
    resume_id: str,
    data: ImproveSummaryRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        return resume_ai.improve_summary(current_user.id, resume_id, data.summary)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Summary improvement failed")


@router.post("/{resume_id}/ai/rewrite-summary", response_model=SummaryResponse)
async def rewrite_summary(
    resume_id: str,
    data: RewriteSummaryRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        return resume_ai.rewrite_summary(current_user.id, resume_id, data.summary)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Summary rewrite failed")


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
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Experience generation failed")


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
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Experience improvement failed")


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
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Project improvement failed")


@router.post("/{resume_id}/ai/suggest-skills", response_model=SkillsResponse)
async def suggest_skills(
    resume_id: str,
    data: SuggestSkillsRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        return resume_ai.suggest_skills(current_user.id, resume_id, data.skills)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Skills suggestion failed")


@router.post(
    "/{resume_id}/ai/fill-fields", response_model=FillFieldsResponse
)
async def fill_fields(
    resume_id: str,
    data: FillFieldsRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        return resume_ai.fill_fields(
            current_user.id, resume_id, data.job_description, data.target_role
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Field filling failed")


@router.get(
    "/{resume_id}/ai/ats-analysis", response_model=ATSAnalysisResponse | None
)
async def get_ats_analysis(
    resume_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    resume = resume_repository.get(resume_id, current_user.id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    analysis = ats_analysis_repository.get_by_resume(resume_id)
    return analysis


@router.get(
    "/{resume_id}/ai/cover-letters", response_model=CoverLetterListResponse
)
async def list_cover_letters(
    resume_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    resume = resume_repository.get(resume_id, current_user.id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    cover_letters = cover_letter_repository.list_by_resume(resume_id)
    return CoverLetterListResponse(items=cover_letters)


@router.delete("/{resume_id}/ai/cover-letters/{cover_letter_id}")
async def delete_cover_letter(
    resume_id: str,
    cover_letter_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    resume = resume_repository.get(resume_id, current_user.id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    cover_letter = cover_letter_repository.get(cover_letter_id)
    if not cover_letter or cover_letter.get("resume_id") != resume_id:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    deleted = cover_letter_repository.delete(cover_letter_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    return {"message": "Cover letter deleted"}


@router.patch("/{resume_id}/ai/cover-letters/{cover_letter_id}", response_model=CoverLetterResponse)
async def update_cover_letter(
    resume_id: str,
    cover_letter_id: str,
    data: UpdateCoverLetterRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    resume = resume_repository.get(resume_id, current_user.id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    cover_letter = cover_letter_repository.get(cover_letter_id)
    if not cover_letter or cover_letter.get("resume_id") != resume_id:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    updated = cover_letter_repository.update(cover_letter_id, data.content)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update cover letter")
    return updated
