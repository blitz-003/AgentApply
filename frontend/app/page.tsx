import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Agent Apply
        </h1>
        <p className="mt-4 text-xl text-zinc-600 dark:text-zinc-400">
          AI-Powered Resume Builder
        </p>
        <p className="mt-6 max-w-lg text-zinc-500 dark:text-zinc-500">
          Build tailored, ATS-optimized resumes with the help of AI. Upload your
          existing resume, improve it with intelligent suggestions, and export
          polished PDFs in seconds.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-zinc-300 px-6 py-3 font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Login
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-200 bg-zinc-50 px-6 py-16 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Features
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-zinc-900 dark:text-zinc-100">AI-Guided Creation</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Let AI guide you through building a professional resume step by step.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-zinc-900 dark:text-zinc-100">ATS Optimization</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Analyze your resume against job descriptions and get actionable suggestions.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-zinc-900 dark:text-zinc-100">PDF Export</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Export your resume as a polished, professional PDF in one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            How It Works
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-zinc-900 text-lg font-bold text-zinc-900 dark:border-zinc-100 dark:text-zinc-100">
                1
              </div>
              <h3 className="mt-4 font-semibold text-zinc-900 dark:text-zinc-100">Upload or Start Fresh</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Upload an existing resume or let AI build one from scratch.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-zinc-900 text-lg font-bold text-zinc-900 dark:border-zinc-100 dark:text-zinc-100">
                2
              </div>
              <h3 className="mt-4 font-semibold text-zinc-900 dark:text-zinc-100">AI Tailors Your Resume</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                AI analyzes your target role and optimizes your resume content.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-zinc-900 text-lg font-bold text-zinc-900 dark:border-zinc-100 dark:text-zinc-100">
                3
              </div>
              <h3 className="mt-4 font-semibold text-zinc-900 dark:text-zinc-100">Export &amp; Apply</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Review, edit, and export your resume as a professional PDF.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-200 bg-zinc-50 px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Ready to build your resume?
        </h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Get started for free. No credit card required.
        </p>
        <Link
          href="/register"
          className="mt-6 inline-block rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Create Your Resume
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 px-6 py-8 dark:border-zinc-800">
        <div className="mx-auto max-w-5xl text-center text-sm text-zinc-500 dark:text-zinc-500">
          Agent Apply. AI-Powered Resume Builder.
        </div>
      </footer>
    </div>
  );
}
