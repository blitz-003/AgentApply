export interface ATSAnalysis {
  id?: string;
  resume_id?: string;
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  missing_keywords: string[];
  analyzed_at?: string;
}

export interface GenerateResponse {
  resume_data: Record<string, unknown>;
  cover_letter: Record<string, unknown>;
  ats_analysis: ATSAnalysis;
}

export interface CoverLetter {
  id: string;
  company_name: string;
  job_title: string;
  content: string;
  created_at?: string;
}

export interface CoverLetterListResponse {
  items: CoverLetter[];
}

export interface CoverLetterResponse {
  id: string;
  company_name: string;
  job_title: string;
  content: string;
  created_at?: string;
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

export interface FillFieldsResponse {
  resume_data: Record<string, unknown>;
}
