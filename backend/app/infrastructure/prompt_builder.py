import json

JSON_INSTRUCTIONS = (
    "Return ONLY valid JSON with no extra text, markdown, or explanation. "
    "Do not wrap the JSON in code blocks."
)

STAR_RULES = (
    "Each bullet point must follow the STAR approach (Situation, Task, Action, Result). "
    "Use strong action verbs and quantify achievements where possible. "
    "Maximum 3 bullet points per section. Be concise and impactful."
)


class PromptBuilder:
    def build_parse_resume_prompt(
        self,
        raw_text: str,
    ) -> tuple[str, str]:
        system_prompt = (
            "You are an expert resume parser and career coach. "
            "Given the raw text extracted from a resume, extract and structure all information "
            "into our resume format. Correct any spelling or grammar errors. "
            "Condense all descriptions to a maximum of 3 bullet points per section using the STAR approach "
            "(Situation, Task, Action, Result). Use strong action verbs and quantify achievements. "
            "If information is missing for a field, leave it as an empty string or empty list. "
            f"{JSON_INSTRUCTIONS} "
            "The response JSON must have exactly these keys: "
            '"personal_info" (object with keys "name", "email", "phone", "location", "linkedin", "github"), '
            '"summary" (string, 2-3 sentences), '
            '"experience" (list of objects with keys "company", "position", "description", "start_date", "end_date"), '
            '"education" (list of objects with keys "institution", "degree", "field", "start_date", "end_date"), '
            '"skills" (list of strings), '
            '"projects" (list of objects with keys "title", "description", "start_date", "end_date").'
        )
        user_prompt = f"Raw resume text:\n\n{raw_text}"
        return system_prompt, user_prompt

    def build_generate_prompt(
        self,
        resume_data: dict,
        job_description: str | None,
        target_role: str | None,
    ) -> tuple[str, str]:
        context = f"Current resume data:\n{json.dumps(resume_data, indent=2)}"

        target = ""
        if job_description:
            target = f"Job Description:\n{job_description}"
        elif target_role:
            target = f"Target Role: {target_role}"

        system_prompt = (
            "You are an expert resume writer and career coach. "
            "Given the user's resume data and a target (job description or role), "
            "generate an optimized, ATS-friendly resume. "
            f"{STAR_RULES} "
            "Also generate a tailored cover letter and ATS analysis. "
            f"{JSON_INSTRUCTIONS} "
            "The response JSON must have exactly these keys: "
            '"resume_data" (object), "cover_letter" (object with key "content"), '
            '"ats_analysis" (object with keys "overall_score", "strengths", "weaknesses", '
            '"recommendations", "missing_keywords").'
        )
        user_prompt = f"{context}\n\n{target}"
        return system_prompt, user_prompt

    def build_ats_analysis_prompt(
        self,
        resume_data: dict,
        job_description: str | None,
        target_role: str | None,
    ) -> tuple[str, str]:
        context = f"Resume data:\n{json.dumps(resume_data, indent=2)}"

        target = ""
        if job_description:
            target = f"Job Description:\n{job_description}"
        elif target_role:
            target = f"Target Role: {target_role}"

        system_prompt = (
            "You are an ATS (Applicant Tracking System) expert. "
            "Analyze the resume against the target and provide an ATS compatibility score, "
            "strengths, weaknesses, recommendations, and missing keywords. "
            f"{JSON_INSTRUCTIONS} "
            "The response JSON must have exactly these keys: "
            '"overall_score" (int 0-100), "strengths" (list of strings), '
            '"weaknesses" (list of strings), "recommendations" (list of strings), '
            '"missing_keywords" (list of strings).'
        )
        user_prompt = f"{context}\n\n{target}"
        return system_prompt, user_prompt

    def build_cover_letter_prompt(
        self,
        resume_data: dict,
        company_name: str,
        job_title: str,
        job_description: str,
    ) -> tuple[str, str]:
        context = f"Resume data:\n{json.dumps(resume_data, indent=2)}"

        system_prompt = (
            "You are a professional cover letter writer. "
            "Write a compelling, personalized cover letter tailored to the company and role. "
            f"{JSON_INSTRUCTIONS} "
            'The response JSON must have exactly one key: "content" (the cover letter text).'
        )
        user_prompt = (
            f"{context}\n\n"
            f"Company: {company_name}\n"
            f"Position: {job_title}\n"
            f"Job Description:\n{job_description}"
        )
        return system_prompt, user_prompt

    def build_improve_summary_prompt(
        self,
        summary: str,
        resume_context: dict,
    ) -> tuple[str, str]:
        system_prompt = (
            "You are a professional resume writer. "
            "Improve the given professional summary to be more impactful, specific, and ATS-friendly. "
            "Keep it concise (2-3 sentences). Maintain the original meaning but make it stronger. "
            f"{JSON_INSTRUCTIONS} "
            'The response JSON must have exactly one key: "summary".'
        )
        user_prompt = (
            f"Resume context:\n{json.dumps(resume_context, indent=2)}\n\n"
            f"Current summary:\n{summary}"
        )
        return system_prompt, user_prompt

    def build_rewrite_summary_prompt(
        self,
        summary: str,
        resume_context: dict,
    ) -> tuple[str, str]:
        system_prompt = (
            "You are a professional resume writer. "
            "Completely rewrite the professional summary with a fresh perspective. "
            "Make it compelling, modern, and optimized for ATS systems. "
            f"{JSON_INSTRUCTIONS} "
            'The response JSON must have exactly one key: "summary".'
        )
        user_prompt = (
            f"Resume context:\n{json.dumps(resume_context, indent=2)}\n\n"
            f"Current summary:\n{summary}"
        )
        return system_prompt, user_prompt

    def build_generate_experience_prompt(
        self,
        experience: dict,
        resume_context: dict,
    ) -> tuple[str, str]:
        system_prompt = (
            "You are a professional resume writer. "
            "Enhance the work experience entry by expanding the description with "
            "specific achievements, metrics, and action verbs. "
            "Maintain the company name and position. "
            f"{STAR_RULES} "
            f"{JSON_INSTRUCTIONS} "
            'The response JSON must have exactly one key: "experience" with sub-keys '
            '"company", "position", "description", "start_date", "end_date".'
        )
        user_prompt = (
            f"Resume context:\n{json.dumps(resume_context, indent=2)}\n\n"
            f"Experience to enhance:\n{json.dumps(experience, indent=2)}"
        )
        return system_prompt, user_prompt

    def build_improve_experience_prompt(
        self,
        experience: dict,
        resume_context: dict,
    ) -> tuple[str, str]:
        system_prompt = (
            "You are a professional resume writer. "
            "Improve the work experience description to be more impactful and results-oriented. "
            f"{STAR_RULES} "
            f"{JSON_INSTRUCTIONS} "
            'The response JSON must have exactly one key: "experience" with sub-keys '
            '"company", "position", "description", "start_date", "end_date".'
        )
        user_prompt = (
            f"Resume context:\n{json.dumps(resume_context, indent=2)}\n\n"
            f"Experience to improve:\n{json.dumps(experience, indent=2)}"
        )
        return system_prompt, user_prompt

    def build_improve_project_prompt(
        self,
        project: dict,
        resume_context: dict,
    ) -> tuple[str, str]:
        system_prompt = (
            "You are a professional resume writer. "
            "Improve the project description to highlight technical skills, "
            "impact, and key contributions. "
            f"{STAR_RULES} "
            f"{JSON_INSTRUCTIONS} "
            'The response JSON must have exactly one key: "project" with sub-keys '
            '"title", "description", "start_date", "end_date".'
        )
        user_prompt = (
            f"Resume context:\n{json.dumps(resume_context, indent=2)}\n\n"
            f"Project to improve:\n{json.dumps(project, indent=2)}"
        )
        return system_prompt, user_prompt

    def build_suggest_skills_prompt(
        self,
        skills: list[str],
        resume_context: dict,
    ) -> tuple[str, str]:
        system_prompt = (
            "You are a career expert and ATS specialist. "
            "Based on the user's existing skills and resume context, suggest additional "
            "relevant skills that would strengthen their profile. "
            "Include the original skills plus new suggestions. "
            f"{JSON_INSTRUCTIONS} "
            'The response JSON must have exactly one key: "skills" (list of strings).'
        )
        user_prompt = (
            f"Resume context:\n{json.dumps(resume_context, indent=2)}\n\n"
            f"Current skills: {json.dumps(skills)}"
        )
        return system_prompt, user_prompt

    def build_fill_fields_prompt(
        self,
        resume_data: dict,
        job_description: str | None,
        target_role: str | None,
    ) -> tuple[str, str]:
        context = f"Current resume data:\n{json.dumps(resume_data, indent=2)}"

        target = ""
        if job_description:
            target = f"Job Description:\n{job_description}"
        elif target_role:
            target = f"Target Role: {target_role}"
        else:
            target = "Generate a general professional resume."

        system_prompt = (
            "You are an expert resume writer. "
            "The user has a partially filled resume. "
            "Fill in ONLY the empty or missing fields with relevant, professional content. "
            "Do NOT modify any fields that already have content — preserve them exactly. "
            "For empty experience entries, generate realistic professional experience based on the target role. "
            "For empty education entries, generate appropriate education. "
            "For empty skills, suggest relevant technical and soft skills. "
            "For empty summary, write a compelling 2-3 sentence professional summary. "
            "For empty projects, generate relevant projects if applicable. "
            f"{STAR_RULES} "
            f"{JSON_INSTRUCTIONS} "
            "The response JSON must have exactly one key: "
            '"resume_data" (the complete resume object with all fields filled).'
        )
        user_prompt = f"{context}\n\n{target}"
        return system_prompt, user_prompt


prompt_builder = PromptBuilder()
