import type { Metadata } from "next";
import Link from "next/link";

import { AuditProgress } from "@/components/audit-progress";
import { IssuesByCategoryChart } from "@/components/charts/issues-by-category-chart";
import { SeverityBadge } from "@/components/severity-badge";
import { StartAuditButton } from "@/components/start-audit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listIssues, listOpportunities } from "@/lib/api/audit-data";
import { getLatestAudit } from "@/lib/api/audits";
import { computeSiteHealth } from "@/lib/site-health";
import type { IssueCategory } from "@/lib/types";

export const metadata: Metadata = { title: "Overview" };

const ALL_CATEGORIES: IssueCategory[] = [
  "technical",
  "on_page",
  "content",
  "internal_linking",
  "indexability",
];

export default async function WebsiteOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ websiteId: string }>;
  searchParams: Promise<{ justAdded?: string }>;
}) {
  const { websiteId } = await params;
  const { justAdded } = await searchParams;
  const audit = await getLatestAudit(websiteId);

  if (!audit) {
    return <NoAuditYet websiteId={websiteId} justAdded={justAdded === "1"} />;
  }

  if (audit.status === "pending" || audit.status === "crawling" || audit.status === "analyzing") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted">
          Your audit is running — this page updates automatically as it progresses.
        </p>
        <div className="mt-6">
          <AuditProgress websiteId={websiteId} initialAudit={audit} />
        </div>
      </div>
    );
  }

  if (audit.status === "failed") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Overview</h1>
        <Card className="mt-6 border-critical/30 p-6">
          <p className="text-sm font-semibold text-critical">The last audit couldn&apos;t finish</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {audit.error_message ?? "Something went wrong while crawling this website."}
          </p>
          <div className="mt-4">
            <StartAuditButton websiteId={websiteId} label="Try again" />
          </div>
        </Card>
      </div>
    );
  }

  const [issues, opportunities] = await Promise.all([
    listIssues(websiteId, audit.id),
    listOpportunities(websiteId, audit.id),
  ]);

  const health = computeSiteHealth(issues);
  const categoryCounts = ALL_CATEGORIES.map((category) => ({
    category,
    count: issues.filter((i) => i.category === category).length,
  }));
  const topOpportunities = opportunities.slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Overview</h1>
            <Badge tone={health.tone}>{health.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            Last audited {new Date(audit.completed_at ?? audit.created_at).toLocaleString()} ·{" "}
            {audit.pages_crawled} pages crawled
          </p>
        </div>
        <StartAuditButton websiteId={websiteId} label="Run new audit" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            {topOpportunities.length === 0 ? (
              <p className="text-sm text-muted">
                No opportunities found in the latest audit — this site is in good shape.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {topOpportunities.map((opp) => (
                  <li
                    key={opp.id}
                    className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{opp.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted">{opp.recommended_action}</p>
                    </div>
                    <SeverityBadge severity={opp.severity} />
                  </li>
                ))}
              </ul>
            )}
            {opportunities.length > 5 && (
              <Link
                href={`/websites/${websiteId}/opportunities`}
                className="mt-4 inline-block text-sm font-medium text-accent hover:text-accent-hover"
              >
                View all {opportunities.length} opportunities →
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Issues by category</CardTitle>
          </CardHeader>
          <CardContent>
            {issues.length === 0 ? (
              <p className="text-sm text-muted">No issues found in the latest audit.</p>
            ) : (
              <IssuesByCategoryChart data={categoryCounts} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NoAuditYet({ websiteId, justAdded }: { websiteId: string; justAdded?: boolean }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      {justAdded && (
        <p className="mb-6 rounded-md bg-success-subtle px-3 py-2 text-sm font-medium text-success">
          Website added — you&apos;re ready to run your first audit.
        </p>
      )}
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        Ready for your first audit
      </h1>
      <p className="mt-2 text-sm text-muted">
        We&apos;ll crawl up to 100 pages on this domain — that usually takes under a minute — and
        surface the technical and on-page SEO issues holding back your rankings.
      </p>
      <div className="mt-6 flex justify-center">
        <StartAuditButton websiteId={websiteId} />
      </div>
    </div>
  );
}
