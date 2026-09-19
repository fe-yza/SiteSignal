"use client";

import Link from "next/link";
import { useActionState } from "react";

import { addWebsiteAction } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddWebsiteForm() {
  const [state, formAction, pending] = useActionState(addWebsiteAction, undefined);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="url" className="text-sm font-medium text-foreground">
          Website URL
        </label>
        <Input id="url" name="url" type="text" required placeholder="https://example.com" autoFocus />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-md bg-critical-subtle px-3 py-2 text-sm text-critical">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button type="submit" loading={pending}>
          Add website
        </Button>
        <Link
          href="/dashboard"
          className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
