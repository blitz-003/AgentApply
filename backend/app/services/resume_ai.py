import json
import logging

from app.infrastructure.llm_client import llm_client
from app.infrastructure.prompt_builder import prompt_builder
from app.infrastructure.response_parser import response_parser
from app.repositories.ats_analysis import ats_analysis_repository
from app.repositories.cover_letter import cover_letter_repository
from app.repositories.resume import resume_repository
from app.schemas.ai import (
    ExperienceInput,
    ExperienceResponse,
    GenerateResponse,
    ProjectInput,
    ProjectResponse,
    SkillsResponse,
    SummaryResponse,
)

logger = logging.getLogger(__name__)


class ResumeAIOrchestrator:
    def _get_resume_data(self, user_id: str, resume_id: str) -> dict:
        resume = resume_repository.get(resume_id, user_id)
        if not resume:
            raise ValueError("Resume not found")
        return resume

    def _validate_job_target(
        self, job_description: str | None, target_role: str | None
    ):
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
        raw_text = resume_data.get("raw_text", "")

        system_prompt, user_prompt = prompt_builder.build_generate_prompt(
            resume_data, job_description, target_role, raw_text=raw_text or None
        )
        raw_response = llm_client.chat(system_prompt, user_prompt, response_format={"type": "json_object"})
        parsed = response_parser.parse_json(raw_response)

        keywords = parsed.get("keywords_extracted", [])
        keyword_categories = parsed.get("keyword_categories", {}) or {}
        generated_resume_data = parsed.get("resume_data", {})
        ats = parsed.get("ats_analysis", {}) or {}

        if keywords and generated_resume_data:
            resume_text = json.dumps(generated_resume_data).lower()
            missing_from_resume = []
            for kw in keywords:
                if kw.lower() not in resume_text:
                    missing_from_resume.append(kw)

            if missing_from_resume:
                skills = generated_resume_data.get("skills", [])
                if not isinstance(skills, list):
                    skills = []
                for kw in missing_from_resume:
                    category = keyword_categories.get(kw, "Others")
                    found = False
                    for skill_group in skills:
                        if isinstance(skill_group, dict) and skill_group.get("category", "").lower() == category.lower():
                            skill_group.setdefault("items", []).append(kw)
                            found = True
                            break
                    if not found:
                        skills.append({"category": category, "items": [kw]})
                generated_resume_data["skills"] = skills

            final_resume_text = json.dumps(generated_resume_data).lower()
            still_missing = []
            for kw in keywords:
                if kw.lower() not in final_resume_text:
                    still_missing.append(kw)

            ats["included_keywords"] = [kw for kw in missing_from_resume if kw.lower() in final_resume_text.lower()]
            ats["missing_keywords"] = still_missing
            covered = len(keywords) - len(still_missing)
            ats["overall_score"] = round(covered / len(keywords) * 100) if keywords else 100

        resume_repository.update(
            resume_id, user_id, {"resume_data": generated_resume_data}
        )

        ats_analysis_data = ats
        if ats_analysis_data:
            ats_analysis_repository.upsert(resume_id, ats_analysis_data)

        cover_letter_data = parsed.get("cover_letter", {}) or {}
        cover_content = (
            cover_letter_data.get("content", "")
            if isinstance(cover_letter_data, dict)
            else ""
        )
        if cover_content:
            for existing in cover_letter_repository.list_by_resume(resume_id):
                cover_letter_repository.delete(existing["id"])
            cover_letter_repository.create(
                resume_id,
                company_name="",
                job_title=target_role or "",
                content=cover_content,
            )

        return GenerateResponse(
            resume_data=generated_resume_data,
            cover_letter=cover_letter_data,
            ats_analysis=ats_analysis_data,
        )

    def improve_summary(
        self, user_id: str, resume_id: str, summary: str
    ) -> SummaryResponse:
        resume = self._get_resume_data(user_id, resume_id)
        resume_data = resume.get("resume_data", {})

        system_prompt, user_prompt = prompt_builder.build_improve_summary_prompt(
            summary, resume_data
        )
        raw_response = llm_client.chat(system_prompt, user_prompt, response_format={"type": "json_object"})
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
        raw_response = llm_client.chat(system_prompt, user_prompt, response_format={"type": "json_object"})
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
        raw_response = llm_client.chat(system_prompt, user_prompt, response_format={"type": "json_object"})
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
        raw_response = llm_client.chat(system_prompt, user_prompt, response_format={"type": "json_object"})
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
        raw_response = llm_client.chat(system_prompt, user_prompt, response_format={"type": "json_object"})
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
        raw_response = llm_client.chat(system_prompt, user_prompt, response_format={"type": "json_object"})
        parsed = response_parser.parse_json(raw_response)

        return SkillsResponse(skills=parsed.get("skills", []))


resume_ai = ResumeAIOrchestrator()
