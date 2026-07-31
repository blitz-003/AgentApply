from pydantic import BaseModel


class GenerateRequest(BaseModel):
    job_description: str | None = None
    target_role: str | None = None


class ImproveSummaryRequest(BaseModel):
    summary: str


class RewriteSummaryRequest(BaseModel):
    summary: str


class ExperienceInput(BaseModel):
    company: str
    position: str
    description: str
    start_date: str = ""
    end_date: str = ""


class GenerateExperienceRequest(BaseModel):
    experience: ExperienceInput


class ImproveExperienceRequest(BaseModel):
    experience: ExperienceInput


class ProjectInput(BaseModel):
    title: str
    description: str
    start_date: str = ""
    end_date: str = ""


class ImproveProjectRequest(BaseModel):
    project: ProjectInput


class SuggestSkillsRequest(BaseModel):
    skills: list[str]


class GenerateResponse(BaseModel):
    resume_data: dict
    cover_letter: dict
    ats_analysis: dict


class SummaryResponse(BaseModel):
    summary: str


class ExperienceResponse(BaseModel):
    experience: ExperienceInput


class ProjectResponse(BaseModel):
    project: ProjectInput


class SkillsResponse(BaseModel):
    skills: list[str]



