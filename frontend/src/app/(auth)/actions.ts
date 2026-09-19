"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/auth";

export interface AuthActionState {
  error?: string;
}

function readCredentials(formData: FormData): { email: string; password: string } | null {
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return null;
  }
  return { email, password };
}

export async function loginAction(
  _prevState: AuthActionState | undefined,
  formData: FormData
): Promise<AuthActionState> {
  const credentials = readCredentials(formData);
  if (!credentials) {
    return { error: "Enter your email and password." };
  }

  try {
    await signIn("credentials", { ...credentials, redirect: false });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw err;
  }

  redirect("/dashboard");
}

export async function registerAction(
  _prevState: AuthActionState | undefined,
  formData: FormData
): Promise<AuthActionState> {
  const credentials = readCredentials(formData);
  if (!credentials) {
    return { error: "Enter your email and password." };
  }
  if (credentials.password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const res = await fetch(`${process.env.BACKEND_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    return { error: data?.detail ?? "Couldn't create your account. Please try again." };
  }

  try {
    await signIn("credentials", { ...credentials, redirect: false });
  } catch {
    return { error: "Your account was created — please log in." };
  }

  redirect("/dashboard");
}
