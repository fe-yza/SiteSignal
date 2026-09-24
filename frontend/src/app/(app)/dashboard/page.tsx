import { FieldSketch } from "@/components/field-sketch";
import { ArrowUpRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { GettingStartedChecklist, type ChecklistStep } from "@/components/getting-started-checklist";
import { SeverityBadge } from "@/components/severity-badge";
import { listOpportunities } from "@/lib/api/audit-data";
import { Doodle } from "@/components/doodle";
import { LinkButton } from "@/components/ui/link-button";
import { getLatestAudit } from "@/lib/api/audits";
import { getCurrentUser } from "@/lib/api/users";
import { listWebsites } from "@/lib/api/websites";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [websites, user] = await Promise.all([listWebsites(), getCurrentUser()]);

  const audits = await Promise.all(websites.map((website) => getLatestAudit(website.id)));
  const opportunityGroups = await Promise.all(websites.map(async (website, index) => {
    const audit = audits[index];
    if (audit?.status !== "completed") return [];
    const opportunities = await listOpportunities(website.id, audit.id);
    return opportunities.map((opportunity) => ({ ...opportunity, website }));
  }));
  const priorities = opportunityGroups.flat().sort((a, b) => b.score - a.score).slice(0, 5);

  let checklist: ChecklistStep[] | null = null;
  if (!user.has_seen_intro) {
    const firstWebsiteId = websites[0]?.id;
    const anyAuditCompleted = audits.some((a) => a?.status === "completed");

    checklist = [
      { label: "Add your website", done: websites.length > 0, href: "/websites/new" },
      {
        label: "Run your first audit",
        done: anyAuditCompleted,
        href: firstWebsiteId ? `/websites/${firstWebsiteId}` : "/websites/new",
      },
      {
        label: "Review your top opportunities",
        done: user.dismissed_hints.includes("opportunities"),
        href: firstWebsiteId ? `/websites/${firstWebsiteId}/opportunities` : "/websites/new",
      },
      {
        label: "Explore a page in detail",
        done: user.dismissed_hints.includes("page-detail"),
        href: firstWebsiteId ? `/websites/${firstWebsiteId}/pages` : "/websites/new",
      },
    ];
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-20">
      <div className="sketch-heading grid items-center gap-4 md:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="eyebrow mb-4">Your field notes / SiteSignal</p>
          <h1>Your websites,<br /><em className="text-accent">a little clearer.</em></h1>
          <p className="mt-5 max-w-md text-sm text-muted">
            A closer look at what’s working, what needs attention, and where to go next.
          </p>
        {websites.length > 0 && (
          <LinkButton href="/websites/new" className="mt-6">
            <Plus className="size-4" />
            Add website
          </LinkButton>
        )}
        </div>
        <FieldSketch className="mx-auto w-48 md:w-full md:max-w-80" />
      </div>

      {checklist && (
        <div className="mt-8">
          <GettingStartedChecklist steps={checklist} />
        </div>
      )}

      {websites.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="mt-12 border-t border-border-strong" aria-label="Your websites">
          <div className="flex items-center justify-between py-4">
            <h2 className="eyebrow">Website index</h2>
            <span className="text-xs text-muted">{websites.length} {websites.length === 1 ? "website" : "websites"}</span>
          </div>
          {websites.map((website, index) => (
            <Link key={website.id} href={`/websites/${website.id}`}
              className="group flex items-center gap-4 border-t border-border py-6 transition-colors hover:bg-surface-subtle/60 sm:gap-8">
              <span className="editorial-title text-xl italic text-muted">{String(index + 1).padStart(2, "0")}</span>
              <div className="min-w-0 flex-1">
                <h2 className="editorial-title truncate text-2xl sm:text-3xl">{website.display_name}</h2>
                <p className="mt-1 truncate text-xs text-muted">{website.url}</p>
              </div>
              <div className="hidden text-right sm:block">
                <p className="text-xs capitalize text-accent">{audits[index]?.status ?? "Not audited yet"}</p>
                {audits[index] && <p className="mt-1 text-xs text-muted">{audits[index].pages_crawled} pages crawled</p>}
              </div>
              <ArrowUpRight className="size-5 shrink-0 text-accent" />
            </Link>
          ))}
        </section>
      )}
      {priorities.length > 0 && (
        <section className="mt-16 grid gap-8 border-t border-border-strong pt-8 md:grid-cols-[1fr_2fr]" aria-labelledby="priorities-title">
          <div>
            <p className="eyebrow mb-3">The next good move</p>
            <h2 id="priorities-title" className="editorial-title text-3xl">A few things<br />worth your attention.</h2>
            <p className="mt-4 max-w-xs text-sm text-muted">Your highest-ranked opportunities across the latest completed audits. Start at the top; take it one fix at a time.</p>
            <Doodle variant="links" className="mt-6 hidden w-32 md:block" />
          </div>
          <ol className="editorial-list">
            {priorities.map((opportunity) => (
              <li key={opportunity.id} className="py-5">
                <Link href={`/websites/${opportunity.website.id}/opportunities#opportunity-${opportunity.id}`} className="group block">
                  <p className="mb-2 text-xs text-muted">{opportunity.website.display_name}</p>
                  <h3 className="editorial-title text-xl group-hover:text-accent">{opportunity.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{opportunity.recommended_action}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <SeverityBadge severity={opportunity.severity} />
                    <span className="text-xs text-muted">{opportunity.affected_page_count} pages · Score {opportunity.score.toFixed(1)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <section className="mt-12 flex flex-col items-center gap-4 border-y border-border px-6 py-12 text-center">
      <Doodle className="w-44" />
      <h2 className="editorial-title text-3xl text-foreground">Add your first website</h2>
      <p className="max-w-sm text-sm text-muted">
        SiteSignal crawls your site, finds technical and on-page SEO problems, and turns them into
        a prioritized list of what to fix next. It takes about a minute to get your first audit.
      </p>
      <LinkButton href="/websites/new" className="mt-2">
        <Plus className="size-4" />
        Add website
      </LinkButton>
    </section>
  );
}
