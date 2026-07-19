from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File

from app.api.deps import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.resume import (
    CreateResumeRequest,
    MessageResponse,
    ResumeCreateResponse,
    ResumeDetailResponse,
    ResumeListOutput,
    UpdateResumeRequest,
    UpdateTemplateRequest,
)
from app.services.resume import resume_service

router = APIRouter()


@router.get("", response_model=ResumeListOutput)
async def list_resumes(
    current_user: UserResponse = Depends(get_current_user),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
):
    return resume_service.list_resumes(current_user.id, search, page, limit)


@router.post("", response_model=ResumeCreateResponse, status_code=201)
async def create_resume(
    data: CreateResumeRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    return resume_service.create_resume(current_user.id, data)


@router.get("/{resume_id}", response_model=ResumeDetailResponse)
async def get_resume(
    resume_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    result = resume_service.get_resume(current_user.id, resume_id)
    if not result:
        raise HTTPException(status_code=404, detail="Resume not found")
    return result


@router.patch("/{resume_id}", response_model=MessageResponse)
async def update_resume(
    resume_id: str,
    data: UpdateResumeRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    result = resume_service.update_resume(current_user.id, resume_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Resume not found")
    return result


@router.delete("/{resume_id}", status_code=204)
async def delete_resume(
    resume_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    success = resume_service.delete_resume(current_user.id, resume_id)
    if not success:
        raise HTTPException(status_code=404, detail="Resume not found")


@router.patch("/{resume_id}/template", response_model=MessageResponse)
async def update_resume_template(
    resume_id: str,
    data: UpdateTemplateRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    result = resume_service.update_template(
        current_user.id, resume_id, data.template_id
    )
    if not result:
        raise HTTPException(status_code=404, detail="Resume or template not found")
    return result


@router.post("/{resume_id}/upload")
async def upload_resume(
    resume_id: str,
    resume: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user),
):
    if not resume.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    file_ext = resume.filename.rsplit(".", 1)[-1].lower() if "." in resume.filename else ""
    if file_ext not in ["pdf", "docx"]:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type. Please upload PDF or DOCX.",
        )

    file_content = await resume.read()
    max_size = 10 * 1024 * 1024  # 10MB
    if len(file_content) > max_size:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")

    try:
        result = resume_service.upload_resume(
            current_user.id, resume_id, file_content, resume.filename
        )
        if not result:
            raise HTTPException(status_code=404, detail="Resume not found")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to parse resume")
