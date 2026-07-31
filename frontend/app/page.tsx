"use client";

import Link from "next/link";
import { Hero } from "@/components/marketing/hero";
import { useAuth } from "@/features/auth/auth-context";
import { getLatestPosts } from "@/lib/blog";

const features = [
  {
    title: "AI Resume Tailoring",
    description:
      "Every application gets a resume rewritten for that specific job description — never a generic copy.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    ),
  },
  {
    title: "Live ATS Score",
    description:
      "See your ATS score and every missing keyword before you apply — no more applying blind.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    ),
  },
  {
    title: "AI Cover Letters",
    description:
      "A tailored, human-sounding cover letter for every application — written around the actual company.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    ),
  },
  {
    title: "Start From Any Resume",
    description:
      "Upload your existing PDF or DOCX and let AI rebuild it — you never start from a blank page.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    ),
  },
  {
    title: "One-Click PDF Export",
    description:
      "Download a pixel-perfect PDF of your optimized resume and cover letter, ready to send.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    ),
  },
  {
    title: "Privacy First",
    description:
      "Your data belongs to you. Your original resume is never modified, and nothing is shared.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    ),
  },
];

const steps = [
  {
    title: "Paste the job description",
    description:
      "Drop in the posting — or just type a target role — and Agent Apply extracts what the role really needs.",
  },
  {
    title: "Upload your resume",
    description:
      "Upload your current PDF or DOCX. AI rewrites the content around the job while preserving your facts.",
  },
  {
    title: "Review, edit, and download",
    description:
      "Check your live ATS score, tweak anything, and export a tailored resume plus cover letter as PDF.",
  },
];

const testimonials = [
  {
    name: "Sarah Kim",
    role: "Product Designer",
    quote:
      "Went from zero callbacks to three interviews in two weeks. The ATS score told me exactly what was broken.",
    rating: "5.0",
  },
  {
    name: "Marcus Chen",
    role: "Software Engineer",
    quote:
      "The keyword matching is scary good. My resume finally reads like the job posting — without sounding fake.",
    rating: "5.0",
  },
  {
    name: "Ana Torres",
    role: "Marketing Manager",
    quote:
      "I applied to ten roles with tailored resumes and got four replies. The cover letters alone are worth it.",
    rating: "5.0",
  },
];

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-xs font-semibold uppercase tracking-wide text-primary">
        {eyebrow}
      </span>
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base leading-relaxed text-muted">{subtitle}</p>
      )}
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const posts = getLatestPosts(3);

  return (
    <div className="flex flex-1 flex-col bg-canvas">
      <Hero />

      {/* Trust band */}
      <div className="border-y border-hairline-soft bg-surface-soft">
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-8 px-6 py-8 text-center sm:grid-cols-4 lg:px-8">
          {[
            ["98%", "applications pass ATS"],
            ["3.8x", "more interview replies"],
            ["12k+", "resumes optimized"],
            ["4.9/5", "average rating"],
          ].map(([value, label]) => (
            <div key={label}>
              <div className="text-2xl font-bold text-ink">{value}</div>
              <div className="mt-1 text-sm text-muted">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" className="py-16 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <SectionHeading
            eyebrow="Features"
            title="Everything you need to get hired faster"
            subtitle="A complete resume workflow — tailored content, ATS analysis, and polished export in one place."
          />
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-md border border-hairline-soft bg-canvas p-6 transition-shadow duration-200 hover:shadow-card"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-strong text-ink">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-ink">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-y border-hairline-soft bg-surface-soft py-16 lg:py-24"
      >
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <SectionHeading
            eyebrow="How it works"
            title="From job posting to interview in three steps"
          />
          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="relative text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary text-lg font-bold text-primary">
                  {i + 1}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ATS showcase */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                ATS analysis
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-4xl">
                Know your score before a recruiter does
              </h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">
                Agent Apply parses the job description, compares it against your
                resume, and shows you exactly what&apos;s missing — then adds those
                keywords where they belong.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Overall ATS score with original vs optimized comparison",
                  "Every missing keyword called out by name",
                  "Strengths, weaknesses, and concrete recommendations",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-body"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border border-hairline-soft bg-canvas p-8 shadow-card">
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <div className="text-xs font-medium text-muted">Original</div>
                  <div className="mt-1 text-4xl font-bold text-muted-soft">
                    58<span className="text-2xl">%</span>
                  </div>
                </div>
                <div className="text-2xl text-hairline">&rarr;</div>
                <div className="text-center">
                  <div className="text-xs font-medium text-muted">
                    Optimized
                  </div>
                  <div className="mt-1 text-4xl font-bold text-primary">
                    96<span className="text-2xl">%</span>
                  </div>
                </div>
              </div>
              <div className="mt-8 space-y-4">
                <div>
                  <div className="mb-1.5 flex justify-between text-xs text-muted">
                    <span>Original score</span>
                    <span>58%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-strong">
                    <div className="h-2 w-[58%] rounded-full bg-hairline" />
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex justify-between text-xs text-muted">
                    <span>Optimized score</span>
                    <span>96%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-strong">
                    <div className="h-2 w-[96%] rounded-full bg-primary" />
                  </div>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-2 border-t border-hairline-soft pt-6">
                {[
                  "TypeScript",
                  "CI/CD",
                  "Design Systems",
                  "A/B Testing",
                  "Roadmapping",
                ].map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full bg-primary-disabled/40 px-3 py-1 text-xs font-medium text-primary-active"
                  >
                    {kw}
                  </span>
                ))}
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">
                  added to resume
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-hairline-soft bg-surface-soft py-16 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <SectionHeading
            eyebrow="Testimonials"
            title="Loved by job seekers who stopped guessing"
          />
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-md border border-hairline-soft bg-canvas p-6"
              >
                <div className="flex items-center gap-1 text-ink">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      className="h-4 w-4 fill-current"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7L5.8 21l1.6-7L2 9.2l7.1-.6z" />
                    </svg>
                  ))}
                  <span className="ml-2 text-sm font-medium text-muted">
                    {t.rating}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-body">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-5 border-t border-hairline-soft pt-4">
                  <div className="text-sm font-semibold text-ink">{t.name}</div>
                  <div className="text-xs text-muted">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog teaser */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="From the blog"
              title="Guides that get you hired"
            />
            <Link
              href="/blog"
              className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-ink hover:text-primary"
            >
              View all articles
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
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-md border border-hairline-soft bg-canvas p-6 transition-shadow duration-200 hover:shadow-card"
              >
                <span className="inline-flex rounded-full bg-surface-strong px-3 py-1 text-xs font-medium text-muted">
                  {post.category}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink transition-colors group-hover:text-primary">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                  {post.description}
                </p>
                <div className="mt-4 text-xs text-muted-soft">
                  {post.date} &middot; {post.readTime}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="px-6 pb-16 lg:px-8 lg:pb-24">
        <div className="mx-auto max-w-[1280px] rounded-xl bg-surface-soft px-6 py-16 text-center lg:px-12">
          <h2 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Your next interview is one tailored resume away
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted">
            Upload your resume, paste a job description, and get an
            ATS-optimized resume plus cover letter in under a minute. Free to
            start.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={isAuthenticated ? "/dashboard" : "/register"}
              className="inline-flex h-12 items-center rounded-full bg-primary px-7 text-base font-medium text-white transition-colors hover:bg-primary-active"
            >
              Create Your Resume
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center rounded-sm border border-ink px-7 text-base font-medium text-ink transition-colors hover:bg-canvas"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
