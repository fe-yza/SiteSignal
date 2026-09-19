import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const toneClasses = {
  neutral: "bg-surface-subtle text-muted-foreground border-border",
  accent: "bg-accent-subtle text-accent border-transparent",
  critical: "bg-critical-subtle text-critical border-transparent",
  warning: "bg-warning-subtle text-warning border-transparent",
  success: "bg-success-subtle text-success border-transparent",
  opportunity: "bg-opportunity-subtle text-opportunity border-transparent",
} as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof toneClasses;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
