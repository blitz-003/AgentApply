import { api } from "./client";
import type {
  ResumeListResponse,
  CreateResumeRequest,
  CreateResumeResponse,
} from "@/types/resume";

export const resumeApi = {
  list: (params?: { search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    const query = searchParams.toString();
    return api.get<ResumeListResponse>(`/resumes${query ? `?${query}` : ""}`);
  },
  create: (data: CreateResumeRequest) =>
    api.post<CreateResumeResponse>("/resumes", data),
  delete: (id: string) => api.delete<void>(`/resumes/${id}`),
};
