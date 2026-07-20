"use client";

import { useState } from "react";
import { useCoverLetters, useDeleteCoverLetter, useUpdateCoverLetter } from "./hooks";

interface CoverLettersPanelProps {
  resumeId: string;
}

export function CoverLettersPanel({ resumeId }: CoverLettersPanelProps) {
  const { data, isLoading, isError } = useCoverLetters(resumeId);
  const deleteMutation = useDeleteCoverLetter(resumeId);
  const updateMutation = useUpdateCoverLetter(resumeId);

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
    return (
      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Cover Letters
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No cover letters yet. Generate one from the AI Resume Copilot.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Cover Letters
      </h2>
      <div className="space-y-4">
        {data.items.map((letter) => (
          <CoverLetterCard
            key={letter.id}
            letter={letter}
            onDelete={() => deleteMutation.mutate(letter.id)}
            onSave={(content) => updateMutation.mutate({ coverLetterId: letter.id, content })}
            isDeleting={deleteMutation.isPending}
            isSaving={updateMutation.isPending}
          />
        ))}
      </div>
    </section>
  );
}

function CoverLetterCard({
  letter,
  onDelete,
  onSave,
  isDeleting,
  isSaving,
}: {
  letter: { id: string; job_title: string; company_name: string; content: string; created_at?: string };
  onDelete: () => void;
  onSave: (content: string) => void;
  isDeleting: boolean;
  isSaving: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(letter.content);

  const handleSave = () => {
    onSave(editContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(letter.content);
    setIsEditing(false);
  };

  return (
    <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {letter.job_title}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {letter.company_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-md p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label="Edit cover letter"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          <button
            onClick={onDelete}
            disabled={isDeleting}
            aria-label="Delete cover letter"
            className="rounded-md p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={10}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleCancel}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
            {letter.content}
          </p>
        )}
      </div>

      {letter.created_at && (
        <p className="mt-4 text-xs text-zinc-400">
          Created {new Date(letter.created_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
