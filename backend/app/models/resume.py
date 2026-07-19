from datetime import datetime

from pydantic import BaseModel


class ResumeData(BaseModel):
    personal_info: dict = {}
    summary: str = ""
    education: list = []
    experience: list = []
    projects: list = []
    skills: list = []
    certifications: list = []
    languages: list = []
    achievements: list = []


class Resume(BaseModel):
    id: str
    user_id: str
    template_id: str | None = None
    title: str
    resume_data: ResumeData
    created_at: datetime
    updated_at: datetime
