import type { Metadata } from "next";

import { AuditGate } from "@/components/audit-gate";
import { PageShell } from "@/components/page-shell";
import { listIssues } from "@/lib/api/audit-data";
import { getLatestAudit } from "@/lib/api/audits";

import { IssuesTable } from "./issues-table";

export const metadata: Metadata = { title: "Issues" };

export default async function IssuesPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;
  const audit = await getLatestAudit(websiteId);

  const gate = <AuditGate websiteId={websiteId} audit={audit} noun="issues" />;
  if (!audit || audit.status !== "completed") {
    return (
      <PageShell
        title="Issues"
        description="Every individual issue found in the latest audit, one row per page."
      >
        {gate}
      </PageShell>
    );
  }

  const issues = await listIssues(websiteId, audit.id);

  return (
    <PageShell
      title="Issues"
      description={
        issues.length === 0
          ? "No issues found in the latest audit."
          : `${issues.length} issues found across ${new Set(issues.map((i) => i.page_id)).size} pages.`
      }
    >
      <IssuesTable websiteId={websiteId} issues={issues} />
    </PageShell>
  );
}
