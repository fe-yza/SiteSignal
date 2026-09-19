"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { SeverityBadge } from "@/components/severity-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCategory } from "@/lib/labels";
import type { IssueSeverity, SEOIssueWithPage } from "@/lib/types";
import { cn } from "@/lib/utils";

type SeverityFilter = "all" | IssueSeverity;

const SEVERITY_OPTIONS: { value: SeverityFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "opportunity", label: "Opportunity" },
];

export function IssuesTable({
  websiteId,
  issues,
}: {
  websiteId: string;
  issues: SEOIssueWithPage[];
}) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");

  const filtered = useMemo(
    () => issues.filter((issue) => severityFilter === "all" || issue.severity === severityFilter),
    [issues, severityFilter]
  );

  if (issues.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 px-6 py-16 text-center">
        <h2 className="text-base font-semibold text-foreground">No issues found</h2>
        <p className="max-w-sm text-sm text-muted">
          The latest audit didn&apos;t find any SEO issues on this site. Nice work.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex gap-1 rounded-md border border-border p-0.5 w-fit">
        {SEVERITY_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setSeverityFilter(option.value)}
            className={cn(
              "rounded px-2.5 py-1 text-xs font-medium transition-colors",
              severityFilter === option.value
                ? "bg-accent-subtle text-accent"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="mt-4 flex flex-col items-center gap-1 px-6 py-14 text-center">
          <p className="text-sm font-semibold text-foreground">No issues match this filter</p>
          <p className="text-sm text-muted">Try a different severity.</p>
        </Card>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {filtered.map((issue) => (
            <li key={issue.id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={issue.severity} />
                  <Badge tone="neutral">{formatCategory(issue.category)}</Badge>
                  <Link
                    href={`/websites/${websiteId}/pages/${issue.page_id}`}
                    className="truncate text-xs text-muted hover:text-accent"
                  >
                    {issue.page_url}
                  </Link>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{issue.explanation}</p>
                <p className="mt-1 text-sm text-foreground">
                  <span className="font-medium">Recommended: </span>
                  {issue.recommended_action}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
