import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SectionIntro } from "@/components/section-intro";
import { SeverityBadge } from "@/components/severity-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPage } from "@/lib/api/audit-data";
import { getLatestAudit } from "@/lib/api/audits";
import { BackendError } from "@/lib/backend";
import { getCurrentUser } from "@/lib/api/users";
import { formatCategory } from "@/lib/labels";

export const metadata: Metadata = { title: "Page detail" };

export default async function PageDetailPage({
  params,
}: {
  params: Promise<{ websiteId: string; pageId: string }>;
}) {
  const { websiteId, pageId } = await params;
  const audit = await getLatestAudit(websiteId);
  if (!audit) notFound();

  let page;
  try {
    page = await getPage(websiteId, audit.id, pageId);
  } catch (err) {
    if (err instanceof BackendError && err.status === 404) notFound();
    throw err;
  }

  const isSuccess = page.status_code !== null && page.status_code >= 200 && page.status_code < 300;
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <SectionIntro
        hintKey="page-detail"
        dismissedHints={user.dismissed_hints}
        title="What you're looking at"
      >
        Everything we found on this one page — its issues with fix suggestions, its on-page SEO
        signals, and every image, so you have what you need to actually fix it.
      </SectionIntro>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
            {page.title || "Untitled page"}
          </h1>
          <a
            href={page.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm text-muted hover:text-accent"
          >
            {page.url}
            <ExternalLink className="size-3" />
          </a>
        </div>
        <Badge tone={isSuccess ? "neutral" : "critical"}>{page.status_code ?? "Error"}</Badge>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Word count" value={page.word_count} />
        <Stat label="Crawl depth" value={page.crawl_depth} />
        <Stat label="Response time" value={page.response_time_ms ? `${page.response_time_ms}ms` : "—"} />
        <Stat label="Incoming links" value={page.incoming_internal_link_count} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Issues on this page ({page.issues.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {page.issues.length === 0 ? (
            <p className="text-sm text-muted">No issues found on this page.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {page.issues.map((issue) => (
                <li key={issue.id} className="border-l-2 border-border pl-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={issue.severity} />
                    <Badge tone="neutral">{formatCategory(issue.category)}</Badge>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{issue.explanation}</p>
                  <p className="mt-1 text-sm text-foreground">
                    <span className="font-medium">Recommended: </span>
                    {issue.recommended_action}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>On-page details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Title" value={page.title} />
            <DetailRow label="Meta description" value={page.meta_description} />
            <DetailRow label="Canonical URL" value={page.canonical_url} />
            <DetailRow label="Robots meta" value={page.robots_meta} />
            <DetailRow label="H1s" value={page.h1s.length > 0 ? page.h1s.join(", ") : null} />
            <DetailRow label="H2s" value={page.h2s.length > 0 ? page.h2s.join(", ") : null} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images ({page.images.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {page.images.length === 0 ? (
              <p className="text-sm text-muted">No images found on this page.</p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
                {page.images.map((img, i) => (
                  <li key={i} className="truncate">
                    <span className="text-muted-foreground">{img.src}</span>
                    {img.alt ? (
                      <span className="text-foreground"> — &ldquo;{img.alt}&rdquo;</span>
                    ) : (
                      <span className="text-critical"> — missing alt text</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={value ? "text-foreground" : "italic text-muted"}>{value || "Not set"}</p>
    </div>
  );
}
