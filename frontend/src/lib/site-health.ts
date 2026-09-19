import type { IssueSeverity } from "@/lib/types";

export interface SiteHealth {
  label: string;
  tone: "success" | "warning" | "critical";
}

// A simple, transparent indicator derived directly from real issue counts —
// deliberately not a fabricated composite "SEO score." Secondary to the
// Top Opportunities list, never the headline metric.
export function computeSiteHealth(issues: { severity: IssueSeverity }[]): SiteHealth {
  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  if (criticalCount > 0) return { label: "Needs attention", tone: "critical" };
  if (warningCount > 0) return { label: "Fair", tone: "warning" };
  return { label: "Good", tone: "success" };
}
