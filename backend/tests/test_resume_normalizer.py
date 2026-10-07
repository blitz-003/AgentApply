"""Tests for skills normalization and PDF rendering across both shapes."""

from app.services.pdf_service import (
    _as_text_list,
    clamp_sentences,
    clip_to_single_line,
    compact_skill_groups,
    pdf_service,
)
from app.services.resume_normalizer import resume_normalizer


class TestNormalizeSkills:
    def test_grouped_skills_pass_through(self):
        out = resume_normalizer.normalize_to_dict(
            {"skills": [
                {"category": "Frontend", "items": ["React", "TypeScript"]},
                {"category": "Backend", "items": ["Python"]},
            ]}
        )
        assert out["skills"] == [
            {"category": "Frontend", "items": ["React", "TypeScript"]},
            {"category": "Backend", "items": ["Python"]},
        ]

    def test_flat_skills_are_grouped_not_dropped(self):
        out = resume_normalizer.normalize_to_dict({"skills": ["React", "Python"]})
        assert out["skills"] == [{"category": "Skills", "items": ["React", "Python"]}]

    def test_mixed_shapes_keep_every_item(self):
        out = resume_normalizer.normalize_to_dict(
            {"skills": ["Loose", {"category": "Cloud", "items": ["AWS"]}]}
        )
        items = [i for g in out["skills"] for i in g["items"]]
        assert sorted(items) == ["AWS", "Loose"]

    def test_flat_and_default_group_merge(self):
        out = resume_normalizer.normalize_to_dict(
            {"skills": ["React", {"category": "Skills", "items": ["Redux"]}]}
        )
        groups = [g for g in out["skills"] if g["category"] == "Skills"]
        assert len(groups) == 1
        assert sorted(groups[0]["items"]) == ["React", "Redux"]

    def test_missing_category_defaults(self):
        out = resume_normalizer.normalize_to_dict(
            {"skills": [{"items": ["GraphQL"]}]}
        )
        assert out["skills"] == [{"category": "Skills", "items": ["GraphQL"]}]

    def test_duplicates_removed(self):
        out = resume_normalizer.normalize_to_dict(
            {"skills": [
                {"category": "Frontend", "items": ["React", "React"]},
                {"category": "Frontend", "items": ["React", "Vue"]},
            ]}
        )
        assert out["skills"] == [{"category": "Frontend", "items": ["React", "Vue"]}]

    def test_junk_entries_are_discarded(self):
        out = resume_normalizer.normalize_to_dict(
            {"skills": [None, 42, {"category": "Empty", "items": []}, ""]}
        )
        assert out["skills"] == []

    def test_non_list_input_is_safe(self):
        assert resume_normalizer.normalize_to_dict({"skills": "nope"})["skills"] == []
        assert resume_normalizer.normalize_to_dict({})["skills"] == []

    def test_non_dict_payload_is_safe(self):
        assert resume_normalizer.normalize_to_dict(None)["skills"] == []


class TestNormalizeNoFieldLoss:
    def test_all_fields_survive(self):
        payload = {
            "personal_info": {"name": "Ada", "email": "a@b.c", "phone": "1",
                              "location": "X", "linkedin": "li", "github": "gh"},
            "summary": "S",
            "experience": [{"company": "C", "position": "P", "description": "d",
                            "start_date": "2022", "end_date": "2024"}],
            "projects": [{"title": "T", "description": "d",
                          "start_date": "2023", "end_date": "2024"}],
            "education": [{"institution": "U", "degree": "BSc", "field": "CS",
                           "start_date": "2020", "end_date": "2024"}],
            "skills": [{"category": "Frontend", "items": ["React"]}],
            "certifications": ["AWS SAA"],
            "languages": ["English"],
            "achievements": ["A1", "A2"],
        }
        out = resume_normalizer.normalize_to_dict(payload)
        assert set(out) == set(payload)

    def test_dates_are_preserved(self):
        """Regression: the old normalizer dropped start_date and end_date."""
        out = resume_normalizer.normalize_to_dict(
            {
                "experience": [{"company": "C", "start_date": "2022", "end_date": "2024"}],
                "projects": [{"title": "T", "start_date": "2023", "end_date": "2024"}],
            }
        )
        assert out["experience"][0]["start_date"] == "2022"
        assert out["experience"][0]["end_date"] == "2024"
        assert out["projects"][0]["start_date"] == "2023"
        assert out["projects"][0]["end_date"] == "2024"

    def test_certifications_languages_achievements_are_kept(self):
        """Regression: these were omitted entirely by the old normalizer."""
        out = resume_normalizer.normalize_to_dict(
            {"certifications": ["AWS"], "languages": ["English"], "achievements": ["A1"]}
        )
        assert out["certifications"] == ["AWS"]
        assert out["languages"] == ["English"]
        assert out["achievements"] == ["A1"]


class TestRenderSkills:
    def test_grouped_renders_categories(self):
        html = pdf_service._render_skills(
            compact_skill_groups([{"category": "Frontend", "items": ["React", "TypeScript"]}])
        )
        assert "Frontend" in html
        assert "React" in html
        assert "TypeScript" in html

    def test_flat_renders_without_crashing(self):
        """Regression: this raised AttributeError on a grouped dict."""
        html = pdf_service._render_skills(compact_skill_groups(["React", "Python"]))
        assert "React" in html and "Python" in html

    def test_empty_returns_blank(self):
        assert pdf_service._render_skills(compact_skill_groups([])) == ""

    def test_grouped_with_empty_items_is_skipped(self):
        html = pdf_service._render_skills(
            compact_skill_groups([{"category": "Empty", "items": []}])
        )
        assert html == ""

    def test_html_is_escaped(self):
        html = pdf_service._render_skills(
            compact_skill_groups(
                [{"category": "<script>", "items": ["<img onerror=x>"]}]
            )
        )
        assert "<script>" not in html
        assert "&lt;script&gt;" in html
        assert "<img" not in html

    def test_skills_normalized_before_render_never_crash(self):
        """Every tolerated input shape must render without raising."""
        for payload in (
            {"skills": ["React"]},
            {"skills": [{"category": "FE", "items": ["React"]}]},
            {"skills": ["Loose", {"category": "BE", "items": ["Python"]}]},
            {"skills": []},
        ):
            skills = resume_normalizer.normalize_to_dict(payload)["skills"]
            pdf_service._render_skills(compact_skill_groups(skills))

    def test_raw_mixed_skills_do_not_drop_flat_entries(self):
        """Export reads stored resume_data directly, before normalization.

        Normalizing first hides this, so compact a mixed list raw and assert the
        flat entries survive alongside the grouped ones.
        """
        html = pdf_service._render_skills(
            compact_skill_groups(
                [
                    {"category": "Backend", "items": ["Python", "FastAPI"]},
                    "React",
                    {"category": "Tools", "items": ["Docker"]},
                ]
            )
        )
        for expected in ("Python", "FastAPI", "React", "Docker", "Backend", "Tools"):
            assert expected in html, f"{expected} was dropped from the PDF"
        # Two strongest categories plus the "Others" bucket holding React/Docker.
        assert html.count("skill-category") == 3
        assert "Others" in html

    def test_flat_skills_merge_into_existing_default_group(self):
        """A flat entry lands in the catch-all bucket, not a duplicate heading."""
        html = pdf_service._render_skills(
            compact_skill_groups([{"category": "Skills", "items": ["Python"]}, "React"])
        )
        assert html.count("skill-category") == 2
        assert "React" in html


class TestCompactSkillGroups:
    def test_keeps_two_strongest_categories_plus_others(self):
        groups = compact_skill_groups(
            [
                {"category": "A", "items": ["a1", "a2", "a3"]},
                {"category": "B", "items": ["b1", "b2", "b3"]},
                {"category": "C", "items": ["c1", "c2", "c3"]},
                {"category": "D", "items": ["d1"]},
            ]
        )
        assert [c for c, _ in groups] == ["A", "B", "Others"]

    def test_never_exceeds_three_rows(self):
        groups = compact_skill_groups(
            [
                {"category": chr(65 + i), "items": [f"{i}a", f"{i}b", f"{i}c"]}
                for i in range(6)
            ]
        )
        assert len(groups) <= 3

    def test_legacy_suggested_category_is_treated_as_others(self):
        groups = compact_skill_groups(
            [
                {"category": "Backend", "items": ["Python"]},
                {"category": "Suggested", "items": ["Rust"]},
            ]
        )
        names = [c for c, _ in groups]
        assert "Suggested" not in names
        assert "Others" in names

    def test_flat_only_input_is_kept(self):
        groups = compact_skill_groups(["React", "Python"])
        assert all("React" in items for _, items in groups)
        assert all("Python" in items for _, items in groups)


class TestSinglePageLimits:
    def test_summary_keeps_three_sentences(self):
        text = clamp_sentences("One. Two. Three. Four. Five.", 3)
        assert text.count(".") == 3
        assert "Four" not in text

    def test_summary_guards_abbreviations_and_decimals(self):
        text = clamp_sentences("Worked at Dr. Smith Inc. on Python 3.11 tooling.", 3)
        assert "Dr. Smith Inc." in text
        assert "3.11" in text

    def test_clip_is_hard_and_has_no_ellipsis(self):
        clipped = clip_to_single_line("x" * 300)
        assert len(clipped) == 90
        assert "..." not in clipped

    def test_text_list_limit_and_object_shapes(self):
        values = _as_text_list(
            ["AWS", {"name": "Azure", "date": "2024"}, "GCP", "Extra"], 2
        )
        assert len(values) == 2
        assert "Azure | 2024" in values[1]

    def test_achievements_capped_at_two_single_lines(self):
        html = pdf_service._render_achievements(["a" * 200, "b" * 200, "third"])
        assert html.count("&bull;") == 2
        assert "third" not in html
        assert "..." not in html
        assert html.count("single-line") == 2

    def test_certifications_render_on_one_line_capped_at_two(self):
        html = pdf_service._render_certifications(["AWS", "Azure", "GCP"])
        # One section wrapper plus exactly one line of content.
        assert html.count("<div") == 2
        assert html.count("single-line") == 1
        assert "AWS | Azure" in html
        assert "GCP" not in html

    def test_languages_render_on_one_line_capped_at_three(self):
        html = pdf_service._render_languages(["English", "French", "German", "Spanish"])
        assert "Spanish" not in html

    def test_page_box_uses_a4_with_required_margins(self):
        out = pdf_service._render_html({"personal_info": {"name": "Ada"}})
        assert "size: A4" in out
        assert "12.7mm 12.7mm 8.89mm 12.7mm" in out