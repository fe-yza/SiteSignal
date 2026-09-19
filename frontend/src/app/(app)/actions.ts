"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { signOut } from "@/auth";
import { BackendError, backendFetch } from "@/lib/backend";
import type { Website } from "@/lib/types";

export async function logoutAction() {
  await signOut({ redirect: false });
  redirect("/login");
}

export interface AddWebsiteState {
  error?: string;
}

export async function addWebsiteAction(
  _prevState: AddWebsiteState | undefined,
  formData: FormData
): Promise<AddWebsiteState> {
  const url = formData.get("url");
  if (typeof url !== "string" || !url.trim()) {
    return { error: "Enter a website URL." };
  }

  let website: Website;
  try {
    website = await backendFetch<Website>("/api/websites", {
      method: "POST",
      body: JSON.stringify({ url: url.trim() }),
    });
  } catch (err) {
    if (err instanceof BackendError) return { error: err.message };
    throw err;
  }

  redirect(`/websites/${website.id}?justAdded=1`);
}

export async function dismissIntroAction() {
  await backendFetch("/api/users/me/dismiss-intro", { method: "POST" });
  revalidatePath("/dashboard");
}

export async function dismissHintAction(hintKey: string) {
  await backendFetch("/api/users/me/dismiss-hint", {
    method: "POST",
    body: JSON.stringify({ hint_key: hintKey }),
  });
  revalidatePath("/dashboard");
}
