export interface ATSAnalysis {
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  missing_keywords: string[];
}

export interface GenerateResponse {
  resume_data: Record<string, unknown>;
  cover_letter: Record<string, unknown>;
  ats_analysis: ATSAnalysis;
}

export interface CoverLetterResponse {
  content: string;
}

export interface SummaryResponse {
  summary: string;
}

export interface ExperienceInput {
  company: string;
  position: string;
  description: string;
}

export interface ExperienceResponse {
  experience: ExperienceInput;
}

export interface ProjectInput {
  title: string;
  description: string;
}

export interface ProjectResponse {
  project: ProjectInput;
}

export interface SkillsResponse {
  skills: string[];
}
