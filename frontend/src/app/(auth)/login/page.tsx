import type { Metadata } from "next";

import { AuthForm } from "../auth-form";
import { loginAction } from "../actions";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  return (
    <AuthForm
      action={loginAction}
      title="Log in"
      subtitle={reason === "session-expired"
        ? "Your session has expired. Please log in again to continue."
        : "Welcome back. Enter your details to continue."}
      submitLabel="Log in"
      footer={{ prompt: "Don't have an account?", linkLabel: "Sign up", href: "/register" }}
    />
  );
}
