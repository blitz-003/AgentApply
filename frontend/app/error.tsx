"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-4xl font-bold text-ink">
        Something went wrong
      </h1>
      <p className="mt-4 text-muted">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-lg bg-primary px-6 py-3 font-medium text-white hover:bg-primary-active"
      >
        Try Again
      </button>
    </div>
  );
}
