import json

from app.config import settings

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

COMPLETENESS_RULE = (
    "COMPLETENESS REQUIREMENT — The output IS the final product; never return empty sections. "
    "If a section (experience, projects, education, skills, achievements) is missing or near-empty "
    "in the user's data, GENERATE realistic, role-appropriate content matching the target role. "
    "Write every summary sentence, every bullet point, and every cover letter paragraph at FULL "
    "length — expand all content to meet the limits below; never truncate or drop a section. "
    "NEVER use placeholders such as '[Company]', '[Manager]', '[Year]', or ellipses. "
    "Fully spell out each bullet, paragraph, and letter."
)

COVER_LETTER_OPENING_RULE = (
    "Open with a salutation. "
    "The very FIRST line of the letter MUST start with the word 'Dear' "
    "(e.g. 'Dear Hiring Manager'). "
    "NEVER begin the letter with the candidate's name, address, phone/email/links, "
    "a 'from' block, or any resume-header echo — those belong in the resume, not the letter. "
    "The letter text must begin directly with 'Dear'."
)

COVER_LETTER_CLOSING_RULE = (
    "Close with a signature block as the final 4 rows of the letter, in this exact order: "
    "'Yours sincerely,' on its own line, then a blank line, then the candidate's full name, "
    "then the candidate's current position/title (use personal_info.title if present, "
    "otherwise the most recent experience position, otherwise the target role). "
    "NEVER omit the closing sign-off."
)


def bound_raw_text(raw_text: str | None, max_chars: int) -> str | None:
    """Clamp uploaded resume text so prompts stay inside the token budget.

    The uploaded text was previously unbounded and, on the structured path, was
    also embedded a second time inside resume_data.
    """
    if not raw_text:
        return None
    text = raw_text.strip()
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rstrip() + "\n[truncated]"


# Shared, cacheable prefix. Groq does not count cached tokens against rate
# limits, so keeping these rules byte-identical across the three concurrent
# generation prompts lets the provider serve them from cache. Note this must NOT
# include instructions about output shape: each call has a different schema.
SHARED_GENERATION_RULES = (
    "You are an expert resume writer, career coach, and hiring specialist. "
    f"{STAR_RULES} "
    f"{COMPLETENESS_RULE} "
    f"{JSON_INSTRUCTIONS} "
)

RESUME_DATA_SHAPE_INSTRUCTIONS = (
    '"resume_data" (object with keys: '
    '"personal_info" (object with keys "name", "email", "phone", "location", "linkedin", "github"), '
    '"summary" (string, AT MOST 3 sentences, never longer than 3 lines of text), '
    '"experience" (list of exactly 3 objects with keys "company", "position", '
    '"description" (string with exactly 3 newline-separated bullets), "start_date", "end_date"), '
    '"education" (list of at most 2 objects with keys "institution", "degree", "field", "start_date", "end_date"), '
    '"skills" (list of AT MOST 3 objects with keys "category" (string) and "items" (list of strings). '
    "Use only the 2 strongest categories that matter most for the target, and put every "
    'remaining skill into a final group whose category is exactly "Others". '
    'e.g. [{"category": "Frontend", "items": ["React", "TypeScript"]}, '
    '{"category": "Others", "items": ["Git", "Vercel"]}]), '
    '"projects" (list of exactly 3 objects with keys "title", "description" '
    '(string with exactly 3 newline-separated bullets), "start_date", "end_date"), '
    '"achievements" (list of EXACTLY 2 strings, each SHORT enough to sit on a single '
    'line - roughly 90 characters or fewer), '
    '"languages" (list of at most 3 short strings), '
    '"certifications" (list of at most 2 short strings, each roughly 60 characters or fewer)'
)

TARGET_BLOCK_TEMPLATE = (
    "Extract the concrete hard skills, programming languages, frameworks, tools, "
    "platforms and technologies that the target calls for. Output "
    "'keywords_extracted' (list of strings) and 'keyword_categories' (list of objects "
    'with keys "keyword" and "category"). '
    "Return AT MOST {max_keywords} keywords, ordered by how strongly the target asks "
    "for them; ignore generic words and stop at the cap. Fewer is better than padding. "
    "List each keyword EXACTLY ONCE and never repeat an entry: models that loop on a "
    "repeated keyword run out of room mid-document and the provider rejects the "
    "whole response as invalid JSON. "
    'Map each keyword to a skill category, e.g. "React" to "Frontend", '
    '"AWS" to "Cloud/DevOps", "Python" to "Backend". '
    "Target:\n{target}"
)


class PromptBuilder:
    def _target_context(
        self, job_description: str | None, target_role: str | None
    ) -> str:
        """Raw target text only, with no instructions about output shape."""
        if job_description:
            return f"Job Description:\n{job_description}"
        return f"Target Role: {target_role or ''}"

    def _target_block(
        self, job_description: str | None, target_role: str | None
    ) -> str:
        """Target plus explicit keyword-extraction output instructions.

        Only for calls whose schema actually contains keywords_extracted and
        keyword_categories. Adding this to a prompt with a different schema makes
        the model emit keywords instead of the requested fields, which the
        provider rejects as json_validate_failed.
        """
        return TARGET_BLOCK_TEMPLATE.format(
            max_keywords=settings.ai_max_keywords,
            target=self._target_context(job_description, target_role),
        )

    def _source_block(self, resume_data: dict, raw_text: str | None) -> str:
        """Build the candidate source context.

        raw_text is stripped from resume_data first; previously it appeared both
        inside the serialized resume_data and again as its own block.
        """
        data = dict(resume_data)
        embedded_raw = data.pop("raw_text", None)
        text = raw_text or embedded_raw
        parts = [f"Current resume data:\n{json.dumps(data, indent=2)}"]
        if text:
            parts.append(
                f"Raw resume text extracted from an uploaded file:\n\n{text}\n\n"
                "Extract all available information from this raw text, correct spelling and "
                "grammar errors, then GENERATE any missing content (descriptions, bullet "
                "points) to produce a complete professional resume. Each experience entry "
                "must have exactly 3 bullet points. Each project entry must have exactly 3 "
                "bullet points."
            )
        return "\n\n".join(parts)

    def build_resume_generation_prompt(
        self,
        resume_data: dict,
        job_description: str | None,
        target_role: str | None,
        raw_text: str | None = None,
    ) -> tuple[str, str]:
        system_prompt = (
            SHARED_GENERATION_RULES
            + f"{ONE_PAGE_BUDGET} "
            f"{KEYWORD_INTEGRATION_RULE} "
            "Generate ONLY the optimized resume and the target keywords. Do NOT write a "
            "cover letter or an ATS analysis in this response; those are generated separately. "
            "Place EVERY extracted keyword into the correct existing skills category. "
            "The response JSON must have exactly these keys: "
            '"keywords_extracted" (list of strings), '
            '"keyword_categories" (list of objects with keys "keyword" and "category"), '
            + RESUME_DATA_SHAPE_INSTRUCTIONS
            + "."
        )
        user_prompt = (
            self._source_block(resume_data, raw_text)
            + "\n\n"
            + self._target_block(job_description, target_role)
        )
        return system_prompt, user_prompt

    def build_cover_letter_generation_prompt(
        self,
        resume_data: dict,
        job_description: str | None,
        target_role: str | None,
        raw_text: str | None = None,
    ) -> tuple[str, str]:
        system_prompt = (
            SHARED_GENERATION_RULES
            + "Write ONLY a tailored cover letter. Do NOT return resume data, a keyword "
            "list, or an ATS analysis in this response. Your JSON must contain exactly "
            'one key, "content", holding the complete letter. '
            f"{COVER_LETTER_OPENING_RULE} "
            f"{COVER_LETTER_CLOSING_RULE} "
            "Write the letter as continuous prose paragraphs of roughly 450 words total, "
            "separated by a single blank line. Make it specific and interesting rather than "
            "generic: reference the company's actual product, mission, market, or engineering "
            "challenges, then connect the candidate's concrete skills and past experience to "
            "that specific context. State clearly what value the candidate brings and what "
            "they would do in the first months. "
            "Use vivid, specific language drawn from the resume; avoid clichés, filler, and "
            "restating the job description back to the reader. "
            "NEVER use exclamation marks. Do not repeat concepts, phrases, or sentences. "
            'The response JSON must have exactly one key: "content" (the full letter text).'
        )
        user_prompt = (
            self._source_block(resume_data, raw_text)
            + "\n\n"
            + "Target for this letter:\n"
            + self._target_context(job_description, target_role)
        )
        return system_prompt, user_prompt

    def build_ats_generation_prompt(
        self,
        resume_data: dict,
        job_description: str | None,
        target_role: str | None,
        raw_text: str | None = None,
    ) -> tuple[str, str]:
        system_prompt = (
            SHARED_GENERATION_RULES
            + "Assess ATS compatibility ONLY. Do NOT return a rewritten resume or a cover "
            "letter in this response. "
            "Score the CURRENT resume against the target before any optimization, then list "
            "concrete strengths, weaknesses, actionable recommendations, and the keywords "
            "still missing. Be honest about gaps rather than inflating the score. "
            "The response JSON must have exactly these keys: "
            '"previous_score" (int 0-100 for the current resume), '
            '"strengths" (list of strings), "weaknesses" (list of strings), '
            '"recommendations" (list of strings), '
            '"missing_keywords" (list of strings), '
            '"keywords_extracted" (list of strings), '
            '"keyword_categories" (list of objects with keys "keyword" and "category").'
        )
        user_prompt = (
            self._source_block(resume_data, raw_text)
            + "\n\n"
            + self._target_block(job_description, target_role)
        )
        return system_prompt, user_prompt

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
                f"{COMPLETENESS_RULE} "
                "Also generate a tailored cover letter and ATS analysis. "
                "The cover letter MUST be exactly 4 paragraphs, one per section below, totaling exactly 450 words. "
                "Separate each paragraph with a blank line so they have clear spacing between them. "
                "NEVER repeat the same idea across multiple paragraphs — each paragraph covers ONE unique topic. "
                "Body sections (in order): "
                "1) Your skills and how they will help the company, "
                "2) Your relevant experience and achievements, "
                "3) Why you are genuinely interested in joining this company, "
                "4) The specific value you will bring to the company. "
                f"{COVER_LETTER_OPENING_RULE} "
                f"{COVER_LETTER_CLOSING_RULE} "
                "Write in an enthusiastic tone that conveys genuine excitement about joining the company and looking forward to working with them. NEVER use exclamation marks (!). Do not repeat concepts, phrases, or sentences. "
                f"{KEYWORD_INTEGRATION_RULE} "
                f"{JSON_INSTRUCTIONS} "
                "The response JSON must have exactly these keys (IN THIS ORDER): "
                '"keywords_extracted" (list of strings, ALL skills/technologies/tools extracted from the job description or target role), '
                '"keyword_categories" (list of objects with keys "keyword" and "category", mapping each keyword to its skill category name), '
                "e.g. {\"React\": \"Frontend\", \"AWS\": \"Cloud/DevOps\", \"Python\": \"Backend\"}, "
                '"resume_data" (object with keys: '
                '"personal_info" (object with keys "name", "email", "phone", "location", "linkedin", "github"), '
                '"summary" (string), '
                '"experience" (list of objects with keys "company", "position", "description" (string with \\n separated bullet points), "start_date", "end_date"), '
                '"education" (list of objects with keys "institution", "degree", "field", "start_date", "end_date"), '
                '"skills" (list of objects with keys "category" (string) and "items" (list of strings)), e.g. [{"category": "Frontend", "items": ["React", "TypeScript"]}, {"category": "Backend", "items": ["Node.js", "Python"]}], '
                '"projects" (list of objects with keys "title", "description" (string with \\n separated bullet points), "start_date", "end_date"), '
                '"achievements" (list of strings, add exactly 2 notable achievements in single-line format), '
                '"languages" (list of strings, add languages with proficiency if any), "certifications" (list of strings, add certifications if any)), '
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
                f"{COMPLETENESS_RULE} "
                "Also generate a tailored cover letter and ATS analysis. "
                "The cover letter MUST be exactly 4 paragraphs, one per section below, totaling exactly 450 words. "
                "Separate each paragraph with a blank line so they have clear spacing between them. "
                "NEVER repeat the same idea across multiple paragraphs — each paragraph covers ONE unique topic. "
                "Body sections (in order): "
                "1) Your skills and how they will help the company, "
                "2) Your relevant experience and achievements, "
                "3) Why you are genuinely interested in joining this company, "
                "4) The specific value you will bring to the company. "
                f"{COVER_LETTER_OPENING_RULE} "
                f"{COVER_LETTER_CLOSING_RULE} "
                "Write in an enthusiastic tone that conveys genuine excitement about joining the company and looking forward to working with them. NEVER use exclamation marks (!). Do not repeat concepts, phrases, or sentences. "
                f"{KEYWORD_INTEGRATION_RULE} "
                f"{JSON_INSTRUCTIONS} "
                "The response JSON must have exactly these keys (IN THIS ORDER): "
                '"keywords_extracted" (list of strings, ALL skills/technologies/tools extracted from the job description or target role), '
                '"keyword_categories" (list of objects with keys "keyword" and "category", mapping each keyword to its skill category name), '
                "e.g. {\"React\": \"Frontend\", \"AWS\": \"Cloud/DevOps\", \"Python\": \"Backend\"}, "
                '"resume_data" (object with keys: '
                '"personal_info" (object with keys "name", "email", "phone", "location", "linkedin", "github"), '
                '"summary" (string), '
                '"experience" (list of objects with keys "company", "position", "description" (string with \\n separated bullet points), "start_date", "end_date"), '
                '"education" (list of objects with keys "institution", "degree", "field", "start_date", "end_date"), '
                '"skills" (list of objects with keys "category" (string) and "items" (list of strings)), e.g. [{"category": "Frontend", "items": ["React", "TypeScript"]}, {"category": "Backend", "items": ["Node.js", "Python"]}], '
                '"projects" (list of objects with keys "title", "description" (string with \\n separated bullet points), "start_date", "end_date"), '
                '"achievements" (list of strings, add exactly 2 notable achievements in single-line format), '
                '"languages" (list of strings, add languages with proficiency if any), "certifications" (list of strings, add certifications if any)), '
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
            "The letter MUST be exactly 4 paragraphs, one per section below, totaling exactly 450 words. "
            "Separate each paragraph with a blank line so they have clear spacing between them. "
            "NEVER repeat the same idea across multiple paragraphs — each paragraph covers ONE unique topic. "
            "Body sections (in order): "
            "1) Your skills and how they will help the company, "
            "2) Your relevant experience and achievements, "
            "3) Why you are genuinely interested in joining this company, "
            "4) The specific value you will bring to the company. "
            f"{COVER_LETTER_OPENING_RULE} "
            f"{COVER_LETTER_CLOSING_RULE} "
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
