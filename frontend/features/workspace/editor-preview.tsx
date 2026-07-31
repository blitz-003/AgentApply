"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { renderResumeHtml, renderCoverLetterHtml, type ResumeData } from "@/lib/pdf/generate-pdf";
import { resumeToText, textToResumeData } from "@/lib/resume-text";
import type { GenerateResponse } from "@/types/ai";

interface EditorPreviewProps {
  initialData: Record<string, unknown>;
  generateResult?: GenerateResponse | null;
  onDownloadAll?: () => void;
  onChange?: (data: Record<string, unknown>) => void;
}

type ViewMode = "resume" | "coverletter";

export function EditorPreview({ initialData, generateResult, onDownloadAll, onChange }: EditorPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("resume");
  const [text, setText] = useState(() => resumeToText(initialData));
  const [previewData, setPreviewData] = useState(initialData);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const coverLetterContent = generateResult?.cover_letter as Record<string, unknown> | undefined;
  const [coverText, setCoverText] = useState(() => (coverLetterContent?.content as string) || "");

  const [prevInitialData, setPrevInitialData] = useState(initialData);
  if (prevInitialData !== initialData) {
    setPrevInitialData(initialData);
    setText(resumeToText(initialData));
    setPreviewData(initialData);
    setCoverText((coverLetterContent?.content as string) || "");
  }

  useEffect(() => {
    onChange?.(initialData);
  }, [initialData, onChange]);

  const handleChange = useCallback((value: string) => {
    setText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const parsed = textToResumeData(value);
      setPreviewData(parsed);
      onChange?.(parsed);
    }, 300);
  }, [onChange]);

  const previewHtml = useMemo(() => {
    try {
      return renderResumeHtml(previewData as ResumeData);
    } catch {
      return '<div style="padding: 20px; color: #999;">Preview unavailable</div>';
    }
  }, [previewData]);

  const coverLetterHtml = useMemo(() => {
    try {
      return renderCoverLetterHtml({
        content: coverText,
        job_title: (coverLetterContent?.job_title as string) || "",
        company_name: (coverLetterContent?.company_name as string) || "",
      });
    } catch {
      return '<div style="padding: 20px; color: #999;">Cover letter preview unavailable</div>';
    }
  }, [coverText, coverLetterContent]);

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="grid grid-cols-3 items-center border-b border-hairline px-6 py-2 shrink-0">
        <div />
        <div className="flex justify-center">
          <div className="flex items-center gap-1 rounded-full border border-hairline bg-surface-soft p-1">
            <button
              onClick={() => setViewMode("resume")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "resume"
                  ? "bg-canvas text-ink shadow-card"
                  : "text-muted hover:text-ink"
              }`}
            >
              Resume
            </button>
            <button
              onClick={() => setViewMode("coverletter")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "coverletter"
                  ? "bg-canvas text-ink shadow-card"
                  : "text-muted hover:text-ink"
              }`}
            >
              Cover Letter
            </button>
          </div>
        </div>
        <div className="flex justify-end">
          {onDownloadAll && (
            <button
              onClick={onDownloadAll}
              className="flex items-center gap-2 rounded-sm bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-active"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download All
            </button>
          )}
        </div>
      </div>

      {viewMode === "resume" ? (
        <div className="flex flex-1 min-h-0">
          <div className="flex w-1/2 flex-col min-h-0">
            <div className="flex items-center justify-between border-b border-hairline px-4 py-2 shrink-0">
              <span className="text-sm font-medium text-muted">Editor</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => handleChange(e.target.value)}
              className="flex-1 resize-none border-0 bg-surface-soft p-4 font-mono text-xs leading-relaxed text-ink outline-none focus:bg-canvas min-h-0"
              spellCheck={false}
            />
          </div>

          <div className="flex w-1/2 flex-col min-h-0">
            <div className="flex items-center justify-between border-b border-hairline px-4 py-2 shrink-0">
              <span className="text-sm font-medium text-muted">Preview</span>
            </div>
            <div className="flex-1 overflow-y-auto bg-surface-strong p-8 min-h-0">
              <div className="mx-auto bg-white shadow-card" style={{ maxWidth: 600, minHeight: 400 }}>
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">
          <div className="flex w-1/2 flex-col min-h-0">
            <div className="flex items-center justify-between border-b border-hairline px-4 py-2 shrink-0">
              <span className="text-sm font-medium text-muted">Editor</span>
            </div>
            <textarea
              value={coverText}
              onChange={(e) => setCoverText(e.target.value)}
              className="flex-1 resize-none border-0 bg-surface-soft p-4 font-mono text-xs leading-relaxed text-ink outline-none focus:bg-canvas min-h-0"
            />
          </div>

          <div className="flex w-1/2 flex-col min-h-0">
            <div className="flex items-center justify-between border-b border-hairline px-4 py-2 shrink-0">
              <span className="text-sm font-medium text-muted">Preview</span>
            </div>
            <div className="flex-1 overflow-y-auto bg-surface-strong p-8 min-h-0">
              <div className="mx-auto bg-white shadow-card overflow-hidden" style={{ width: 600, height: 849 }}>
                <div style={{ width: 800, transform: 'scale(0.75)', transformOrigin: 'top left' }}>
                  <div dangerouslySetInnerHTML={{ __html: coverLetterHtml }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
