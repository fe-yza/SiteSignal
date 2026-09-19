"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { BackendError, backendFetch } from "@/lib/backend";
import type { Audit } from "@/lib/types";

export interface StartAuditState {
  error?: string;
}

export async function startAuditAction(
  websiteId: string,
  _prevState: StartAuditState | undefined,
  _formData: FormData
): Promise<StartAuditState> {
  try {
    await backendFetch<Audit>(`/api/websites/${websiteId}/audits`, { method: "POST" });
  } catch (err) {
    if (err instanceof BackendError) return { error: err.message };
    throw err;
  }
  revalidatePath(`/websites/${websiteId}`);
  return {};
}

export async function deleteWebsiteAction(websiteId: string): Promise<{ error?: string }> {
  try {
    await backendFetch(`/api/websites/${websiteId}`, { method: "DELETE" });
  } catch (err) {
    if (err instanceof BackendError) return { error: err.message };
    throw err;
  }
  redirect("/dashboard");
}
