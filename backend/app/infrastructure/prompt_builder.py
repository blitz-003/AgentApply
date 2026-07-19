JSON_INSTRUCTIONS = (
    "Return ONLY valid JSON with no extra text, markdown, or explanation. "
    "Do not wrap the JSON in code blocks."
)


class PromptBuilder:
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
            "Keep it concise (3-4 sentences). Maintain the original meaning but make it stronger. "
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
            f"{JSON_INSTRUCTIONS} "
            'The response JSON must have exactly one key: "experience" with sub-keys '
            '"company", "position", "description".'
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
            "Use strong action verbs and quantify achievements where possible. "
            f"{JSON_INSTRUCTIONS} "
            'The response JSON must have exactly one key: "experience" with sub-keys '
            '"company", "position", "description".'
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
            "impact, and key contributions. Make it compelling and specific. "
            f"{JSON_INSTRUCTIONS} "
            'The response JSON must have exactly one key: "project" with sub-keys '
            '"title", "description".'
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


prompt_builder = PromptBuilder()
