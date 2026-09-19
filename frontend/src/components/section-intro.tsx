"use client";

import { Lightbulb, X } from "lucide-react";
import { useState } from "react";

import { dismissHintAction } from "@/app/(app)/actions";

/**
 * A one-time contextual callout for a section (Opportunities, Pages, Page
 * detail, ...). Shown the first time a user reaches that section and never
 * again once dismissed — persisted per-user via the backend's
 * dismissed_hints, not local/session storage, so it stays dismissed across
 * devices and sessions.
 */
export function SectionIntro({
  hintKey,
  dismissedHints,
  title,
  children,
}: {
  hintKey: string;
  dismissedHints: string[];
  title: string;
  children: React.ReactNode;
}) {
  const [dismissed, setDismissed] = useState(dismissedHints.includes(hintKey));

  if (dismissed) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-accent/30 bg-accent-subtle px-4 py-3">
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
      <div className="flex-1 text-sm">
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-muted-foreground">{children}</p>
      </div>
      <button
        onClick={() => {
          setDismissed(true);
          void dismissHintAction(hintKey);
        }}
        className="rounded p-1 text-muted hover:bg-surface hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
