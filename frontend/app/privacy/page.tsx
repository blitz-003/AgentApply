import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Agent Apply",
  description:
    "How Agent Apply handles your data — what we store, what we delete, and what we never do.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl bg-canvas px-6 py-16 lg:py-20">
      <h1 className="text-4xl font-bold tracking-tight text-ink">
        Privacy Policy
      </h1>
      <p className="mt-3 text-sm text-muted-soft">
        Last updated: July 31, 2026
      </p>

      <div className="mt-10 space-y-10 text-base leading-relaxed text-body">
        <section>
          <h2 className="mb-3 text-2xl font-bold text-ink">
            The short version
          </h2>
          <p>
            Your resumes are private to your account. We don&apos;t sell your
            data, we don&apos;t train models on it, and we don&apos;t share it
            with third parties. Original uploaded resumes are deleted after
            they&apos;re parsed.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold text-ink">
            What we collect
          </h2>
          <p>To run the service, we store:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li>
              Your account details: name, email address, and authentication
              tokens.
            </li>
            <li>
              Your resumes and cover letters, stored as structured data so you
              can edit and re-download them.
            </li>
            <li>
              Job descriptions you paste, used only to tailor your resume and
              cover letter for that specific role.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold text-ink">
            What happens to your uploads
          </h2>
          <p>
            When you upload a PDF or DOCX, we parse its text so AI can rebuild
            your content.{" "}
            <span className="font-semibold text-ink">
              The original file is then deleted
            </span>{" "}
            — we keep only the structured, editable version of your resume.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold text-ink">
            What we never do
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>We never sell or rent your personal information.</li>
            <li>We never train AI models on your resumes or cover letters.</li>
            <li>We never share your data with employers or recruiters.</li>
            <li>
              We never persist raw AI prompts, model responses, or
              chain-of-thought to the database.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold text-ink">Your rights</h2>
          <p>
            You can delete your resumes and cover letters at any time. You can
            also contact us to delete your entire account and all associated
            data. Data you delete is permanently removed.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-bold text-ink">Questions</h2>
          <p>
            Email{" "}
            <Link
              href="mailto:support@agentapply.app"
              className="font-medium text-primary hover:underline"
            >
              support@agentapply.app
            </Link>{" "}
            and a human will respond within 24 hours.
          </p>
        </section>
      </div>
    </div>
  );
}
