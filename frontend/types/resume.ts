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
}

export interface CreateResumeRequest {
  title: string;
}

export interface CreateResumeResponse {
  id: string;
  title: string;
}
