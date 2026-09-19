import { Zap } from "lucide-react";
import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Performance" };

export default function PerformancePage() {
  return (
    <PageShell title="Performance" description="Page speed and Core Web Vitals data.">
      <ComingSoon
        icon={Zap}
        title="Performance data is coming soon"
        description="We'll pull in PageSpeed Insights data — load time, Core Web Vitals, and speed-related opportunities — once that integration is built."
      />
    </PageShell>
  );
}
