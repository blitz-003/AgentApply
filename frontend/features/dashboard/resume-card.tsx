"use client";

import type { ResumeListItem } from "@/types/resume";
import { useExportResume } from "@/features/workspace/hooks";

interface ResumeCardProps {
  resume: ResumeListItem;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function ResumeCard({ resume, onDelete, isDeleting }: ResumeCardProps) {
  const formattedDate = new Date(resume.updated_at).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  const exportMutation = useExportResume();

  return (
    <div className="flex flex-col rounded-md border border-hairline-soft bg-canvas p-6 transition-shadow duration-200 hover:shadow-card">
      <h3 className="truncate text-lg font-semibold text-ink">
        {resume.title}
      </h3>
      <p className="mt-1 text-sm text-muted">
        {resume.target_role || "Ready for AI optimization"}
      </p>
      <p className="mt-1 text-sm text-muted-soft">AI-optimized resume</p>
      <p className="mt-2 text-xs text-muted-soft">Updated {formattedDate}</p>
      <div className="mt-4 flex flex-1 items-end gap-2">
        <button
          onClick={() => exportMutation.mutate(resume.id)}
          disabled={exportMutation.isPending}
          className="rounded-sm bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-active disabled:bg-primary-disabled"
        >
          {exportMutation.isPending ? "Exporting..." : "Download"}
        </button>
        <button
          onClick={() => onDelete(resume.id)}
          disabled={isDeleting}
          className="rounded-sm border border-hairline px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-soft disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
