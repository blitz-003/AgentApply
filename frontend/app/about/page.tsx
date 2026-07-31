import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/marketing/contact-form";

export const metadata: Metadata = {
  title: "About & Contact | Agent Apply",
  description:
    "Learn how Agent Apply helps job seekers get interviews, and get in touch with our team.",
};

const values = [
  {
    title: "Your story stays yours",
    description:
      "We never change your facts. AI rewrites how you present your experience, never what it is.",
  },
  {
    title: "Applicants first",
    description:
      "No gatekeeping. Every feature exists to move one number: your callback rate.",
  },
  {
    title: "Radical transparency",
    description:
      "Live ATS scores, plain-language recommendations, and no dark patterns.",
  },
  {
    title: "Built on real feedback",
    description:
      "The product is shaped by thousands of job-seeker sessions, not boardroom guesses.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-canvas">
      <section className="border-b border-hairline-soft">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              About us
            </span>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink md:text-5xl">
              We help great candidates stop being invisible
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-body">
              Agent Apply started with a frustrating observation: qualified
              people were getting filtered out before a human ever saw their
              resume. Not because they lacked skill — because their application
              didn&apos;t speak the ATS&apos;s language.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted">
              So we built a tool that does the tedious, brutal work for you:
              parsing job descriptions, rewriting your resume for each role,
              checking your ATS score, and drafting a cover letter that reads
              like it was written by a person who actually cares.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-ink">
            What we believe
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-md border border-hairline-soft p-6 transition-shadow duration-200 hover:shadow-card"
              >
                <h3 className="text-lg font-semibold text-ink">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="border-t border-hairline-soft bg-surface-soft py-16 lg:py-24"
      >
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                Contact
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink">
                We&apos;d love to hear from you
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                Questions about your resume, the product, partnerships, or
                press? Reach out and a real person will reply within 24 hours.
              </p>
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas text-ink shadow-card">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.6}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </span>
                  <div>
                    <div className="text-sm font-medium text-ink">Email</div>
                    <a
                      href="mailto:support@agentapply.app"
                      className="text-sm text-muted hover:text-primary"
                    >
                      support@agentapply.app
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas text-ink shadow-card">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.6}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </span>
                  <div>
                    <div className="text-sm font-medium text-ink">
                      Response time
                    </div>
                    <div className="text-sm text-muted">
                      Within 24 hours, every day
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas text-ink shadow-card">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.6}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </span>
                  <div>
                    <div className="text-sm font-medium text-ink">
                      Got feedback?
                    </div>
                    <Link
                      href="/pricing#faq"
                      className="text-sm text-muted hover:text-primary"
                    >
                      Check the FAQ first
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-hairline bg-canvas p-8 shadow-card">
              <h3 className="text-lg font-semibold text-ink">
                Send us a message
              </h3>
              <p className="mb-6 mt-1 text-sm text-muted">
                This opens a pre-filled email to our team.
              </p>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
