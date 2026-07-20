export interface ResumeListItem {
  id: string;
  title: string;
  target_role: string | null;
  template: { id: string; name: string } | null;
  updated_at: string;
}

export interface ResumeListResponse {
  items: ResumeListItem[];
  page: number;
  limit: number;
  total: number;
}

export interface ResumeDetail {
  id: string;
  title: string;
  template_id: string | null;
  resume_data: Record<string, unknown>;
  ats_analysis: Record<string, unknown> | null;
  cover_letter: Record<string, unknown> | null;
  target_role: string | null;
}

export interface CreateResumeRequest {
  title: string;
}

export interface CreateResumeResponse {
  id: string;
  title: string;
}

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
}

export interface ExperienceEntry {
  company: string;
  position: string;
  description: string;
  start_date: string;
  end_date: string;
}

export interface ProjectEntry {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
}

export interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  start_date: string;
  end_date: string;
}

export interface ResumeData {
  personal_info: PersonalInfo;
  summary: string;
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: string[];
  education: EducationEntry[];
}
