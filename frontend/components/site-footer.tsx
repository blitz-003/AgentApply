"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const productLinks = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Get Started", href: "/register" },
];

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/about#contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

const supportLinks = [
  { label: "Contact Support", href: "/about#contact" },
  { label: "FAQ", href: "/pricing#faq" },
  { label: "How to apply", href: "/blog/how-to-apply-for-jobs" },
  { label: "ATS-friendly resume", href: "/blog/ats-friendly-resume-guide" },
];

const socialLinks = [
  {
    label: "X",
    href: "https://x.com",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452z" />
      </svg>
    ),
  },
  {
    label: "GitHub",
    href: "https://github.com",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 .5C5.373.5 0 5.873 0 12.5c0 5.302 3.438 9.8 8.207 11.387.6.111.82-.26.82-.578 0-.285-.011-1.04-.017-2.04-3.338.725-4.043-1.61-4.043-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.082-.73.082-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.419-1.304.762-1.604-2.665-.303-5.467-1.333-5.467-5.93 0-1.31.469-2.381 1.236-3.22-.124-.303-.535-1.524.117-3.176 0 0 1.008-.323 3.301 1.23a11.51 11.51 0 0 1 3.003-.404c1.02.005 2.047.138 3.006.404 2.291-1.553 3.297-1.23 3.297-1.23.653 1.652.243 2.873.118 3.176.77.839 1.235 1.91 1.235 3.22 0 4.61-2.807 5.624-5.479 5.921.43.372.814 1.102.814 2.222 0 1.606-.015 2.898-.015 3.293 0 .32.216.694.825.576C20.565 22.297 24 17.8 24 12.5 24 5.873 18.627.5 12 .5z" />
      </svg>
    ),
  },
];

const appRoutes = ["/dashboard", "/workspace", "/login", "/register"];

export function SiteFooter() {
  const pathname = usePathname();

  if (appRoutes.some((route) => pathname.startsWith(route))) {
    return null;
  }

  return (
    <footer className="border-t border-hairline bg-canvas">
      <div className="mx-auto max-w-[1280px] px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
                A
              </span>
              <span className="text-lg font-bold tracking-tight text-ink">
                Agent<span className="text-primary">Apply</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              AI-powered resume builder that tailors your resume and cover
              letter to every job and passes ATS screening.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-muted transition-colors hover:border-ink hover:text-ink"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium text-ink">Product</h3>
            <ul className="mt-4 space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-base font-medium text-ink">Company</h3>
            <ul className="mt-4 space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-base font-medium text-ink">Resources</h3>
            <ul className="mt-4 space-y-3">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <a
              href="mailto:support@agentapply.app"
              className="mt-6 inline-block text-sm text-muted transition-colors hover:text-ink"
            >
              support@agentapply.app
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-hairline-soft">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-3 px-6 py-5 sm:flex-row lg:px-8">
          <p className="text-xs text-muted">
            &copy; 2026 Agent Apply. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs text-muted hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs text-muted hover:text-ink">
              Terms
            </Link>
            <span className="text-xs text-muted">English (US)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
