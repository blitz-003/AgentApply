export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="h-5 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-3 h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-2 h-4 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-4 flex gap-2">
        <div className="h-8 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-8 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}
