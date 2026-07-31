"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resumeApi } from "@/lib/api/resume";
import { aiApi } from "@/lib/api/ai";
import { downloadAll, generateResumePDF } from "@/lib/pdf/generate-pdf";

export function useResumeDetail(resumeId: string) {
  return useQuery({
    queryKey: ["resume", resumeId],
    queryFn: () => resumeApi.get(resumeId),
    enabled: !!resumeId,
  });
}

export function useUpdateResume(resumeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title?: string; template_id?: string; resume_data?: Record<string, unknown> }) =>
      resumeApi.update(resumeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume", resumeId] });
    },
  });
}

export function useGenerateResume(resumeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { job_description?: string; target_role?: string }) =>
      aiApi.generate(resumeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume", resumeId] });
    },
  });
}

export function useImproveSummary(resumeId: string) {
  return useMutation({
    mutationFn: (summary: string) => aiApi.improveSummary(resumeId, summary),
  });
}

export function useRewriteSummary(resumeId: string) {
  return useMutation({
    mutationFn: (summary: string) => aiApi.rewriteSummary(resumeId, summary),
  });
}

export function useGenerateExperience(resumeId: string) {
  return useMutation({
    mutationFn: (experience: { company: string; position: string; description: string }) =>
      aiApi.generateExperience(resumeId, experience),
  });
}

export function useImproveExperience(resumeId: string) {
  return useMutation({
    mutationFn: (experience: { company: string; position: string; description: string; start_date: string; end_date: string }) =>
      aiApi.improveExperience(resumeId, experience),
  });
}

export function useImproveProject(resumeId: string) {
  return useMutation({
    mutationFn: (project: { title: string; description: string; start_date: string; end_date: string }) =>
      aiApi.improveProject(resumeId, project),
  });
}

export function useSuggestSkills(resumeId: string) {
  return useMutation({
    mutationFn: (skills: string[]) => aiApi.suggestSkills(resumeId, skills),
  });
}

export function useUploadResume(resumeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => resumeApi.upload(resumeId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume", resumeId] });
    },
  });
}

export function useExportResume() {
  return useMutation({
    mutationFn: async (resumeId: string) => {
      const detail = await resumeApi.get(resumeId);
      const resumeData = detail.resume_data as Record<string, unknown>;
      const coverContent =
        ((detail.cover_letter as Record<string, unknown> | null)
          ?.content as string) || "";
      const name =
        (resumeData.personal_info as Record<string, string> | undefined)
          ?.name || detail.title || "Resume";
      if (coverContent) {
        await downloadAll(resumeData, coverContent, name);
      } else {
        await generateResumePDF(resumeData, `${name}_Resume.pdf`);
      }
    },
  });
}
