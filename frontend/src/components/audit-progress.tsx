"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { Audit } from "@/lib/types";

const POLL_INTERVAL_MS = 1500;

const STATUS_LABEL: Record<string, string> = {
  pending: "Getting ready to crawl…",
  crawling: "Crawling your website…",
  analyzing: "Analyzing what we found…",
};

function elapsedSecondsSince(startedAt: string | null): number {
  const startedAtMs = startedAt ? new Date(startedAt).getTime() : Date.now();
  return Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
}

export function AuditProgress({
  websiteId,
  initialAudit,
}: {
  websiteId: string;
  initialAudit: Audit;
}) {
  const [audit, setAudit] = useState(initialAudit);
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    elapsedSecondsSince(initialAudit.started_at)
  );
  const router = useRouter();

  useEffect(() => {
    if (audit.status === "completed" || audit.status === "failed") return;

    const tickTimer = setInterval(() => {
      setElapsedSeconds(elapsedSecondsSince(audit.started_at));
    }, 1000);

    const pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`/api/websites/${websiteId}/audits/${audit.id}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data: Audit = await res.json();
        setAudit(data);
        if (data.status === "completed" || data.status === "failed") {
          router.refresh();
        }
      } catch {
        // transient network hiccup — the next poll tick will retry
      }
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(tickTimer);
      clearInterval(pollTimer);
    };
  }, [audit.id, audit.status, audit.started_at, websiteId, router]);

  const progress = audit.pages_limit > 0 ? Math.min(1, audit.pages_crawled / audit.pages_limit) : 0;

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="flex items-center gap-2.5">
        <Loader2 className="size-4 animate-spin text-accent" aria-hidden="true" />
        <p className="text-sm font-semibold text-foreground">
          {STATUS_LABEL[audit.status] ?? "Working…"}
        </p>
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle">
        <div
          className="h-full rounded-full bg-accent transition-all duration-200"
          style={{ width: `${Math.max(4, progress * 100)}%` }}
        />
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs text-muted">
        <span>
          {audit.pages_crawled} of up to {audit.pages_limit} pages crawled
        </span>
        <span>{elapsedSeconds}s elapsed</span>
      </div>
    </div>
  );
}
