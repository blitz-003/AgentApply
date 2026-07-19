"use client";

import Link from "next/link";
import { useAuth } from "@/features/auth/auth-context";

export function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <a href="/" className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Agent Apply
        </a>
        <div className="flex items-center gap-4">
          {isLoading ? null : isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Dashboard
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {user?.name}
                </span>
                <button
                  onClick={logout}
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
