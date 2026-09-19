import type { Metadata } from "next";
import Link from "next/link";

import { AuditGate } from "@/components/audit-gate";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { listInternalLinks } from "@/lib/api/audit-data";
import { getLatestAudit } from "@/lib/api/audits";

export const metadata: Metadata = { title: "Internal Links" };

export default async function InternalLinksPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;
  const audit = await getLatestAudit(websiteId);

  const gate = <AuditGate websiteId={websiteId} audit={audit} noun="internal link data" />;
  if (!audit || audit.status !== "completed") {
    return (
      <PageShell
        title="Internal Links"
        description="How pages on this site link to each other — incoming and outgoing counts."
      >
        {gate}
      </PageShell>
    );
  }

  const links = await listInternalLinks(websiteId, audit.id);
  const fewLinkedCount = links.filter((l) => l.few_incoming_links).length;

  return (
    <PageShell
      title="Internal Links"
      description={
        fewLinkedCount > 0
          ? `${fewLinkedCount} page(s) have very few internal links pointing to them.`
          : "Every page has a healthy number of internal links pointing to it."
      }
    >
      {links.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 px-6 py-16 text-center">
          <h2 className="text-base font-semibold text-foreground">No link data yet</h2>
          <p className="max-w-sm text-sm text-muted">Run an audit to see internal link counts.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-subtle">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  URL
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                  Incoming links
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                  Outgoing links
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr
                  key={link.page_id}
                  className="border-b border-border last:border-0 hover:bg-surface-subtle"
                >
                  <td className="max-w-sm truncate px-4 py-2.5">
                    <Link
                      href={`/websites/${websiteId}/pages/${link.page_id}`}
                      className="text-foreground hover:text-accent"
                      title={link.url}
                    >
                      {link.url}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right text-foreground">{link.incoming_count}</td>
                  <td className="px-4 py-2.5 text-right text-foreground">{link.outgoing_count}</td>
                  <td className="px-4 py-2.5">
                    {link.few_incoming_links ? (
                      <Badge tone="warning">Few incoming links</Badge>
                    ) : (
                      <Badge tone="success">Healthy</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
