"use client";

import Link from "next/link";
import type { ResumeListItem } from "@/types/resume";

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

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {resume.title}
      </h3>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {resume.target_role || "No target role"}
      </p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
        {resume.template?.name || "No template"}
      </p>
      <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
        Updated {formattedDate}
      </p>
      <div className="mt-4 flex gap-2">
        <Link
          href={`/dashboard/resumes/${resume.id}`}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Edit
        </Link>
        <button
          onClick={() => onDelete(resume.id)}
          disabled={isDeleting}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
