"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { useAuth } from "@/features/auth/auth-context";
import {
  useResumeList,
  useCreateResume,
  useDeleteResume,
} from "@/features/dashboard/hooks";
import { SearchBar } from "@/features/dashboard/search-bar";
import { EmptyState } from "@/features/dashboard/empty-state";
import { SkeletonCard } from "@/features/dashboard/skeleton-card";
import { ResumeCard } from "@/features/dashboard/resume-card";
import { ErrorState } from "@/components/error-state";

const inputClass =
  "w-full rounded-sm border border-hairline bg-canvas px-4 py-3 text-base text-ink placeholder:text-muted-soft focus:border-ink focus:outline-none focus:ring-0";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    data,
    isLoading,
    isError,
    refetch,
    search,
    setSearch,
    page,
    setPage,
  } = useResumeList();
  const createResume = useCreateResume();
  const deleteResume = useDeleteResume();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newResumeTitle, setNewResumeTitle] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreateResume = async () => {
    if (!newResumeTitle.trim()) return;
    try {
      const result = await createResume.mutateAsync({ title: newResumeTitle });
      setShowCreateDialog(false);
      setNewResumeTitle("");
      toast.success("Resume created successfully");
      router.push(`/dashboard/resumes/${result.id}`);
    } catch {
      toast.error("Failed to create resume");
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteResume.mutateAsync(deleteId);
      setDeleteId(null);
      toast.success("Resume deleted successfully");
    } catch {
      toast.error("Failed to delete resume");
    }
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">
              Welcome, {user?.name}
            </h1>
            <p className="mt-1 text-sm text-muted">Manage your resumes</p>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="rounded-sm bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-active"
          >
            + New Resume
          </button>
        </div>

        <div className="mt-6">
          <SearchBar value={search} onChange={setSearch} />
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : isError ? (
            <ErrorState message="Unable to load resumes" onRetry={() => refetch()} />
          ) : data?.items.length === 0 ? (
            <EmptyState onCreateResume={() => setShowCreateDialog(true)} />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data?.items.map((resume) => (
                  <ResumeCard
                    key={resume.id}
                    resume={resume}
                    onDelete={handleDeleteClick}
                    isDeleting={deleteResume.isPending}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-4">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="rounded-sm border border-hairline px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-soft disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-muted">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="rounded-sm border border-hairline px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-soft disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-md border border-hairline bg-canvas p-6 shadow-card">
            <h2 className="text-lg font-semibold text-ink">
              Create New Resume
            </h2>
            <input
              type="text"
              placeholder="Resume title"
              value={newResumeTitle}
              onChange={(e) => setNewResumeTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateResume();
              }}
              className={`${inputClass} mt-4`}
              autoFocus
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewResumeTitle("");
                }}
                className="rounded-sm border border-hairline px-4 py-2 text-sm font-medium text-ink hover:bg-surface-soft"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateResume}
                disabled={!newResumeTitle.trim() || createResume.isPending}
                className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-active disabled:bg-primary-disabled"
              >
                {createResume.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-md border border-hairline bg-canvas p-6 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Delete Resume</h2>
            <p className="mt-2 text-sm text-muted">
              Are you sure you want to delete this resume? This action cannot be
              undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-sm border border-hairline px-4 py-2 text-sm font-medium text-ink hover:bg-surface-soft"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteResume.isPending}
                className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-active disabled:bg-primary-disabled"
              >
                {deleteResume.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
