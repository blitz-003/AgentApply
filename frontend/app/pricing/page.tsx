import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing | Agent Apply",
  description:
    "Simple pricing for an AI resume builder that actually gets you interviews. Free to start, upgrade when you're ready.",
};

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    tagline: "For your first tailored application.",
    cta: "Start for Free",
    highlight: false,
    features: [
      "1 resume workspace",
      "3 AI optimizations per month",
      "Live ATS score",
      "PDF resume export",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "$12",
    period: "per month",
    tagline: "For an active job search that gets replies.",
    cta: "Go Pro",
    highlight: true,
    features: [
      "Unlimited resumes",
      "Unlimited AI optimization",
      "AI cover letters",
      "Upload PDF / DOCX to start",
      "Keyword gap analysis",
      "Priority processing",
    ],
  },
  {
    name: "Premium",
    price: "$29",
    period: "per month",
    tagline: "For candidates who want every advantage.",
    cta: "Go Premium",
    highlight: false,
    features: [
      "Everything in Pro",
      "Unlimited ATS analysis",
      "AI interview question prep",
      "Tailored application tracking",
      "Priority email support",
      "Early access to new features",
    ],
  },
];

const comparison = [
  ["Resumes", "1", "Unlimited", "Unlimited"],
  ["AI optimizations / month", "3", "Unlimited", "Unlimited"],
  ["AI cover letters", "—", "Included", "Included"],
  ["Upload PDF / DOCX", "—", "Included", "Included"],
  ["Live ATS score", "Included", "Included", "Included"],
  ["Keyword gap analysis", "—", "Included", "Included"],
  ["PDF export", "Resume only", "Resume + cover letter", "Resume + cover letter"],
  ["Priority support", "—", "—", "Included"],
];

const faqs = [
  {
    q: "Is the free plan really free?",
    a: "Yes. No credit card required. You get one resume workspace and three AI optimizations every month — plenty to test whether Agent Apply moves your callback rate.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Upgrade or downgrade whenever you like. Paid plans are month-to-month and you keep access until the end of your billing period.",
  },
  {
    q: "How accurate is the ATS score?",
    a: "The score mirrors how real applicant tracking systems parse and rank resumes: keyword coverage, section structure, and parseability. No tool can guarantee a recruiter's decision, but our users see dramatically higher callback rates after optimizing.",
  },
  {
    q: "Do you store my resume or sell my data?",
    a: "Never. Your resumes are private to your account, we don't train on your data, and we never sell or share it. Your original upload is deleted after it's parsed.",
  },
  {
    q: "Can I use Agent Apply for multiple roles?",
    a: "Pro and Premium plans are built for exactly this: a tailored resume for every job you apply to. Each optimization is written around the specific job description you paste.",
  },
];

export default function PricingPage() {
  return (
    <div className="bg-canvas">
      <section className="border-b border-hairline-soft">
        <div className="mx-auto max-w-[1280px] px-6 py-16 text-center lg:px-8 lg:py-24">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            Pricing
          </span>
          <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-bold tracking-tight text-ink md:text-5xl">
            Pay for callbacks, not for features
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted">
            Start free. Upgrade when you&apos;re ready to tailor every single
            application. Cancel anytime.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-md border p-8 transition-shadow duration-200 ${
                  plan.highlight
                    ? "border-primary bg-surface-soft shadow-card"
                    : "border-hairline-soft bg-canvas hover:shadow-card"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h2 className="text-lg font-semibold text-ink">{plan.name}</h2>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-ink">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{plan.tagline}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
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
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 inline-flex h-12 items-center justify-center rounded-sm px-6 text-base font-medium transition-colors ${
                    plan.highlight
                      ? "bg-primary text-white hover:bg-primary-active"
                      : "border border-ink text-ink hover:bg-surface-soft"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-hairline-soft bg-surface-soft py-16 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight text-ink">
            Compare plans
          </h2>
          <div className="mt-10 overflow-x-auto rounded-md border border-hairline bg-canvas">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-hairline">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted">
                    Feature
                  </th>
                  {["Free", "Pro", "Premium"].map((name) => (
                    <th
                      key={name}
                      className="px-6 py-4 text-base font-semibold text-ink"
                    >
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr
                    key={row[0]}
                    className="border-b border-hairline-soft last:border-0"
                  >
                    <td className="px-6 py-4 font-medium text-ink">
                      {row[0]}
                    </td>
                    {row.slice(1).map((cell, i) => (
                      <td key={i} className="px-6 py-4 text-muted">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="faq" className="py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight text-ink">
            Frequently asked questions
          </h2>
          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-md border border-hairline-soft bg-canvas p-6"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-ink">
                  {faq.q}
                  <span className="text-muted transition-transform group-open:rotate-45">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
          <div className="mt-12 text-center">
            <p className="text-sm text-muted">
              Still have questions?{" "}
              <Link
                href="/about#contact"
                className="font-medium text-ink hover:text-primary"
              >
                Talk to us
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
