"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resumeApi } from "@/lib/api/resume";
import { useState } from "react";

export function useResumeList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const query = useQuery({
    queryKey: ["resumes", search, page],
    queryFn: () => resumeApi.list({ search, page, limit }),
  });

  return {
    ...query,
    search,
    setSearch,
    page,
    setPage,
    limit,
  };
}

export function useCreateResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resumeApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
  });
}

export function useDeleteResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resumeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
  });
}
