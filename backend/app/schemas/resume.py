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


class PersonalInfo(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""


class ExperienceEntry(BaseModel):
    company: str = ""
    position: str = ""
    description: str = ""


class ProjectEntry(BaseModel):
    title: str = ""
    description: str = ""


class EducationEntry(BaseModel):
    institution: str = ""
    degree: str = ""
    field: str = ""
    start_date: str = ""
    end_date: str = ""


class ResumeData(BaseModel):
    personal_info: PersonalInfo = PersonalInfo()
    summary: str = ""
    experience: list[ExperienceEntry] = []
    projects: list[ProjectEntry] = []
    skills: list[str] = []
    education: list[EducationEntry] = []
    certifications: list[dict] = []
    languages: list[dict] = []
    achievements: list[str] = []


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
