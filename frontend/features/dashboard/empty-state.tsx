"use client";

interface EmptyStateProps {
  onCreateResume: () => void;
}

export function EmptyState({ onCreateResume }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-surface-soft p-4">
        <svg
          className="h-8 w-8 text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-ink">
        No resumes yet
      </h3>
      <p className="mt-2 text-sm text-muted">
        Create your first AI-powered resume
      </p>
      <button
        onClick={onCreateResume}
        className="mt-6 rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-active"
      >
        Create Resume
      </button>
    </div>
  );
}
