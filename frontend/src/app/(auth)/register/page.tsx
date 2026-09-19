import type { Metadata } from "next";

import { AuthForm } from "../auth-form";
import { registerAction } from "../actions";

export const metadata: Metadata = { title: "Sign up" };

export default function RegisterPage() {
  return (
    <AuthForm
      action={registerAction}
      title="Create your account"
      subtitle="Start auditing your website in under a minute."
      submitLabel="Create account"
      footer={{ prompt: "Already have an account?", linkLabel: "Log in", href: "/login" }}
    />
  );
}
