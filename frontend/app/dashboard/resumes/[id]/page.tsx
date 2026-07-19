"use client";

import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { useResumeDetail } from "@/features/workspace/hooks";
import { GuidedFlow } from "@/features/workspace/guided-flow";
import { ResumeEditor } from "@/features/workspace/resume-editor";

export default function ResumePage() {
  const params = useParams();
  const resumeId = params.id as string;
  const { data: resume, isLoading, error } = useResumeDetail(resumeId);

  return (
    <ProtectedRoute>
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-zinc-500">Loading resume...</div>
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-zinc-600">Failed to load resume</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Retry
            </button>
          </div>
        </div>
      ) : resume?.resume_data && Object.keys(resume.resume_data).length > 0 ? (
        <ResumeEditor resumeId={resumeId} resume={resume} />
      ) : (
        <GuidedFlow resumeId={resumeId} />
      )}
    </ProtectedRoute>
  );
}
