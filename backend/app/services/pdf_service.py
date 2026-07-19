import io
from datetime import datetime


class PDFService:
    def generate_pdf(self, resume_data: dict, template_id: str | None = None) -> bytes:
        html_content = self._render_html(resume_data, template_id)
        return self._html_to_pdf(html_content)

    def _render_html(self, resume_data: dict, template_id: str | None = None) -> str:
        personal_info = resume_data.get("personal_info", {})
        summary = resume_data.get("summary", "")
        experience = resume_data.get("experience", [])
        education = resume_data.get("education", [])
        skills = resume_data.get("skills", [])
        projects = resume_data.get("projects", [])

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #2563eb;
        }}
        .header h1 {{
            font-size: 28px;
            color: #1e40af;
            margin-bottom: 10px;
        }}
        .contact-info {{
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
            font-size: 14px;
            color: #666;
        }}
        .contact-info span {{
            display: flex;
            align-items: center;
            gap: 5px;
        }}
        .section {{
            margin-bottom: 25px;
        }}
        .section-title {{
            font-size: 18px;
            color: #1e40af;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e5e7eb;
        }}
        .summary {{
            font-size: 14px;
            line-height: 1.8;
            color: #444;
        }}
        .experience-item, .education-item, .project-item {{
            margin-bottom: 20px;
            padding-left: 15px;
            border-left: 3px solid #2563eb;
        }}
        .item-header {{
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 5px;
        }}
        .item-title {{
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
        }}
        .item-subtitle {{
            font-size: 14px;
            color: #6b7280;
        }}
        .item-description {{
            font-size: 14px;
            color: #4b5563;
            margin-top: 5px;
        }}
        .skills-list {{
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }}
        .skill-item {{
            background-color: #eff6ff;
            color: #1e40af;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 500;
        }}
        .empty-state {{
            color: #9ca3af;
            font-style: italic;
            text-align: center;
            padding: 20px;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>{personal_info.get('name', 'Your Name')}</h1>
        <div class="contact-info">
            {f'<span>{personal_info.get("email", "")}</span>' if personal_info.get('email') else ''}
            {f'<span>{personal_info.get("phone", "")}</span>' if personal_info.get('phone') else ''}
            {f'<span>{personal_info.get("location", "")}</span>' if personal_info.get('location') else ''}
            {f'<span>{personal_info.get("linkedin", "")}</span>' if personal_info.get('linkedin') else ''}
            {f'<span>{personal_info.get("github", "")}</span>' if personal_info.get('github') else ''}
        </div>
    </div>

    {self._render_summary(summary)}
    {self._render_experience(experience)}
    {self._render_education(education)}
    {self._render_skills(skills)}
    {self._render_projects(projects)}
</body>
</html>"""

        return html

    def _render_summary(self, summary: str) -> str:
        if not summary:
            return ""
        return f"""
    <div class="section">
        <h2 class="section-title">Professional Summary</h2>
        <p class="summary">{summary}</p>
    </div>"""

    def _render_experience(self, experience: list) -> str:
        if not experience:
            return ""

        items = ""
        for exp in experience:
            items += f"""
        <div class="experience-item">
            <div class="item-header">
                <span class="item-title">{exp.get('position', 'Position')}</span>
                <span class="item-subtitle">{exp.get('company', 'Company')}</span>
            </div>
            <p class="item-description">{exp.get('description', '')}</p>
        </div>"""

        return f"""
    <div class="section">
        <h2 class="section-title">Experience</h2>
        {items}
    </div>"""

    def _render_education(self, education: list) -> str:
        if not education:
            return ""

        items = ""
        for edu in education:
            items += f"""
        <div class="education-item">
            <div class="item-header">
                <span class="item-title">{edu.get('institution', 'Institution')}</span>
                <span class="item-subtitle">{edu.get('degree', '')} {edu.get('field', '')}</span>
            </div>
        </div>"""

        return f"""
    <div class="section">
        <h2 class="section-title">Education</h2>
        {items}
    </div>"""

    def _render_skills(self, skills: list) -> str:
        if not skills:
            return ""

        items = ""
        for skill in skills:
            items += f'<span class="skill-item">{skill}</span>'

        return f"""
    <div class="section">
        <h2 class="section-title">Skills</h2>
        <div class="skills-list">
            {items}
        </div>
    </div>"""

    def _render_projects(self, projects: list) -> str:
        if not projects:
            return ""

        items = ""
        for project in projects:
            items += f"""
        <div class="project-item">
            <div class="item-header">
                <span class="item-title">{project.get('title', 'Project')}</span>
            </div>
            <p class="item-description">{project.get('description', '')}</p>
        </div>"""

        return f"""
    <div class="section">
        <h2 class="section-title">Projects</h2>
        {items}
    </div>"""

    def _html_to_pdf(self, html_content: str) -> bytes:
        try:
            import weasyprint

            pdf = weasyprint.HTML(string=html_content).write_pdf()
            return pdf
        except ImportError:
            try:
                from reportlab.lib.pagesizes import letter
                from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
                from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
                from reportlab.lib.units import inch

                buffer = io.BytesIO()
                doc = SimpleDocTemplate(buffer, pagesize=letter)
                styles = getSampleStyleSheet()
                story = []

                story.append(Paragraph("Resume", styles['Title']))
                story.append(Spacer(1, 12))

                doc.build(story)
                return buffer.getvalue()
            except ImportError:
                raise ValueError("PDF generation not available. Please install weasyprint or reportlab.")

    def get_filename(self, resume_data: dict) -> str:
        name = resume_data.get("personal_info", {}).get("name", "Resume")
        safe_name = "".join(c for c in name if c.isalnum() or c in (' ', '-', '_')).strip()
        safe_name = safe_name.replace(' ', '_')
        return f"{safe_name}_Resume.pdf"


pdf_service = PDFService()
