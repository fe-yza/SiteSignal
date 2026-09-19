import "server-only";

import { BackendError, backendFetch } from "@/lib/backend";
import type { Audit } from "@/lib/types";

export function listAudits(websiteId: string): Promise<Audit[]> {
  return backendFetch<Audit[]>(`/api/websites/${websiteId}/audits`);
}

export async function getLatestAudit(websiteId: string): Promise<Audit | null> {
  try {
    return await backendFetch<Audit>(`/api/websites/${websiteId}/audits/latest`);
  } catch (err) {
    if (err instanceof BackendError && err.status === 404) return null;
    throw err;
  }
}

export function getAudit(websiteId: string, auditId: string): Promise<Audit> {
  return backendFetch<Audit>(`/api/websites/${websiteId}/audits/${auditId}`);
}
