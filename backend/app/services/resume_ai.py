from app.infrastructure.llm_client import llm_client
from app.infrastructure.prompt_builder import prompt_builder
from app.infrastructure.response_parser import response_parser
from app.repositories.ats_analysis import ats_analysis_repository
from app.repositories.cover_letter import cover_letter_repository
from app.repositories.resume import resume_repository
from app.schemas.ai import (
    ATSAnalysisResponse,
    CoverLetterResponse,
    ExperienceInput,
    ExperienceResponse,
    GenerateResponse,
    ProjectInput,
    ProjectResponse,
    SkillsResponse,
    SummaryResponse,
)


class ResumeAIOrchestrator:
    def _get_resume_data(self, user_id: str, resume_id: str) -> dict:
        resume = resume_repository.get(resume_id, user_id)
        if not resume:
            raise ValueError("Resume not found")
        return resume

    def _validate_job_target(
        self, job_description: str | None, target_role: str | None
    ):
        if not job_description and not target_role:
            raise ValueError(
                "Either job_description or target_role must be provided"
            )
        if job_description and target_role:
            raise ValueError(
                "Provide either job_description or target_role, not both"
            )

    def generate(
        self,
        user_id: str,
        resume_id: str,
        job_description: str | None,
        target_role: str | None,
    ) -> GenerateResponse:
        self._validate_job_target(job_description, target_role)
        resume = self._get_resume_data(user_id, resume_id)
        resume_data = resume.get("resume_data", {})

        system_prompt, user_prompt = prompt_builder.build_generate_prompt(
            resume_data, job_description, target_role
        )
        raw_response = llm_client.chat(system_prompt, user_prompt)
        parsed = response_parser.parse_json(raw_response)

        generated_resume_data = parsed.get("resume_data", {})
        resume_repository.update(
            resume_id, user_id, {"resume_data": generated_resume_data}
        )

        ats_analysis_data = parsed.get("ats_analysis", {})
        ats_analysis_repository.upsert(resume_id, ats_analysis_data)

        cover_letter_data = parsed.get("cover_letter", {})
        content = cover_letter_data.get("content", "")
        if content:
            cover_letter_repository.create(
                resume_id,
                cover_letter_data.get("company_name", ""),
                cover_letter_data.get("job_title", ""),
                content,
            )

        return GenerateResponse(
            resume_data=generated_resume_data,
            cover_letter=cover_letter_data,
            ats_analysis=ats_analysis_data,
        )

    def ats_analysis(
        self,
        user_id: str,
        resume_id: str,
        job_description: str | None,
        target_role: str | None,
    ) -> ATSAnalysisResponse:
        self._validate_job_target(job_description, target_role)
        resume = self._get_resume_data(user_id, resume_id)
        resume_data = resume.get("resume_data", {})

        system_prompt, user_prompt = prompt_builder.build_ats_analysis_prompt(
            resume_data, job_description, target_role
        )
        raw_response = llm_client.chat(system_prompt, user_prompt)
        parsed = response_parser.parse_json(raw_response)

        result = ATSAnalysisResponse(
            overall_score=parsed.get("overall_score", 0),
            strengths=parsed.get("strengths", []),
            weaknesses=parsed.get("weaknesses", []),
            recommendations=parsed.get("recommendations", []),
            missing_keywords=parsed.get("missing_keywords", []),
        )

        ats_analysis_repository.upsert(resume_id, result.model_dump())

        return result

    def cover_letter(
        self,
        user_id: str,
        resume_id: str,
        company_name: str,
        job_title: str,
        job_description: str,
    ) -> CoverLetterResponse:
        resume = self._get_resume_data(user_id, resume_id)
        resume_data = resume.get("resume_data", {})

        system_prompt, user_prompt = prompt_builder.build_cover_letter_prompt(
            resume_data, company_name, job_title, job_description
        )
        raw_response = llm_client.chat(system_prompt, user_prompt)
        parsed = response_parser.parse_json(raw_response)
        content = parsed.get("content", "")

        cover_letter = cover_letter_repository.create(
            resume_id, company_name, job_title, content
        )

        return CoverLetterResponse(
            id=cover_letter["id"],
            company_name=company_name,
            job_title=job_title,
            content=content,
        )

    def improve_summary(
        self, user_id: str, resume_id: str, summary: str
    ) -> SummaryResponse:
        resume = self._get_resume_data(user_id, resume_id)
        resume_data = resume.get("resume_data", {})

        system_prompt, user_prompt = prompt_builder.build_improve_summary_prompt(
            summary, resume_data
        )
        raw_response = llm_client.chat(system_prompt, user_prompt)
        parsed = response_parser.parse_json(raw_response)

        return SummaryResponse(summary=parsed.get("summary", ""))

    def rewrite_summary(
        self, user_id: str, resume_id: str, summary: str
    ) -> SummaryResponse:
        resume = self._get_resume_data(user_id, resume_id)
        resume_data = resume.get("resume_data", {})

        system_prompt, user_prompt = prompt_builder.build_rewrite_summary_prompt(
            summary, resume_data
        )
        raw_response = llm_client.chat(system_prompt, user_prompt)
        parsed = response_parser.parse_json(raw_response)

        return SummaryResponse(summary=parsed.get("summary", ""))

    def generate_experience(
        self,
        user_id: str,
        resume_id: str,
        experience: ExperienceInput,
    ) -> ExperienceResponse:
        resume = self._get_resume_data(user_id, resume_id)
        resume_data = resume.get("resume_data", {})

        system_prompt, user_prompt = prompt_builder.build_generate_experience_prompt(
            experience.model_dump(), resume_data
        )
        raw_response = llm_client.chat(system_prompt, user_prompt)
        parsed = response_parser.parse_json(raw_response)
        exp = parsed.get("experience", {})

        return ExperienceResponse(
            experience=ExperienceInput(
                company=exp.get("company", experience.company),
                position=exp.get("position", experience.position),
                description=exp.get("description", experience.description),
            )
        )

    def improve_experience(
        self,
        user_id: str,
        resume_id: str,
        experience: ExperienceInput,
    ) -> ExperienceResponse:
        resume = self._get_resume_data(user_id, resume_id)
        resume_data = resume.get("resume_data", {})

        system_prompt, user_prompt = prompt_builder.build_improve_experience_prompt(
            experience.model_dump(), resume_data
        )
        raw_response = llm_client.chat(system_prompt, user_prompt)
        parsed = response_parser.parse_json(raw_response)
        exp = parsed.get("experience", {})

        return ExperienceResponse(
            experience=ExperienceInput(
                company=exp.get("company", experience.company),
                position=exp.get("position", experience.position),
                description=exp.get("description", experience.description),
            )
        )

    def improve_project(
        self,
        user_id: str,
        resume_id: str,
        project: ProjectInput,
    ) -> ProjectResponse:
        resume = self._get_resume_data(user_id, resume_id)
        resume_data = resume.get("resume_data", {})

        system_prompt, user_prompt = prompt_builder.build_improve_project_prompt(
            project.model_dump(), resume_data
        )
        raw_response = llm_client.chat(system_prompt, user_prompt)
        parsed = response_parser.parse_json(raw_response)
        proj = parsed.get("project", {})

        return ProjectResponse(
            project=ProjectInput(
                title=proj.get("title", project.title),
                description=proj.get("description", project.description),
            )
        )

    def suggest_skills(
        self,
        user_id: str,
        resume_id: str,
        skills: list[str],
    ) -> SkillsResponse:
        resume = self._get_resume_data(user_id, resume_id)
        resume_data = resume.get("resume_data", {})

        system_prompt, user_prompt = prompt_builder.build_suggest_skills_prompt(
            skills, resume_data
        )
        raw_response = llm_client.chat(system_prompt, user_prompt)
        parsed = response_parser.parse_json(raw_response)

        return SkillsResponse(skills=parsed.get("skills", []))


resume_ai = ResumeAIOrchestrator()
