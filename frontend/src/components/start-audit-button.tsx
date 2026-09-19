"use client";

import { useActionState } from "react";

import { startAuditAction, type StartAuditState } from "@/app/(app)/websites/[websiteId]/actions";
import { Button } from "@/components/ui/button";

export function StartAuditButton({
  websiteId,
  label = "Start audit",
}: {
  websiteId: string;
  label?: string;
}) {
  const boundAction = startAuditAction.bind(null, websiteId);
  const [state, formAction, pending] = useActionState<StartAuditState | undefined, FormData>(
    boundAction,
    undefined
  );

  return (
    <form action={formAction}>
      <Button type="submit" loading={pending}>
        {label}
      </Button>
      {state?.error && (
        <p role="alert" className="mt-2 text-sm text-critical">
          {state.error}
        </p>
      )}
    </form>
  );
}
