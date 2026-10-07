import asyncio
import json
import logging

from app.config import settings
from app.infrastructure.ai_errors import AIInvalidRequestError
from app.infrastructure.llm_client import llm_router
from app.infrastructure.prompt_builder import bound_raw_text, prompt_builder
from app.infrastructure.response_parser import response_parser
from app.infrastructure.response_schemas import (
    ATS_GENERATION_SCHEMA,
    COVER_LETTER_GENERATION_SCHEMA,
    EXPERIENCE_SCHEMA,
    PROJECT_SCHEMA,
    RESUME_GENERATION_SCHEMA,
    SKILLS_SCHEMA,
    SUMMARY_SCHEMA,
    structured_format,
)
from app.infrastructure.response_validator import response_validator
from app.repositories.ats_analysis import ats_analysis_repository
from app.repositories.cover_letter import cover_letter_repository
from app.repositories.resume import resume_repository
from app.services.resume_normalizer import resume_normalizer
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
    async def _run_call(
        self,
        prompt: tuple[str, str],
        schema: dict,
        schema_name: str,
        context: str,
        max_output_tokens: int,
    ) -> dict:
        """One model call: router failover, JSON parse, schema validation."""
        system_prompt, user_prompt = prompt
        raw_response = await llm_router.chat(
            system_prompt,
            user_prompt,
            response_format=structured_format(schema_name, schema),
            max_output_tokens=max_output_tokens,
        )
        parsed = response_parser.parse_json(raw_response)
        return response_validator.validate_payload(parsed, schema, context)

    async def _rerun_letter_with_opening_reminder(
        self,
        resume_data: dict,
        job_description: str | None,
        target_role: str | None,
        raw_text: str | None,
    ) -> dict:
        """Re-run only the cover letter when it opened with a header echo.

        The first attempt can be schema-valid yet stylistically broken (the
        model echoes the resume header above the salutation). Re-requesting
        with the strict opening rule appended fixes it within the same budget
        spent on one more targeted call.
        """
        system_prompt, user_prompt = prompt_builder.build_cover_letter_generation_prompt(
            resume_data, job_description, target_role, raw_text=raw_text
        )
        reminder = (
            "Your previous draft opened with the candidate's contact header "
            "instead of the salutation. Rewrite the letter so the very first "
            "line starts with 'Dear' and contains no name/address/contact block."
        )
        raw_response = await llm_router.chat(
            system_prompt,
            f"{user_prompt}\n\n{reminder}",
            response_format=structured_format(
                "cover_letter_generation", COVER_LETTER_GENERATION_SCHEMA
            ),
            max_output_tokens=1400,
        )
        parsed = response_parser.parse_json(raw_response)
        return response_validator.validate_payload(
            parsed, COVER_LETTER_GENERATION_SCHEMA, "cover letter generation"
        )

    def _get_resume_data(self, user_id: str, resume_id: str) -> dict:
        resume = resume_repository.get(resume_id, user_id)
        if not resume:
            raise AIInvalidRequestError(
                "Resume not found",
                reason=f"resume_id={resume_id} did not resolve for this user",
            )
        return resume

    def _validate_job_target(
        self, job_description: str | None, target_role: str | None
    ):
        if job_description and target_role:
            raise AIInvalidRequestError(
                "Provide either job_description or target_role, not both",
                reason="both job_description and target_role were supplied",
            )
        if not job_description and not target_role:
            # Required by the API contract: a target is needed, and without this
            # guard the request would spend a full AI round-trip on a prompt with
            # no job to aim at.
            raise AIInvalidRequestError(
                "Provide either job_description or target_role",
                reason="neither job_description nor target_role was supplied",
            )

    async def generate(
        self,
        user_id: str,
        resume_id: str,
        job_description: str | None,
        target_role: str | None,
    ) -> GenerateResponse:
        self._validate_job_target(job_description, target_role)
        resume = self._get_resume_data(user_id, resume_id)
        resume_data = resume.get("resume_data", {})
        raw_text = bound_raw_text(
            resume_data.get("raw_text"), settings.ai_raw_text_max_chars
        )

        resume_prompt = prompt_builder.build_resume_generation_prompt(
            resume_data, job_description, target_role, raw_text=raw_text
        )
        letter_prompt = prompt_builder.build_cover_letter_generation_prompt(
            resume_data, job_description, target_role, raw_text=raw_text
        )
        ats_prompt = prompt_builder.build_ats_generation_prompt(
            resume_data, job_description, target_role, raw_text=raw_text
        )

        # Three independent calls. The router picks a different model per call so
        # they consume separate per-model TPM budgets instead of one shared one.
        # The resume body needs the most room: it carries experience, projects,
        # education, skills, languages, certifications and achievements, and a
        # 2000-token allowance was not enough to finish it -- the provider cut
        # the response off and reported json_validate_failed with four missing
        # required fields. The letter and ATS payloads are smaller.
        resume_call, letter_call, ats_call = await asyncio.gather(
            self._run_call(
                resume_prompt,
                RESUME_GENERATION_SCHEMA,
                "resume_generation",
                "resume generation",
                3000,
            ),
            self._run_call(
                letter_prompt,
                COVER_LETTER_GENERATION_SCHEMA,
                "cover_letter_generation",
                "cover letter generation",
                1400,
            ),
            self._run_call(
                ats_prompt,
                ATS_GENERATION_SCHEMA,
                "ats_generation",
                "ATS analysis",
                1000,
            ),
        )

        keywords = list(resume_call.get("keywords_extracted", []) or [])
        # The ATS call extracts keywords independently; prefer the richer set.
        for kw in ats_call.get("keywords_extracted", []) or []:
            if kw not in keywords:
                keywords.append(kw)
        # Both calls are individually capped, but their union is not, so enforce
        # the limit once more on the merged list before it reaches the editor.
        keywords = keywords[: settings.ai_max_keywords]

        keyword_categories = {
            item["keyword"]: item["category"]
            for item in (
                list(resume_call.get("keyword_categories", []) or [])
                + list(ats_call.get("keyword_categories", []) or [])
            )
            if isinstance(item, dict) and item.get("keyword") and item.get("category")
        }
        generated_resume_data = resume_call.get("resume_data", {})
        ats = {
            "previous_score": ats_call.get("previous_score", 0),
            "overall_score": 0,
            "strengths": ats_call.get("strengths", []),
            "weaknesses": ats_call.get("weaknesses", []),
            "recommendations": ats_call.get("recommendations", []),
            "missing_keywords": ats_call.get("missing_keywords", []),
            "included_keywords": [],
        }

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

        # Coerce the AI payload into the typed model before persisting, so what
        # lands in JSONB always matches ResumeData. This is the final leg of
        # AGENTS.md rule 5: parse -> validate -> normalize.
        normalized_resume_data = resume_normalizer.normalize_to_dict(
            generated_resume_data
        )

        resume_repository.update(
            resume_id, user_id, {"resume_data": normalized_resume_data}
        )

        ats_analysis_data = ats
        if ats_analysis_data:
            ats_analysis_repository.upsert(resume_id, ats_analysis_data)

        cover_letter_data = {"content": letter_call.get("content", "")}
        cover_content = cover_letter_data["content"]
        if cover_content and not cover_content.startswith("Dear"):
            # Schemas cannot express "the letter must start with Dear", so a
            # structurally valid draft can still open with a resume-header echo
            # (name/contact block above the salutation). One bounded retry with
            # the strict opening rule restores the required form; if that also
            # degenerates the call raises and the API reports a diagnosable
            # error instead of persisting a broken letter.
            letter_call = await self._rerun_letter_with_opening_reminder(
                resume_data, job_description, target_role, raw_text
            )
            cover_letter_data = {"content": letter_call.get("content", "")}
            cover_content = cover_letter_data["content"]
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
            resume_data=normalized_resume_data,
            cover_letter=cover_letter_data,
            ats_analysis=ats_analysis_data,
        )

    async def improve_summary(
        self, user_id: str, resume_id: str, summary: str
    ) -> SummaryResponse:
        resume = self._get_resume_data(user_id, resume_id)
        resume_data = resume.get("resume_data", {})

        system_prompt, user_prompt = prompt_builder.build_improve_summary_prompt(
            summary, resume_data
        )
        raw_response = await llm_router.chat(
            system_prompt,
            user_prompt,
            response_format=structured_format("resume_summary", SUMMARY_SCHEMA),
        )
        parsed = response_parser.parse_json(raw_response)

        return SummaryResponse(summary=parsed.get("summary", ""))

    async def rewrite_summary(
        self, user_id: str, resume_id: str, summary: str
    ) -> SummaryResponse:
        resume = self._get_resume_data(user_id, resume_id)
        resume_data = resume.get("resume_data", {})

        system_prompt, user_prompt = prompt_builder.build_rewrite_summary_prompt(
            summary, resume_data
        )
        raw_response = await llm_router.chat(
            system_prompt,
            user_prompt,
            response_format=structured_format("resume_summary", SUMMARY_SCHEMA),
        )
        parsed = response_parser.parse_json(raw_response)

        return SummaryResponse(summary=parsed.get("summary", ""))

    async def generate_experience(
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
        raw_response = await llm_router.chat(
            system_prompt,
            user_prompt,
            response_format=structured_format("resume_experience", EXPERIENCE_SCHEMA),
        )
        parsed = response_parser.parse_json(raw_response)
        exp = parsed.get("experience", {})

        return ExperienceResponse(
            experience=ExperienceInput(
                company=exp.get("company", experience.company),
                position=exp.get("position", experience.position),
                description=exp.get("description", experience.description),
            )
        )

    async def improve_experience(
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
        raw_response = await llm_router.chat(
            system_prompt,
            user_prompt,
            response_format=structured_format("resume_experience", EXPERIENCE_SCHEMA),
        )
        parsed = response_parser.parse_json(raw_response)
        exp = parsed.get("experience", {})

        return ExperienceResponse(
            experience=ExperienceInput(
                company=exp.get("company", experience.company),
                position=exp.get("position", experience.position),
                description=exp.get("description", experience.description),
            )
        )

    async def improve_project(
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
        raw_response = await llm_router.chat(
            system_prompt,
            user_prompt,
            response_format=structured_format("resume_project", PROJECT_SCHEMA),
        )
        parsed = response_parser.parse_json(raw_response)
        proj = parsed.get("project", {})

        return ProjectResponse(
            project=ProjectInput(
                title=proj.get("title", project.title),
                description=proj.get("description", project.description),
            )
        )

    async def suggest_skills(
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
        raw_response = await llm_router.chat(
            system_prompt,
            user_prompt,
            response_format=structured_format("resume_skills", SKILLS_SCHEMA),
        )
        parsed = response_parser.parse_json(raw_response)

        return SkillsResponse(skills=parsed.get("skills", []))


resume_ai = ResumeAIOrchestrator()
