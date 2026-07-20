"use client";

import { useCoverLetters, useDeleteCoverLetter } from "./hooks";

interface CoverLettersPanelProps {
  resumeId: string;
}

export function CoverLettersPanel({ resumeId }: CoverLettersPanelProps) {
  const { data, isLoading, isError } = useCoverLetters(resumeId);
  const deleteMutation = useDeleteCoverLetter(resumeId);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Loading cover letters...
          </span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Failed to load cover letters.
        </p>
      </div>
    );
  }

  if (!data?.items || data.items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {data.items.map((letter) => (
        <div
          key={letter.id}
          className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                {letter.job_title}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {letter.company_name}
              </p>
            </div>
            <button
              onClick={() => deleteMutation.mutate(letter.id)}
              disabled={deleteMutation.isPending}
              aria-label="Delete cover letter"
              className="rounded-md p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
          <div className="mt-4">
            <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
              {letter.content}
            </p>
          </div>
          {letter.created_at && (
            <p className="mt-4 text-xs text-zinc-400">
              Created{" "}
              {new Date(letter.created_at).toLocaleDateString()}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
