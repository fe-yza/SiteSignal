"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { backendRequest } from "@/lib/backend-http.mjs";

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
      return { error: err.type === "CredentialsSignin"
        ? "Invalid email or password."
        : "Login could not reach the server. Please try again in a moment." };
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

  let res: Response;
  try {
    res = await backendRequest("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
  } catch {
    return { error: "Account creation is temporarily unavailable. Please try again in a moment." };
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const detail = data?.detail;
    // FastAPI validation errors contain an array, which React cannot render.
    const error = typeof detail === "string"
      ? detail
      : Array.isArray(detail)
        ? detail.map((item: { msg?: unknown }) =>
            typeof item.msg === "string" ? item.msg : "Check your email and password."
          ).join(" ")
        : "Couldn't create your account. Please try again.";
    return { error };
  }

  try {
    await signIn("credentials", { ...credentials, redirect: false });
  } catch {
    return { error: "Your account was created — please log in." };
  }

  redirect("/dashboard");
}
