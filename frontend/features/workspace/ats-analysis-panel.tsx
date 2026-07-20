"use client";

import { useAtsAnalysis } from "./hooks";

interface ATSAnalysisPanelProps {
  resumeId: string;
  onSaveAndAnalyze: () => void;
  isAnalyzing: boolean;
}

export function ATSAnalysisPanel({ resumeId, onSaveAndAnalyze, isAnalyzing }: ATSAnalysisPanelProps) {
  const { data: analysis, isLoading, isError } = useAtsAnalysis(resumeId);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Loading ATS analysis...
          </span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Failed to load ATS analysis.
        </p>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Running ATS analysis...
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
            AI is analyzing your resume. This may take a moment.
          </p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
          No ATS analysis yet.
        </p>
        <button
          onClick={onSaveAndAnalyze}
          className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Save &amp; Run Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onSaveAndAnalyze}
        className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Analyze Again
      </button>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            ATS Match Score
          </span>
          <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {analysis.overall_score}/100
          </span>
        </div>
      </div>

      {analysis.strengths && analysis.strengths.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            Strengths
          </h3>
          <ul className="mt-2 space-y-1">
            {analysis.strengths.map((s, i) => (
              <li
                key={i}
                className="text-sm text-zinc-600 dark:text-zinc-400"
              >
                + {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.weaknesses && analysis.weaknesses.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            Weaknesses
          </h3>
          <ul className="mt-2 space-y-1">
            {analysis.weaknesses.map((w, i) => (
              <li
                key={i}
                className="text-sm text-zinc-600 dark:text-zinc-400"
              >
                - {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.missing_keywords &&
        analysis.missing_keywords.length > 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Missing Keywords
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {analysis.missing_keywords.map((kw, i) => (
                <span
                  key={i}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

      {analysis.recommendations &&
        analysis.recommendations.length > 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Recommendations
            </h3>
            <ul className="mt-2 space-y-1">
              {analysis.recommendations.map((r, i) => (
                <li
                  key={i}
                  className="text-sm text-zinc-600 dark:text-zinc-400"
                >
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
    </div>
  );
}
