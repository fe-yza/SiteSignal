"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { AuthActionState } from "./actions";

interface AuthFormProps {
  action: (state: AuthActionState | undefined, formData: FormData) => Promise<AuthActionState>;
  title: string;
  subtitle: string;
  submitLabel: string;
  footer: { prompt: string; linkLabel: string; href: string };
}

export function AuthForm({ action, title, subtitle, submitLabel, footer }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <div className="border-t border-border-strong py-8">
      <h1 className="editorial-title text-4xl text-foreground">{title}</h1>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>

      <form action={formAction} className="mt-6 space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            placeholder="••••••••"
          />
        </div>

        {state?.error && (
          <p role="alert" className="rounded-md bg-critical-subtle px-3 py-2 text-sm text-critical">
            {state.error}
          </p>
        )}

        <Button type="submit" className="w-full" loading={pending}>
          {submitLabel}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {footer.prompt}{" "}
        <Link href={footer.href} className="font-medium text-accent hover:text-accent-hover">
          {footer.linkLabel}
        </Link>
      </p>
    </div>
  );
}
