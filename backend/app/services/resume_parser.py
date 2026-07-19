import io
import re

from app.schemas.resume import ResumeData


class ResumeParserService:
    def parse_pdf(self, file_content: bytes) -> dict:
        try:
            import pdfplumber

            text = ""
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                for page in pdf.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"

            return self._extract_sections_from_text(text)
        except ImportError:
            raise ValueError("PDF parsing not available")
        except Exception as e:
            raise ValueError(f"Failed to parse PDF: {str(e)}")

    def parse_docx(self, file_content: bytes) -> dict:
        try:
            import docx

            doc = docx.Document(io.BytesIO(file_content))
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])

            return self._extract_sections_from_text(text)
        except ImportError:
            raise ValueError("DOCX parsing not available")
        except Exception as e:
            raise ValueError(f"Failed to parse DOCX: {str(e)}")

    def _extract_sections_from_text(self, text: str) -> dict:
        lines = text.split("\n")
        sections = {
            "personal_info": {},
            "summary": "",
            "experience": [],
            "education": [],
            "skills": [],
        }

        current_section = None
        current_content = []

        for line in lines:
            line = line.strip()
            if not line:
                continue

            lower_line = line.lower()

            if any(
                keyword in lower_line
                for keyword in ["experience", "work history", "employment"]
            ):
                current_section = "experience"
                current_content = []
            elif any(
                keyword in lower_line
                for keyword in ["education", "academic", "university"]
            ):
                current_section = "education"
                current_content = []
            elif any(
                keyword in lower_line
                for keyword in ["skills", "competencies", "technologies"]
            ):
                current_section = "skills"
                current_content = []
            elif any(
                keyword in lower_line
                for keyword in ["summary", "objective", "profile", "about"]
            ):
                current_section = "summary"
                current_content = []
            elif current_section and line:
                current_content.append(line)

            if current_section and current_content:
                self._update_section(
                    sections, current_section, current_content, lines, line
                )

        if not sections["personal_info"]:
            sections["personal_info"] = self._extract_personal_info(text)

        return sections

    def _update_section(
        self, sections: dict, section: str, content: list, lines: list, current_line: str
    ):
        if section == "experience":
            experience_pattern = r"(.+?)\s*(?:at|@)\s*(.+?)(?:,\s*(.+))?$"
            match = re.match(experience_pattern, current_line, re.IGNORECASE)
            if match:
                sections["experience"].append(
                    {
                        "position": match.group(1).strip(),
                        "company": match.group(2).strip(),
                        "description": "\n".join(content[:-1]) if len(content) > 1 else "",
                    }
                )
        elif section == "education":
            sections["education"].append({"institution": current_line, "degree": "", "field": ""})
        elif section == "skills":
            skill_items = re.split(r"[,;•·\-]", current_line)
            for skill in skill_items:
                skill = skill.strip()
                if skill and len(skill) < 50:
                    sections["skills"].append(skill)
        elif section == "summary":
            sections["summary"] = " ".join(content)

    def _extract_personal_info(self, text: str) -> dict:
        email_pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
        phone_pattern = r"[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]*"

        email_match = re.search(email_pattern, text)
        phone_match = re.search(phone_pattern, text)

        lines = text.split("\n")
        name = ""
        for line in lines[:5]:
            line = line.strip()
            if (
                line
                and not re.search(email_pattern, line)
                and not re.search(phone_pattern, line)
                and len(line.split()) <= 3
                and len(line) < 50
            ):
                name = line
                break

        return {
            "name": name,
            "email": email_match.group(0) if email_match else "",
            "phone": phone_match.group(0) if phone_match else "",
            "location": "",
            "linkedin": "",
            "github": "",
        }


resume_parser = ResumeParserService()
