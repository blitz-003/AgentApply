export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
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
    </div>
  );
}
