from datetime import datetime

from pydantic import BaseModel


class CreateResumeRequest(BaseModel):
    title: str


class UpdateResumeRequest(BaseModel):
    title: str | None = None
    template_id: str | None = None
    resume_data: dict | None = None


class UpdateTemplateRequest(BaseModel):
    template_id: str


class ResumeListResponse(BaseModel):
    id: str
    title: str
    target_role: str | None = None
    template: dict | None = None
    updated_at: datetime


class ResumeListOutput(BaseModel):
    items: list[ResumeListResponse]
    page: int
    limit: int
    total: int


class ResumeDetailResponse(BaseModel):
    id: str
    title: str
    template_id: str | None = None
    resume_data: dict
    ats_analysis: dict | None = None
    cover_letter: dict | None = None


class ResumeCreateResponse(BaseModel):
    id: str
    title: str


class MessageResponse(BaseModel):
    message: str
