"""The cover-letter prompts must forbid opening with a header echo.

The live suite asserts the letter literally starts with "Dear". A model can
still emit schema-valid but stylistically broken output (echoing the resume
header above the salutation), so each prompt that produces a letter must
explicitly require the very first line to start with "Dear". These tests lock
that instruction in so the prompt can never silently regress to a generic
"open with a salutation".
"""

from app.infrastructure.prompt_builder import (
    COVER_LETTER_CLOSING_RULE,
    COVER_LETTER_OPENING_RULE,
    prompt_builder,
)

FAKE_RESUME = {"personal_info": {"name": "Ada Lovelace", "email": "ada@example.com"}}
JD = "Backend Engineer creating reliable services with FastAPI and PostgreSQL."


def _letters_vs_rule(rule: str) -> list[tuple[str, str]]:
    """Return (label, combined prompt) for every branch that writes a letter."""
    letters = [
        (
            "generate (JD)",
            prompt_builder.build_generate_prompt(
                FAKE_RESUME, JD, None, raw_text=None
            ),
        ),
        (
            "generate (target role)",
            prompt_builder.build_generate_prompt(
                FAKE_RESUME, None, "Backend Engineer", raw_text=None
            ),
        ),
        (
            "generate (raw upload)",
            prompt_builder.build_generate_prompt(
                FAKE_RESUME, JD, None, raw_text="Some extracted resume text."
            ),
        ),
        (
            "cover letter separate",
            prompt_builder.build_cover_letter_generation_prompt(
                FAKE_RESUME, JD, None
            ),
        ),
        (
            "cover letter targeted",
            prompt_builder.build_cover_letter_prompt(
                FAKE_RESUME, "Example Corp", "Backend Engineer", JD
            ),
        ),
    ]
    return [(label, system + " " + user) for label, (system, user) in letters]


def test_every_letter_prompt_requires_a_dear_opening():
    for label, prompt in _letters_vs_rule(COVER_LETTER_OPENING_RULE):
        assert "MUST start with the word 'Dear'" in prompt, label
        assert "NEVER begin the letter with the candidate's name" in prompt, label


def test_rule_text_locks_the_deal():
    """The shared rule itself must not lose its hard constraints."""
    assert "The very FIRST line of the letter MUST start with the word 'Dear'" in (
        COVER_LETTER_OPENING_RULE
    )
    assert "resume-header echo" in COVER_LETTER_OPENING_RULE
    assert "directly with 'Dear'" in COVER_LETTER_OPENING_RULE


def test_every_letter_prompt_requires_the_closing_block():
    for label, prompt in _letters_vs_rule(COVER_LETTER_CLOSING_RULE):
        assert "final 4 rows" in prompt, label
        assert "'Yours sincerely,' on its own line" in prompt, label
        assert "candidate's full name" in prompt, label
        assert "current position/title" in prompt, label


def test_every_letter_prompt_targets_450_words():
    for label, prompt in _letters_vs_rule("450"):
        assert "total" in prompt and "450" in prompt, label
        assert "1200" not in prompt, label
        assert "700" not in prompt, label