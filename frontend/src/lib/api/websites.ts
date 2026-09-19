import "server-only";

import { backendFetch } from "@/lib/backend";
import type { Website } from "@/lib/types";

export function listWebsites(): Promise<Website[]> {
  return backendFetch<Website[]>("/api/websites");
}

export function getWebsite(id: string): Promise<Website> {
  return backendFetch<Website>(`/api/websites/${id}`);
}
