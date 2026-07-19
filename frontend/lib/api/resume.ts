import { api } from "./client";
import type {
  ResumeListResponse,
  ResumeDetail,
  CreateResumeRequest,
  CreateResumeResponse,
  ResumeData,
} from "@/types/resume";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const resumeApi = {
  list: (params?: { search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    const query = searchParams.toString();
    return api.get<ResumeListResponse>(`/resumes${query ? `?${query}` : ""}`);
  },
  get: (id: string) => api.get<ResumeDetail>(`/resumes/${id}`),
  create: (data: CreateResumeRequest) =>
    api.post<CreateResumeResponse>("/resumes", data),
  update: (id: string, data: { title?: string; template_id?: string; resume_data?: Record<string, unknown> }) =>
    api.patch<{ message: string }>(`/resumes/${id}`, data),
  delete: (id: string) => api.delete<void>(`/resumes/${id}`),
  upload: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("resume", file);
    return api.upload<ResumeData>(`/resumes/${id}/upload`, formData);
  },
  export: async (id: string): Promise<Blob> => {
    const url = `${API_BASE_URL}/resumes/${id}/export`;
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Export failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.blob();
  },
};
