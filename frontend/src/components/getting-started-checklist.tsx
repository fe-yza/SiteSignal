import { Check, X } from "lucide-react";
import Link from "next/link";

import { dismissIntroAction } from "@/app/(app)/actions";
import { cn } from "@/lib/utils";

export interface ChecklistStep {
  label: string;
  done: boolean;
  href: string;
}

export function GettingStartedChecklist({ steps }: { steps: ChecklistStep[] }) {
  return (
    <div className="mb-8 rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Getting started</h2>
          <p className="mt-0.5 text-sm text-muted">A few steps to get your first real results.</p>
        </div>
        <form action={dismissIntroAction}>
          <button
            type="submit"
            className="rounded p-1 text-muted hover:bg-surface-subtle hover:text-foreground"
            aria-label="Dismiss getting started checklist"
          >
            <X className="size-4" />
          </button>
        </form>
      </div>

      <ol className="mt-4 flex flex-col gap-1">
        {steps.map((step, i) => (
          <li key={step.label}>
            <Link
              href={step.href}
              className="flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-surface-subtle"
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                  step.done
                    ? "border-success bg-success-subtle text-success"
                    : "border-border-strong text-muted"
                )}
              >
                {step.done ? <Check className="size-3" /> : i + 1}
              </span>
              <span className={cn(step.done ? "text-muted line-through" : "text-foreground")}>
                {step.label}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
