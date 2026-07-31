import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Agent Apply",
  description:
    "The terms that govern your use of Agent Apply — the AI resume builder.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl bg-canvas px-6 py-16 lg:py-20">
      <h1 className="text-4xl font-bold tracking-tight text-ink">
        Terms of Service
      </h1>
      <p className="mt-3 text-sm text-muted-soft">
        Last updated: July 31, 2026
      </p>

      <div className="mt-10 space-y-10 text-base leading-relaxed text-body">
        <section>
          <h2 className="mb-3 text-2xl font-bold text-ink">
            1. Acceptance of terms
          </h2>
          <p>
            By creating an account or using Agent Apply, you agree to these
            terms. If you don&apos;t agree, please don&apos;t use the service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold text-ink">
            2. What the service does
          </h2>
          <p>
            Agent Apply uses AI to tailor resumes and cover letters to job
            descriptions and to analyze resumes for ATS compatibility. Output is
            generated from your information and the job description you provide.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold text-ink">
            3. Your responsibility for accuracy
          </h2>
          <p>
            You are responsible for the accuracy of the information you provide.
            Agent Apply never fabricates your facts — but always review
            AI-generated content before submitting it to an employer.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold text-ink">
            4. No guarantee of results
          </h2>
          <p>
            We work hard to help you get interviews, but we make no guarantee
            about job applications, interviews, or offers. Hiring decisions are
            made by employers, not by us.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold text-ink">
            5. Acceptable use
          </h2>
          <p>You agree not to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>Upload content you don&apos;t have the right to use.</li>
            <li>Attempt to access another user&apos;s account or resumes.</li>
            <li>Use the service to misrepresent yourself to employers.</li>
            <li>
              Abuse, scrape, or attempt to disrupt the service or its AI
              providers.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold text-ink">
            6. Subscriptions &amp; billing
          </h2>
          <p>
            Paid plans are billed in advance on a month-to-month basis. You can
            cancel anytime and keep access until the end of your billing
            period. We don&apos;t offer refunds for partial months.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold text-ink">
            7. Termination
          </h2>
          <p>
            You can delete your account at any time. We may suspend accounts
            that violate these terms. On termination, your data is permanently
            deleted.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold text-ink">Contact</h2>
          <p>
            Questions about these terms? Email{" "}
            <Link
              href="mailto:support@agentapply.app"
              className="font-medium text-primary hover:underline"
            >
              support@agentapply.app
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
