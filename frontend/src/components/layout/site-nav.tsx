"use client";

import {
  AlertTriangle,
  Gauge,
  Link2,
  ListChecks,
  Search,
  Settings,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  comingSoon?: boolean;
}

function useSiteNavItems(websiteId: string): NavItem[] {
  const base = `/websites/${websiteId}`;
  return [
    { label: "Overview", href: base, icon: Gauge, exact: true },
    { label: "Opportunities", href: `${base}/opportunities`, icon: Target },
    { label: "Pages", href: `${base}/pages`, icon: ListChecks },
    { label: "Issues", href: `${base}/issues`, icon: AlertTriangle },
    { label: "Internal Links", href: `${base}/internal-links`, icon: Link2 },
    { label: "Performance", href: `${base}/performance`, icon: Zap, comingSoon: true },
    { label: "Search Console", href: `${base}/search-console`, icon: Search, comingSoon: true },
    { label: "Settings", href: `${base}/settings`, icon: Settings },
  ];
}

export function SiteNav({ websiteId }: { websiteId: string }) {
  const pathname = usePathname();
  const items = useSiteNavItems(websiteId);

  return (
    <nav aria-label="Website" className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center justify-between gap-2 border-l-2 border-transparent px-3 py-2 text-sm font-medium transition-colors duration-150",
              active
                ? "border-accent bg-accent-subtle/50 text-accent"
                : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-2">
              <Icon className="size-4" />
              {item.label}
            </span>
            {item.comingSoon && (
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted">
                Soon
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

// Horizontal, scrollable tab bar for viewports too small for the sidebar.
export function SiteNavMobile({ websiteId }: { websiteId: string }) {
  const pathname = usePathname();
  const items = useSiteNavItems(websiteId);

  return (
    <nav
      aria-label="Website"
      className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-3 py-2 sm:hidden"
    >
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-150",
              active
                ? "border-accent bg-accent-subtle/50 text-accent"
                : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
