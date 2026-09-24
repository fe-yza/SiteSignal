import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { SiteNav, SiteNavMobile } from "@/components/layout/site-nav";
import { BackendError } from "@/lib/backend";
import { getWebsite } from "@/lib/api/websites";

export default async function WebsiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;

  let website;
  try {
    website = await getWebsite(websiteId);
  } catch (err) {
    if (err instanceof BackendError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="flex flex-1 flex-col sm:min-h-[calc(100vh-5rem)] sm:flex-row">
      <aside className="hidden w-60 shrink-0 flex-col gap-4 border-r border-border bg-background px-4 py-8 sm:flex">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          All websites
        </Link>

        <div>
          <p className="truncate text-sm font-semibold text-foreground">{website.display_name}</p>
          <p className="truncate text-xs text-muted">{website.domain}</p>
        </div>

        <SiteNav websiteId={website.id} />
      </aside>

      <SiteNavMobile websiteId={website.id} />

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
