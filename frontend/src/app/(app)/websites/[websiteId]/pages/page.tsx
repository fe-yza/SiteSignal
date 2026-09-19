import type { Metadata } from "next";

import { AuditGate } from "@/components/audit-gate";
import { PageShell } from "@/components/page-shell";
import { SectionIntro } from "@/components/section-intro";
import { listPages } from "@/lib/api/audit-data";
import { getLatestAudit } from "@/lib/api/audits";
import { getCurrentUser } from "@/lib/api/users";

import { PagesTable } from "./pages-table";

export const metadata: Metadata = { title: "Pages" };

export default async function PagesListPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;
  const audit = await getLatestAudit(websiteId);

  const gate = <AuditGate websiteId={websiteId} audit={audit} noun="pages" />;
  if (!audit || audit.status !== "completed") {
    return (
      <PageShell title="Pages" description="Every page we crawled, with its key SEO signals.">
        {gate}
      </PageShell>
    );
  }

  const [pages, user] = await Promise.all([listPages(websiteId, audit.id), getCurrentUser()]);

  return (
    <PageShell title="Pages" description={`${pages.length} pages crawled in the latest audit.`}>
      <SectionIntro hintKey="pages" dismissedHints={user.dismissed_hints} title="What you're looking at">
        Every page from the latest crawl, with its status, word count, and how many issues it has.
        Sort or search to find a specific page, then click into it for the full detail.
      </SectionIntro>
      <PagesTable websiteId={websiteId} pages={pages} />
    </PageShell>
  );
}
