import { Globe, Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { GettingStartedChecklist, type ChecklistStep } from "@/components/getting-started-checklist";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { getLatestAudit } from "@/lib/api/audits";
import { getCurrentUser } from "@/lib/api/users";
import { listWebsites } from "@/lib/api/websites";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [websites, user] = await Promise.all([listWebsites(), getCurrentUser()]);

  let checklist: ChecklistStep[] | null = null;
  if (!user.has_seen_intro) {
    const firstWebsiteId = websites[0]?.id;
    const audits = firstWebsiteId
      ? await Promise.all(websites.map((w) => getLatestAudit(w.id)))
      : [];
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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Your websites</h1>
          <p className="mt-1 text-sm text-muted">
            Pick a website to see its SEO health, or add a new one to audit.
          </p>
        </div>
        {websites.length > 0 && (
          <LinkButton href="/websites/new">
            <Plus className="size-4" />
            Add website
          </LinkButton>
        )}
      </div>

      {checklist && (
        <div className="mt-8">
          <GettingStartedChecklist steps={checklist} />
        </div>
      )}

      {websites.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${checklist ? "" : "mt-8"}`}
        >
          {websites.map((website) => (
            <Link
              key={website.id}
              href={`/websites/${website.id}`}
              className="group rounded-lg border border-border bg-surface p-5 transition-colors hover:border-border-strong"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-md bg-surface-subtle text-muted-foreground">
                  <Globe className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {website.display_name}
                  </p>
                  <p className="truncate text-xs text-muted">{website.url}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="mt-8 flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-accent-subtle text-accent">
        <Search className="size-5" />
      </div>
      <h2 className="text-base font-semibold text-foreground">Add your first website</h2>
      <p className="max-w-sm text-sm text-muted">
        SiteSignal crawls your site, finds technical and on-page SEO problems, and turns them into
        a prioritized list of what to fix next. It takes about a minute to get your first audit.
      </p>
      <LinkButton href="/websites/new" className="mt-2">
        <Plus className="size-4" />
        Add website
      </LinkButton>
    </Card>
  );
}
