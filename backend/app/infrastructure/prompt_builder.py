import json

JSON_INSTRUCTIONS = (
    "Return ONLY valid JSON with no extra text, markdown, or explanation. "
    "Do not wrap the JSON in code blocks."
)

STAR_RULES = (
    "Each bullet point must follow the STAR approach (Situation, Task, Action, Result). "
    "Use strong action verbs and quantify achievements where possible. "
    "Each experience entry must have exactly 3 bullet points separated by newlines. "
    "Each project entry must have exactly 3 bullet points separated by newlines. "
    "Each bullet point MUST be a single line of 55-85 characters that fits on one line in the PDF. "
    "NEVER write multi-line bullets. Each bullet must be a self-contained, quantified achievement that occupies exactly one line. "
    "Be concise and impactful."
)

ONE_PAGE_BUDGET = (
    "ONE-PAGE CONSTRAINT — The entire resume must fit exactly on one A4 page with no gaps at the bottom. "
    "Total body text should be approximately 2800-3400 characters (excluding JSON structure). "
    "Adhere to these content limits: "
    "Summary: 3-4 sentences (250-400 chars). "
    "Skills: organized into 3-5 categories (Frontend, Backend, DevOps, etc.) with 3-6 items each, ~15-20 total keywords (300-400 chars). "
    "Experience: exactly 3 entries, each with exactly 3 single-line bullets of 55-85 chars (total ~900-1100 chars for all experience). "
    "Projects: exactly 3 entries, each with exactly 3 single-line bullets of 55-85 chars (total ~900-1100 chars for all projects). "
    "Education: maximum 2 entries, keep each to 2 lines (~200 chars). "
    "Achievements: exactly 2 single-line items (~150 chars). "
    "Languages: 1 line (~100 chars). "
    "Certifications: 2-3 items if applicable (~150 chars). "
    "If content is below these limits, EXPAND it to fill the page. "
    "If content exceeds these limits, TRIM it. "
    "The resume MUST use exactly one page — no more, no less."
)

KEYWORD_INTEGRATION_RULE = (
    "KEYWORD REQUIREMENT: Extract every concrete hard skill, programming language, framework, "
    "tool, platform, and technology from the job description / target role below. "
    "DO NOT extract abstract concepts, soft skills, or generic terms such as "
    "'communication', 'reliability', 'quality', 'innovation', 'leadership', 'teamwork', "
    "'real-time communication', 'scalability', 'performance', 'agile', or similar. "
    "Only concrete technical keywords that can be listed as a candidate's skill. "
    "For EACH keyword, output its category mapping in keyword_categories "
    "(e.g. \"React\" → \"Frontend\", \"AWS\" → \"Cloud/DevOps\", \"Python\" → \"Backend\"). "
    "Place EACH keyword into an EXISTING skills category in resume_data.skills whenever possible. "
    "Only create a new category as a last resort. "
    "The backend will automatically detect and list any keywords still missing."
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
            '"experience" (list of objects with keys "company", "position", "description" (string with \n separated bullet points), "start_date", "end_date"), '
            '"education" (list of objects with keys "institution", "degree", "field", "start_date", "end_date"), '
            '"skills" (list of objects with keys "category" (string) and "items" (list of strings)), e.g. [{"category": "Frontend", "items": ["React", "TypeScript"]}, {"category": "Backend", "items": ["Node.js", "Python"]}], '
            '"projects" (list of objects with keys "title", "description" (string with \n separated bullet points), "start_date", "end_date").'
        )
        user_prompt = f"Raw resume text:\n\n{raw_text}"
        return system_prompt, user_prompt

    def build_generate_prompt(
        self,
        resume_data: dict,
        job_description: str | None,
        target_role: str | None,
        raw_text: str | None = None,
    ) -> tuple[str, str]:
        target = ""
        if job_description:
            target = f"Job Description:\n{job_description}"
        elif target_role:
            target = f"Target Role: {target_role}"

        if raw_text:
            context = (
                f"Raw resume text extracted from an uploaded file:\n\n{raw_text}\n\n"
                "Extract all available information from this raw text, correct spelling/grammar errors, "
                "then GENERATE any missing content (descriptions, bullet points) to produce a complete professional resume. "
                "Each experience entry must have exactly 3 bullet points. Each project entry must have exactly 3 bullet points. "
            )
            system_prompt = (
                "You are an expert resume parser and writer. "
                "Given raw text from an uploaded resume, extract everything you can and GENERATE any missing content (especially 3 detailed bullet points per entry) to produce a complete, optimized resume for the target role. "
                "First evaluate the ORIGINAL resume data against the job description and assign previous_score (0-100). "
                "Then generate the optimized resume_data with EVERY keyword placed into the correct skills categories. "
                "Finally evaluate the OPTIMIZED resume and assign overall_score (0-100, should be 90-100). "
                f"{STAR_RULES} "
                f"{ONE_PAGE_BUDGET} "
                "Also generate a tailored cover letter and ATS analysis. "
                "The cover letter MUST be exactly 5 paragraphs, one per section below, totaling exactly 1200 words. "
                "Separate each paragraph with a blank line so they have clear spacing between them. "
                "NEVER repeat the same idea across multiple paragraphs — each paragraph covers ONE unique topic. "
                "Body sections (in order): "
                "1) Your skills and how they will help the company, "
                "2) Your relevant experience and achievements, "
                "3) Why you are genuinely interested in joining this company, "
                "4) The specific value you will bring to the company, "
                "5) Your vision, future ideas, and growth prospects for the company. "
                "Open with a salutation (Dear [Hiring Manager / Team]). "
                "IMPORTANT: End the letter with 'Yours sincerely,' on its own line, followed by the candidate's full name on the next line. NEVER omit the closing sign-off. "
                "Write in an enthusiastic tone that conveys genuine excitement about joining the company and looking forward to working with them. NEVER use exclamation marks (!). Do not repeat concepts, phrases, or sentences. "
                f"{KEYWORD_INTEGRATION_RULE} "
                f"{JSON_INSTRUCTIONS} "
                "The response JSON must have exactly these keys (IN THIS ORDER): "
                '"keywords_extracted" (list of strings, ALL skills/technologies/tools extracted from the job description or target role), '
                '"keyword_categories" (object mapping each keyword to its skill category name), '
                "e.g. {\"React\": \"Frontend\", \"AWS\": \"Cloud/DevOps\", \"Python\": \"Backend\"}, "
                '"resume_data" (object with keys: '
                '"personal_info" (object with keys "name", "email", "phone", "location", "linkedin", "github"), '
                '"summary" (string), '
                '"experience" (list of objects with keys "company", "position", "description" (string with \\n separated bullet points), "start_date", "end_date"), '
                '"education" (list of objects with keys "institution", "degree", "field", "start_date", "end_date"), '
                '"skills" (list of objects with keys "category" (string) and "items" (list of strings)), e.g. [{"category": "Frontend", "items": ["React", "TypeScript"]}, {"category": "Backend", "items": ["Node.js", "Python"]}], '
                '"projects" (list of objects with keys "title", "description" (string with \\n separated bullet points), "start_date", "end_date"), '
                '"achievements" (list of strings, add exactly 2 notable achievements in single-line format), '
                '"languages" (list of strings, add languages with proficiency if any)), '
                '"cover_letter" (object with key "content"), '
                '"ats_analysis" (object with keys "previous_score" (int 0-100), "overall_score" (int 0-100), '
                '"strengths" (list of strings), "weaknesses" (list of strings), '
                '"recommendations" (list of strings), "missing_keywords" (list of strings)).'
            )
            user_prompt = f"{context}\n\n{target}"
            return system_prompt, user_prompt
        else:
            context = f"Current resume data:\n{json.dumps(resume_data, indent=2)}"
            system_prompt = (
                "You are an expert resume writer and career coach. "
                "Given the user's resume data and a target (job description or role), "
                "generate an optimized, ATS-friendly resume. "
                "First evaluate the ORIGINAL resume data against the job description and assign previous_score (0-100). "
                "Then generate the optimized resume_data with EVERY keyword placed into the correct skills categories. "
                "Finally evaluate the OPTIMIZED resume and assign overall_score (0-100, should be 90-100). "
                f"{STAR_RULES} "
                f"{ONE_PAGE_BUDGET} "
                "Also generate a tailored cover letter and ATS analysis. "
                "The cover letter MUST be exactly 5 paragraphs, one per section below, totaling exactly 1200 words. "
                "Separate each paragraph with a blank line so they have clear spacing between them. "
                "NEVER repeat the same idea across multiple paragraphs — each paragraph covers ONE unique topic. "
                "Body sections (in order): "
                "1) Your skills and how they will help the company, "
                "2) Your relevant experience and achievements, "
                "3) Why you are genuinely interested in joining this company, "
                "4) The specific value you will bring to the company, "
                "5) Your vision, future ideas, and growth prospects for the company. "
                "Open with a salutation (Dear [Hiring Manager / Team]). "
                "IMPORTANT: End the letter with 'Yours sincerely,' on its own line, followed by the candidate's full name on the next line. NEVER omit the closing sign-off. "
                "Write in an enthusiastic tone that conveys genuine excitement about joining the company and looking forward to working with them. NEVER use exclamation marks (!). Do not repeat concepts, phrases, or sentences. "
                f"{KEYWORD_INTEGRATION_RULE} "
                f"{JSON_INSTRUCTIONS} "
                "The response JSON must have exactly these keys (IN THIS ORDER): "
                '"keywords_extracted" (list of strings, ALL skills/technologies/tools extracted from the job description or target role), '
                '"keyword_categories" (object mapping each keyword to its skill category name), '
                "e.g. {\"React\": \"Frontend\", \"AWS\": \"Cloud/DevOps\", \"Python\": \"Backend\"}, "
                '"resume_data" (object with keys: '
                '"personal_info" (object with keys "name", "email", "phone", "location", "linkedin", "github"), '
                '"summary" (string), '
                '"experience" (list of objects with keys "company", "position", "description" (string with \\n separated bullet points), "start_date", "end_date"), '
                '"education" (list of objects with keys "institution", "degree", "field", "start_date", "end_date"), '
                '"skills" (list of objects with keys "category" (string) and "items" (list of strings)), e.g. [{"category": "Frontend", "items": ["React", "TypeScript"]}, {"category": "Backend", "items": ["Node.js", "Python"]}], '
                '"projects" (list of objects with keys "title", "description" (string with \\n separated bullet points), "start_date", "end_date"), '
                '"achievements" (list of strings, add exactly 2 notable achievements in single-line format), '
                '"languages" (list of strings, add languages with proficiency if any)), '
                '"cover_letter" (object with key "content"), '
                '"ats_analysis" (object with keys "previous_score" (int 0-100), "overall_score" (int 0-100), '
                '"strengths" (list of strings), "weaknesses" (list of strings), '
                '"recommendations" (list of strings), "missing_keywords" (list of strings)).'
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
            "The letter MUST be exactly 5 paragraphs, one per section below, totaling exactly 1200 words. "
            "Separate each paragraph with a blank line so they have clear spacing between them. "
            "NEVER repeat the same idea across multiple paragraphs — each paragraph covers ONE unique topic. "
            "Body sections (in order): "
            "1) Your skills and how they will help the company, "
            "2) Your relevant experience and achievements, "
            "3) Why you are genuinely interested in joining this company, "
            "4) The specific value you will bring to the company, "
            "5) Your vision, future ideas, and growth prospects for the company. "
            "Open with a salutation (Dear [Hiring Manager / Team]). "
            "IMPORTANT: End the letter with 'Yours sincerely,' on its own line, followed by the candidate's full name on the next line. NEVER omit the closing sign-off. "
            "Write in an enthusiastic tone that conveys genuine excitement about joining the company and looking forward to working with them. NEVER use exclamation marks (!). Do not repeat concepts, phrases, or sentences. "
            f"{JSON_INSTRUCTIONS} "
            'The response JSON must have exactly one key: "content" (the full cover letter text).'
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
