import { api } from "./client";
import type {
  GenerateResponse,
  ATSAnalysis,
  CoverLetterResponse,
  SummaryResponse,
  ExperienceResponse,
  ProjectResponse,
  SkillsResponse,
} from "@/types/ai";

export const aiApi = {
  generate: (resumeId: string, data: { job_description?: string; target_role?: string }) =>
    api.post<GenerateResponse>(`/resumes/${resumeId}/ai/generate`, data),

  atsAnalysis: (resumeId: string, data: { job_description?: string; target_role?: string }) =>
    api.post<ATSAnalysis>(`/resumes/${resumeId}/ai/ats-analysis`, data),

  coverLetter: (resumeId: string, data: { company_name: string; job_title: string; job_description: string }) =>
    api.post<CoverLetterResponse>(`/resumes/${resumeId}/ai/cover-letter`, data),

  improveSummary: (resumeId: string, summary: string) =>
    api.post<SummaryResponse>(`/resumes/${resumeId}/ai/improve-summary`, { summary }),

  rewriteSummary: (resumeId: string, summary: string) =>
    api.post<SummaryResponse>(`/resumes/${resumeId}/ai/rewrite-summary`, { summary }),

  generateExperience: (resumeId: string, experience: { company: string; position: string; description: string }) =>
    api.post<ExperienceResponse>(`/resumes/${resumeId}/ai/generate-experience`, { experience }),

  improveExperience: (resumeId: string, experience: { company: string; position: string; description: string }) =>
    api.post<ExperienceResponse>(`/resumes/${resumeId}/ai/improve-experience`, { experience }),

  improveProject: (resumeId: string, project: { title: string; description: string }) =>
    api.post<ProjectResponse>(`/resumes/${resumeId}/ai/improve-project`, { project }),

  suggestSkills: (resumeId: string, skills: string[]) =>
    api.post<SkillsResponse>(`/resumes/${resumeId}/ai/suggest-skills`, { skills }),
};
