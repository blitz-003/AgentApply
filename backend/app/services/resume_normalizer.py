"""Normalizes AI-generated resume payloads into the typed ResumeData model.

AI output is untrusted (AGENTS.md rule 5). This coerces every field to its
declared type and accepts both the canonical grouped skills shape and the older
flat list-of-strings shape, so a mixed database never breaks a renderer.
"""

from app.schemas.resume import ResumeData

DEFAULT_SKILL_CATEGORY = "Skills"


class ResumeNormalizer:
    def normalize(self, raw_data: dict) -> ResumeData:
        """Coerce a raw payload into ResumeData without dropping any field."""
        data = raw_data if isinstance(raw_data, dict) else {}
        return ResumeData(
            personal_info=self._normalize_personal_info(
                data.get("personal_info") or {}
            ),
            summary=self._as_str(data.get("summary")),
            experience=self._normalize_experience(data.get("experience")),
            projects=self._normalize_projects(data.get("projects")),
            skills=self._normalize_skills(data.get("skills")),
            education=self._normalize_education(data.get("education")),
            certifications=self._normalize_str_list(data.get("certifications")),
            languages=self._normalize_str_list(data.get("languages")),
            achievements=self._normalize_str_list(data.get("achievements")),
        )

    def normalize_to_dict(self, raw_data: dict) -> dict:
        """JSONB-ready dict, which is what the resumes table stores."""
        return self.normalize(raw_data).model_dump()

    @staticmethod
    def _as_str(value) -> str:
        if value is None:
            return ""
        if isinstance(value, str):
            return value
        return str(value)

    def _normalize_personal_info(self, info) -> dict:
        info = info if isinstance(info, dict) else {}
        return {
            "name": self._as_str(info.get("name")),
            "email": self._as_str(info.get("email")),
            "phone": self._as_str(info.get("phone")),
            "location": self._as_str(info.get("location")),
            "linkedin": self._as_str(info.get("linkedin")),
            "github": self._as_str(info.get("github")),
        }

    def _normalize_experience(self, experience) -> list:
        if not isinstance(experience, list):
            return []
        normalized = []
        for exp in experience:
            if isinstance(exp, dict):
                normalized.append(
                    {
                        "company": self._as_str(exp.get("company")),
                        "position": self._as_str(exp.get("position")),
                        "description": self._as_str(exp.get("description")),
                        "start_date": self._as_str(exp.get("start_date")),
                        "end_date": self._as_str(exp.get("end_date")),
                    }
                )
        return normalized

    def _normalize_projects(self, projects) -> list:
        if not isinstance(projects, list):
            return []
        normalized = []
        for proj in projects:
            if isinstance(proj, dict):
                normalized.append(
                    {
                        "title": self._as_str(proj.get("title")),
                        "description": self._as_str(proj.get("description")),
                        "start_date": self._as_str(proj.get("start_date")),
                        "end_date": self._as_str(proj.get("end_date")),
                    }
                )
        return normalized

    def _normalize_education(self, education) -> list:
        if not isinstance(education, list):
            return []
        normalized = []
        for edu in education:
            if isinstance(edu, dict):
                normalized.append(
                    {
                        "institution": self._as_str(edu.get("institution")),
                        "degree": self._as_str(edu.get("degree")),
                        "field": self._as_str(edu.get("field")),
                        "start_date": self._as_str(edu.get("start_date")),
                        "end_date": self._as_str(edu.get("end_date")),
                    }
                )
        return normalized

    def _normalize_skills(self, skills) -> list[dict]:
        """Accept grouped skills and flatten bare strings into a default group.

        Rendering skills as {category, items} is the canonical shape, but older
        records and the suggest-skills endpoint both use a flat list, so a flat
        value is collected into one group rather than discarded.
        """
        if not isinstance(skills, list):
            return []

        groups: list[dict] = []
        by_category: dict[str, dict] = {}
        loose: list[str] = []

        for entry in skills:
            if isinstance(entry, dict):
                category = self._as_str(entry.get("category")).strip()
                items = self._normalize_str_list(entry.get("items"))
                if not items:
                    continue
                category = category or DEFAULT_SKILL_CATEGORY
                existing = by_category.get(category)
                if existing is None:
                    existing = {"category": category, "items": []}
                    by_category[category] = existing
                    groups.append(existing)
                for item in items:
                    if item not in existing["items"]:
                        existing["items"].append(item)
            elif isinstance(entry, str):
                text = entry.strip()
                if text:
                    loose.append(text)

        if loose:
            target = by_category.get(DEFAULT_SKILL_CATEGORY)
            if target is None:
                target = {"category": DEFAULT_SKILL_CATEGORY, "items": []}
                by_category[DEFAULT_SKILL_CATEGORY] = target
                groups.append(target)
            for item in loose:
                if item not in target["items"]:
                    target["items"].append(item)

        return groups

    def _normalize_str_list(self, value) -> list[str]:
        """Coerce a list to strings, skipping blanks and dropping duplicates."""
        if not isinstance(value, list):
            return []
        result: list[str] = []
        for item in value:
            text = self._as_str(item).strip()
            if text and text not in result:
                result.append(text)
        return result


resume_normalizer = ResumeNormalizer()