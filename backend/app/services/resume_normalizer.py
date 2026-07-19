from app.schemas.resume import ResumeData


class ResumeNormalizer:
    def normalize(self, raw_data: dict) -> ResumeData:
        return ResumeData(
            personal_info=self._normalize_personal_info(
                raw_data.get("personal_info", {})
            ),
            summary=raw_data.get("summary", ""),
            experience=self._normalize_experience(raw_data.get("experience", [])),
            projects=self._normalize_projects(raw_data.get("projects", [])),
            skills=self._normalize_skills(raw_data.get("skills", [])),
            education=self._normalize_education(raw_data.get("education", [])),
        )

    def _normalize_personal_info(self, info: dict) -> dict:
        return {
            "name": str(info.get("name", "")),
            "email": str(info.get("email", "")),
            "phone": str(info.get("phone", "")),
            "location": str(info.get("location", "")),
            "linkedin": str(info.get("linkedin", "")),
            "github": str(info.get("github", "")),
        }

    def _normalize_experience(self, experience: list) -> list:
        normalized = []
        for exp in experience:
            if isinstance(exp, dict):
                normalized.append(
                    {
                        "company": str(exp.get("company", "")),
                        "position": str(exp.get("position", "")),
                        "description": str(exp.get("description", "")),
                    }
                )
        return normalized

    def _normalize_projects(self, projects: list) -> list:
        normalized = []
        for proj in projects:
            if isinstance(proj, dict):
                normalized.append(
                    {
                        "title": str(proj.get("title", "")),
                        "description": str(proj.get("description", "")),
                    }
                )
        return normalized

    def _normalize_skills(self, skills: list) -> list:
        return [str(skill) for skill in skills if skill]

    def _normalize_education(self, education: list) -> list:
        normalized = []
        for edu in education:
            if isinstance(edu, dict):
                normalized.append(
                    {
                        "institution": str(edu.get("institution", "")),
                        "degree": str(edu.get("degree", "")),
                        "field": str(edu.get("field", "")),
                        "start_date": str(edu.get("start_date", "")),
                        "end_date": str(edu.get("end_date", "")),
                    }
                )
        return normalized


resume_normalizer = ResumeNormalizer()
