"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resumeApi } from "@/lib/api/resume";
import { aiApi } from "@/lib/api/ai";

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

export function useAtsAnalysis(resumeId: string) {
  return useQuery({
    queryKey: ["atsAnalysis", resumeId],
    queryFn: () => aiApi.getAtsAnalysis(resumeId),
    enabled: !!resumeId,
  });
}

export function useImproveSummary(resumeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (summary: string) => aiApi.improveSummary(resumeId, summary),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume", resumeId] });
    },
  });
}

export function useRewriteSummary(resumeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (summary: string) => aiApi.rewriteSummary(resumeId, summary),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume", resumeId] });
    },
  });
}

export function useGenerateExperience(resumeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (experience: { company: string; position: string; description: string }) =>
      aiApi.generateExperience(resumeId, experience),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume", resumeId] });
    },
  });
}

export function useImproveExperience(resumeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (experience: { company: string; position: string; description: string }) =>
      aiApi.improveExperience(resumeId, experience),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume", resumeId] });
    },
  });
}

export function useImproveProject(resumeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (project: { title: string; description: string }) =>
      aiApi.improveProject(resumeId, project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume", resumeId] });
    },
  });
}

export function useSuggestSkills(resumeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (skills: string[]) => aiApi.suggestSkills(resumeId, skills),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume", resumeId] });
    },
  });
}

export function useCoverLetters(resumeId: string) {
  return useQuery({
    queryKey: ["coverLetters", resumeId],
    queryFn: () => aiApi.listCoverLetters(resumeId),
    enabled: !!resumeId,
  });
}

export function useDeleteCoverLetter(resumeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (coverLetterId: string) => aiApi.deleteCoverLetter(resumeId, coverLetterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coverLetters", resumeId] });
    },
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
      const blob = await resumeApi.export(resumeId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
  });
}

export function useFillFields(resumeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { job_description?: string; target_role?: string }) =>
      aiApi.fillFields(resumeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume", resumeId] });
    },
  });
}
