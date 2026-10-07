import html
import re

# Single-page A4 layout rules, matching the frontend renderer.
PAGE_SIZE = "A4"
MARGIN_TOP = "12.7mm"  # 0.5in
MARGIN_SIDE = "12.7mm"  # 0.5in
MARGIN_BOTTOM = "8.89mm"  # 0.35in

SUMMARY_MAX_SENTENCES = 3
SKILLS_MAX_ROWS = 3
SKILLS_STRONG_CATEGORIES = 2
OTHERS_CATEGORY = "Others"
CATCH_ALL_CATEGORIES = (OTHERS_CATEGORY, "Suggested")
ACHIEVEMENTS_MAX = 2
CERTIFICATIONS_MAX = 2
EXPERIENCE_MAX = 4
PROJECTS_MAX = 3
EDUCATION_MAX = 3
LANGUAGES_MAX = 3
# Single-line hard clip; overflow is cut rather than wrapped.
CLIP_CHARS = 90


def clamp_sentences(text: str, max_sentences: int) -> str:
    """Keep the first n sentences, guarding abbreviations and decimals."""
    normalized = re.sub(r"\s+", " ", text or "").strip()
    if not normalized:
        return ""
    guarded = re.sub(
        r"\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|Inc|Ltd|Co|vs|etc|e\.g|i\.e)\.",
        r"\1<DOT>",
        normalized,
        flags=re.IGNORECASE,
    )
    guarded = re.sub(r"(\d)\.(\d)", r"\1<DOT>\2", guarded)
    parts = re.split(r"(?<=[.!?])\s+", guarded)
    kept = [p.replace("<DOT>", ".").strip() for p in parts[:max_sentences]]
    result = " ".join(k for k in kept if k).strip()
    if result and not result.endswith((".", "!", "?")):
        result += "."
    return result


def clip_to_single_line(value: object, limit: int = CLIP_CHARS) -> str:
    """Collapse whitespace and hard clip so the text occupies exactly one line."""
    return re.sub(r"\s+", " ", str(value or "")).strip()[:limit]


def _as_text_list(values: object, limit: int) -> list[str]:
    """Flatten the string and {field: value} shapes the API allows."""
    out: list[str] = []
    if not isinstance(values, list):
        return out
    for value in values:
        if isinstance(value, str):
            text = value.strip()
        elif isinstance(value, dict):
            parts = [
                str(value.get(key, "")).strip()
                for key in ("name", "language", "issuer", "title")
                if value.get(key)
            ]
            if value.get("proficiency"):
                parts.append(str(value["proficiency"]))
            if value.get("date"):
                parts.append(str(value["date"]))
            text = " | ".join(p for p in parts if p)
        else:
            text = str(value or "").strip()
        if text:
            out.append(text)
        if len(out) >= limit:
            break
    return out


def compact_skill_groups(skills: object) -> list[tuple[str, list[str]]]:
    """Reduce skills to the two strongest categories plus an "Others" bucket.

    Grouped and flat shapes are both accepted, matching what the frontend
    renderer accepts.
    """
    flat: list[tuple[str, str]] = []
    if isinstance(skills, list):
        for entry in skills:
            if isinstance(entry, str):
                name = entry.strip()
                if name:
                    flat.append((name, ""))
            elif isinstance(entry, dict):
                category = str(entry.get("category", "")).strip()
                for item in entry.get("items", []) or []:
                    name = str(item or "").strip()
                    if name:
                        flat.append((name, category))

    if not flat:
        return []

    # Fold the legacy catch-all name into "Others" so an older resume does not
    # render two near-duplicate bucket headings.
    flat = [
        (name, OTHERS_CATEGORY if category in CATCH_ALL_CATEGORIES else category)
        for name, category in flat
    ]

    counts: dict[str, int] = {}
    for _, category in flat:
        key = category or OTHERS_CATEGORY
        counts[key] = counts.get(key, 0) + 1

    ranked = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    strong = [name for name, _ in ranked if name != OTHERS_CATEGORY][
        :SKILLS_STRONG_CATEGORIES
    ]
    rest = [name for name, _ in ranked if name not in strong]

    groups = [(category, [n for n, c in flat if c == category]) for category in strong]
    if rest:
        groups.append(
            (
                OTHERS_CATEGORY,
                [
                    n
                    for n, c in flat
                    if (c or OTHERS_CATEGORY) in rest
                ],
            )
        )
    return groups[:SKILLS_MAX_ROWS]


class PDFService:
    def generate_pdf(self, resume_data: dict, template_id: str | None = None) -> bytes:
        html_content = self._render_html(resume_data, template_id)
        return self._html_to_pdf(html_content)

    def _render_html(self, resume_data: dict, template_id: str | None = None) -> str:
        personal_info = resume_data.get("personal_info", {})
        # Compact the content before rendering so the document fits one page by
        # construction rather than by cropping.
        summary = clamp_sentences(resume_data.get("summary", ""), SUMMARY_MAX_SENTENCES)
        experience = (resume_data.get("experience") or [])[:EXPERIENCE_MAX]
        education = (resume_data.get("education") or [])[:EDUCATION_MAX]
        skills = compact_skill_groups(resume_data.get("skills", []))
        projects = (resume_data.get("projects") or [])[:PROJECTS_MAX]
        achievements = _as_text_list(resume_data.get("achievements"), ACHIEVEMENTS_MAX)
        languages = _as_text_list(resume_data.get("languages"), LANGUAGES_MAX)
        certifications = _as_text_list(
            resume_data.get("certifications"), CERTIFICATIONS_MAX
        )

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume</title>
    <style>
        /* A4 with the required margins, enforced as a real page box so the
           renderer paginates to this geometry instead of an implicit one. */
        @page {{
            size: {PAGE_SIZE};
            margin: {MARGIN_TOP} {MARGIN_SIDE} {MARGIN_BOTTOM} {MARGIN_SIDE};
        }}
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        html, body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.25;
            color: #333;
        }}
        body {{
            width: 100%;
        }}
        /* Single-line items are hard clipped rather than wrapped onto a second
           line, and ellipsis-free as required. */
        .single-line {{
            white-space: nowrap;
            overflow: hidden;
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
        .item-dates {{
            font-size: 12px;
            color: #6b7280;
            margin-top: 2px;
        }}
        .skills-list {{
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }}
        .skill-group {{
            margin-bottom: 10px;
        }}
        .skill-group:last-child {{
            margin-bottom: 0;
        }}
        .skill-category {{
            display: block;
            font-size: 12px;
            font-weight: 600;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin-bottom: 5px;
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
        <h1>{html.escape(personal_info.get('name', 'Your Name'))}</h1>
        <div class="contact-info">
            {f'<span>{html.escape(personal_info.get("email", ""))}</span>' if personal_info.get('email') else ''}
            {f'<span>{html.escape(personal_info.get("phone", ""))}</span>' if personal_info.get('phone') else ''}
            {f'<span>{html.escape(personal_info.get("location", ""))}</span>' if personal_info.get('location') else ''}
            {f'<span>{html.escape(personal_info.get("linkedin", ""))}</span>' if personal_info.get('linkedin') else ''}
            {f'<span>{html.escape(personal_info.get("github", ""))}</span>' if personal_info.get('github') else ''}
        </div>
    </div>

    {self._render_summary(summary)}
    {self._render_experience(experience)}
    {self._render_education(education)}
    {self._render_skills(skills)}
    {self._render_projects(projects)}
    {self._render_achievements(achievements)}
    {self._render_languages(languages)}
    {self._render_certifications(certifications)}
</body>
</html>"""

        return html_content

    def _render_summary(self, summary: str) -> str:
        if not summary:
            return ""
        return f"""
    <div class="section">
        <h2 class="section-title">Professional Summary</h2>
        <p class="summary">{html.escape(summary)}</p>
    </div>"""

    def _render_experience(self, experience: list) -> str:
        if not experience:
            return ""

        items = ""
        for exp in experience:
            date_range = ""
            start = exp.get('start_date', '')
            end = exp.get('end_date', '')
            if start or end:
                date_range = f'<div class="item-dates">{html.escape(start)}{(" - " + html.escape(end)) if start and end else (" - " + html.escape(end) if end else "")}</div>'
            items += f"""
        <div class="experience-item">
            <div class="item-header">
                <span class="item-title">{html.escape(exp.get('position', 'Position'))}</span>
                <span class="item-subtitle">{html.escape(exp.get('company', 'Company'))}</span>
            </div>
            {date_range}
            <p class="item-description">{html.escape(exp.get('description', ''))}</p>
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
                <span class="item-title">{html.escape(edu.get('institution', 'Institution'))}</span>
                <span class="item-subtitle">{html.escape(edu.get('degree', ''))} {html.escape(edu.get('field', ''))}</span>
            </div>
        </div>"""

        return f"""
    <div class="section">
        <h2 class="section-title">Education</h2>
        {items}
    </div>"""

    def _render_skills(self, skills: list) -> str:
        """Render at most the two strongest categories plus "Others".

        compact_skill_groups has already normalised the grouped and flat shapes,
        so this only lays out the resulting rows.
        """
        if not skills:
            return ""

        blocks = ""
        for category, items in skills:
            if not items:
                continue
            chips = "".join(
                f'<span class="skill-item">{html.escape(str(v))}</span>' for v in items
            )
            blocks += f"""
        <div class="skill-group single-line">
            <span class="skill-category">{html.escape(category)}:</span>
            <div class="skills-list">{chips}</div>
        </div>"""

        if not blocks:
            return ""

        return f"""
    <div class="section">
        <h2 class="section-title">Technical Skills</h2>
        {blocks}
    </div>"""

    def _render_achievements(self, achievements: list) -> str:
        """At most two points, each hard clipped to a single line."""
        achievements = _as_text_list(achievements, ACHIEVEMENTS_MAX)
        if not achievements:
            return ""
        items = "".join(
            f'<div class="single-line">&bull; {html.escape(clip_to_single_line(a))}</div>'
            for a in achievements
        )
        return f"""
    <div class="section">
        <h2 class="section-title">Achievements</h2>
        {items}
    </div>"""

    def _render_languages(self, languages: list) -> str:
        languages = _as_text_list(languages, LANGUAGES_MAX)
        if not languages:
            return ""
        joined = html.escape(clip_to_single_line(" | ".join(languages)))
        return f"""
    <div class="section">
        <h2 class="section-title">Languages</h2>
        <div class="single-line">{joined}</div>
    </div>"""

    def _render_certifications(self, certifications: list) -> str:
        """All certifications on one line, hard clipped, at most two."""
        certifications = _as_text_list(certifications, CERTIFICATIONS_MAX)
        if not certifications:
            return ""
        joined = html.escape(clip_to_single_line(" | ".join(certifications)))
        return f"""
    <div class="section">
        <h2 class="section-title">Certifications</h2>
        <div class="single-line">{joined}</div>
    </div>"""

    def _render_projects(self, projects: list) -> str:
        if not projects:
            return ""

        items = ""
        for project in projects:
            date_range = ""
            start = project.get('start_date', '')
            end = project.get('end_date', '')
            if start or end:
                date_range = f'<div class="item-dates">{html.escape(start)}{(" - " + html.escape(end)) if start and end else (" - " + html.escape(end) if end else "")}</div>'
            items += f"""
        <div class="project-item">
            <div class="item-header">
                <span class="item-title">{html.escape(project.get('title', 'Project'))}</span>
            </div>
            {date_range}
            <p class="item-description">{html.escape(project.get('description', ''))}</p>
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
            raise ValueError("PDF generation not available. Please install weasyprint.")

    def get_filename(self, resume_data: dict) -> str:
        name = resume_data.get("personal_info", {}).get("name", "Resume")
        safe_name = "".join(c for c in name if c.isalnum() or c in (' ', '-', '_')).strip()
        safe_name = safe_name.replace(' ', '_')
        return f"{safe_name}_Resume.pdf"


pdf_service = PDFService()
