import { AuditProgress } from "@/components/audit-progress";
import { NoAuditEmptyState } from "@/components/no-audit-empty-state";
import { StartAuditButton } from "@/components/start-audit-button";
import { Card } from "@/components/ui/card";
import type { Audit } from "@/lib/types";

/**
 * Renders the right thing when the latest audit isn't ready for a section to
 * show real data: no audit yet, one in progress, or the last one failed.
 * Returns null when the audit is `completed`, meaning the caller should
 * render its real content instead.
 */
export function AuditGate({
  websiteId,
  audit,
  noun,
}: {
  websiteId: string;
  audit: Audit | null;
  noun: string;
}) {
  if (!audit) {
    return <NoAuditEmptyState websiteId={websiteId} noun={noun} />;
  }

  if (audit.status === "pending" || audit.status === "crawling" || audit.status === "analyzing") {
    return <AuditProgress websiteId={websiteId} initialAudit={audit} />;
  }

  if (audit.status === "failed") {
    return (
      <Card className="border-critical/30 p-6">
        <p className="text-sm font-semibold text-critical">The last audit couldn&apos;t finish</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {audit.error_message ?? "Something went wrong while crawling this website."}
        </p>
        <div className="mt-4">
          <StartAuditButton websiteId={websiteId} label="Try again" />
        </div>
      </Card>
    );
  }

  return null;
}
