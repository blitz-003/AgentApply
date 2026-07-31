export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-md border border-hairline-soft bg-canvas p-6">
      <div className="h-5 w-3/4 rounded bg-surface-strong" />
      <div className="mt-3 h-4 w-1/2 rounded bg-surface-strong" />
      <div className="mt-2 h-4 w-1/3 rounded bg-surface-strong" />
      <div className="mt-4 flex gap-2">
        <div className="h-8 w-16 rounded bg-surface-strong" />
        <div className="h-8 w-16 rounded bg-surface-strong" />
      </div>
    </div>
  );
}
