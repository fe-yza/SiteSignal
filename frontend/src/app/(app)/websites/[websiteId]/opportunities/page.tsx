import type { Metadata } from "next";

import { AuditGate } from "@/components/audit-gate";
import { PageShell } from "@/components/page-shell";
import { SectionIntro } from "@/components/section-intro";
import { SeverityBadge } from "@/components/severity-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { listOpportunities } from "@/lib/api/audit-data";
import { getLatestAudit } from "@/lib/api/audits";
import { getCurrentUser } from "@/lib/api/users";
import { formatCategory } from "@/lib/labels";

export const metadata: Metadata = { title: "Opportunities" };

export default async function OpportunitiesPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;
  const audit = await getLatestAudit(websiteId);

  const gate = <AuditGate websiteId={websiteId} audit={audit} noun="opportunities" />;
  if (!audit || audit.status !== "completed") {
    return (
      <PageShell
        title="Opportunities"
        description="Ranked, prioritized fixes — grouped by issue type, not one row per page."
      >
        {gate}
      </PageShell>
    );
  }

  const [opportunities, user] = await Promise.all([
    listOpportunities(websiteId, audit.id),
    getCurrentUser(),
  ]);

  return (
    <PageShell
      title="Opportunities"
      description="Ranked, prioritized fixes — grouped by issue type, not one row per page. Higher score means more impact for the effort."
    >
      <SectionIntro hintKey="opportunities" dismissedHints={user.dismissed_hints} title="What you're looking at">
        Each row groups every page with the same issue into one fix — e.g. &ldquo;7 pages missing
        a title&rdquo; instead of 7 separate rows. The score combines severity, how many pages are
        affected, and how easy it likely is to fix, so the top of the list is where to start.
      </SectionIntro>
      {opportunities.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 px-6 py-16 text-center">
          <h2 className="text-base font-semibold text-foreground">No opportunities found</h2>
          <p className="max-w-sm text-sm text-muted">
            The latest audit didn&apos;t surface any prioritized fixes. That&apos;s a great sign —
            check the Issues tab for anything more minor.
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {opportunities.map((opp) => (
            <li key={opp.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{opp.title}</h3>
                      <SeverityBadge severity={opp.severity} />
                      <Badge tone="neutral">{formatCategory(opp.category)}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{opp.explanation}</p>
                    <p className="mt-2 text-sm text-foreground">
                      <span className="font-medium">Recommended: </span>
                      {opp.recommended_action}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-semibold text-accent">{opp.score.toFixed(1)}</p>
                    <p className="text-xs text-muted">score</p>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
