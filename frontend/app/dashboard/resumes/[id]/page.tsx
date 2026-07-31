"use client";

import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { GuidedFlow } from "@/features/workspace/guided-flow";

export default function ResumePage() {
  const params = useParams();
  const resumeId = params.id as string;

  return (
    <ProtectedRoute>
      <GuidedFlow resumeId={resumeId} />
    </ProtectedRoute>
  );
}
