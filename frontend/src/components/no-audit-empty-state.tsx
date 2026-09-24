import { Doodle } from "@/components/doodle";

import { StartAuditButton } from "@/components/start-audit-button";
import { Card } from "@/components/ui/card";

export function NoAuditEmptyState({ websiteId, noun }: { websiteId: string; noun: string }) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <Doodle variant="search" />
      <h2 className="editorial-title text-3xl text-foreground">Run an audit to see {noun}</h2>
      <p className="max-w-sm text-sm text-muted">
        We haven&apos;t crawled this website yet. Start an audit and {noun} will show up here as
        soon as it finishes — usually under a minute.
      </p>
      <div className="mt-2">
        <StartAuditButton websiteId={websiteId} />
      </div>
    </Card>
  );
}
