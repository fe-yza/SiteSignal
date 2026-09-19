import type { Metadata } from "next";

import { AuthForm } from "../auth-form";
import { loginAction } from "../actions";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <AuthForm
      action={loginAction}
      title="Log in"
      subtitle="Welcome back. Enter your details to continue."
      submitLabel="Log in"
      footer={{ prompt: "Don't have an account?", linkLabel: "Sign up", href: "/register" }}
    />
  );
}
