"""Live end-to-end test against the real Groq free tier.

Opt in explicitly, because it spends real quota:

    LIVE_AI=1 python -m pytest tests/test_live_generate.py -v -s

Runs the same three parallel calls that POST /ai/generate runs, but stops before
any database write. Verifies that each call validates against its schema, that
three distinct models serve the three calls, and reports token usage.
"""

import asyncio
import os

import pytest

from app.config import settings
from app.infrastructure.ai_errors import AIError
from app.infrastructure.llm_client import llm_router
from app.infrastructure.prompt_builder import bound_raw_text, prompt_builder
from app.infrastructure.response_schemas import (
    ATS_GENERATION_SCHEMA,
    COVER_LETTER_GENERATION_SCHEMA,
    RESUME_GENERATION_SCHEMA,
    structured_format,
)
from app.infrastructure.response_validator import response_validator

pytestmark = [
    pytest.mark.live,
    pytest.mark.skipif(
        os.environ.get("LIVE_AI") != "1",
        reason="set LIVE_AI=1 to spend real provider quota",
    ),
]

RESUME_DATA = {
    "personal_info": {
        "name": "Ada Lovelace",
        "email": "ada@example.com",
        "phone": "+44 20 7946 0000",
        "location": "London, UK",
        "linkedin": "linkedin.com/in/adalovelace",
        "github": "github.com/adalovelace",
    },
    "summary": (
        "Backend engineer with 6 years building Python services and data "
        "pipelines. Comfortable owning a service from schema design through "
        "on-call."
    ),
    "education": [
        {
            "institution": "University of London",
            "degree": "BSc",
            "field": "Computer Science",
            "start_date": "2016",
            "end_date": "2020",
        }
    ],
    "experience": [
        {
            "company": "Northwind Analytics",
            "position": "Senior Backend Engineer",
            "description": "\n".join(
                [
                    "Rebuilt the ingestion pipeline in FastAPI, cutting p99 latency from 2.4s to 380ms.",
                    "Led migration of 40 Postgres tables to partitioned schemas with zero downtime.",
                    "Introduced contract testing across 6 services, dropping production incidents by 38%.",
                ]
            ),
            "start_date": "2022",
            "end_date": "2025",
        },
        {
            "company": "Cobalt Systems",
            "position": "Backend Engineer",
            "description": "\n".join(
                [
                    "Built the billing service handling 12k transactions per day with idempotent writes.",
                    "Cut AWS spend 22% by right-sizing ECS tasks and adding S3 lifecycle policies.",
                    "Wrote the incident runbook that halved mean time to recovery.",
                ]
            ),
            "start_date": "2020",
            "end_date": "2022",
        },
        {
            "company": "Meridian Retail",
            "position": "Software Engineer",
            "description": "\n".join(
                [
                    "Shipped the inventory sync used by 300 stores, replacing a nightly batch job.",
                    "Added integration tests raising backend coverage from 34% to 81%.",
                    "Mentored two junior engineers through their first production releases.",
                ]
            ),
            "start_date": "2018",
            "end_date": "2020",
        },
    ],
    "projects": [
        {
            "title": "OpenLedger",
            "description": "\n".join(
                [
                    "Double-entry ledger library in Python, 3.1k stars and 40k monthly downloads.",
                    "Implemented a double-entry engine with 120 passing property tests.",
                    "Published a plugin API adopted by 14 downstream teams.",
                ]
            ),
            "start_date": "2023",
            "end_date": "2024",
        },
        {
            "title": "QueryGuard",
            "description": "\n".join(
                [
                    "Static analyser that flags unsafe SQL before it reaches production.",
                    "Parses query plans and flags N+1 patterns and missing indexes.",
                    "Caught 60+ regressions in CI across three adopted repositories.",
                ]
            ),
            "start_date": "2022",
            "end_date": "2023",
        },
        {
            "title": "Driftwatch",
            "description": "\n".join(
                [
                    "CLI that diffs database schemas and generates reversible migrations.",
                    "Emits reversible SQL so rollbacks need no manual repair.",
                    "Reduced migration review time by roughly 70% for our team.",
                ]
            ),
            "start_date": "2021",
            "end_date": "2022",
        },
    ],
    "skills": [
        {"category": "Backend", "items": ["Python", "FastAPI", "Django", "SQLAlchemy"]},
        {"category": "Data", "items": ["PostgreSQL", "Redis", "Kafka", "Pandas"]},
        {"category": "Cloud/DevOps", "items": ["AWS", "Docker", "Kubernetes", "Terraform"]},
    ],
    "certifications": ["AWS Certified Solutions Architect - Associate"],
    "languages": ["English (native)", "French (professional)"],
    "achievements": [
        "Reduced production incident count by 38% over two consecutive quarters.",
        "Mentored six engineers, five of whom were promoted within a year.",
    ],
}

JOB_DESCRIPTION = (
    "Senior Backend Engineer at Lumen Health. You will own our patient "
    "encounters service, a Python/FastAPI system processing 4M requests per day "
    "on Kubernetes. We need strong PostgreSQL and AWS experience, comfort with "
    "event-driven design using Kafka or SQS, and a track record of improving "
    "reliability and latency. You will partner with our data team on an "
    "HL7/FHIR ingestion pipeline. Requirements: Python, FastAPI, PostgreSQL, "
    "AWS, Docker, Kubernetes, Kafka, Terraform, observability tooling, and "
    "mentoring."
)

# Used by the target-role-only path. Kept specific on purpose: a vague role such
# as "engineer" gives the model nothing to aim at and is not representative of
# what real users type.
TARGET_ROLE = "Senior Backend Engineer (Python/FastAPI, PostgreSQL, AWS)"


def _call_specs():
    raw_text = bound_raw_text(RESUME_DATA.get("raw_text"), settings.ai_raw_text_max_chars)
    return [
        (
            "resume generation",
            prompt_builder.build_resume_generation_prompt(
                RESUME_DATA, JOB_DESCRIPTION, None, raw_text=raw_text
            ),
            RESUME_GENERATION_SCHEMA,
            # Must match app/services/resume_ai.py: the resume body needs the most
            # room, and 2000 was not enough to finish it.
            3000,
        ),
        (
            "cover letter generation",
            prompt_builder.build_cover_letter_generation_prompt(
                RESUME_DATA, JOB_DESCRIPTION, None, raw_text=raw_text
            ),
            COVER_LETTER_GENERATION_SCHEMA,
            1400,
        ),
        (
            "ATS analysis",
            prompt_builder.build_ats_generation_prompt(
                RESUME_DATA, JOB_DESCRIPTION, None, raw_text=raw_text
            ),
            ATS_GENERATION_SCHEMA,
            1000,
        ),
    ]


def _target_role_only_call_specs():
    """Same artifacts, but with a target role and no job description.

    The reported failure rate for this path was around 90%, and the earlier live
    fixture always supplied a job description, so it never exercised the path
    that was actually broken.
    """
    raw_text = bound_raw_text(RESUME_DATA.get("raw_text"), settings.ai_raw_text_max_chars)
    return [
        (
            "resume generation (target role only)",
            prompt_builder.build_resume_generation_prompt(
                RESUME_DATA, None, TARGET_ROLE, raw_text=raw_text
            ),
            RESUME_GENERATION_SCHEMA,
            3000,
        ),
        (
            "cover letter generation (target role only)",
            prompt_builder.build_cover_letter_generation_prompt(
                RESUME_DATA, None, TARGET_ROLE, raw_text=raw_text
            ),
            COVER_LETTER_GENERATION_SCHEMA,
            1400,
        ),
        (
            "ATS analysis (target role only)",
            prompt_builder.build_ats_generation_prompt(
                RESUME_DATA, None, TARGET_ROLE, raw_text=raw_text
            ),
            ATS_GENERATION_SCHEMA,
            1000,
        ),
    ]


@pytest.mark.asyncio
async def test_three_parallel_calls_succeed_and_validate():
    """The real check: 3 parallel calls, 3 distinct models, all schema-valid."""
    served_by: list[str] = []
    original = llm_router._complete

    async def recording_complete(slot, system_prompt, user_prompt, fmt, max_completion):
        served_by.append(slot.name)
        return await original(slot, system_prompt, user_prompt, fmt, max_completion)

    llm_router._complete = recording_complete

    async def run_one(context, prompt, schema, max_output):
        system_prompt, user_prompt = prompt
        raw = await llm_router.chat(
            system_prompt,
            user_prompt,
            response_format=structured_format(context.replace(" ", "_"), schema),
            max_output_tokens=max_output,
        )
        from app.infrastructure.response_parser import response_parser

        parsed = response_parser.parse_json(raw)
        return context, response_validator.validate_payload(parsed, schema, context)

    try:
        results = await asyncio.gather(
            *(run_one(*spec) for spec in _call_specs()), return_exceptions=True
        )
    finally:
        llm_router._complete = original

    failures = [r for r in results if isinstance(r, BaseException)]
    if failures:
        for f in failures:
            print(f"FAILURE: {type(f).__name__}: {f}")
        raise AssertionError(f"{len(failures)} of 3 calls failed") from failures[0]

    payloads = dict(results)
    print("\n--- live results ---")
    for model in served_by:
        print(f"  served by: {model}")
    for context, _ in results:
        print(f"  validated: {context}")
    assert len(served_by) == 3
    assert len(set(served_by)) == 3, f"expected 3 distinct models, got {served_by}"

    # Spot-check real output quality.
    letter = payloads["cover letter generation"]["content"]
    words = len(letter.split())
    print(f"  cover letter words: {words}")
    assert 350 <= words <= 650, f"cover letter length off at {words} words"
    assert "Lumen" in letter, "cover letter should name the company from the JD"

    keywords = payloads["resume generation"]["keywords_extracted"]
    assert len(keywords) >= 8, f"expected a real keyword list, got {len(keywords)}"
    print(f"  keywords extracted: {len(keywords)}")

    resume = payloads["resume generation"]["resume_data"]
    skills = resume["skills"]
    assert isinstance(skills, list) and skills
    assert all(isinstance(g, dict) and "category" in g for g in skills)
    print(f"  skill groups: {len(skills)}")

    ats = payloads["ATS analysis"]
    assert 0 <= ats["previous_score"] <= 100
    print(f"  previous_score: {ats['previous_score']}")


@pytest.mark.asyncio
async def test_target_role_only_generation_succeeds_and_validates():
    """Reproduces the path that failed ~90% of the time for real users.

    Every previous live run supplied a job description. With only a target role
    the prompts carry no employer, no responsibilities list and no requirement
    bullets, which is a materially different and previously untested prompt.
    """
    served_by: list[str] = []
    original = llm_router._complete

    async def recording_complete(slot, system_prompt, user_prompt, fmt, max_completion):
        served_by.append(slot.name)
        return await original(slot, system_prompt, user_prompt, fmt, max_completion)

    llm_router._complete = recording_complete

    async def run_one(context, prompt, schema, max_output):
        system_prompt, user_prompt = prompt
        raw = await llm_router.chat(
            system_prompt,
            user_prompt,
            response_format=structured_format(
                context.replace(" ", "_").replace("(", "").replace(")", ""), schema
            ),
            max_output_tokens=max_output,
        )
        from app.infrastructure.response_parser import response_parser

        parsed = response_parser.parse_json(raw)
        return context, response_validator.validate_payload(parsed, schema, context)

    specs = _target_role_only_call_specs()
    try:
        results = await asyncio.gather(
            *(run_one(*spec) for spec in specs), return_exceptions=True
        )
    finally:
        llm_router._complete = original

    failures = [r for r in results if isinstance(r, BaseException)]
    if failures:
        for f in failures:
            # Report the real, code-level cause so the failure is diagnosable
            # rather than just "generation failed".
            if isinstance(f, AIError):
                print(f"FAILURE [{f.code}]: {f.message}")
                print(f"  provider_code={f.provider_code!r} status={f.provider_status}")
                print(f"  path={f.path or '-'} missing={f.missing or '-'}")
                print(f"  reason={f.reason}")
            else:
                print(f"FAILURE: {type(f).__name__}: {f}")
        raise AssertionError(f"{len(failures)} of {len(specs)} calls failed") from failures[0]

    payloads = dict(results)
    print("\n--- target role only ---")
    for model in served_by:
        print(f"  served by: {model}")
    assert len(set(served_by)) == 3, f"expected 3 distinct models, got {served_by}"

    resume = payloads["resume generation (target role only)"]["resume_data"]
    # The section that the 400 blamed for missing content must actually be there.
    for field in ("experience", "projects", "certifications", "languages"):
        assert resume.get(field), f"resume_data.{field} missing or empty"
    print(f"  resume sections present: {sorted(resume)}")

    keywords = payloads["resume generation (target role only)"]["keywords_extracted"]
    assert 0 < len(keywords) <= settings.ai_max_keywords
    print(f"  keywords extracted: {len(keywords)} (cap {settings.ai_max_keywords})")

    letter = payloads["cover letter generation (target role only)"]["content"]
    assert letter.startswith("Dear")
    print(f"  cover letter words: {len(letter.split())}")


@pytest.mark.asyncio
async def test_repeated_generation_degrades_gracefully():
    """Back-to-back runs on the free tier must fail cleanly, never badly.

    One generate costs roughly 17k aggregate tokens against ~24k/min of pool
    budget, so a second run inside the same minute legitimately exhausts every
    model. The contract is not "always succeeds" but: either it succeeds, or it
    raises RateLimitExhaustedError, which the API maps to a 429 with
    Retry-After. A provider 400, a schema error, or an unhandled exception here
    would be a real regression.
    """
    from app.infrastructure.llm_client import RateLimitExhaustedError

    outcomes: list[str] = []

    for run in range(2):
        async def run_one(context, prompt, schema, max_output):
            system_prompt, user_prompt = prompt
            raw = await llm_router.chat(
                system_prompt,
                user_prompt,
                response_format=structured_format(context.replace(" ", "_"), schema),
                max_output_tokens=max_output,
            )
            from app.infrastructure.response_parser import response_parser

            return response_validator.validate_payload(
                response_parser.parse_json(raw), schema, context
            )

        results = await asyncio.gather(
            *(run_one(*spec) for spec in _call_specs()), return_exceptions=True
        )
        unexpected = [
            r
            for r in results
            if isinstance(r, BaseException) and not isinstance(r, RateLimitExhaustedError)
        ]
        if unexpected:
            for f in unexpected:
                print(f"run {run} UNEXPECTED {type(f).__name__}: {f}")
            raise AssertionError(
                f"run {run}: {len(unexpected)} call(s) failed in a way the API "
                f"does not handle: {[type(f).__name__ for f in unexpected]}"
            )
        rate_limited = [r for r in results if isinstance(r, RateLimitExhaustedError)]
        for r in rate_limited:
            # The API copies this into the Retry-After header on a 429.
            assert r.retry_after is not None and r.retry_after > 0, (
                "a rate-limited call must carry a positive retry_after so the "
                "client can be told when to come back"
            )
        outcomes.append(f"run {run}: {len(results) - len(rate_limited)} ok, "
                        f"{len(rate_limited)} cleanly rate limited")

    now = __import__("time").monotonic()
    print("\n--- repeat-run outcomes ---")
    for line in outcomes:
        print(f"  {line}")
    for name, slot in llm_router.slots.items():
        print(
            f"  {name:24s} used {slot.spent_this_minute:5d} / {slot.tpm_limit} TPM"
            f"  cooling={slot.cooldown_until > now}"
        )

    # Note there is no "first run must fully succeed" assertion: this file shares
    # one provider quota with the test above, so which models are still in budget
    # depends on how recently they ran. The invariant is that the pool always
    # answers with a value the API can turn into a response, and that exhaustion
    # is reported as a retryable 429 rather than a provider or schema failure.
    assert sum(int(o.split(": ")[1].split(" ok")[0]) for o in outcomes) >= 1, (
        "no call succeeded in either run; the pool looks misconfigured"
        + "; ".join(outcomes)
    )
