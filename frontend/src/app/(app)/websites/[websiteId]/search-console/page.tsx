import { Search } from "lucide-react";
import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Search Console" };

export default function SearchConsolePage() {
  return (
    <PageShell title="Search Console" description="Real query and ranking data from Google.">
      <ComingSoon
        icon={Search}
        title="Search Console is coming soon"
        description="Once connected, you'll see real search queries, impressions, clicks, and ranking positions — and opportunity scoring will factor in actual search demand."
      />
    </PageShell>
  );
}
