interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Something went wrong", onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-surface-soft p-4">
        <svg
          className="h-8 w-8 text-error"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-ink">
        {message}
      </h3>
      <p className="mt-2 text-sm text-muted">
        Please try again later
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 rounded-sm border border-ink px-4 py-2 text-sm font-medium text-ink hover:bg-surface-soft"
        >
          Retry
        </button>
      )}
    </div>
  );
}
