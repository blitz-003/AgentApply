"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";

const roles = [
  "Senior Frontend Developer",
  "Product Manager",
  "Data Scientist",
  "Growth Marketing Lead",
];

const keywordSets: Record<string, string[]> = {
  "Senior Frontend Developer": ["React", "TypeScript", "Next.js", "Testing"],
  "Product Manager": ["Roadmapping", "Stakeholders", "SQL", "OKRs"],
  "Data Scientist": ["Python", "ML", "A/B Testing", "SQL"],
  "Growth Marketing Lead": ["SEO", "CAC", "Conversion", "Analytics"],
};

function useTypingEffect() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = roles[roleIndex];
    if (!deleting && typed === current) {
      const t = setTimeout(() => setDeleting(true), 2200);
      return () => clearTimeout(t);
    }
    if (deleting && typed === "") {
      const t = setTimeout(() => {
        setDeleting(false);
        setRoleIndex((i) => (i + 1) % roles.length);
      }, 50);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => {
        setTyped(
          deleting
            ? current.slice(0, typed.length - 1)
            : current.slice(0, typed.length + 1),
        );
      },
      deleting ? 40 : 75,
    );
    return () => clearTimeout(t);
  }, [typed, deleting, roleIndex]);

  return { typed, keywords: keywordSets[roles[roleIndex]] ?? [] };
}

function useScoreAnimation(target: number, duration = 2600) {
  const [score, setScore] = useState(54);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setScore(Math.round(54 + (target - 54) * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return score;
}

export function Hero() {
  const { isAuthenticated } = useAuth();
  const { typed, keywords } = useTypingEffect();
  const score = useScoreAnimation(96);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;

  return (
    <section className="bg-canvas">
      <div className="mx-auto grid max-w-[1280px] items-center gap-14 px-6 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-hairline px-3 py-1 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            AI-Powered Resume Builder
          </span>
          <h1 className="mt-6 max-w-xl text-4xl font-bold leading-[1.1] tracking-tight text-ink md:text-5xl">
            Resumes that get you the{" "}
            <span className="text-primary">interview</span>.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-body md:text-lg">
            Paste a job description, upload your resume, and let AI tailor your
            resume and cover letter to the exact role — with a live ATS score
            before you ever hit send.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href={isAuthenticated ? "/dashboard" : "/register"}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-base font-medium text-white transition-colors hover:bg-primary-active"
            >
              Build My Resume
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex h-12 items-center rounded-sm border border-ink px-7 text-base font-medium text-ink transition-colors hover:bg-surface-soft"
            >
              See how it works
            </Link>
          </div>
          <div className="mt-10 flex items-center gap-8">
            <div>
              <div className="text-2xl font-bold text-ink">12k+</div>
              <div className="text-sm text-muted">resumes optimized</div>
            </div>
            <div className="h-10 w-px bg-hairline" />
            <div>
              <div className="text-2xl font-bold text-ink">3.8x</div>
              <div className="text-sm text-muted">more interview replies</div>
            </div>
            <div className="h-10 w-px bg-hairline" />
            <div>
              <div className="text-2xl font-bold text-ink">4.9/5</div>
              <div className="text-sm text-muted">user rating</div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-md bg-white p-1 shadow-card">
            <div className="flex items-center gap-1.5 rounded-t-sm bg-surface-strong px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-hairline" />
              <span className="h-2.5 w-2.5 rounded-full bg-hairline" />
              <span className="h-2.5 w-2.5 rounded-full bg-hairline" />
              <span className="ml-3 text-xs text-muted-soft">
                resume-preview.pdf
              </span>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-bold text-ink">Jordan Lee</div>
                  <div className="text-sm text-muted">
                    Product-minded engineer
                  </div>
                </div>
                <div className="relative h-28 w-28 shrink-0">
                  <svg
                    className="h-28 w-28 -rotate-90"
                    viewBox="0 0 120 120"
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="none"
                      stroke="#f2f2f2"
                      strokeWidth="9"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="none"
                      stroke="#ff385c"
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={
                        circumference - (circumference * score) / 100
                      }
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-ink">
                      {score}%
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted">
                      ATS score
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 rounded-full border border-hairline bg-canvas px-4 py-3 shadow-card">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z"
                    />
                  </svg>
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                    Targeting
                  </div>
                  <div className="truncate text-sm font-medium text-ink">
                    {typed}
                    <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-primary" />
                  </div>
                </div>
              </div>

              <div className="mt-4 min-h-[72px] space-y-2">
                {[
                  "Built design systems used by 40+ engineers",
                  "Cut CI pipeline time by 38% with smarter caching",
                  "Led migration from REST to tRPC across 3 teams",
                ].map((bullet, i) => (
                  <div
                    key={bullet}
                    className="flex items-start gap-2 text-sm text-body"
                    style={{ opacity: 1 - i * 0.15 }}
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {bullet}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {keywords.map((kw, i) => (
                  <span
                    key={kw}
                    className="animate-fade-in rounded-full bg-primary-disabled/40 px-3 py-1 text-xs font-medium text-primary-active"
                    style={{ animationDelay: `${i * 200}ms` }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
