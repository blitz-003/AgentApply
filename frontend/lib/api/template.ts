import { api } from "./client";
import type { Template } from "@/types/template";

export const templateApi = {
  list: () => api.get<Template[]>("/templates"),
};
