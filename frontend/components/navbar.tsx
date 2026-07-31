"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/features/auth/auth-context";

const marketingLinks = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
];

const appLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Blog", href: "/blog" },
];

export function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks = isLoading ? [] : isAuthenticated ? appLinks : marketingLinks;

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-canvas">
      <nav className="mx-auto flex h-20 max-w-[1280px] items-center justify-between gap-4 px-6 lg:px-8">
        <Link
          href={isAuthenticated ? "/dashboard" : "/"}
          className="flex shrink-0 items-center gap-2.5"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-base font-bold text-white">
            A
          </span>
          <span className="text-xl font-bold tracking-tight text-ink">
            Agent<span className="text-primary">Apply</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-soft hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {isLoading ? null : isAuthenticated ? (
            <>
              <span className="hidden text-sm text-muted md:block">
                {user?.name}
              </span>
              <button
                onClick={logout}
                className="rounded-sm border border-ink bg-canvas px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-soft"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-soft hover:text-ink sm:block"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-active"
              >
                Get Started
              </Link>
            </>
          )}
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle menu"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-strong text-ink md:hidden"
          >
            {menuOpen ? (
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-hairline-soft bg-canvas md:hidden">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-1 px-6 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-soft"
              >
                {link.label}
              </Link>
            ))}
            <div className="my-2 border-t border-hairline-soft" />
            {isLoading ? null : isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted transition-colors hover:bg-surface-soft"
                >
                  Logout ({user?.name})
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-soft"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 rounded-sm bg-primary px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-primary-active"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
