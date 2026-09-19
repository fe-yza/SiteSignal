import "server-only";

import { backendFetch } from "@/lib/backend";

export interface CurrentUser {
  id: string;
  email: string;
  has_seen_intro: boolean;
  dismissed_hints: string[];
}

export function getCurrentUser(): Promise<CurrentUser> {
  return backendFetch<CurrentUser>("/api/auth/me");
}
