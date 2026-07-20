"use client";

import { useState, useRef } from "react";
import { useGenerateResume, useUpdateResume, useUploadResume, useFillFields } from "./hooks";
import { useToast } from "@/components/toast-context";

interface GuidedFlowProps {
  resumeId: string;
}

type Step = "resume-source" | "target-job" | "uploading" | "analysis" | "summary";

function hasEmptyFields(data: Record<string, unknown>): boolean {
  const pi = (data.personal_info as Record<string, unknown>) || {};
  if (!pi.name || !pi.email) return true;
  if (!data.summary) return true;
  if (Array.isArray(data.experience) && data.experience.length === 0) return true;
  if (Array.isArray(data.skills) && data.skills.length === 0) return true;
  if (Array.isArray(data.education) && data.education.length === 0) return true;
  return false;
}

export function GuidedFlow({ resumeId }: GuidedFlowProps) {
  const [step, setStep] = useState<Step>("resume-source");
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [hasJobDescription, setHasJobDescription] = useState<boolean | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    resume_data?: Record<string, unknown>;
    ats_analysis?: { overall_score: number; strengths: string[]; weaknesses: string[]; recommendations: string[]; missing_keywords: string[] };
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateMutation = useGenerateResume(resumeId);
  const updateMutation = useUpdateResume(resumeId);
  const uploadMutation = useUploadResume(resumeId);
  const fillFieldsMutation = useFillFields(resumeId);
  const { addToast } = useToast();

  const getJobData = () => {
    const data: { job_description?: string; target_role?: string } = {};
    if (hasJobDescription && jobDescription.trim()) {
      data.job_description = jobDescription;
    } else if (targetRole.trim()) {
      data.target_role = targetRole;
    }
    return data;
  };

  const handleGenerate = (jobData: { job_description?: string; target_role?: string }) => {
    setStep("analysis");
    generateMutation.mutate(jobData, {
      onSuccess: (result) => {
        setAnalysisResult(result);
        setStep("summary");
        addToast("AI analysis completed", "success");
      },
      onError: () => {
        setStep("resume-source");
        addToast("AI generation failed. Please try again.", "error");
      },
    });
  };

  const handleTargetJobSubmit = () => {
    handleGenerate(getJobData());
  };

  const handleSkipTarget = () => {
    setHasJobDescription(null);
    setJobDescription("");
    setTargetRole("");
    handleGenerate({});
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type)) {
      setUploadError("Please upload a PDF or DOCX file");
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError("File too large. Maximum size is 10MB");
      return;
    }

    setUploadError(null);
    setStep("uploading");

    uploadMutation.mutate(file, {
      onSuccess: () => {
        setStep("target-job");
        addToast("Resume uploaded successfully", "success");
      },
      onError: (error) => {
        setUploadError(error.message || "Failed to upload resume");
        setStep("resume-source");
        addToast("Resume upload failed", "error");
      },
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCreateFromScratch = () => {
    setStep("target-job");
  };

  const handleGenerateResume = () => {
    if (analysisResult?.resume_data) {
      updateMutation.mutate(
        { resume_data: analysisResult.resume_data as Record<string, unknown> },
        {
          onSuccess: () => {
            addToast("Tailored resume saved", "success");
            if (hasEmptyFields(analysisResult.resume_data || {})) {
              addToast("Filling in missing details...", "info");
              fillFieldsMutation.mutate(getJobData(), {
                onSuccess: (filledResult) => {
                  setAnalysisResult((prev) => prev ? { ...prev, resume_data: filledResult.resume_data } : prev);
                  addToast("Missing fields filled automatically", "success");
                },
                onError: () => {
                  addToast("Could not auto-fill some fields", "error");
                },
              });
            }
          },
          onError: () => {
            addToast("Failed to save resume", "error");
          },
        }
      );
    }
  };

  if (step === "resume-source") {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              How would you like to start?
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Upload an existing resume or create one from scratch
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleUploadClick}
              disabled={uploadMutation.isPending}
              className="flex flex-col items-center gap-3 rounded-lg border-2 border-zinc-300 p-6 text-center transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500 disabled:opacity-50"
            >
              <svg className="h-10 w-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v-8m0 0l-3 3m3-3l3 3M9 20H7a2 2 0 01-2-2V6a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V18a2 2 0 01-2 2h-2" />
              </svg>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {uploadMutation.isPending ? "Uploading..." : "Upload Resume"}
              </span>
              <span className="text-xs text-zinc-500">PDF or DOCX</span>
            </button>

            <button
              onClick={handleCreateFromScratch}
              className="flex flex-col items-center gap-3 rounded-lg border-2 border-zinc-300 p-6 text-center transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
            >
              <svg className="h-10 w-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Create from Scratch</span>
              <span className="text-xs text-zinc-500">AI will help build it</span>
            </button>
          </div>

          {uploadError && (
            <p className="text-sm text-center text-red-600 dark:text-red-400">
              {uploadError}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (step === "uploading") {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-lg text-center space-y-6">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Uploading your resume...
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              We&apos;re parsing and extracting content from your resume.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "target-job") {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Let&apos;s build your resume
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Do you have a job description to target?
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setHasJobDescription(true)}
              className={`px-6 py-3 rounded-lg border-2 font-medium transition-colors ${
                hasJobDescription === true
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-300 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500"
              }`}
            >
              Yes, I have one
            </button>
            <button
              onClick={() => setHasJobDescription(false)}
              className={`px-6 py-3 rounded-lg border-2 font-medium transition-colors ${
                hasJobDescription === false
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-300 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500"
              }`}
            >
              No, just a target role
            </button>
          </div>

          {hasJobDescription === true && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Paste the job description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                placeholder="Paste the full job description here..."
              />
            </div>
          )}

          {hasJobDescription === false && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                What role are you targeting?
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                placeholder="e.g. Frontend Developer"
              />
            </div>
          )}

          {hasJobDescription !== null && (
            <button
              onClick={handleTargetJobSubmit}
              disabled={
                (hasJobDescription === true && !jobDescription.trim()) ||
                (hasJobDescription === false && !targetRole.trim())
              }
              className="w-full rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Continue
            </button>
          )}

          <button
            onClick={handleSkipTarget}
            className="w-full text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            No target? Skip — generate general resume
          </button>

          <button
            onClick={() => setStep("resume-source")}
            className="w-full text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (step === "analysis") {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-lg text-center space-y-6">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              AI is analyzing your resume...
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              This may take a moment. We&apos;re generating tailored content.
            </p>
          </div>
          {generateMutation.isError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Something went wrong. Please try again.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (step === "summary" && analysisResult?.ats_analysis) {
    const { ats_analysis } = analysisResult;
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Analysis Complete
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Here&apos;s what the AI found
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">ATS Score</span>
              <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {ats_analysis.overall_score}/100
              </span>
            </div>
          </div>

          {ats_analysis.strengths.length > 0 && (
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Strengths</h3>
              <ul className="mt-2 space-y-1">
                {ats_analysis.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400">+ {s}</li>
                ))}
              </ul>
            </div>
          )}

          {ats_analysis.missing_keywords.length > 0 && (
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Missing Keywords</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {ats_analysis.missing_keywords.map((kw, i) => (
                  <span key={i} className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {ats_analysis.recommendations.length > 0 && (
            <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Recommendations</h3>
              <ul className="mt-2 space-y-1">
                {ats_analysis.recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400">• {r}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleGenerateResume}
            disabled={updateMutation.isPending || fillFieldsMutation.isPending}
            className="w-full rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {updateMutation.isPending
              ? "Saving..."
              : fillFieldsMutation.isPending
                ? "Filling in missing details..."
                : "Generate Tailored Resume"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
