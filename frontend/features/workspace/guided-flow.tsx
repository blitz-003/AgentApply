"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  useGenerateResume,
  useUploadResume,
} from "./hooks";
import { downloadAll } from "@/lib/pdf/generate-pdf";
import { EditorPreview } from "./editor-preview";
import type { GenerateResponse } from "@/types/ai";

interface GuidedFlowProps {
  resumeId: string;
}

type Step =
  | "target-job"
  | "resume-source"
  | "processing"
  | "results"
  | "editor-preview";

const inputClass =
  "w-full rounded-sm border border-hairline bg-canvas px-4 py-3 text-base text-ink placeholder:text-muted-soft focus:border-ink focus:outline-none focus:ring-0";

const progressMessages = [
  "Uploading your resume...",
  "Extracting text from your resume...",
  "Analyzing your experience...",
  "Extracting keywords from the job description...",
  "Optimizing content for ATS systems...",
  "Generating tailored resume content...",
  "Creating a personalized cover letter...",
  "Running final ATS analysis...",
  "Almost done...",
];

export function GuidedFlow({ resumeId }: GuidedFlowProps) {
  const [step, setStep] = useState<Step>("target-job");
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [hasJobDescription, setHasJobDescription] = useState<boolean | null>(
    null,
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string>("");
  const [generateResult, setGenerateResult] = useState<GenerateResponse | null>(
    null,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateMutation = useGenerateResume(resumeId);
  const uploadMutation = useUploadResume(resumeId);

  const [progressIndex, setProgressIndex] = useState(0);

  useEffect(() => {
    if (step !== "processing") return;
    const interval = setInterval(() => {
      setProgressIndex((prev) => (prev + 1) % progressMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [step]);

  const getJobData = () => {
    const jobData: { job_description?: string; target_role?: string } = {};
    if (hasJobDescription && jobDescription.trim()) {
      jobData.job_description = jobDescription;
    } else if (targetRole.trim()) {
      jobData.target_role = targetRole;
    }
    return jobData;
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
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
    setUploadedFilename(file.name);
    setProgressIndex(0);
    setStep("processing");

    uploadMutation.mutate(file, {
      onSuccess: () => {
        const jobData = getJobData();
        if (!jobData.job_description && !jobData.target_role) {
          toast.error("Please enter a job description or target role first");
          setStep("target-job");
          return;
        }
        generateMutation.mutate(jobData, {
          onSuccess: (result) => {
            setGenerateResult(result);
            setStep("results");
          },
          onError: (err) => {
            const msg =
              err instanceof Error ? err.message : "Generation failed";
            toast.error(`AI generation failed: ${msg}`);
            setStep("resume-source");
          },
        });
      },
      onError: (error) => {
        setUploadError(error.message || "Failed to upload resume");
        setStep("resume-source");
        toast.error("Resume upload failed");
      },
    });
  };

  const handleDownloadAll = async () => {
    if (!generateResult) return;
    const pi =
      (generateResult.resume_data?.personal_info as Record<string, string>) ||
      {};
    const name = pi.name || "Resume";
    const coverContent =
      ((generateResult.cover_letter as Record<string, unknown>)
        ?.content as string) || "";
    if (coverContent) {
      await downloadAll(
        generateResult.resume_data as Record<string, unknown>,
        coverContent,
        name,
      );
    } else {
      const { generateResumePDF } = await import("@/lib/pdf/generate-pdf");
      await generateResumePDF(
        generateResult.resume_data as Record<string, unknown>,
        `${name}_Resume.pdf`,
      );
    }
  };

  if (step === "target-job") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-ink">
              What role are you targeting?
            </h2>
            <p className="mt-2 text-muted">
              Provide a job description or a target role for AI-tailored
              optimization
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={() => setHasJobDescription(true)}
              className={`rounded-full border px-6 py-3 text-sm font-medium transition-colors ${
                hasJobDescription === true
                  ? "border-primary bg-primary text-white"
                  : "border-hairline text-muted hover:border-ink hover:text-ink"
              }`}
            >
              Paste a Job Description
            </button>
            <button
              onClick={() => setHasJobDescription(false)}
              className={`rounded-full border px-6 py-3 text-sm font-medium transition-colors ${
                hasJobDescription === false
                  ? "border-primary bg-primary text-white"
                  : "border-hairline text-muted hover:border-ink hover:text-ink"
              }`}
            >
              Just a Target Role
            </button>
          </div>

          {hasJobDescription === true && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-ink">
                Paste the job description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={6}
                className={`${inputClass} resize-y`}
                placeholder="Paste the full job description here..."
              />
            </div>
          )}

          {hasJobDescription === false && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-ink">
                What role are you targeting?
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className={inputClass}
                placeholder="e.g. Frontend Developer"
              />
            </div>
          )}

          {hasJobDescription !== null && (
            <button
              onClick={() => setStep("resume-source")}
              disabled={
                (hasJobDescription === true && !jobDescription.trim()) ||
                (hasJobDescription === false && !targetRole.trim())
              }
              className="w-full rounded-sm bg-primary px-4 py-3 text-base font-medium text-white hover:bg-primary-active disabled:bg-primary-disabled"
            >
              Next
            </button>
          )}
        </div>
      </div>
    );
  }

  if (step === "resume-source") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-ink">Upload Your Resume</h2>
            <p className="mt-2 text-muted">
              Upload your current resume (PDF or DOCX) for AI-powered
              optimization
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={handleUploadClick}
            disabled={uploadMutation.isPending}
            className="flex w-full flex-col items-center gap-3 rounded-md border-2 border-hairline bg-canvas p-10 text-center transition-colors hover:border-primary disabled:opacity-50"
          >
            <svg
              className="h-12 w-12 text-muted-soft"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 16v-8m0 0l-3 3m3-3l3 3M9 20H7a2 2 0 01-2-2V6a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V18a2 2 0 01-2 2h-2"
              />
            </svg>
            <span className="font-medium text-ink">
              {uploadMutation.isPending
                ? "Uploading..."
                : uploadedFilename
                  ? uploadedFilename
                  : "Choose File"}
            </span>
            <span className="text-xs text-muted-soft">
              PDF or DOCX (max 10 MB)
            </span>
          </button>

          {uploadError && (
            <p className="text-center text-sm text-error">{uploadError}</p>
          )}

          <button
            onClick={() => setStep("target-job")}
            className="w-full text-sm text-muted hover:text-ink"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg space-y-8 text-center">
          <div
            className="mx-auto h-20 w-20 animate-spin rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, #ffd1da 10%, #ff385c 100%)",
              WebkitMask:
                "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))",
              mask: "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))",
            }}
          />

          <div>
            <h2 className="text-2xl font-bold text-ink">
              Processing Your Resume
            </h2>
            <p className="mt-3 text-sm font-medium text-muted transition-opacity duration-300">
              {progressMessages[progressIndex]}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "results" && generateResult) {
    const ats = generateResult.ats_analysis as unknown as Record<
      string,
      unknown
    >;
    const score = (ats?.overall_score as number) || 0;
    const prevScore = ats?.previous_score as number | undefined;
    const strengths = (ats?.strengths as string[]) || [];
    const weaknesses = (ats?.weaknesses as string[]) || [];
    const missingKeywords = (ats?.missing_keywords as string[]) || [];
    const includedKeywords = (ats?.included_keywords as string[]) || [];
    const recommendations = (ats?.recommendations as string[]) || [];

    return (
      <div className="flex flex-1 overflow-y-auto p-6">
        <div className="mx-auto w-full max-w-2xl space-y-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-disabled/40">
              <svg
                className="h-8 w-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-ink">
              ATS Analysis Complete
            </h2>
            <p className="mt-1 text-muted">
              Your resume has been analyzed against the target role. Review the
              findings below, then view your optimized resume.
            </p>
          </div>

          <div className="rounded-md border border-hairline bg-canvas p-6">
            <div className="mb-4">
              <div className="mb-4 flex items-center justify-center gap-6">
                {prevScore !== undefined && (
                  <>
                    <div className="text-center">
                      <div className="mb-1 text-xs text-muted">Original</div>
                      <div
                        className={`text-xl font-bold ${
                          prevScore >= 80
                            ? "text-green-600"
                            : prevScore >= 60
                              ? "text-yellow-600"
                              : "text-error"
                        }`}
                      >
                        {prevScore}%
                      </div>
                    </div>
                    <div className="text-2xl text-hairline">→</div>
                  </>
                )}
                <div className="text-center">
                  <div className="mb-1 text-xs text-muted">Optimized</div>
                  <div
                    className={`text-2xl font-bold ${
                      score >= 80
                        ? "text-green-600"
                        : score >= 60
                          ? "text-yellow-600"
                          : "text-error"
                    }`}
                  >
                    {score}%
                  </div>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-strong">
                <div
                  className={`h-2 rounded-full transition-all ${
                    score >= 80
                      ? "bg-green-500"
                      : score >= 60
                        ? "bg-yellow-500"
                        : "bg-primary"
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>

            <div className="space-y-4">
              {strengths.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-green-700">
                    Strengths
                  </h4>
                  <ul className="space-y-1">
                    {strengths.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-body"
                      >
                        <span className="mt-0.5 text-green-500">&#10003;</span>{" "}
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {weaknesses.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-amber-700">
                    Weaknesses
                  </h4>
                  <ul className="space-y-1">
                    {weaknesses.map((w, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-body"
                      >
                        <span className="mt-0.5 text-amber-500">&#9888;</span>{" "}
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {includedKeywords.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-error">
                    Missing Keywords — Added to Your Resume
                  </h4>
                  <div className="space-y-1.5">
                    {includedKeywords.map((kw, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded bg-surface-soft px-2 py-1 text-sm"
                      >
                        <span className="font-bold text-primary">&#10007;</span>
                        <span className="text-body">{kw}</span>
                        <span className="text-xs text-green-600">
                          added to resume
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {missingKeywords.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-error">
                    Still Missing
                  </h4>
                  <div className="space-y-1.5">
                    {missingKeywords.map((kw, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded bg-surface-soft px-2 py-1 text-sm"
                      >
                        <span className="font-bold text-primary">&#10007;</span>
                        <span className="text-error">{kw}</span>
                        <span className="text-xs text-muted">not in resume</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {recommendations.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-purple-700">
                    Recommendations
                  </h4>
                  <ul className="space-y-1">
                    {recommendations.map((r, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-body"
                      >
                        <span className="mt-0.5 text-purple-500">
                          &#128161;
                        </span>{" "}
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setStep("editor-preview")}
            className="flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-6 py-4 text-base font-semibold text-white hover:bg-primary-active"
          >
            View Optimized Resume
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (step === "editor-preview" && generateResult) {
    const data = generateResult.resume_data as Record<string, unknown>;

    return (
      <div className="flex flex-1 flex-col min-h-0">
        <EditorPreview
          initialData={data}
          generateResult={generateResult}
          onDownloadAll={handleDownloadAll}
        />
      </div>
    );
  }

  return null;
}
